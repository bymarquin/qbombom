'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Products', 'allowedOrderTypes', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: ['Mesa', 'Viagem', 'Entrega'],
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Products', 'allowedOrderTypes');
  }
};
