const config = {
  
  production: {
    accessTokenSecret: "NwqeSDI3WCYJBnn1YY5Yaq2,96y59rn8",
    refreshAccessTokenSecret: "truyiUIIViBubi63WPlmwaczx7f4s20l",
    expTime: "20m",
    logging: false,
    code: "CBMSL",
    name: "R.S. Software (India) Ltd.",
    isin: "INE165B01029",
    cin: "L72200WB1987PLC043375",
    address: "Kolkata",
    city: "Kolkata",
    state: "West Bengal",
    pin: "700020",
    phone: "22875746",
    fax: "22876256",
    website: "www.rssoftware.com",
    email: "nodalofficer.sdd@rssoftware.co.in",
    total_capital: 0,
    share_value: 0,
    meta_tag: "CB-Intrade",
    contact_person: "",
    window_close_from: "",
    window_close_to: "",
    CO: {
      pan: "NOPAN00000",
      emp_code: "000001",
      name: "Nodal Officer",
      email: "nodalofficer.sdd@rssoftware.co.in",
      designation: "Nodal Officer",
      phone: "",
      address: "",
      total_share: 0,
      last_benpos_date: "",
      date_of_appointment_as_insider: "",
      last_institute: "",
      last_employer: "",
      is_compliance: true,
      is_active: true,
      status: "Active",
    },
    Management: {
      pan: "MPAN00000",
      emp_code: "",
      name: "CBMSL",
      email: "r@nodal.com",
      designation: "Management",
      phone: "",
      address: "Kolkata",
      total_share: 0,
      last_benpos_date: "",
      date_of_appointment_as_insider: "",
      last_institute: "",
      last_employer: "",
      is_compliance: false,
      is_active: true,
      status: "Active",
      isManagement: true,
    },
    username: "rscbmsl",
    password: "rscbmsl2023",
    database: "cbmsl",
    host: "cbmsl.cshogpl3juxx.ap-south-1.rds.amazonaws.com",
    dialect: "postgres",
    port: "5432",
    backupLocation: "backup",
    mailId: "nodalofficer.sdd@rssoftware.co.in",
    mailPassword: null,
    backendUrl: "13.200.48.73",
    frontendUrl: "https://cbml.s3.ap-south-1.amazonaws.com/index.html",
    credentials: ["pan", "folio"],
    smtpFlag: true,
    smtpDetail: {
      service: null,
      host: "rssoftware.relay.tmes-sg.trendmicro.com",
      secureConnection: true,
      port: "25",
      tls: { rejectUnauthorized: false },
    },
  },
};

module.exports = config;
