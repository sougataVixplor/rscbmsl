module.exports = (sequelize, DataTypes) => {
    const Requests = sequelize.define('Requests', {
        id:{
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        category:{
            type:DataTypes.ENUM('Promoter','Employee','Director','Partner','Immediate Relative','Material Financial Relationship'),
            defaultValue: "Employee"
        },
        security_type:{
            type:DataTypes.ENUM('Shares','Warrants','Convertible Debentures','Rights','Entitlements'),
            defaultValue: "Shares"
        },
        mode:{
            type:DataTypes.ENUM('Market','Public','Preferential Offer','Rights','Off Market','ESOP Request','Inter-se Transfer'),
            defaultValue: "Market"
        },
        request_type:{
            type:DataTypes.ENUM('Purchase','Sell'),
            defaultValue: "Purchase"
        },
        date_requested_from:{
            type: 'TIMESTAMP'
        },
        date_requested_to:{
            type: 'TIMESTAMP'
        },
        request_quantity:{
            type:DataTypes.FLOAT,
            defaultValue:0
        },
        proposed_price:{
            type:DataTypes.FLOAT,
            defaultValue:0
        },
        market_price:{
            type:DataTypes.FLOAT,
            defaultValue:0
        },
        previous_total_share:{
            type:DataTypes.FLOAT,
            defaultValue:0
        },
        previous_security_type:{
            type:DataTypes.ENUM('Shares','Warrants','Convertible Debentures','Rights','Entitlements'),
            defaultValue: "Shares"
        },
        request_status:{
            type:DataTypes.ENUM('Pending','Approved','Rejected','Expired','Completed'),
            defaultValue: "Pending"
        },
        request_date:{
            type: 'TIMESTAMP'
        },
        approval_date:{
            type: 'TIMESTAMP'
        },
        transaction_date:{
            type: 'TIMESTAMP'
        },
        transaction_quantity:{
            type:DataTypes.FLOAT,
            defaultValue:0
        },
        pan:{
            type: DataTypes.STRING,
            defaultValue:""
        },
        transaction_price:{
            type:DataTypes.FLOAT,
            defaultValue:0
        },
        stock_exchange:{
            type:DataTypes.ENUM('BSE','NSE'),
            defaultValue: null
        },
        trans_folio:{
            type: DataTypes.STRING,
            defaultValue:""
        },
        reason:{
            type:DataTypes.TEXT,
            defaultValue:""   
        }
    })
    Requests.associate = models => {
        Requests.belongsTo(models.Folios,{foreignKey: 'request_folio', sourceKey: 'folio'})
        // Requests.belongsTo(models.Folios,{foreignKey: 'trans_folio', sourceKey: 'folio'})
        Requests.belongsTo(models.UploadDatas,{foreignKey: 'data_id', sourceKey: 'id'})
    }

    return Requests;
}