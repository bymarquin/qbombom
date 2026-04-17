const { Order, OrderItem, Product, sequelize } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

exports.getMetrics = async (req, res) => {
  try {
    const { period } = req.query; // 'today', 'week', 'month'
    
    let startDate;
    let endDate = moment().endOf('day').toDate();

    if (period === 'week') {
      startDate = moment().subtract(7, 'days').startOf('day').toDate();
    } else if (period === 'month') {
      startDate = moment().startOf('month').toDate();
    } else {
      // Default: today
      startDate = moment().startOf('day').toDate();
    }

    const whereClause = {
      createdAt: {
        [Op.between]: [startDate, endDate]
      }
    };

    // 1. Faturamento Total (Apenas pedidos não cancelados)
    const revenueResult = await Order.sum('total', {
      where: {
        ...whereClause,
        status: { [Op.ne]: 'cancelado' }
      }
    });
    const revenue = revenueResult || 0;

    // 2. Total de Pedidos (Não cancelados)
    const totalOrders = await Order.count({
      where: {
        ...whereClause,
        status: { [Op.ne]: 'cancelado' }
      }
    });

    // 3. Ticket Médio
    const averageTicket = totalOrders > 0 ? (revenue / totalOrders) : 0;

    // 4. Cancelamentos
    const cancellations = await Order.count({
      where: {
        ...whereClause,
        status: 'cancelado'
      }
    });

    // 5. Pedidos Recentes
    const recentOrders = await Order.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // 6. Top Produtos (Mais vendidos no período)
    const topProductsRaw = await OrderItem.findAll({
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
          where: {
            ...whereClause,
            status: { [Op.ne]: 'cancelado' }
          },
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
    });

    // Clean up raw results
    const topProducts = topProductsRaw.map(item => ({
      id: item.productId,
      name: item['product.name'],
      quantity: parseInt(item.totalQuantity, 10),
      revenue: parseFloat(item.totalRevenue)
    }));

    res.json({
      metrics: {
        revenue,
        totalOrders,
        averageTicket,
        cancellations
      },
      recentOrders,
      topProducts
    });

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
