'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });
      OrderItem.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });
      OrderItem.belongsTo(models.ProductVariation, {
        foreignKey: 'productVariationId',
        as: 'variation'
      });
    }
  }
  OrderItem.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Orders',
        key: 'id'
      }
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id'
      }
    },
    productVariationId: {
      type: DataTypes.UUID,
      references: {
        model: 'ProductVariations',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    variationName: DataTypes.STRING,
    observation: DataTypes.TEXT,
    selectedAdditionals: {
      type: DataTypes.JSONB,
      comment: 'JSON storing the selected additionals for this item'
    }
  }, {
    sequelize,
    modelName: 'OrderItem',
    tableName: 'OrderItems'
  });
  return OrderItem;
};
