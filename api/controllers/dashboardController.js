'use strict';

const { Order, OrderItem, Product, sequelize } = require('../models');
const { Op } = require('sequelize');

function getDateRange(period) {
  const now = new Date();
  const endOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

  if (period === 'week') {
    const from = new Date(now);
    from.setDate(now.getDate() - 7);
    return { start: startOf(from), end: endOf(now) };
  }

  if (period === '3days') {
    const from = new Date(now);
    from.setDate(now.getDate() - 3);
    return { start: startOf(from), end: endOf(now) };
  }

  if (period === 'month') {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOf(now) };
  }

  if (period === 'year') {
    return { start: new Date(now.getFullYear(), 0, 1), end: endOf(now) };
  }

  return { start: startOf(now), end: endOf(now) };
}

exports.getMetrics = async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query.period);

    const withinPeriod = { createdAt: { [Op.between]: [start, end] } };
    const billableStatuses = { status: { [Op.in]: ['finalizado', 'entregue'] } };
    const billableFilter = { ...withinPeriod, ...billableStatuses };

    const [revenue, totalOrders, cancellations, recentOrders, topProductsRaw] = await Promise.all([
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
      })
    ]);

    const topProducts = topProductsRaw.map((item) => ({
      id: item.productId,
      name: item['product.name'],
      quantity: parseInt(item.totalQuantity, 10),
      revenue: parseFloat(item.totalRevenue)
    }));

    const safeRevenue = revenue || 0;

    res.json({
      metrics: {
        revenue: safeRevenue,
        totalOrders,
        averageTicket: totalOrders > 0 ? safeRevenue / totalOrders : 0,
        cancellations
      },
      recentOrders,
      topProducts
    });
  } catch (error) {
    console.error('[dashboard.getMetrics]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
