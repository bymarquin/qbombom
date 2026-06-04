'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('OrderPayments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      orderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      method: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pendente',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('OrderPayments', ['orderId'], {
      name: 'order_payments_order_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('OrderPayments');
  },
};
