'use strict';

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.warn('[WARNING] JWT_SECRET or JWT_REFRESH_SECRET not set. Using insecure defaults — never do this in production.');
}

module.exports = {
  SECRET: process.env.JWT_SECRET || 'qbombom_super_secret_key_2026',
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'qbombom_refresh_secret_long_lived_2026',
};
