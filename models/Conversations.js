module.exports = (sequelize, DataTypes) => {
  const Conversations = sequelize.define("Conversations", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    subject: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    information: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    attachmentUrl: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
  });
  Conversations.associate = (models) => {
    Conversations.belongsTo(models.UPSILogs, {
      foreignKey: "upsi_id",
      sourceKey: "id",
    });
    Conversations.belongsTo(models.Employees, {
      foreignKey: "sender_id",
      as: "Sender",
      sourceKey: "id",
    });
    Conversations.belongsTo(models.Employees, {
      foreignKey: "receiver_id",
      as: "Receiver",
      sourceKey: "id",
    });
  };

  return Conversations;
};
