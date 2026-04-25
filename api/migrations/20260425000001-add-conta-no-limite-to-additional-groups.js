'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('AdditionalGroups', 'countsTowardLimit', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('AdditionalGroups', 'countsTowardLimit');
  },
};
