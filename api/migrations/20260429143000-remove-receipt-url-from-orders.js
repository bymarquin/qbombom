'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const table = await queryInterface.describeTable('Orders');
    if (table.receiptUrl) {
      await queryInterface.removeColumn('Orders', 'receiptUrl');
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Orders');
    if (!table.receiptUrl) {
      await queryInterface.addColumn('Orders', 'receiptUrl', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },
};
