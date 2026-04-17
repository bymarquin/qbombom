const { Order, OrderItem, Product, ProductVariation, Customer, sequelize } = require('../models');
const { uploadFile } = require('../services/storageService');
const whatsappService = require('../services/whatsappService');

const ORDER_INCLUDES = [
  {
    model: OrderItem,
    as: 'items',
    include: [
      { model: Product, as: 'product', attributes: ['id', 'name'] },
      { model: ProductVariation, as: 'variation', attributes: ['id', 'name'] }
    ]
  }
];

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

async function notifyCustomer(order, status) {
  if (!order.customerId) return;
  const customer = await Customer.findByPk(order.customerId, { attributes: ['phone'] });
  if (customer?.phone) {
    whatsappService.sendStatusMessage(customer.phone, status, order.id.slice(-6).toUpperCase());
  }
}

exports.index = async (req, res) => {
  try {
    const where = req.query.status ? { status: req.query.status } : {};
    const orders = await Order.findAll({
      where,
      include: ORDER_INCLUDES,
      order: [['createdAt', 'DESC']]
    });
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
      paymentStatus, paymentMethod, subtotal, discount, total, observation, items
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

    const order = await Order.create({
      trackingCode,
      type: type || 'Mesa',
      customerName,
      customerId,
      customerPhone,
      deliveryAddress,
      status: isPendingPix ? 'aguardando_pagamento' : 'novo',
      paymentStatus: paymentStatus || 'pendente',
      paymentMethod,
      subtotal,
      discount: discount || 0,
      total,
      observation
    }, { transaction });

    if (items?.length > 0) {
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

      for (const item of items) {
        const qty = item.quantity || 1;

        if (item.productId) {
          const product = await Product.findByPk(item.productId, { transaction });
          if (product?.manageStock) {
            await product.update({ stock: product.stock - qty }, { transaction });
          }
        }

        if (item.productVariationId) {
          const variation = await ProductVariation.findByPk(item.productVariationId, { transaction });
          if (variation?.manageStock) {
            await variation.update({ stock: variation.stock - qty }, { transaction });
          }
        }
      }
    }

    await transaction.commit();

    const createdOrder = await Order.findByPk(order.id, { include: ORDER_INCLUDES });
    req.app.get('io')?.emit('orderCreated', createdOrder);

    res.status(201).json(createdOrder);
  } catch (error) {
    await transaction.rollback();
    console.error('[orders.create]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.track = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { trackingCode: req.params.code },
      include: ORDER_INCLUDES
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
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

    req.app.get('io')?.emit('orderUpdated', {
      id: order.id,
      trackingCode: order.trackingCode,
      status: order.status,
      paymentStatus: order.paymentStatus,
      receiptUrl: order.receiptUrl
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

    req.app.get('io')?.emit('orderUpdated', order);
    notifyCustomer(order, 'cancelado');

    return res.json(order);
  } catch (error) {
    await transaction.rollback();
    console.error('[orders.cancelOrder]', error);
    return res.status(500).json({ error: 'Internal server error' });
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

    req.app.get('io')?.emit('orderUpdated', {
      trackingCode: order.trackingCode,
      status: order.status,
      paymentStatus: order.paymentStatus,
      receiptUrl: order.receiptUrl
    });

    res.json(order);
  } catch (error) {
    console.error('[orders.uploadReceipt]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
