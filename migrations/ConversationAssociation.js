module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn(
          "Conversations", // name of Source model
          "upsi_id", // name of the key we're adding
          {
            type: Sequelize.DataTypes.INTEGER,
            references: {
              model: "UPSILogs", // name of Target model
              key: "id", // key in Target model that we're referencing
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
          }
        ),
        queryInterface.addColumn(
          "Conversations", // name of Source model
          "sender_id", // name of the key we're adding
          {
            type: Sequelize.DataTypes.STRING,
            references: {
              model: "Employees", // name of Target model
              key: "pan", // key in Target model that we're referencing
              as: "Sender",
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
          }
        ),
        queryInterface.addColumn(
          "Conversations", // name of Source model
          "receiver_id", // name of the key we're adding
          {
            type: Sequelize.DataTypes.STRING,
            references: {
              model: "Employees", // name of Target model
              key: "pan", // key in Target model that we're referencing
              as: "Receiver",
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
          }
        ),
      ]);
    });
  },
};
