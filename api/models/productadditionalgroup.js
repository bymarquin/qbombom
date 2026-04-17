'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProductAdditionalGroup extends Model {
    static associate(models) {}
  }
  ProductAdditionalGroup.init({
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    additionalGroupId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
  }, {
    sequelize,
    modelName: 'ProductAdditionalGroup',
    tableName: 'ProductAdditionalGroups',
  });
  return ProductAdditionalGroup;
};
