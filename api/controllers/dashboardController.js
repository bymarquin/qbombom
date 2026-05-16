'use strict';

const { Order, OrderItem, Product, sequelize } = require('../models');
const { Op } = require('sequelize');
const simpleCache = require('../utils/simpleCache');

const DASHBOARD_CACHE_TTL_MS = Number(process.env.DASHBOARD_CACHE_TTL_MS || 30000);

function getDateRange(period) {
  const now = new Date();
  const todayYmd = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const parseDateAtSaoPaulo = (ymd, time) => new Date(`${ymd}T${time}-03:00`);
  const startOfYmd = (ymd) => parseDateAtSaoPaulo(ymd, '00:00:00.000');
  const endOfYmd = (ymd) => parseDateAtSaoPaulo(ymd, '23:59:59.999');
  const shiftYmd = (ymd, days) => {
    const base = parseDateAtSaoPaulo(ymd, '12:00:00.000');
    base.setUTCDate(base.getUTCDate() + days);
    return base.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  };

  if (period === 'week') {
    const fromYmd = shiftYmd(todayYmd, -7);
    return { start: startOfYmd(fromYmd), end: endOfYmd(todayYmd) };
  }

  if (period === '3days') {
    const fromYmd = shiftYmd(todayYmd, -3);
    return { start: startOfYmd(fromYmd), end: endOfYmd(todayYmd) };
  }

  if (period === 'month') {
    const [year, month] = todayYmd.split('-');
    return { start: startOfYmd(`${year}-${month}-01`), end: endOfYmd(todayYmd) };
  }

  if (period === 'year') {
    const [year] = todayYmd.split('-');
    return { start: startOfYmd(`${year}-01-01`), end: endOfYmd(todayYmd) };
  }

  return { start: startOfYmd(todayYmd), end: endOfYmd(todayYmd) };
}

exports.getMetrics = async (req, res) => {
  try {
    const period = req.query.period || 'today';
    const cacheKey = `dashboard:${period}`;
    const cached = await simpleCache.get(cacheKey);
    if (cached) return res.json(cached);

    const { start, end } = getDateRange(period);

    const withinPeriod = { createdAt: { [Op.between]: [start, end] } };

    const billableStatuses = { status: { [Op.in]: ['finalizado', 'entregue'] } };
    const billableFilter = { ...withinPeriod, ...billableStatuses };

    const [revenue, totalOrders, cancellations, recentOrders, topProductsRaw, activeOrdersRaw, paymentMethodsRaw, orderTypesRaw] = await Promise.all([
      Order.sum('total', { where: billableFilter }),
      Order.count({ where: billableFilter }),
      Order.count({ where: { ...withinPeriod, status: 'cancelado' } }),
      Order.findAll({ where: withinPeriod, order: [['createdAt', 'DESC']], limit: 5 }),
      OrderItem.findAll({
        attributes: [
          'productId',
          [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
          [sequelize.fn('SUM', sequelize.col('totalPrice')), 'totalRevenue']
        ],
        include: [
          {
            model: Order,
            as: 'order',
            attributes: [],
            where: billableFilter,
            required: true
          },
          {
            model: Product,
            as: 'product',
            attributes: ['name']
          }
        ],
        group: ['productId', 'product.id'],
        order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
        limit: 5,
        raw: true
      }),
      Order.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        where: { status: { [Op.notIn]: ['finalizado', 'cancelado'] } },
        group: ['status'],
        raw: true,
      }),
      Order.findAll({
        attributes: ['paymentMethod', [sequelize.fn('COUNT', sequelize.col('id')), 'count'], [sequelize.fn('SUM', sequelize.col('total')), 'revenue']],
        where: billableFilter,
        group: ['paymentMethod'],
        raw: true,
      }),
      Order.findAll({
        attributes: ['type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        where: billableFilter,
        group: ['type'],
        raw: true,
      })
    ]);

    const topProducts = topProductsRaw.map((item) => ({
      id: item.productId,
      name: item['product.name'],
      quantity: parseInt(item.totalQuantity, 10),
      revenue: parseFloat(item.totalRevenue)
    }));

    const safeRevenue = revenue || 0;
    const activeOrders = {
      novo: 0,
      em_preparo: 0,
      pronto: 0,
      aguardando_pagamento: 0,
      em_rota: 0,
    };
    activeOrdersRaw.forEach((item) => {
      if (Object.prototype.hasOwnProperty.call(activeOrders, item.status)) {
        activeOrders[item.status] = parseInt(item.count, 10);
      }
    });
    const paymentMethods = paymentMethodsRaw.map((item) => ({
      method: item.paymentMethod,
      count: parseInt(item.count, 10),
      revenue: parseFloat(item.revenue || 0)
    }));
    const orderTypes = orderTypesRaw.map((item) => ({
      type: item.type,
      count: parseInt(item.count, 10)
    }));

    const payload = {
      metrics: {
        revenue: safeRevenue,
        totalOrders,
        averageTicket: totalOrders > 0 ? safeRevenue / totalOrders : 0,
        cancellations,
        cancellationRate: totalOrders + cancellations > 0 ? Math.round((cancellations / (totalOrders + cancellations)) * 100) : 0
      },
      recentOrders,
      topProducts,
      activeOrders,
      paymentMethods,
      orderTypes
    };

    await simpleCache.set(cacheKey, payload, DASHBOARD_CACHE_TTL_MS);
    res.json(payload);
  } catch (error) {
    console.error('[dashboard.getMetrics]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
