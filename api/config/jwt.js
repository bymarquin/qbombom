'use strict';

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET environment variables are required');
}

module.exports = {
  SECRET: process.env.JWT_SECRET,
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
};
