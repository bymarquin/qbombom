'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ProductVariations', 'barcode', {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('ProductVariations', 'barcode');
  },
};
