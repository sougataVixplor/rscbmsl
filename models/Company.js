module.exports = (sequelize, DataTypes) => {
    const Company = sequelize.define('Company', {
        id:{
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        code:{
            type: DataTypes.STRING,
            defaultValue:""
        },
        name:{
            type:DataTypes.STRING,
            defaultValue:""
        },
        isin:{
            type:DataTypes.STRING,
            defaultValue:""   
        },
        cin:{
            type:DataTypes.STRING,
            defaultValue:""
        },
        address:{
            type:DataTypes.TEXT,
            defaultValue:""   
        },
        city:{
            type:DataTypes.STRING,
            defaultValue:""
        },
        state:{
            type:DataTypes.STRING,
            defaultValue:""
        },
        pin:{
            type:DataTypes.STRING,
            defaultValue:""
        },
        phone:{
            type:DataTypes.STRING,
            defaultValue:""
        },
        fax:{
            type:DataTypes.STRING,
            defaultValue:""
        },
        email:{
            type:DataTypes.STRING,
            defaultValue:""
        },
        total_capital:{
            type:DataTypes.FLOAT,
            defaultValue:0
        },
        share_value:{
            type:DataTypes.FLOAT,
            defaultValue:0
        },
        contact_person:{
            type:DataTypes.STRING,
            defaultValue:""
        },
        window_close_from:{
            type: 'TIMESTAMP',
            defaultValue:null
        },
        window_close_to:{
            type: 'TIMESTAMP',
            defaultValue:null
        },
        purpose:{
            type:DataTypes.TEXT,
            defaultValue:""   
        },
        website:{
            type:DataTypes.TEXT,
            defaultValue:""   
        },
        meta_tag:{
            type:DataTypes.TEXT,
            defaultValue:""   
        }
    })
    Company.associate = models => {
        Company.hasMany(models.Employees,{foreignKey: 'company_id', sourceKey: 'id'})
    }

    return Company;
}