const nodemailer = require("nodemailer");
const config = require("../config/config");
const env = process.env.NODE_ENV || "development";

var transporter = null;

const sentMail = async (mailOptions) => {
  if (config[env].smtpFlag) {
    var transporter = nodemailer.createTransport({
      // service: config[env].smtpDetail.service,
      host: config[env].smtpDetail.host,
      secureConnection: config[env].smtpDetail.secureConnection,
      port: config[env].smtpDetail.port,

      auth: {
        user: mailOptions.mailId ? mailOptions.mailId : config[env].mailId,
        pass: config[env].mailPassword,
      },
      tls: config[env].smtpDetail.tls,
    });
  } else {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config[env].mailId,
        pass: config[env].mailPassword,
      },
    });
  }
  mailOptions = {
    ...mailOptions,
    from: mailOptions.mailId ? mailOptions.mailId : config[env].mailId,
  };
  try {
    console.log("Email mailOptions: " + mailOptions);
    var response = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + response);
    return { status: 200, message: "Mail sent" };
  } catch (error) {
    if (error) {
      console.log(error);
      return { status: 500, message: "Error!!!" };
    }
  }
};

module.exports = {
  sentMail,
};
