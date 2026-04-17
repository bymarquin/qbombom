'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AdditionalGroup extends Model {
    static associate(models) {
      AdditionalGroup.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });
      AdditionalGroup.hasMany(models.AdditionalItem, {
        foreignKey: 'additionalGroupId',
        as: 'items',
        onDelete: 'CASCADE'
      });
    }
  }
  AdditionalGroup.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    minChoices: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    maxChoices: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    freeChoices: {
      type: DataTypes.INTEGER,
      defaultValue: 0
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
    modelName: 'AdditionalGroup',
    tableName: 'AdditionalGroups'
  });
  return AdditionalGroup;
};
