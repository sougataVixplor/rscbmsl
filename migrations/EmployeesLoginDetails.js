module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn(
          "Employees",
          "lastLogin",
          {
            type: "TIMESTAMP",
            defaultValue: null,
          },
          { transaction: t }
        ),
        queryInterface.addColumn(
          "Employees",
          "totalLogin",
          {
            type: Sequelize.DataTypes.INTEGER,
            defaultValue: 0,
          },
          { transaction: t }
        ),
      ]);
    });
  },
};
