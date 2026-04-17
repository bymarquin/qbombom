'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = bcrypt.hashSync('Admin@123', 8);

    await queryInterface.bulkInsert('Users', [{
      id: uuidv4(),
      name: 'Marcos Macedo',
      email: 'marcosmacedo784@gmail.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      status: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', { email: 'marcosmacedo784@gmail.com' }, {});
  }
};
