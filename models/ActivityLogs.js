module.exports = (sequelize, DataTypes) => {
    const ActivityLogs = sequelize.define('ActivityLogs', {
        id:{
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        activity:{
            type: DataTypes.STRING,
            defaultValue:""
        },
        description:{
            type:DataTypes.STRING,
            defaultValue:""
        },
        period:{
            type:DataTypes.STRING,
            defaultValue:""
        },
        done_by:{
            type:DataTypes.TEXT,
            defaultValue:""
        },
        done_for:{
            type:DataTypes.TEXT,
            defaultValue:""
        },
        status:{
            type:DataTypes.ENUM('Success','Fail'),
            defaultValue: null
        }
    })
    ActivityLogs.associate = models => {
    }

    return ActivityLogs;
}