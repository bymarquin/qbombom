'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status ON "Orders" ("status")',
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at ON "Orders" ("createdAt")',
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_payment_status_provider ON "Orders" ("paymentStatus", "paymentProvider")',
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_phone ON "Customers" ("phone")',
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP INDEX CONCURRENTLY IF EXISTS idx_customers_phone');
    await queryInterface.sequelize.query('DROP INDEX CONCURRENTLY IF EXISTS idx_orders_payment_status_provider');
    await queryInterface.sequelize.query('DROP INDEX CONCURRENTLY IF EXISTS idx_orders_created_at');
    await queryInterface.sequelize.query('DROP INDEX CONCURRENTLY IF EXISTS idx_orders_status');
  },
};
