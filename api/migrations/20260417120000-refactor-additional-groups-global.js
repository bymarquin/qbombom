'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Cria tabela junction N:N
    await queryInterface.createTable('ProductAdditionalGroups', {
      productId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      additionalGroupId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'AdditionalGroups', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addConstraint('ProductAdditionalGroups', {
      fields: ['productId', 'additionalGroupId'],
      type: 'primary key',
      name: 'product_additional_groups_pkey',
    });

    // 2. Migra dados existentes para a junction table
    await queryInterface.sequelize.query(`
      INSERT INTO "ProductAdditionalGroups" ("productId", "additionalGroupId", "createdAt", "updatedAt")
      SELECT "productId", id, NOW(), NOW()
      FROM "AdditionalGroups"
      WHERE "productId" IS NOT NULL
    `);

    // 3. Remove FK e coluna productId de AdditionalGroups
    await queryInterface.removeConstraint('AdditionalGroups', 'AdditionalGroups_productId_fkey');
    await queryInterface.removeColumn('AdditionalGroups', 'productId');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('AdditionalGroups', 'productId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Products', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    await queryInterface.dropTable('ProductAdditionalGroups');
  },
};
