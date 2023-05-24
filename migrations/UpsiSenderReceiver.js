module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn(
          "UPSILogs",
          "sender_id",
          {
            type: Sequelize.DataTypes.TEXT,
            defaultValue: null,
          },
          { transaction: t }
        ),
        queryInterface.addColumn(
          "UPSILogs",
          "receiver_id",
          {
            type: Sequelize.DataTypes.TEXT,
            defaultValue: null,
          },
          { transaction: t }
        ),
      ]);
    });
  },
};
