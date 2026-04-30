'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Orders', 'paymentProvider', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Orders', 'paymentProviderReference', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Orders', 'pixQrCode', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('Orders', 'pixQrCodeBase64', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('Orders', 'pixExpiresAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Orders', 'pixExpiresAt');
    await queryInterface.removeColumn('Orders', 'pixQrCodeBase64');
    await queryInterface.removeColumn('Orders', 'pixQrCode');
    await queryInterface.removeColumn('Orders', 'paymentProviderReference');
    await queryInterface.removeColumn('Orders', 'paymentProvider');
  },
};
