module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction((t) => {
            return Promise.all([
                queryInterface.addColumn(
                    "Employees",
                    "firstLogin",
                    {
                        type: Sequelize.DataTypes.BOOLEAN,
                        defaultValue: false,
                    },
                    { transaction: t }
                ),
            ]);
        });
    },
};