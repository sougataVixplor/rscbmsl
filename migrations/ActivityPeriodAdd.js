module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction((t) => {
            return Promise.all([
                queryInterface.addColumn(
                    "ActivityLogs",
                    "period",
                    {
                        type: Sequelize.DataTypes.STRING,
                        defaultValue: "",
                    },
                    { transaction: t }
                ),
            ]);
        });
    },
};
