'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // define association here
    }

    checkPassword(password) {
      return bcrypt.compareSync(password, this.password);
    }
  }
  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    pin: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'cashier', // SUPER_ADMIN, MANAGER, CASHIER, DELIVERY
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    refreshToken: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    hooks: {
      beforeSave: async (user) => {
        if (user.changed('password')) {
          user.password = bcrypt.hashSync(user.password, 8);
        }
      }
    }
  });
  return User;
};
