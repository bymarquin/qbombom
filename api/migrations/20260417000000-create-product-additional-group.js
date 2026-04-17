'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProductAdditionalGroups', {
      productId: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Products', key: 'id' },
        onDelete: 'CASCADE',
      },
      additionalGroupId: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'AdditionalGroups', key: 'id' },
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ProductAdditionalGroups');
  },
};
