'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AdditionalGroup extends Model {
    static associate(models) {
      AdditionalGroup.belongsToMany(models.Product, {
        through: models.ProductAdditionalGroup,
        foreignKey: 'additionalGroupId',
        otherKey: 'productId',
        as: 'products',
      });
      AdditionalGroup.hasMany(models.AdditionalItem, {
        foreignKey: 'additionalGroupId',
        as: 'items',
        onDelete: 'CASCADE',
      });
    }
  }
  AdditionalGroup.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    minChoices: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    maxChoices: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    freeChoices: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    stepperMode: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isSaborGroup: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    position: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    sequelize,
    modelName: 'AdditionalGroup',
    tableName: 'AdditionalGroups',
  });
  return AdditionalGroup;
};
