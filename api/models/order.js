'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.hasMany(models.OrderItem, {
        foreignKey: 'orderId',
        as: 'items',
        onDelete: 'CASCADE'
      });
      Order.belongsTo(models.Customer, {
        foreignKey: 'customerId',
        as: 'customer'
      });
    }
  }
  Order.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    trackingCode: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Mesa' // Mesa, Viagem, Delivery
    },
    customerName: DataTypes.STRING,
    status: {
      type: DataTypes.STRING,
      defaultValue: 'novo' // novo, em_preparo, pronto
    },
    paymentStatus: {
      type: DataTypes.STRING,
      defaultValue: 'pendente' // pendente, pago
    },
    paymentMethod: DataTypes.STRING,
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    observation: DataTypes.TEXT,
    customerId: DataTypes.UUID,
    customerPhone: DataTypes.STRING,
    deliveryAddress: DataTypes.TEXT,
    receiptUrl: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'Orders'
  });
  return Order;
};
