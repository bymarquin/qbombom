'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Category, {
        foreignKey: 'categoryId',
        as: 'category'
      });
      Product.hasMany(models.ProductVariation, {
        foreignKey: 'productId',
        as: 'variations',
        onDelete: 'CASCADE'
      });
      Product.belongsToMany(models.AdditionalGroup, {
        through: models.ProductAdditionalGroup,
        foreignKey: 'productId',
        otherKey: 'additionalGroupId',
        as: 'additionalGroups',
      });
      Product.hasMany(models.ProductImage, {
        foreignKey: 'productId',
        as: 'images',
        onDelete: 'CASCADE',
      });
      Product.hasMany(models.OrderItem, {
        foreignKey: 'productId',
        as: 'orderItems'
      });
    }
  }
  Product.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    manageStock: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    weightBased: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    pricePerKg: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    minPrice: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Categories',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'Products'
  });
  return Product;
};
