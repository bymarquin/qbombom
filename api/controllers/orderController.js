const { Order, OrderItem, Product, ProductVariation, Customer, sequelize } = require('../models');
const { Op } = require('sequelize');
const { uploadFile } = require('../services/storageService');
const whatsappService = require('../services/whatsappService');

const ETA_ACTIVE_STATUSES = new Set(['novo', 'em_preparo']);
const ETA_FINISHED_STATUSES = ['pronto', 'em_rota', 'entregue', 'finalizado'];
const ETA_DEFAULT_SECONDS_PER_UNIT = 210;
const ETA_MIN_SECONDS_PER_UNIT = 90;
const ETA_MAX_SECONDS_PER_UNIT = 600;

const ORDER_INCLUDES = [
  {
    model: OrderItem,
    as: 'items',
    include: [
      { model: Product, as: 'product', attributes: ['id', 'name', 'requiresPreparation'] },
      { model: ProductVariation, as: 'variation', attributes: ['id', 'name'] }
    ]
  }
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function countPreparationUnits(order) {
  if (!Array.isArray(order?.items) || order.items.length === 0) {
    return 1;
  }

  const units = order.items.reduce((total, item) => {
    const qty = Math.max(Number(item.quantity) || 1, 1);
    const requiresPreparation = item?.product?.requiresPreparation !== false;
    return requiresPreparation ? total + qty : total;
  }, 0);

  return Math.max(units, 1);
}

async function estimateSecondsPerUnitFromHistory() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const historicalOrders = await Order.findAll({
    where: {
      status: { [Op.in]: ETA_FINISHED_STATUSES },
      updatedAt: { [Op.gte]: cutoff },
    },
    include: ORDER_INCLUDES,
    order: [['updatedAt', 'DESC']],
    limit: 200,
  });

  let totalUnits = 0;
  let totalSeconds = 0;
  let validSamples = 0;

  for (const order of historicalOrders) {
    const units = countPreparationUnits(order);
    const durationSeconds = Math.round((new Date(order.updatedAt) - new Date(order.createdAt)) / 1000);

    if (durationSeconds < 120 || durationSeconds > 3 * 60 * 60) continue;

    totalUnits += units;
    totalSeconds += durationSeconds;
    validSamples += 1;
  }

  if (validSamples < 5 || totalUnits <= 0) {
    return ETA_DEFAULT_SECONDS_PER_UNIT;
  }

  return clamp(totalSeconds / totalUnits, ETA_MIN_SECONDS_PER_UNIT, ETA_MAX_SECONDS_PER_UNIT);
}

function createNonQueueEta(status, secondsPerUnit, generatedAt) {
  if (status === 'aguardando_pagamento') {
    return {
      inQueue: false,
      state: 'waiting_payment',
      queuePosition: null,
      etaMinutes: null,
      etaAt: null,
      modelSecondsPerUnit: secondsPerUnit,
      generatedAt,
    };
  }

  return {
    inQueue: false,
    state: 'out_of_queue',
    queuePosition: null,
    etaMinutes: null,
    etaAt: null,
    modelSecondsPerUnit: secondsPerUnit,
    generatedAt,
  };
}

async function buildEtaSnapshot() {
  const [secondsPerUnit, activeQueue] = await Promise.all([
    estimateSecondsPerUnitFromHistory(),
    Order.findAll({
      where: { status: { [Op.in]: Array.from(ETA_ACTIVE_STATUSES) } },
      include: ORDER_INCLUDES,
      order: [['createdAt', 'ASC']],
    }),
  ]);

  const sortedQueue = [...activeQueue].sort((a, b) => {
    const aRank = a.status === 'em_preparo' ? 0 : 1;
    const bRank = b.status === 'em_preparo' ? 0 : 1;
    if (aRank !== bRank) return aRank - bRank;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const generatedAt = new Date().toISOString();
  const byOrderId = new Map();
  let queuedSeconds = 0;

  sortedQueue.forEach((order, index) => {
    const units = countPreparationUnits(order);
    const estimatedTotalSeconds = Math.max(4 * 60, Math.round(units * secondsPerUnit));
    const remainingFactor = order.status === 'em_preparo' ? 0.55 : 1;
    const remainingSeconds = Math.max(2 * 60, Math.round(estimatedTotalSeconds * remainingFactor));
    const etaSeconds = queuedSeconds + remainingSeconds;

    byOrderId.set(order.id, {
      inQueue: true,
      state: 'in_queue',
      queuePosition: index + 1,
      etaMinutes: Math.max(1, Math.ceil(etaSeconds / 60)),
      etaAt: new Date(Date.now() + etaSeconds * 1000).toISOString(),
      modelSecondsPerUnit: Math.round(secondsPerUnit),
      generatedAt,
      prepUnits: units,
      estimatedRemainingSeconds: remainingSeconds,
    });

    queuedSeconds += remainingSeconds;
  });

  return {
    byOrderId,
    generatedAt,
    secondsPerUnit: Math.round(secondsPerUnit),
  };
}

function mapEtaToOrder(order, snapshot) {
  if (snapshot.byOrderId.has(order.id)) {
    return snapshot.byOrderId.get(order.id);
  }

  return createNonQueueEta(order.status, snapshot.secondsPerUnit, snapshot.generatedAt);
}

async function attachEtaToOrders(orders) {
  const list = Array.isArray(orders) ? orders : [orders];
  if (!list.length) return;

  const snapshot = await buildEtaSnapshot();

  list.forEach((order) => {
    order.setDataValue('eta', mapEtaToOrder(order, snapshot));
  });
}

async function restoreStock(items, transaction) {
  for (const item of items) {
    const qty = item.quantity || 1;

    if (item.productId) {
      const product = await Product.findByPk(item.productId, { transaction });
      if (product?.manageStock) {
        await product.update({ stock: product.stock + qty }, { transaction });
      }
    }

    if (item.productVariationId) {
      const variation = await ProductVariation.findByPk(item.productVariationId, { transaction });
      if (variation?.manageStock) {
        await variation.update({ stock: variation.stock + qty }, { transaction });
      }
    }
  }
}

async function reserveStockAtomically(items, transaction) {
  const productQtyMap = new Map();
  const variationQtyMap = new Map();

  for (const item of items || []) {
    const qty = Math.max(Number(item.quantity) || 1, 1);

    if (item.productId) {
      productQtyMap.set(item.productId, (productQtyMap.get(item.productId) || 0) + qty);
    }

    if (item.productVariationId) {
      variationQtyMap.set(item.productVariationId, (variationQtyMap.get(item.productVariationId) || 0) + qty);
    }
  }

  for (const [productId, qty] of productQtyMap.entries()) {
    const [affectedRows] = await Product.update(
      { stock: sequelize.literal(`stock - ${qty}`) },
      {
        where: {
          id: productId,
          manageStock: true,
          stock: { [Op.gte]: qty },
        },
        transaction,
      },
    );

    if (affectedRows === 0) {
      const product = await Product.findByPk(productId, {
        attributes: ['name', 'manageStock', 'stock'],
        transaction,
      });

      if (product?.manageStock) {
        const error = new Error(
          `Estoque insuficiente para ${product.name}. Disponivel: ${product.stock ?? 0}.`,
        );
        error.status = 409;
        throw error;
      }
    }
  }

  for (const [variationId, qty] of variationQtyMap.entries()) {
    const [affectedRows] = await ProductVariation.update(
      { stock: sequelize.literal(`stock - ${qty}`) },
      {
        where: {
          id: variationId,
          manageStock: true,
          stock: { [Op.gte]: qty },
        },
        transaction,
      },
    );

    if (affectedRows === 0) {
      const variation = await ProductVariation.findByPk(variationId, {
        attributes: ['name', 'manageStock', 'stock'],
        transaction,
      });

      if (variation?.manageStock) {
        const error = new Error(
          `Estoque insuficiente para a variacao ${variation.name}. Disponivel: ${variation.stock ?? 0}.`,
        );
        error.status = 409;
        throw error;
      }
    }
  }
}

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

async function notifyCustomer(order, status) {
  if (!order.customerId) return;
  const customer = await Customer.findByPk(order.customerId, { attributes: ['phone'] });
  if (customer?.phone) {
    const trackingUrl = status === 'em_rota' && order.trackingCode
      ? `${CLIENT_URL}/cardapio?track=${order.trackingCode}`
      : null;
    whatsappService.sendStatusMessage(customer.phone, status, order.id.slice(-6).toUpperCase(), trackingUrl, order.id);
  }
}

exports.index = async (req, res) => {
  try {
    const where = {}
    if (req.query.status) where.status = req.query.status

    const { dateFrom, dateTo } = req.query
    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom) : new Date('2000-01-01')
      const to = dateTo ? new Date(dateTo) : new Date()
      from.setHours(0, 0, 0, 0)
      to.setHours(23, 59, 59, 999)
      where.createdAt = { [Op.between]: [from, to] }
    }

    const orders = await Order.findAll({
      where,
      include: ORDER_INCLUDES,
      order: [['createdAt', 'DESC']]
    });

    await attachEtaToOrders(orders);

    res.json(orders);
  } catch (error) {
    console.error('[orders.index]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.show = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, { include: ORDER_INCLUDES });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    await attachEtaToOrders(order);

    res.json(order);
  } catch (error) {
    console.error('[orders.show]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.create = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      type, customerName, customerPhone, deliveryAddress,
      paymentStatus, paymentMethod, subtotal, discount, total, observation, items, whatsappOptIn
    } = req.body;

    let customerId = null;
    if (customerPhone) {
      const phone = customerPhone.replace(/\D/g, '');
      let customer = await Customer.findOne({ where: { phone } });

      if (!customer && customerName) {
        customer = await Customer.create({ name: customerName, phone, address: deliveryAddress }, { transaction });
      } else if (customer) {
        if (deliveryAddress) customer.address = deliveryAddress;
        if (customerName) customer.name = customerName;
        customer.totalOrders = (customer.totalOrders || 0) + 1;
        customer.totalSpent = parseFloat(customer.totalSpent || 0) + parseFloat(total);
        await customer.save({ transaction });
      }

      if (customer) customerId = customer.id;
    }

    const trackingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const isPendingPix = paymentMethod === 'PIX' && (!paymentStatus || paymentStatus === 'pendente');

    let allExpressItems = false;
    if (!isPendingPix && items?.length > 0) {
      const productIds = [...new Set(items.map(i => i.productId).filter(Boolean))];
      const products = await Product.findAll({ where: { id: productIds }, attributes: ['id', 'requiresPreparation'], transaction });
      const productMap = new Map(products.map(p => [p.id, p]));
      allExpressItems = items.every(i => productMap.get(i.productId)?.requiresPreparation === false);
    }

    const orderStatus = isPendingPix ? 'aguardando_pagamento' : allExpressItems ? 'pronto' : 'novo';

    const order = await Order.create({
      trackingCode,
      type: type || 'Mesa',
      customerName,
      customerId,
      customerPhone,
      deliveryAddress,
      status: orderStatus,
      paymentStatus: paymentStatus || 'pendente',
      paymentMethod,
      subtotal,
      discount: discount || 0,
      total,
      observation
    }, { transaction });

    if (items?.length > 0) {
      const variationIds = [...new Set(items.map(i => i.productVariationId).filter(Boolean))];
      if (variationIds.length > 0) {
        const existingVariations = await ProductVariation.findAll({
          where: { id: variationIds },
          attributes: ['id'],
          transaction
        });
        const existingIds = new Set(existingVariations.map(v => v.id));
        const missing = variationIds.find(id => !existingIds.has(id));
        if (missing) {
          const err = new Error('Variação de produto não encontrada');
          err.status = 422;
          throw err;
        }
      }

      await OrderItem.bulkCreate(
        items.map(item => ({
          orderId: order.id,
          productId: item.productId,
          productVariationId: item.productVariationId || null,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          observation: item.observation || '',
          selectedAdditionals: item.selectedAdditionals || []
        })),
        { transaction }
      );

      await reserveStockAtomically(items, transaction);
    }

    await transaction.commit();

    if (customerPhone && typeof whatsappOptIn === 'boolean') {
      await whatsappService.setPhoneOptIn(customerPhone, whatsappOptIn);
    }

    const createdOrder = await Order.findByPk(order.id, { include: ORDER_INCLUDES });
    await attachEtaToOrders(createdOrder);

    req.app.get('io')?.emit('orderCreated', createdOrder);

    res.status(201).json(createdOrder);
  } catch (error) {
    await transaction.rollback();
    console.error('[orders.create]', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Internal server error' : error.message });
  }
};

exports.optOutWhatsappByTracking = async (req, res) => {
  try {
    const order = await Order.findOne({ where: { trackingCode: req.params.code } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const customerPhone = order.customerPhone;
    if (!customerPhone) {
      return res.status(400).json({ error: 'Pedido não possui telefone para opt-out.' });
    }

    await whatsappService.setPhoneOptOut(customerPhone, true);
    return res.json({ message: 'Notificações de WhatsApp desativadas para este número.' });
  } catch (error) {
    console.error('[orders.optOutWhatsappByTracking]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.track = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { trackingCode: req.params.code },
      include: ORDER_INCLUDES
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    await attachEtaToOrders(order);

    res.json(order);
  } catch (error) {
    console.error('[orders.track]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.cancelByTracking = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const order = await Order.findOne({
      where: { trackingCode: req.params.code },
      include: [{ model: OrderItem, as: 'items' }],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'cancelado') {
      await transaction.commit();
      await attachEtaToOrders(order);
      return res.json(order);
    }

    const cancelableStatuses = new Set(['aguardando_pagamento', 'novo']);
    if (!cancelableStatuses.has(order.status)) {
      await transaction.rollback();
      return res.status(409).json({ error: 'Pedido não pode mais ser cancelado. Entre em contato com a loja.' });
    }

    if (order.paymentStatus === 'pago') {
      await transaction.rollback();
      return res.status(409).json({ error: 'Pedido já consta como pago e não pode ser cancelado por aqui.' });
    }

    await restoreStock(order.items || [], transaction);

    order.status = 'cancelado';
    await order.save({ transaction });
    await transaction.commit();

    await attachEtaToOrders(order);

    req.app.get('io')?.emit('orderUpdated', {
      id: order.id,
      trackingCode: order.trackingCode,
      status: order.status,
      paymentStatus: order.paymentStatus,
      receiptUrl: order.receiptUrl,
      eta: order.eta,
    });

    return res.json(order);
  } catch (error) {
    await transaction.rollback();
    console.error('[orders.cancelByTracking]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const previousStatus = order.status;
    const { status, paymentStatus } = req.body;

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    await order.save();

    await attachEtaToOrders(order);

    const io = req.app.get('io');
    io?.emit('orderUpdated', order);

    if (status && status !== previousStatus) {
      notifyCustomer(order, status);
    }

    res.json(order);

    if (status === 'entregue') {
      setTimeout(async () => {
        try {
          order.status = 'finalizado';
          await order.save();
          await attachEtaToOrders(order);
          io?.emit('orderUpdated', order);
          notifyCustomer(order, 'finalizado');
        } catch (e) {
          console.error('[auto-finalizar]', e);
        }
      }, 3000);
    }
  } catch (error) {
    console.error('[orders.updateStatus]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.cancelOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'cancelado') {
      await transaction.commit();
      await attachEtaToOrders(order);
      return res.json(order);
    }

    if (['finalizado', 'entregue'].includes(order.status)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Não é possível cancelar um pedido já finalizado.' });
    }

    await restoreStock(order.items || [], transaction);

    order.status = 'cancelado';
    await order.save({ transaction });
    await transaction.commit();

    await attachEtaToOrders(order);

    req.app.get('io')?.emit('orderUpdated', order);
    notifyCustomer(order, 'cancelado');

    return res.json(order);
  } catch (error) {
    await transaction.rollback();
    console.error('[orders.cancelOrder]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.confirmDeliveryByTracking = async (req, res) => {
  try {
    const order = await Order.findOne({ where: { trackingCode: req.params.code } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status !== 'em_rota') {
      return res.status(409).json({ error: 'Pedido não está em rota de entrega.' });
    }

    order.status = 'entregue';
    await order.save();
    await attachEtaToOrders(order);

    const io = req.app.get('io');
    io?.emit('orderUpdated', order);
    notifyCustomer(order, 'entregue');

    res.json(order);

    setTimeout(async () => {
      try {
        order.status = 'finalizado';
        await order.save();
        await attachEtaToOrders(order);
        io?.emit('orderUpdated', order);
        notifyCustomer(order, 'finalizado');
      } catch (e) {
        console.error('[auto-finalizar confirmDelivery]', e);
      }
    }, 3000);
  } catch (error) {
    console.error('[orders.confirmDeliveryByTracking]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.uploadReceipt = async (req, res) => {
  try {
    const order = await Order.findOne({ where: { trackingCode: req.params.code } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const { receiptBase64 } = req.body;
    if (!receiptBase64) return res.status(400).json({ error: 'Missing image data' });

    const matches = receiptBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ error: 'Invalid base64 string' });

    const [, contentType, data] = matches;
    const ext = contentType.split('/')[1] || 'png';
    const key = `receipts/receipt_${order.id}_${Date.now()}.${ext}`;

    order.receiptUrl = await uploadFile(Buffer.from(data, 'base64'), key, contentType);
    await order.save();
    await attachEtaToOrders(order);

    req.app.get('io')?.emit('orderUpdated', {
      id: order.id,
      trackingCode: order.trackingCode,
      status: order.status,
      paymentStatus: order.paymentStatus,
      receiptUrl: order.receiptUrl,
      eta: order.eta,
    });

    res.json(order);
  } catch (error) {
    console.error('[orders.uploadReceipt]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
