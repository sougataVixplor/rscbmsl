module.exports = (sequelize, DataTypes) => {
  const Employees = sequelize.define("Employees", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
    },
    pan: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    other_identifier_type: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    other_identifier_no: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    emp_code: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    name: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    email: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    password: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    category: {
      type: DataTypes.ENUM("Promoter", "Employee", "Director", "Partner"),
      defaultValue: "Employee",
    },
    designation: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    phone: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    address: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    total_share: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    security_type: {
      type: DataTypes.ENUM(
        "Shares",
        "Warrants",
        "Convertible Debentures",
        "Rights",
        "Entitlements"
      ),
      defaultValue: "Shares",
    },
    last_benpos_date: {
      type: DataTypes.DATE,
      defaultValue: null,
    },
    date_of_appointment_as_insider: {
      type: DataTypes.DATE,
      defaultValue: null,
    },
    last_institute: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    last_employer: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_compliance: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    photo: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.ENUM("Temp", "Active", "Update", "Release", "Deactive"),
      defaultValue: "Active",
    },
    release_date: {
      type: DataTypes.DATE,
      defaultValue: null,
    },
    temp_info: {
      type: DataTypes.JSONB,
      defaultValue: null,
    },
    refreshAccessToken: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    registrationToken: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: "DP",
    },
    canEdit: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    upsi: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    reason: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    firstLogin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isManagement: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    lastLogin: {
      type: "TIMESTAMP",
      defaultValue: null,
    },
    totalLogin: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  });
  Employees.associate = (models) => {
    Employees.belongsTo(models.Company, {
      foreignKey: "company_id",
      sourceKey: "id",
    });
    Employees.hasMany(models.Relatives, {
      foreignKey: "emp_pan",
      sourceKey: "pan",
    });
    Employees.hasMany(models.Folios, {
      foreignKey: "emp_pan",
      sourceKey: "pan",
    });
  };

  return Employees;
};
