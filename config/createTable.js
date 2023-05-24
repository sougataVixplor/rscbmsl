const bcrypt = require("bcrypt");
const config = require("../config/config");
const env = process.env.NODE_ENV || "development";
const code = config[env].code;
const name = config[env].name;
const isin = config[env].isin;
const cin = config[env].cin;
const address = config[env].address;
const city = config[env].city;
const state = config[env].state;
const pin = config[env].pin;
const phone = config[env].phone;
const fax = config[env].fax;
const email = config[env].email;
const website = config[env].website;
const total_capital = config[env].total_capital;
const share_value = config[env].share_value;
const contact_person = config[env].contact_person;
const meta_tag = config[env].meta_tag;
var window_close_from = config[env].window_close_from;
if (window_close_from != "" && window_close_from != null) {
  if (typeof window_close_from == "string") {
    window_close_from = new Date(
      new Date(window_close_from.replace(pattern, "$3-$2-$1")).setHours(0, 0, 0)
    );
  }
} else {
  window_close_from = null;
}
var window_close_to = config[env].window_close_to;
if (window_close_to != "" && window_close_to != null) {
  if (typeof window_close_to == "string") {
    window_close_to = new Date(
      new Date(window_close_to.replace(pattern, "$3-$2-$1")).setHours(0, 0, 0)
    );
  }
} else {
  window_close_to = null;
}
var pattern = /(\d{2})\/(\d{2})\/(\d{4})/;
var COInfo = config[env].CO;
var ManagementInfo = config[env].Management;
var companyInfo = [
  {
    code: code,
    name: name,
    isin: isin,
    cin: cin,
    address: address,
    city: city,
    state: state,
    pin: pin,
    phone: phone,
    fax: fax,
    website: website,
    email: email,
    total_capital: total_capital,
    share_value: share_value,
    contact_person: contact_person,
    window_close_from: window_close_from,
    window_close_to: window_close_to,
    meta_tag: meta_tag,
  },
];

const templates = [
  {
    name: "New Insider Join Request",
    type: "New_CP_Join",
    subject: "Fill Your Details",
    body: "Dear Insider,\n\n\tYou have been identified as an Insider by the Company under the Company’s policy for Prevention of Insider Trading as per SEBI Prevention of Insider Trading (PIT) Regulations. As per the SEBI (Prohibition of Insider Trading) Regulations, <<0>> is required to identify Insiders (those who has or can access unpublished price sensitive information of the Company) and create and maintain a database of such Insiders. For the above purpose, as required under this mandate, you have been identified as an Insider and hence certain data are being sought. Further, all Insiders are required to disclose the shareholding of self, immediate relatives and persons with whom you have a material financial relationship. Company’s Policy for prohibition of Insider trading is available on the PIT Compliance portal of the company as well as the website, <<1>>. You are requested to update your details on the company’s PIT compliance portal using the following details:\nURL: <<2>>\nEmail: <<3>>\nPassword: <<4>>\n\n\nYours faithfully,\nfor <<5>>\n<<6>>\nCompliance Officer",
  },
  {
    name: "New Insider Added",
    type: "New_cp_added",
    subject: "New Insider Details",
    body: "Dear <<0>>\nCompliance Officer,\n\n\tI have filled my personal details on the PIT compliance portal. Please find attached herewith details filled by me in Annexure 5 and Annexure 6\n\n\nThank You,\n<<1>>",
  },
  {
    name: "New Insider Login Details",
    type: "New_cp_login_details",
    subject: "New Login Details",
    body: "Dear <<0>>,\n\nYour details have successfully registered on the company’s PIT compliance portal. Your new login details are as under:\nURL: <<1>>\nEmail: <<2>>\nPassword: <<3>>\n\n\nYours faithfully,\nfor <<4>>\n<<5>>\nCompliance Officer",
  },
  {
    name: "Insider Update Request",
    type: "Cp_update_request",
    subject: "Insider data update request",
    body: "Dear <<0>>\nCompliance Officer,\n\n\tI have updated my personal details on the PIT compliance portal. Please find attached herewith details filled by me in Annexure 5 and Annexure 6\n\n\nThank You,\n<<1>>",
  },
  {
    name: "Insider Update Approved",
    type: "Cp_update_approved",
    subject: "Insider data update request success",
    body: "Dear <<0>>,\n\n\tYour data update has been successfully registered on the PIT compliance portal.\n\n\nYours faithfully,\nfor <<1>>\n<<2>>\nCompliance Officer",
  },
  {
    name: "Insider Update Rejected",
    type: "Cp_update_rejected",
    subject: "Insider data update request reject",
    body: "Dear <<0>>,\n\n\tYour data update request has been rejected for following reasons:\n\t<<1>>\n\n\nYours faithfully,\nfor <<2>>\n<<3>>\nCompliance Officer",
  },
  {
    name: "New Transaction Request",
    type: "New_transaction_request",
    subject: "New Transaction Request",
    body: "Dear <<0>>\nCompliance Officer,\n\n\tPlease find attached herewith Pre-Transaction Request done by me in Annexure 1 and Annexure 2.\n\n\nThank You,\n<<1>>",
  },
  {
    name: "Transaction Request Approved",
    type: "Transaction_request_appoved",
    subject: "Pre-Transaction Request Approved",
    body: "Dear <<0>>,\n\n\tYour Pre-Transaction Request has been Approved. Please find attached herewith Pre-Transaction Request status in Annexure 3.\n\n\nYours faithfully,\nfor <<1>>\n<<2>>\nCompliance Officer",
  },
  {
    name: "Transaction Request Rejected",
    type: "Transaction_request_rejected",
    subject: "Pre-Transaction Request Rejected",
    body: "Dear <<0>>,\n\n\tYour Pre-Transaction Request has been rejected. Please find attached herewith Pre-Transaction Request status in Annexure 3.\n\n\nYours faithfully,\nfor <<1>>\n<<2>>\nCompliance Officer",
  },
  {
    name: "Transaction Details Submit",
    type: "Transaction_details_submit",
    subject: "Intimation of Transaction",
    body: "Dear <<0>>\nCompliance Officer,\n\n\tPlease find attached herewith transaction done by me in Annexure 4.\n\n\nThank You,\n<<1>>",
  },
  {
    name: "Window Closure",
    type: "Window_closure",
    subject: "Trading Window closure intimation",
    body: "Dear Insider,\n\n\tIn terms of the Company's Policy for Prevention of Insider Trading, pursuant to SEBI (Prohibition of Insider Trading) Regulations, 2015, as amended, the Trading Window will remain closed for all Insiders from <<0>> until <<1>> for <<2>>. All Insiders (including immediate relatives) shall not deal in the securities of the Company during the ‘Prohibited Period’ when the trading window is closed.\n\n\nYours faithfully,\nfor <<3>>\n<<4>>\nCompliance Officer",
  },
  {
    name: "Annual Declaration",
    type: "Cp_annual_declaration",
    subject: "Insider Trading Annual Declaration",
    body: "Dear Insider,\n\nSEBI (Prohibition of Insider Trading) Regulation prohibits Insiders and their immediate relatives from Trading in the Securities of the Company based on any unpublished price sensitive information(*).\n\nAs per these regulations, <<0>> is required to identify Insiders (those who have or can access unpublished price sensitive information of the Company) and create and maintain a database of such Insiders (essentially â€˜Insidersâ€™). For the above purpose, as required under this mandate, you have been identified as a Insider and included in the Structured Digital Database (SDD) maintained at <<1>>.\n\nFurther, all such Insiders are required to disclose the shareholding of self, immediate relatives and persons with whom they have had a material financial relationship (#)\n\nYou are requested to confirm your information by visiting the SDD at following link.\n\n<<2>> and click 'Personal Information'.\n\nIf you need to add/modify any information (except PAN_NO) please do the same by clicking on the Pen button at the top right of the page and after doing the changes click the Update button at the bottom of the page.\n\nYour login details are as follows:\n\nUsername: <<3>>\nPassword: <<4>>\n\nCompanyâ€™s Policy for prohibition of Insider trading is available on companyâ€™s website <<2>>\n\nRegards\n<<5>>\nCompliance Officer\n<<6>>\n\nNotes:\n  *Unpublished price sensitive informationâ€™ means any information, relating to Company or its securities, directly or indirectly, that is not generally available which upon becoming generally available, is likely to materially affect the price of the securities and shall, ordinarily including but not restricted to, information relating to the following :\n\t(i) financial results;\n\t(ii) dividends;\n\t(iii) change in capital structure;\n\t(iv) mergers, de-mergers, acquisitions, delisting, disposals and expansion of business and such other transactions;\n\t(v) changes in key managerial personnel.\n# a relationship in which one person is a recipient of any kind of payment such as by way of a loan or gift during the immediately preceding twelve months, equivalent to at least 25% of such payerâ€™s annual income but shall exclude relationships in which the payment is based on armâ€™s length transactions.",
  },
];

const createTables = async (db) => {
  db.sequelize
    .sync({
      force: false,
    })
    .then(async (success) => {
      console.log("DATABASE SYNCED ... ");
      // console.log("companyInfo = ",companyInfo)

      // Company
      const companyData = await db.Company.create(companyInfo[0]);

      console.log("companyData id = ", companyData.id);
      console.log("COMPANY DATA INSERTED ... ");

      // preparing data of compliance officer
      // console.log("CCOInfo = ",COInfo);
      if (COInfo.last_benpos_date != "" && COInfo.last_benpos_date != null) {
        if (typeof COInfo.last_benpos_date == "string") {
          COInfo.last_benpos_date = new Date(
            new Date(
              COInfo.last_benpos_date.replace(pattern, "$3-$2-$1")
            ).setHours(0, 0, 0)
          );
        }
      } else {
        COInfo.last_benpos_date = null;
      }
      if (
        COInfo.date_of_appointment_as_insider != "" &&
        COInfo.date_of_appointment_as_insider != null
      ) {
        // console.error("typeof COInfo.date_of_appointment_as_insider = ", typeof COInfo.date_of_appointment_as_insider)
        if (typeof COInfo.date_of_appointment_as_insider == "string") {
          COInfo.date_of_appointment_as_insider = new Date(
            new Date(
              COInfo.date_of_appointment_as_insider.replace(pattern, "$3-$2-$1")
            ).setHours(0, 0, 0)
          );
        }
      } else {
        COInfo.date_of_appointment_as_insider = null;
      }

      var company = await db.Company.findAll();
      // console.log("company = ",company)
      companyId = company[0].id;
      // console.log("companyId = ",companyId)
      COInfo["company_id"] = companyId;
      if (COInfo.pan == "") {
        COInfo["password"] = bcrypt.hashSync("co123", 10);
      } else {
        COInfo["password"] = bcrypt.hashSync(COInfo.pan, 10);
      }
      // console.log("COInfo = ",COInfo)

      // Employee
      const EmployeeData = await db.Employees.create(COInfo);

      console.log("EmployeeData id = ", EmployeeData.id);

      console.log("CO DATA INSERTED ... ");

      // preparing data of Management
      // console.log("ManagementInfo = ",ManagementInfo);
      if (
        ManagementInfo.last_benpos_date != "" &&
        ManagementInfo.last_benpos_date != null
      ) {
        if (typeof ManagementInfo.last_benpos_date == "string") {
          ManagementInfo.last_benpos_date = new Date(
            new Date(
              ManagementInfo.last_benpos_date.replace(pattern, "$3-$2-$1")
            ).setHours(0, 0, 0)
          );
        }
      } else {
        ManagementInfo.last_benpos_date = null;
      }
      if (
        ManagementInfo.date_of_appointment_as_insider != "" &&
        ManagementInfo.date_of_appointment_as_insider != null
      ) {
        // console.error("typeof ManagementInfo.date_of_appointment_as_insider = ", typeof ManagementInfo.date_of_appointment_as_insider)
        if (typeof ManagementInfo.date_of_appointment_as_insider == "string") {
          ManagementInfo.date_of_appointment_as_insider = new Date(
            new Date(
              ManagementInfo.date_of_appointment_as_insider.replace(
                pattern,
                "$3-$2-$1"
              )
            ).setHours(0, 0, 0)
          );
        }
      } else {
        ManagementInfo.date_of_appointment_as_insider = null;
      }

      ManagementInfo["company_id"] = companyId;
      if (ManagementInfo.pan == "") {
        ManagementInfo["password"] = bcrypt.hashSync("co123", 10);
      } else {
        ManagementInfo["password"] = bcrypt.hashSync(ManagementInfo.pan, 10);
      }
      // console.log("ManagementInfo = ",ManagementInfo)

      // Employee
      const EmployeeData1 = await db.Employees.create(ManagementInfo);

      console.log("EmployeeData1 id = ", EmployeeData1.id);

      console.log("Management DATA INSERTED ... ");
      // Templates
      for (t = 0; t < templates.length; t++) {
        const templateInfo = await db.Templates.create(templates[t]);
      }
      console.log("TEMPLATES INSERTED ... ");
    })
    .catch((err) => {
      console.error("SYNC ERROR...", err);
    });
};

module.exports = {
  createTables,
};
