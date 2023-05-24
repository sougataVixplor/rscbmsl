module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("Conversations", {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      subject: {
        type: Sequelize.DataTypes.TEXT,
        defaultValue: "",
      },
      information: {
        type: Sequelize.DataTypes.TEXT,
        defaultValue: "",
      },
      is_active: {
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: true,
      },
      status: {
        type: Sequelize.DataTypes.STRING,
        defaultValue: "",
      },
      attachmentUrl: {
        type: Sequelize.DataTypes.STRING,
        defaultValue: "",
      },
      createdAt: {
        type: "TIMESTAMP",
        defaultValue: new Date(),
      },
      updatedAt: {
        type: "TIMESTAMP",
        defaultValue: new Date(),
      },
    });
  },
};
