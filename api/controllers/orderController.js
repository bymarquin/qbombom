const { Order, OrderItem, Product, ProductVariation, Customer, Setting, sequelize } = require('../models');
const { Op } = require('sequelize');
const whatsappService = require('../services/whatsappService');
const thermalPrinter = require('../services/print/thermalPrinterService');
const pixGatewayService = require('../services/pixGatewayService');
const orderPaymentService = require('../services/orderPaymentService');
const logger = require('../utils/logger');
const { handleControllerError } = require('../utils/controllerError');
const simpleCache = require('../utils/simpleCache');

// Transições permitidas por updateStatus.
// Cancelamento não está aqui — tem endpoint e lógica própria (restaura estoque).
const VALID_TRANSITIONS = {
  aguardando_pagamento: new Set(['novo']),
  novo:                 new Set(['em_preparo', 'pronto']),
  em_preparo:           new Set(['pronto']),
  pronto:               new Set(['em_rota', 'finalizado']),
  em_rota:              new Set(['entregue']),
  entregue:             new Set(['finalizado']),
  finalizado:           new Set(),
  cancelado:            new Set(),
};

const ETA_ACTIVE_STATUSES = new Set(['novo', 'em_preparo']);
const ETA_FINISHED_STATUSES = ['pronto', 'em_rota', 'entregue', 'finalizado'];
const ETA_DEFAULT_SECONDS_PER_UNIT = 210;
const ETA_MIN_SECONDS_PER_UNIT = 90;
const ETA_MAX_SECONDS_PER_UNIT = 600;
const ETA_SNAPSHOT_TTL_MS = Number(process.env.ETA_SNAPSHOT_TTL_MS || 5000);

if (!process.env.MERCADOPAGO_WEBHOOK_TOKEN) {
  logger.warn('SECURITY: MERCADOPAGO_WEBHOOK_TOKEN não configurado — webhooks de pagamento não são autenticados. Configure a variável de ambiente para proteger o endpoint.');
}

let etaSnapshotPromise = null;

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

async function getEtaSnapshot() {
  const cached = await simpleCache.get('eta:snapshot');
  if (cached) {
    return { ...cached, byOrderId: new Map(cached.byOrderId) };
  }

  if (!etaSnapshotPromise) {
    etaSnapshotPromise = buildEtaSnapshot()
      .then(async (snapshot) => {
        const serializable = { ...snapshot, byOrderId: Array.from(snapshot.byOrderId.entries()) };
        await simpleCache.set('eta:snapshot', serializable, ETA_SNAPSHOT_TTL_MS);
        return snapshot;
      })
      .finally(() => {
        etaSnapshotPromise = null;
      });
  }

  return etaSnapshotPromise;
}

function mapEtaToOrder(order, snapshot) {
  if (snapshot.byOrderId.has(order.id)) {
    return snapshot.byOrderId.get(order.id);
  }

  return createNonQueueEta(order.status, snapshot.secondsPerUnit, snapshot.generatedAt);
}

// Synchronous ETA for freshly-created orders: avoids the two DB queries in
// buildEtaSnapshot. Queue position is unknown (null) — client refreshes via
// socket or /track polling which runs the full snapshot.
function buildLocalEtaForCreate(order) {
  const generatedAt = new Date().toISOString();

  if (order.status === 'aguardando_pagamento') {
    return createNonQueueEta('aguardando_pagamento', ETA_DEFAULT_SECONDS_PER_UNIT, generatedAt);
  }

  if (!ETA_ACTIVE_STATUSES.has(order.status)) {
    return createNonQueueEta(order.status, ETA_DEFAULT_SECONDS_PER_UNIT, generatedAt);
  }

  const units = countPreparationUnits(order);
  const estimatedSeconds = Math.max(4 * 60, Math.round(units * ETA_DEFAULT_SECONDS_PER_UNIT));

  return {
    inQueue: true,
    state: 'in_queue',
    queuePosition: null,
    etaMinutes: Math.max(1, Math.ceil(estimatedSeconds / 60)),
    etaAt: new Date(Date.now() + estimatedSeconds * 1000).toISOString(),
    modelSecondsPerUnit: ETA_DEFAULT_SECONDS_PER_UNIT,
    generatedAt,
    prepUnits: units,
    estimatedRemainingSeconds: estimatedSeconds,
  };
}

async function attachEtaToOrders(orders) {
  const list = Array.isArray(orders) ? orders : [orders];
  if (!list.length) return;

  const snapshot = await getEtaSnapshot();

  list.forEach((order) => {
    order.setDataValue('eta', mapEtaToOrder(order, snapshot));
  });
}

async function restoreStock(items, transaction) {
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
    await Product.update(
      { stock: sequelize.literal(`stock + ${qty}`) },
      { where: { id: productId, manageStock: true }, transaction },
    );
  }

  for (const [variationId, qty] of variationQtyMap.entries()) {
    await ProductVariation.update(
      { stock: sequelize.literal(`stock + ${qty}`) },
      { where: { id: variationId, manageStock: true }, transaction },
    );
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
const PIX_RECONCILE_INTERVAL_MS = 30000;
const PIX_RECONCILE_BATCH_SIZE = 20;
let pixReconcilerStarted = false;
let pixReconcileRunning = false;

// Re-busca o pedido no banco antes de finalizar para não sobrescrever
// uma mudança concorrente (ex.: cancelamento ocorrido nos 3s de espera).
function scheduleAutoFinalize(orderId, io) {
  setTimeout(async () => {
    try {
      const fresh = await Order.findByPk(orderId);
      if (!fresh || fresh.status !== 'entregue') return;

      fresh.status = 'finalizado';
      await fresh.save();
      await attachEtaToOrders(fresh);
      io?.emit('orderUpdated', fresh);
      notifyCustomer(fresh, 'finalizado');
    } catch (e) {
      logger.error('orders.auto_finalize.failed', e, { orderId });
    }
  }, 3000);
}

async function notifyCustomer(order, status) {
  if (!order.customerId) return;
  const customer = await Customer.findByPk(order.customerId, { attributes: ['phone', 'name'] });
  if (customer?.phone) {
    const trackingUrl = status === 'em_rota' && order.trackingCode
      ? `${CLIENT_URL}/cardapio?track=${order.trackingCode}`
      : null;
    const pixExpiresAt = status === 'aguardando_pagamento' ? order.pixExpiresAt : null;
    whatsappService.sendStatusMessage(customer.phone, status, order.id.slice(-6).toUpperCase(), trackingUrl, order.id, customer.name, pixExpiresAt);
  }
}

async function ensurePixGatewayPix(order) {
  return orderPaymentService.ensurePixPayment(order);
}

async function syncPixGatewayPaymentStatus(order, io) {
  return orderPaymentService.syncPixPaymentStatus(order, {
    onOrderUpdated: async (updatedOrder, meta) => {
      await attachEtaToOrders(updatedOrder);
      io?.emit('orderUpdated', updatedOrder);
      if (meta.paymentApprovedNow) notifyCustomer(updatedOrder, updatedOrder.status);
      logger.info('orders.pix.reconciled', {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
      });
    },
  });
}

async function runPixGatewayReconcile(io) {
  if (pixReconcileRunning) return;
  pixReconcileRunning = true;
  try {
    const pendingOrders = await Order.findAll({
      where: {
        paymentMethod: 'PIX',
        paymentProvider: 'mercadopago',
        paymentStatus: { [Op.ne]: 'pago' },
      },
      order: [['createdAt', 'ASC']],
      limit: PIX_RECONCILE_BATCH_SIZE,
    });

    if (!pendingOrders.length) return;

    await Promise.all(pendingOrders.map((order) => syncPixGatewayPaymentStatus(order, io)));
  } catch (error) {
    logger.error('orders.reconcile.failed', error);
  } finally {
    pixReconcileRunning = false;
  }
}

async function ensurePixGatewayReconciler(io) {
  if (!pixGatewayService.isEnabled()) return;
  if (pixReconcilerStarted) return;

  const LOCK_KEY = 'pix:reconciler:leader';
  const LOCK_TTL = PIX_RECONCILE_INTERVAL_MS * 3;

  const existing = await simpleCache.get(LOCK_KEY);
  if (existing) return;

  pixReconcilerStarted = true;
  await simpleCache.set(LOCK_KEY, process.pid, LOCK_TTL);

  setInterval(async () => {
    try {
      await simpleCache.set(LOCK_KEY, process.pid, LOCK_TTL);
      await runPixGatewayReconcile(io);
    } catch (error) {
      logger.error('orders.reconciler.tick.failed', error);
    }
  }, PIX_RECONCILE_INTERVAL_MS);

  await runPixGatewayReconcile(io);
  logger.info('orders.reconciler.started', { intervalMs: PIX_RECONCILE_INTERVAL_MS, batchSize: PIX_RECONCILE_BATCH_SIZE });
}

exports.index = async (req, res) => {
  try {
    await ensurePixGatewayReconciler(req.app.get('io'));
    const where = {}
    if (req.query.status) where.status = req.query.status

    const { dateFrom, dateTo } = req.query
    if (dateFrom || dateTo) {
      // Interpreta as datas no fuso de Brasília (UTC-3) para não cortar pedidos da virada de meia-noite UTC
      const from = dateFrom ? new Date(`${dateFrom}T00:00:00.000-03:00`) : new Date('2000-01-01')
      const to = dateTo ? new Date(`${dateTo}T23:59:59.999-03:00`) : new Date()
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
    return handleControllerError(res, 'orders.index', error);
  }
};

exports.show = async (req, res) => {
  try {
    await ensurePixGatewayReconciler(req.app.get('io'));
    const order = await Order.findByPk(req.params.id, { include: ORDER_INCLUDES });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    await attachEtaToOrders(order);

    res.json(order);
  } catch (error) {
    return handleControllerError(res, 'orders.show', error);
  }
};

exports.create = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    await ensurePixGatewayReconciler(req.app.get('io'));
    const {
      type, customerName, customerPhone, tableNumber, deliveryAddress,
      deliveryLatitude, deliveryLongitude, deliveryAccuracyMeters, deliveryLocationCapturedAt,
      paymentStatus, paymentMethod, subtotal, discount, serviceFee, total, observation, items, whatsappOptIn
    } = req.body;

    const resolvedServiceFee = Number.parseFloat(serviceFee);

    const orderType = type || 'Mesa';
    const resolvedTableNumber = orderType === 'Mesa' && tableNumber
      ? String(tableNumber).trim()
      : null;
    const hasDeliveryLatitude = deliveryLatitude != null && String(deliveryLatitude).trim() !== '';
    const hasDeliveryLongitude = deliveryLongitude != null && String(deliveryLongitude).trim() !== '';

    if (hasDeliveryLatitude !== hasDeliveryLongitude) {
      const mismatchError = new Error('Coordenadas incompletas. Envie latitude e longitude.');
      mismatchError.status = 422;
      throw mismatchError;
    }

    // Validate geolocation fields when provided
    let geoLat = null, geoLng = null, geoAccuracy = null, geoCapturedAt = null;
    if (hasDeliveryLatitude && hasDeliveryLongitude) {
      const lat = parseFloat(deliveryLatitude);
      const lng = parseFloat(deliveryLongitude);
      if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
        const invalidGeoError = new Error('Coordenadas de entrega inválidas.');
        invalidGeoError.status = 422;
        throw invalidGeoError;
      }
      geoLat = lat;
      geoLng = lng;
      geoAccuracy = deliveryAccuracyMeters != null ? parseFloat(deliveryAccuracyMeters) : null;
      if (!Number.isFinite(geoAccuracy) || geoAccuracy < 0) geoAccuracy = null;
      geoCapturedAt = deliveryLocationCapturedAt ? new Date(deliveryLocationCapturedAt) : null;
      if (geoCapturedAt && isNaN(geoCapturedAt.getTime())) geoCapturedAt = null;
    }

    const resolvedDeliveryAddress = deliveryAddress || (
      geoLat != null && geoLng != null
        ? `GPS: ${Number(geoLat).toFixed(6)}, ${Number(geoLng).toFixed(6)}`
        : null
    );

    let customerId = null;
    if (customerPhone) {
      const phone = customerPhone.replace(/\D/g, '');
      let customer = await Customer.findOne({ where: { phone } });

      if (!customer && customerName) {
        customer = await Customer.create({
          name: customerName,
          phone,
          address: resolvedDeliveryAddress,
          totalOrders: 1,
          totalSpent: parseFloat(total),
        }, { transaction });
      } else if (customer) {
        if (resolvedDeliveryAddress) customer.address = resolvedDeliveryAddress;
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
    if (items?.length > 0) {
      const productIds = [...new Set(items.map(i => i.productId).filter(Boolean))];
      const products = await Product.findAll({
        where: { id: productIds },
        attributes: ['id', 'name', 'requiresPreparation', 'allowedOrderTypes'],
        transaction
      });
      const productMap = new Map(products.map(p => [p.id, p]));

      const incompatible = products.filter(p => {
        const allowed = p.allowedOrderTypes;
        return Array.isArray(allowed) && !allowed.includes(orderType);
      });
      if (incompatible.length > 0) {
        const names = incompatible.map(p => p.name).join(', ');
        const err = new Error(`Os seguintes itens não estão disponíveis para ${orderType}: ${names}`);
        err.status = 422;
        throw err;
      }

      if (!isPendingPix) {
        allExpressItems = items.every(i => productMap.get(i.productId)?.requiresPreparation === false);
      }
    }

    const orderStatus = isPendingPix ? 'aguardando_pagamento' : allExpressItems ? 'pronto' : 'novo';

    const order = await Order.create({
      trackingCode,
      type: orderType,
      customerName,
      customerId,
      customerPhone,
      tableNumber: resolvedTableNumber,
      deliveryAddress: resolvedDeliveryAddress,
      deliveryLatitude: geoLat,
      deliveryLongitude: geoLng,
      deliveryAccuracyMeters: geoAccuracy,
      deliveryLocationCapturedAt: geoCapturedAt,
      status: orderStatus,
      paymentStatus: paymentStatus || 'pendente',
      paymentMethod,
      subtotal,
      discount: discount || 0,
      serviceFee: Number.isFinite(resolvedServiceFee) ? resolvedServiceFee : 0,
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
          variationName: item.variationName || null,
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

    let createdOrder = await Order.findByPk(order.id, { include: ORDER_INCLUDES });
    if (createdOrder) {
      try {
        createdOrder = await ensurePixGatewayPix(createdOrder);
      } catch (pixError) {
        logger.error('orders.create.mp_failed', pixError, { orderId: createdOrder?.id });
      }
    }
    await attachEtaToOrders(createdOrder);

    req.app.get('io')?.emit('orderCreated', createdOrder);

    // Envia notificação inicial de WhatsApp (Status Novo ou Aguardando PIX)
    notifyCustomer(createdOrder, createdOrder.status);

    res.status(201).json(createdOrder);
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    return handleControllerError(res, 'orders.create', error);
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
    return handleControllerError(res, 'orders.optOutWhatsappByTracking', error);
  }
};

exports.track = async (req, res) => {
  try {
    await ensurePixGatewayReconciler(req.app.get('io'));
    const order = await Order.findOne({
      where: { trackingCode: req.params.code },
      include: ORDER_INCLUDES
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status === 'aguardando_pagamento') {
      await syncPixGatewayPaymentStatus(order, req.app.get('io'));
    }

    await attachEtaToOrders(order);

    res.json(order);
  } catch (error) {
    return handleControllerError(res, 'orders.track', error);
  }
};

exports.cancelByTracking = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const order = await Order.findOne({
      where: { trackingCode: req.params.code },
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

    const items = await OrderItem.findAll({
      where: { orderId: order.id },
      transaction
    });

    await restoreStock(items, transaction);

    order.status = 'cancelado';
    await order.save({ transaction });
    await transaction.commit();

    await attachEtaToOrders(order);

    req.app.get('io')?.emit('orderUpdated', {
      id: order.id,
      trackingCode: order.trackingCode,
      status: order.status,
      paymentStatus: order.paymentStatus,
      eta: order.eta,
    });

    return res.json(order);
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    return handleControllerError(res, 'orders.cancelByTracking', error);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const { status, paymentStatus, paymentMethod } = req.body;

    if (status) {
      if (status === 'cancelado') {
        return res.status(400).json({ error: 'Use o endpoint de cancelamento para cancelar um pedido.' });
      }

      const allowed = new Set(VALID_TRANSITIONS[order.status] || []);
      
      // Regra especial: Apenas pedidos que NÃO são 'Entrega' podem ir de 'pronto' para 'finalizado'
      if (order.status === 'pronto' && (status === 'finalizado' || status === 'entregue')) {
        if (order.type === 'Entrega') {
          return res.status(400).json({ error: 'Pedidos de Entrega devem passar pelo status Em Rota antes de serem finalizados.' });
        }
      }

      if (!allowed.has(status)) {
        return res.status(400).json({
          error: `Transição inválida: ${order.status} → ${status}.`,
        });
      }
    }

    const previousStatus = order.status;

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    await order.save();

    await attachEtaToOrders(order);

    const io = req.app.get('io');
    io?.emit('orderUpdated', order);

    if (status && status !== previousStatus) {
      notifyCustomer(order, status);
    }

    res.json(order);

    if (status === 'entregue') {
      scheduleAutoFinalize(order.id, io);
    }
  } catch (error) {
    return handleControllerError(res, 'orders.updateStatus', error);
  }
};

exports.cancelOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const order = await Order.findByPk(req.params.id, {
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

    const items = await OrderItem.findAll({
      where: { orderId: order.id },
      transaction
    });

    await restoreStock(items, transaction);

    order.status = 'cancelado';
    await order.save({ transaction });
    await transaction.commit();

    await attachEtaToOrders(order);

    req.app.get('io')?.emit('orderUpdated', order);
    notifyCustomer(order, 'cancelado');

    return res.json(order);
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    return handleControllerError(res, 'orders.cancelOrder', error);
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

    scheduleAutoFinalize(order.id, io);
  } catch (error) {
    return handleControllerError(res, 'orders.confirmDeliveryByTracking', error);
  }
};

exports.pixGatewayWebhook = async (req, res) => {
  try {
    await ensurePixGatewayReconciler(req.app.get('io'));
    logger.info('orders.webhook.received', {
      type: req.query?.type || req.body?.type || null,
      action: req.body?.action || null,
    });

    const expectedToken = process.env.MERCADOPAGO_WEBHOOK_TOKEN;
    if (expectedToken) {
      const receivedToken = req.query?.token;
      if (receivedToken !== expectedToken) {
        return res.status(401).json({ error: 'Unauthorized webhook' });
      }
    }

    const eventType = String(req.query?.type || req.body?.type || '').toLowerCase();
    const action = String(req.body?.action || '').toLowerCase();
    const isPaymentEvent = eventType === 'payment' || action.startsWith('payment.');
    if (!isPaymentEvent) {
      return res.status(200).json({ ok: true });
    }

    const paymentId = req.body?.data?.id || req.query?.['data.id'];
    if (!paymentId) {
      return res.status(200).json({ ok: true });
    }

    const payment = await pixGatewayService.getPayment(paymentId);
    if (!payment) {
      return res.status(200).json({ ok: true });
    }

    const externalReference = payment.external_reference || payment.metadata?.orderId;
    if (!externalReference) {
      return res.status(200).json({ ok: true });
    }

    const order = await Order.findByPk(externalReference);
    if (!order || order.paymentMethod !== 'PIX') {
      return res.status(200).json({ ok: true });
    }

    logger.info('orders.webhook.order_matched', {
      paymentId: String(paymentId),
      foundOrder: Boolean(order),
      orderId: order?.id,
      orderStatus: order?.status,
      paymentStatus: order?.paymentStatus,
    });
    const { changed, paymentApprovedNow } = await orderPaymentService.applyPaymentToOrder(order, payment);

    if (changed) {
      await attachEtaToOrders(order);
      req.app.get('io')?.emit('orderUpdated', order);
      logger.info('orders.webhook.order_updated', {
        orderId: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
      });
      if (paymentApprovedNow) {
        notifyCustomer(order, order.status);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    logger.error('orders.webhook.failed', error);
    return res.status(200).json({ ok: true });
  }
};

exports.printOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, { include: ORDER_INCLUDES });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const [setting] = await Setting.findOrCreate({
      where: { key: 'store_config' },
      defaults: { key: 'store_config', value: {} },
    });

    const meta = await thermalPrinter.printOrder(order, setting.value || {});

    return res.json({ success: true, ...meta });
  } catch (error) {
    const operationalCodes = [
      'PRINT_DISABLED',
      'PRINT_NO_HOST',
      'PRINT_NO_USB_PRINTER',
      'PRINT_UNKNOWN_MODE',
      'PRINT_USB_FAILED',
    ];
    if (operationalCodes.includes(error.code)) {
      return res.status(422).json({ error: error.message });
    }
    logger.error('orders.printOrder.failed', error);
    return res.status(422).json({
      error: `Falha ao comunicar com a impressora: ${error.message}`,
    });
  }
};
