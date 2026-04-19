'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProductImages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      productId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Products', key: 'id' },
        onDelete: 'CASCADE',
      },
      imageUrl: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      position: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('ProductImages', ['productId', 'position']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ProductImages');
  },
};
