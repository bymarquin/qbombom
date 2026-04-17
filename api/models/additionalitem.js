'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AdditionalItem extends Model {
    static associate(models) {
      AdditionalItem.belongsTo(models.AdditionalGroup, {
        foreignKey: 'additionalGroupId',
        as: 'group'
      });
    }
  }
  AdditionalItem.init({
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
      defaultValue: 0.00
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    additionalGroupId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'AdditionalGroups',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'AdditionalItem',
    tableName: 'AdditionalItems'
  });
  return AdditionalItem;
};
