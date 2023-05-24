module.exports = (sequelize, DataTypes) => {
    const Relatives = sequelize.define('Relatives', {
        id:{
            type: DataTypes.INTEGER,
            autoIncrement: true,
        },
        emp_sub_code:{
            type: DataTypes.STRING,
            defaultValue:""
        },
        pan:{
            type:DataTypes.STRING,
            primaryKey: true,
            defaultValue:""
        },
        email:{
            type:DataTypes.STRING,
            defaultValue:""
        },
        phone:{
            type:DataTypes.STRING,
            defaultValue:""
        },
        name:{
            type:DataTypes.STRING,
            defaultValue:""
        },
        address:{
            type:DataTypes.TEXT,
            defaultValue:""   
        },
        type:{
            type:DataTypes.ENUM('Immediate Relative','Material Financial Relationship'),
            defaultValue: "Immediate Relative"
        },
        relation:{
            type:DataTypes.STRING,
            defaultValue:""
        },
        total_share:{
            type:DataTypes.FLOAT,
            defaultValue:0
        },
        security_type:{
            type:DataTypes.ENUM('Shares','Warrants','Convertible Debentures','Rights','Entitlements'),
            defaultValue: "Shares"
        },
        last_benpos_date:{
            type: 'TIMESTAMP'
        },
        release_date:{
            type: 'TIMESTAMP',
            defaultValue:null 
        },
        last_institute:{
            type:DataTypes.TEXT,
            defaultValue:""   
        },
        last_employer:{
            type:DataTypes.TEXT,
            defaultValue:"" 
        },
        other_identifier_type:{
            type: DataTypes.STRING,
            defaultValue:"" 
        },
        other_identifier_no:{
            type: DataTypes.STRING,
            defaultValue:"" 
        },
        status:{
            type:DataTypes.ENUM('Active','Release','Deactive'),
            defaultValue: "Active"
        },
        is_active:{
            type:DataTypes.BOOLEAN,
            defaultValue:true   
        }
    })
    Relatives.associate = models => {
        Relatives.belongsTo(models.Employees,{foreignKey: 'emp_pan', sourceKey: 'pan'})
        Relatives.hasMany(models.Folios,{foreignKey: 'emp_relative_pan', sourceKey: 'pan'})
    }

    return Relatives;
}