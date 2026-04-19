'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProductImage extends Model {
    static associate(models) {
      ProductImage.belongsTo(models.Product, { foreignKey: 'productId' });
    }
  }

  ProductImage.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    position: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    sequelize,
    modelName: 'ProductImage',
    tableName: 'ProductImages',
  });

  return ProductImage;
};
