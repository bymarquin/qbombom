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
    paymentProvider: DataTypes.STRING,
    paymentProviderReference: DataTypes.STRING,
    pixQrCode: DataTypes.TEXT,
    pixQrCodeBase64: DataTypes.TEXT,
    pixExpiresAt: DataTypes.DATE,
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
    tableNumber: DataTypes.STRING,
    deliveryAddress: DataTypes.TEXT,
    deliveryLatitude: DataTypes.DECIMAL(10, 7),
    deliveryLongitude: DataTypes.DECIMAL(10, 7),
    deliveryAccuracyMeters: DataTypes.FLOAT,
    deliveryLocationCapturedAt: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'Orders'
  });
  return Order;
};
