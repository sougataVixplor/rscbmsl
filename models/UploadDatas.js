module.exports = (sequelize, DataTypes) => {
    const UploadDatas = sequelize.define('UploadDatas', {
        id:{
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        previous_share:{
            type: DataTypes.FLOAT,
            defaultValue:0
        },
        current_share:{
            type: DataTypes.FLOAT,
            defaultValue:0
        },
        pan:{
            type: DataTypes.STRING,
            defaultValue:""
        },
        previous_total_share:{
            type:DataTypes.FLOAT,
            defaultValue:0
        },
        total_share:{
            type:DataTypes.FLOAT,
            defaultValue:0
        },
        current_benpos_date:{
            type: 'TIMESTAMP'
        },
        last_share_change_date:{
            type: 'TIMESTAMP',
            defaultValue: null  
        },
        is_share_changed:{
            type:DataTypes.BOOLEAN,
            defaultValue:false   
        },
        is_valid:{
            type:DataTypes.BOOLEAN,
            defaultValue:false   
        }
    })
    UploadDatas.associate = models => {
        UploadDatas.belongsTo(models.Folios,{foreignKey: 'transaction_folio', sourceKey: 'folio'})
        UploadDatas.hasMany(models.Requests,{foreignKey: 'data_id', sourceKey: 'id'})
    }

    return UploadDatas;
}