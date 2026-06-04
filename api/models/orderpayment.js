'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrderPayment extends Model {
    static associate(models) {
      OrderPayment.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order',
      });
    }
  }

  OrderPayment.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    method: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pendente',
    },
  }, {
    sequelize,
    modelName: 'OrderPayment',
    tableName: 'OrderPayments',
  });

  return OrderPayment;
};
