'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.createTable('calendar', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: null,
        allowNull: false,

      }
    })
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
