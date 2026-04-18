'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('AdditionalGroups');
    if (!table.stepperMode) {
      await queryInterface.addColumn('AdditionalGroups', 'stepperMode', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
    if (!table.position) {
      await queryInterface.addColumn('AdditionalGroups', 'position', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }
  },
  async down(queryInterface) {
    const table = await queryInterface.describeTable('AdditionalGroups');
    if (table.position) await queryInterface.removeColumn('AdditionalGroups', 'position');
    if (table.stepperMode) await queryInterface.removeColumn('AdditionalGroups', 'stepperMode');
  },
};
