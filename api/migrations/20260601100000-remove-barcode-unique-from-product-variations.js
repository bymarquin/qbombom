'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeConstraint('ProductVariations', 'ProductVariations_barcode_key');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addConstraint('ProductVariations', {
      fields: ['barcode'],
      type: 'unique',
      name: 'ProductVariations_barcode_key',
    });
  },
};
