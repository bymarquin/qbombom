'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProductVariation extends Model {
    static associate(models) {
      ProductVariation.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });
      ProductVariation.hasMany(models.OrderItem, {
        foreignKey: 'productVariationId',
        as: 'orderItems'
      });
    }
  }
  ProductVariation.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    manageStock: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    maxAdditionals: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    barcode: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'ProductVariation',
    tableName: 'ProductVariations'
  });
  return ProductVariation;
};
