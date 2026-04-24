'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Orders', 'deliveryLatitude', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true
    });
    await queryInterface.addColumn('Orders', 'deliveryLongitude', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true
    });
    await queryInterface.addColumn('Orders', 'deliveryAccuracyMeters', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
    await queryInterface.addColumn('Orders', 'deliveryLocationCapturedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('Orders', 'deliveryLatitude');
    await queryInterface.removeColumn('Orders', 'deliveryLongitude');
    await queryInterface.removeColumn('Orders', 'deliveryAccuracyMeters');
    await queryInterface.removeColumn('Orders', 'deliveryLocationCapturedAt');
  }
};
