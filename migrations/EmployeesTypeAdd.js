module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction((t) => {
            return Promise.all([
                queryInterface.addColumn(
                    "Employees",
                    "type",
                    {
                        type: Sequelize.DataTypes.STRING,
                        defaultValue: "DP",
                    },
                    { transaction: t }
                ),
            ]);
        });
    },
};
