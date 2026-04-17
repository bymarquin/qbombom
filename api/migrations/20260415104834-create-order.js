'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Orders', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      trackingCode: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Mesa'
      },
      customerName: {
        type: Sequelize.STRING
      },
      customerId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      customerPhone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      deliveryAddress: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'novo'
      },
      paymentStatus: {
        type: Sequelize.STRING,
        defaultValue: 'pendente'
      },
      paymentMethod: {
        type: Sequelize.STRING
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      discount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      observation: {
        type: Sequelize.TEXT
      },
      receiptUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Orders');
  }
};
