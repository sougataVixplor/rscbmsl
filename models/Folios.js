module.exports = (sequelize, DataTypes) => {
    const Folios = sequelize.define('Folios', {
        id:{
            type: DataTypes.INTEGER,
            autoIncrement: true,
        },
        folio:{
            type: DataTypes.STRING,
            primaryKey: true
        },
        current_share:{
            type:DataTypes.FLOAT,
            defaultValue:0
        },
        is_active:{
            type:DataTypes.BOOLEAN,
            defaultValue:true   
        }
    })
    Folios.associate = models => {
        Folios.belongsTo(models.Employees,{foreignKey: 'emp_pan', sourceKey: 'pan'})
        Folios.belongsTo(models.Relatives,{foreignKey: 'emp_relative_pan', sourceKey: 'pan'})
        Folios.hasMany(models.Requests,{foreignKey: 'request_folio', sourceKey: 'folio'})
        // Folios.hasMany(models.Requests,{foreignKey: 'trans_folio', sourceKey: 'folio'})
        Folios.hasMany(models.UploadDatas,{foreignKey: 'transaction_folio', sourceKey: 'folio'})
    }

    return Folios;
}