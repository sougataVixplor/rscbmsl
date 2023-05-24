var pdf = require("pdfkit");
const moment = require("moment");
const PDFDocument = require("../api/pdfkit-tables");
const { getDateString2 } = require("../util/common");
const getConversationLog = require("../util/common").getConversationLog;

async function getDateString(dateObj, timeFlag = false) {
  try {
    if (!timeFlag) {
      var dateStr =
        dateObj.getDate() +
        "-" +
        (dateObj.getMonth() + 1) +
        "-" +
        dateObj.getFullYear();
      console.log("dateObj : ", dateObj);
      return dateStr;
    } else {
      var dateStr =
        dateObj.getDate() +
        "-" +
        (dateObj.getMonth() + 1) +
        "-" +
        dateObj.getFullYear() +
        ", " +
        dateObj.getHours() +
        ":" +
        dateObj.getMinutes() +
        ":" +
        dateObj.getSeconds();
      console.log("dateObj : ", dateObj);
      return dateStr;
    }
  } catch (error) {
    console.error("getDateString:: ", error);
    throw error;
  }
}

const getDateValue = (date) => {
  var d = new Date(date);
  var day = d.getDate();
  if (day.toString().length == 1) day = "0" + day;
  var month = d.getMonth() + 1;
  if (month.toString().length == 1) month = "0" + month;
  var Year = d.getFullYear();
  return day + "-" + month + "-" + Year;
};

var getAnnexure3 = async (data) => {
  const doc = new PDFDocument({
    // layout : 'landscape'
  });
  // doc.pipe(res);
  // doc.pipe(fs.createWriteStream('example.pdf'));
  doc.font("Times-Roman");
  doc.fontSize(12);
  doc.text("ANNEXURE 3", {
    align: "center",
  });
  doc.text("FORMAT FOR PRE- CLEARANCE ORDER", {
    align: "center",
  });
  doc.fontSize(11);
  doc.text(
    "\n\n\n\nTo,\nName : " +
      data.KMP_Name +
      "\nDesignation : " +
      data.designation +
      "\nLocation : " +
      data.add +
      "\n",
    {
      align: "left",
    }
  );
  doc.moveDown();
  doc.moveDown();
  var request_date_string = await getDateString(data.request_date);
  var date_requested_to_string = await getDateString(data.date_requested_to);
  doc.text(
    "This is to inform you that your request for dealing in " +
      data.request_quantity +
      "(nos) shares of the Company as mentioned in your application dated " +
      request_date_string +
      " is " +
      data.request_status +
      ".",
    {
      align: "left",
    }
  );
  if (data.request_status == "Approved") {
    doc.text(
      "Please note that the said transaction must be completed on or before " +
        date_requested_to_string +
        " (date) that is within 7 days from today."
    );

    doc.moveDown();
    doc.moveDown();
    doc.text(
      "In case you do not execute the approved transaction /deal on or before the aforesaid date you would have to seek fresh pre-clearance before executing any transaction/deal in the securities of the Company. Further, you are required to file the details of the executed transactions in the attached format within 2 days from the date of transaction/deal. In case the transaction is not undertaken a ‘Nil’ report shall be necessary.",
      {
        align: "left",
      }
    );
  } else {
    doc.text(
      "Request has been rejected for following reasons: \n " + data.reason,
      {
        align: "left",
      }
    );
    doc.moveDown();
    doc.moveDown();
  }
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc.text("Yours faithfully,", {
    align: "right",
  });
  doc.text("for " + data.company, {
    align: "right",
  });
  doc.text("Compliance Officer  ", {
    align: "right",
  });
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  var nowDate = new Date();
  var dateStr = await getDateString(nowDate);

  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc.text("Date: " + dateStr, {
    align: "left",
  });
  doc.moveDown();
  doc.moveDown();
  doc.text("*This is system generated. Does not require signature.", {
    align: "left",
  });
  doc.moveDown();
  doc.text("Request ID: " + data.requestData_id, {
    align: "left",
  });
  doc.end();
  return doc;
};

var getAnnexure4 = async (data) => {
  var header_data = [];
  var row_data = [];
  var nowDate = new Date();
  header_data.push("Name of holder");
  header_data.push("No. of securities dealt with");
  header_data.push("Bought/sold");
  header_data.push("DP ID/Client ID/Folio No");
  header_data.push("Price (Rs.)");
  row_data.push([
    data.name,
    data.transaction_quantity,
    data.request_type,
    data.trans_folio,
    data.transaction_price,
  ]);
  const doc = new PDFDocument({
    // layout : 'landscape'
  });
  // doc.pipe(fs.createWriteStream('example.pdf'));
  const table0 = {
    headers: header_data,
    rows: row_data,
  };
  doc.font("Times-Roman");
  doc.fontSize(12);
  doc.text("ANNEXURE 4", {
    align: "center",
  });
  doc.moveDown();
  doc.fontSize(11);
  doc.text(
    "FORMAT FOR DISCLOSURE OF TRANSACTIONS\n(To be submitted within 2 days of transaction / dealing in securities of the Company)",
    {
      align: "center",
    }
  );
  doc.moveDown();
  doc.moveDown();
  var dateStr = await getDateString(nowDate);
  doc.text(
    "Date: " +
      dateStr +
      "\n\n\n\nTo,\nThe Compliance Officer,\n" +
      data.company,
    {
      align: "left",
    }
  );
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  var transaction_date_string = await getDateString(data.transaction_date);
  doc.text(
    "I hereby inform that I have " +
      data.request_type +
      " " +
      data.transaction_quantity +
      " securities as mentioned below on " +
      transaction_date_string +
      "(date).",
    {
      align: "left",
    }
  );
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc.table(table0, {
    prepareHeader: () => doc.font("Times-Roman").fontSize(11),
    prepareRow: (row, i) => doc.font("Times-Roman").fontSize(09),
  });
  doc.fontSize(11);
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc.text(
    "In connection with the aforesaid transaction(s), I hereby undertake to preserve, for a period of 5 years and produce to the Compliance officer / SEBI any of the following documents:",
    {
      align: "left",
    }
  );
  doc.moveDown();
  doc.text(
    "1. Broker’s contract note.\
    \n2. Proof of payment to/from brokers.\
    \n3. Extract of bank passbook/statement reflecting the payment or receipt as aforesaid.\
    \n4. Copy of Delivery instruction slip (applicable in case of sale transaction).",
    {
      align: "left",
    }
  );
  doc.moveDown();
  doc.text(
    "I agree to hold the above securities for a minimum period of six months. In case there is any urgent need to sell these securities within the said period, I shall approach the Compliance Officer for necessary approval. (Applicable in case of purchase/ subscription).",
    {
      align: "left",
    }
  );
  doc.moveDown();
  doc.text(
    "I declare that the above information is correct and that no provisions of the Company’s Code and/or applicable laws/regulations have been contravened for effecting the above said transactions(s).",
    {
      align: "left",
    }
  );
  doc.moveDown();
  doc.moveDown();
  doc.text("*This is system generated. Does not require signature.", {
    align: "left",
  });
  doc.moveDown();
  doc.text("Request ID: " + data.reqId, {
    align: "left",
  });
  doc.end();
  console.error("anexxure 4 generated");
  return doc;
};

var getAnnexure6 = async (data) => {
  var quantity = 0;
  var Folios = data.folios;
  for (x = 0; x < Folios.length; x++) {
    quantity += Folios[x].current_share;
  }
  data["total_share"] = quantity.toString();
  const doc = new pdf({
    margins: {
      top: 30,
      bottom: 10,
      left: 30,
      right: 30,
    },
    layout: "landscape",
  });
  // console.log(branchManagers)
  // doc.pipe(res);
  // doc.pipe( fs.createWriteStream('out.pdf') );

  // doc.addPage({
  //     margin: 50});
  doc.font("Times-Roman");
  doc.fontSize(16);
  doc.text("ANNEXURE 6", {
    align: "center",
  });
  doc.moveDown();
  doc.fontSize(12);
  var company = data.admin.Company.name;
  var ISIN = data.admin.Company.isin;
  doc.text("Name of Companny: " + company, 50);
  doc.moveDown();
  doc.text("ISIN: " + ISIN, 50);
  doc.moveDown();

  doc.text(
    "Details of Securities held on appointment of KMP or Director or upon becoming a Promoter or member of the promoter group of a listed company  and immediate relatives of such persons and by other such persons as mentioned in regulation 6(2)."
  );
  // doc.text("Id:"+payments[0].Loan.Borrower.id)
  doc.fontSize(11);
  // these examples are easier to see with a large line width
  doc.lineWidth(0.5);

  var x = 50;
  var y = doc.y + 20;

  var stY = y;
  var maxY = y;

  doc.text("Name, PAN, CIN/DIN & Address with Contact Number", x, y, {
    width: 100,
    align: "center",
  });
  x += 110;

  doc
    .lineCap("butt")
    .moveTo(x - 5, y - 5)
    .lineTo(x - 5, 460)
    .stroke();

  doc.text(
    "Category of person (KMP/Dir. or Promoter or member of the promoter group/Immediate relative to/others, etc)",
    x,
    y,
    {
      width: 100,
      align: "center",
    }
  );

  var box2X = doc.x + 105;
  var maxY2 = doc.y;
  x += 110;

  doc
    .lineCap("butt")
    .moveTo(x - 5, y - 5)
    .lineTo(x - 5, 460)
    .stroke();

  if (doc.y > maxY2) {
    maxY2 = doc.y;
  }

  doc.text(
    "Date of appointment of KMP/Dir or Date of becoming Promoter/member of the promoter group",
    x,
    y,
    {
      width: 100,
      align: "center",
    }
  );

  var box2X = doc.x + 105;
  var maxY2 = doc.y;
  x += 110;

  doc
    .lineCap("butt")
    .moveTo(x - 5, y - 5)
    .lineTo(x - 5, 460)
    .stroke();

  if (doc.y > maxY2) {
    maxY2 = doc.y;
  }
  doc.text(
    "Securities held at the time of appointment of KMP/Dir or upon becoming Promoter or member of the promoter group",
    x,
    y,
    {
      width: 200,
      align: "center",
    }
  );
  x += 210;
  doc
    .lineCap("butt")
    .moveTo(x - 5, y - 5)
    .lineTo(x - 5, 460)
    .stroke();

  if (doc.y > maxY2) {
    maxY2 = doc.y;
  }
  doc.text("% of  shareholding", x, y, {
    width: 100,
    align: "center",
  });
  x += 110;
  if (doc.y > maxY2) {
    maxY2 = doc.y;
  }

  //end of first layer headline

  y = y + 50;
  x = 380;

  doc.text(
    "Type of securities (For e.g.-Share, warrants, Convertible debentures, Rights entitlements, etc.)",
    x,
    y,
    {
      width: 100,
      align: "center",
    }
  );

  x += 110;

  doc
    .lineCap("butt")
    .moveTo(x - 3, y - 3)
    .lineTo(x - 3, 460)
    .stroke();

  if (doc.y > maxY) {
    // console.log("1 doc y", doc.y, maxY);
    maxY = doc.y;
  }

  doc.text("No", x, y, {
    width: 100,
    align: "center",
  });
  if (doc.y > maxY) {
    // console.log("2 doc y", doc.y, maxY);

    maxY = doc.y;
  }
  x += 110;

  const endX = x + 5;
  if (doc.y > maxY) {
    // console.log("9 doc y", doc.y, maxY);

    maxY = doc.y;
  }
  // console.log("endX", endX);
  doc.rect(50, stY - 5, endX + 70, 130).stroke();
  doc.rect(50, stY - 5, endX + 70, 300).stroke();
  // console.log("endX", endX);
  doc.rect(box2X, stY - 5, 350, 52).stroke();

  var y = 310;
  var x = 60;
  var category = "";
  var appontDate = "";
  var security_type = data.security_type;
  var quantity = data.total_share;
  if (data.emp.length == 0) {
    // in case of relatives
    // console.error("relData = ",data)
    category = data.type;
  } else {
    // in case of Employee
    // console.error("empData = ",data)
    category = data.emp.category;
    appontDate = await getDateString(data.emp.createdAt);
  }
  var share_percent = "";
  doc.text(data.name, x, y, { width: 100 });
  doc.text(data.pan, x, y + 10, { width: 100 });
  doc.text(data.address, x, y + 20, { width: 100 });
  doc.text(data.phone, x, y + 30, { width: 100 });

  doc.text(category, x + 100, y, { width: 100 });

  doc.text(appontDate, x + 210, y, { width: 100 });

  doc.text(security_type, x + 320, y, { width: 100 });

  doc.text(quantity.toString(), x + 450, y, { width: 100 });

  doc.text(share_percent, x + 550, y, { width: 100 });

  doc.moveDown();

  doc.text(
    "Note: “Securities” shall have the meaning as defined under regulation 2(1) (i) of SEBI  (Prohibition of Insider Trading) Regulations, 2015",
    50,
    470
  );

  doc.moveDown();

  // doc.text("Name:")
  // doc.text("Signature:")
  // doc.text("Place:")
  // doc.text("Date:")

  doc.moveDown();
  doc.moveDown();

  doc.text(
    "Note:: For existing designated persons, this declaration to be given on an annual basis (as of 31 March) and for new designated persons within 30 days from becoming a Designated Person",
    50
  );

  doc.moveDown();
  doc.text("*Machine generated document.\n No need of signature");
  doc.end();

  return doc;
};

var getAnnexure5 = async (data) => {
  const doc = new PDFDocument({});

  doc.font("Times-Roman");
  doc.fontSize(12);
  doc.text("ANNEXURE 5", {
    align: "center",
  });
  doc.moveDown();
  var company = data.admin.Company.name;
  doc.text("To");
  doc.text("The Compliance Officer,:");
  doc.text(company);

  doc.moveDown();
  doc.moveDown();

  doc.text("Dear Sir,  ");
  doc.text(
    "I, " +
      data.name +
      ", hereby furnish the following details in terms of the " +
      company +
      " Insider Trading Policy:"
  );
  var header_data = [];
  var row_data = [];
  var joiningDateStr = await getDateString(data.emp.createdAt);
  header_data.push("");
  header_data.push("");
  row_data.push(["Name", data.name]);
  row_data.push(["Designation", data.designation]);
  row_data.push(["Function", data.function]);
  row_data.push(["Employee Code", data.emp_code]);
  row_data.push(["Address", data.address]);
  row_data.push(["Mobile No.", data.phone]);
  row_data.push(["Email", data.email]);
  row_data.push(["PAN", data.pan]);
  row_data.push(["Date of joining", joiningDateStr]);
  row_data.push([
    "Degree and Names of the educational institutions where studied",
    data.last_institute,
  ]);
  row_data.push(["Names of past employers, if any", data.last_employer]);

  const table0 = {
    headers: header_data,
    rows: row_data,
  };

  doc.moveDown();
  doc.moveDown();

  doc.text("1. Details of Designated Person");
  doc.moveDown();
  doc.moveDown();

  doc.table(table0, {
    prepareHeader: () => doc.font("Times-Roman").fontSize(10),
    prepareRow: (row, i) => doc.font("Times-Roman").fontSize(10),
  });

  doc.fontSize(12);

  doc.moveDown();

  doc.text("2. Details of my Immediate Relatives");
  doc.moveDown();
  doc.moveDown();

  header_data = [];
  row_data = [];

  header_data.push("Name");
  header_data.push("Relation");
  header_data.push("PAN");
  header_data.push("Phone No.");

  for (var i = 0; i < data.relatives.length; i++) {
    var r = data.relatives[i];
    if (r.type == "Immediate Relative")
      row_data.push([r.name, r.relation, r.pan, r.phone]);
  }

  const table1 = {
    headers: header_data,
    rows: row_data,
  };

  doc.table(table1, {
    prepareHeader: () => doc.font("Times-Roman").fontSize(10),
    prepareRow: (row, i) => doc.font("Times-Roman").fontSize(10),
  });

  doc.fontSize(12);

  doc.moveDown();

  doc.text(
    "3. Details of persons with whom I have a ‘material financial relationship’"
  );

  doc.moveDown();

  header_data = [];
  row_data = [];

  header_data.push("Name");
  header_data.push("Relation");
  header_data.push("PAN");
  header_data.push("Phone No.");

  for (var i = 0; i < data.relatives.length; i++) {
    var r = data.relatives[i];
    if (r.type == "Material Financial Relationship")
      row_data.push([r.name, r.relation, r.pan, r.phone]);
  }

  const table2 = {
    headers: header_data,
    rows: row_data,
  };

  doc.moveDown();

  doc.table(table2, {
    prepareHeader: () => doc.font("Times-Roman").fontSize(10),
    prepareRow: (row, i) => doc.font("Times-Roman").fontSize(10),
  });

  doc.moveDown();
  doc.moveDown();

  doc.fontSize(11);

  doc.moveDown();
  doc.text("*Machine generated document.\n No need of signature");
  doc.moveDown();
  // doc.text("Name:")
  // doc.moveDown()
  // doc.text("Place:")
  // doc.moveDown()
  // doc.text("Date:")
  // doc.moveDown()
  // doc.moveDown()

  doc.fontSize(9);

  doc.text(
    "* “material financial relationship” shall mean a relationship in which" +
      "one person is a recipient of any kind of payment such as by way of a loan or gift" +
      " during the immediately preceding twelve months, equivalent to at least 25% of such " +
      "payer’s annual income but shall exclude relationships in which the payment is based on arm’s length transactions",
    {
      align: "justify",
    }
  );

  doc.text(
    "** “immediate relative” means (i)  a spouse of a person and (ii) child," +
      " parent and sibling of such person or of the spouse, any of whom is either dependent" +
      " financially on such person, or consult such person in taking decisions relating to" +
      " trading in securities.  Spouse of a person will be considered immediate relative " +
      "irrespective of whether he/she is financially dependent or consults such person in " +
      "taking decisions relating to trading in securities.",
    {
      align: "justify",
    }
  );

  // console.error("returned...")
  doc.end();

  return doc;
};

var getAnnexure7And8 = async (data) => {
  const doc = new pdf({
    margins: {
      top: 30,
      bottom: 10,
      left: 30,
      right: 30,
    },
    layout: "landscape",
  });
  // console.log(branchManagers)
  // doc.pipe( fs.createWriteStream('out.pdf') );

  // doc.addPage({
  //     margin: 50});
  doc.font("Times-Roman");
  doc.fontSize(16);
  doc.text("ANNEXURE 7", {
    align: "center",
  });
  doc.moveDown();
  doc.fontSize(12);
  var Company = data.Folio.Employee.Company.name;
  var ISIN = data.Folio.Employee.Company.isin;
  doc.text("Name of Companny: " + Company, 50);
  doc.moveDown();
  doc.text("ISIN: " + ISIN, 50);
  doc.moveDown();

  doc.text(
    "Details of change in holding of Securities of Promoter, Member of the of the Promoter " +
      "Group, Designated Person or Director of a listed company and immediate relatives of such " +
      "persons and by other such persons as mentioned in regulation 6(2)."
  );
  // doc.text("Id:"+payments[0].Loan.Borrower.id)
  doc.fontSize(11);
  // these examples are easier to see with a large line width
  doc.lineWidth(0.5);

  var x = 50;
  var y = doc.y + 20;

  var stY = y;
  var maxY = y;

  doc.text("Name, PAN, CIN/DIN & address with contact nos.", x, y, {
    width: 100,
    align: "center",
  });
  x += 110;

  doc
    .lineCap("butt")
    .moveTo(x - 5, y - 5)
    .lineTo(x - 5, 560)
    .stroke();

  doc.text(
    "Category of person (Promoter/Member of the  promoter" +
      "group/designated person/Directors/Immediate " +
      " relative to/others etc.)",
    x,
    y,
    {
      width: 100,
      align: "center",
    }
  );

  var box2X = doc.x + 105;
  var maxY2 = doc.y;
  x += 110;

  doc
    .lineCap("butt")
    .moveTo(x - 5, y - 5)
    .lineTo(x - 5, 560)
    .stroke();

  if (doc.y > maxY2) {
    maxY2 = doc.y;
  }
  doc.text("Securities held prior to acquisition/disposal", x, y, {
    width: 100,
    align: "center",
  });
  x += 110;
  doc
    .lineCap("butt")
    .moveTo(x - 5, y - 5)
    .lineTo(x - 5, 560)
    .stroke();

  if (doc.y > maxY2) {
    maxY2 = doc.y;
  }
  doc.text("Securities Acquired/Disposal", x, y, {
    width: 150,
    align: "center",
  });
  x += 160;

  doc
    .lineCap("butt")
    .moveTo(x - 5, y - 5)
    .lineTo(x - 5, 560)
    .stroke();

  if (doc.y > maxY2) {
    maxY2 = doc.y;
  }

  doc.text("Securities held post acquisition/disposal", x, y, {
    width: 100,
    align: "center",
  });

  x += 110;

  doc
    .lineCap("butt")
    .moveTo(x - 5, y - 5)
    .lineTo(x - 5, 560)
    .stroke();

  if (doc.y > maxY2) {
    maxY2 = doc.y;
  }
  doc.text(
    "Date of allotment advice/acquisition shares/disposal of shares specify",
    x,
    y,
    {
      width: 100,
      align: "center",
    }
  );
  x += 110;
  // doc.lineCap('butt')
  // .moveTo(x-5, y - 5)
  // .lineTo(x-5, 560)
  // .stroke();

  if (doc.y > maxY2) {
    maxY2 = doc.y;
  }

  //end of first layer headline

  y = y + 50;
  x = 270;

  doc.text(
    "Type of securities (For e.g.-Share, warrants, Convertible debentures, Rights entitlements, etc.)",
    x,
    y,
    {
      width: 50,
      align: "center",
    }
  );

  x += 55;

  doc
    .lineCap("butt")
    .moveTo(x - 3, y - 3)
    .lineTo(x - 3, 560)
    .stroke();

  if (doc.y > maxY) {
    console.log("1 doc y", doc.y, maxY);
    maxY = doc.y;
  }

  doc.text("No & % of shareholding", x, y, {
    width: 50,
    align: "center",
  });
  if (doc.y > maxY) {
    console.log("2 doc y", doc.y, maxY);

    maxY = doc.y;
  }
  x += 55;

  doc.text(
    "Type of securities (For e.g.-Share, warrants, Convertible debentures, Rights  entitlements, etc. etc.",
    x,
    y,
    {
      width: 50,
      align: "center",
    }
  );
  x += 55;
  if (doc.y > maxY) {
    console.log("3 doc y", doc.y, maxY);

    maxY = doc.y;
  }

  doc
    .lineCap("butt")
    .moveTo(x - 3, y - 3)
    .lineTo(x - 3, 560)
    .stroke();

  doc.text("No", x, y, {
    width: 15,
    align: "center",
  });
  x += 20;

  doc
    .lineCap("butt")
    .moveTo(x - 3, y - 3)
    .lineTo(x - 3, 560)
    .stroke();

  if (doc.y > maxY) {
    console.log("4 doc y", doc.y, maxY);

    maxY = doc.y;
  }
  doc.text("Value", x, y, {
    width: 30,
    align: "center",
  });

  if (doc.y > maxY) {
    console.log("5 doc y", doc.y, maxY);

    maxY = doc.y;
  }
  x += 35;

  doc
    .lineCap("butt")
    .moveTo(x - 3, y - 3)
    .lineTo(x - 3, 560)
    .stroke();

  doc.text(
    "Transaction type (Purchase/Sale/pledge/revocation/Invocation others-please specify",
    x,
    y,
    {
      width: 40,
      align: "center",
    }
  );
  x += 45;

  doc.text(
    "Type of securities (For e.g.-Share, warrants, Convertible debentures, Rights entitlements, etc.)",
    x,
    y,
    {
      width: 50,
      align: "center",
    }
  );
  if (doc.y > maxY) {
    console.log("6 doc y", doc.y, maxY);

    maxY = doc.y;
  }
  x += 55;

  doc
    .lineCap("butt")
    .moveTo(x - 3, y - 3)
    .lineTo(x - 3, 560)
    .stroke();

  doc.text("No & % of shareholding", x, y, {
    width: 50,
    align: "center",
  });
  if (doc.y > maxY) {
    console.log("7 doc y", doc.y, maxY);

    maxY = doc.y;
  }
  x += 55;

  doc.text("From", x, y, {
    width: 40,
    align: "center",
  });
  x += 45;
  if (doc.y > maxY) {
    console.log("8 doc y", doc.y, maxY);

    maxY = doc.y;
  }

  doc
    .lineCap("butt")
    .moveTo(x - 3, y - 3)
    .lineTo(x - 3, 560)
    .stroke();

  doc.text("To", x, y, {
    width: 40,
    align: "center",
  });
  x += 45;

  var endX = x;
  if (doc.y > maxY) {
    console.log("9 doc y", doc.y, maxY);

    maxY = doc.y;
  }
  console.log("endX", endX);
  doc.rect(50, stY - 5, endX - 40, 200).stroke();
  doc.rect(50, stY - 5, endX - 40, 400).stroke();
  console.log("endX", endX);
  doc.rect(box2X, stY - 5, 480, 52).stroke();

  var y = 370;
  var x = 60;

  doc.text(data.Folio.Employee.name, x, y, { width: 100 });
  doc.text(data.pan, x, y + 10, { width: 100 });
  doc.text(data.Folio.Employee.address, x, y + 20, { width: 100 });
  doc.text(data.Folio.Employee.phone, x, y + 30, { width: 100 });

  doc.text(data.category, x + 100, y, { width: 100 });

  doc.text(data.previous_security_type, x + 210, y, { width: 50 });
  data.previous_total_share;
  doc.text(data.previous_total_share, x + 270, y, { width: 50 });

  doc.text(data.security_type, x + 320, y, { width: 50 });

  doc.text(data.transaction_quantity, x + 375, y, { width: 15 });
  doc.text(data.transaction_price, x + 395, y, { width: 40 });
  doc.text(data.request_type, x + 430, y, { width: 40 });

  doc.text(data.Folio.Employee.security_type, x + 480, y, { width: 50 });
  doc.text(data.Folio.Employee.total_share, x + 530, y, { width: 50 });

  var date_requested_from_Str = await getDateString(data.date_requested_from);
  var date_requested_to_Str = await getDateString(data.date_requested_to);
  doc.text(date_requested_from_Str, x + 590, y, { width: 40 });
  doc.text(date_requested_to_Str, x + 630, y, { width: 50 });

  // doc.text("Asssa",x+320, y, {width:100})

  // doc.text("890",x+450, y, {width:100})

  // doc.text("10%",x+550, y, {width:100})

  doc.addPage();

  x = 50;
  y = 50;

  doc.text("Date of intimation to Company", x, y, {
    width: 70,
    align: "center",
  });
  if (doc.y > maxY2) {
    maxY2 = doc.y;
  }

  x = x + 100;
  doc.text(
    "Mode of acquisition/disposal(on market/public/rights/preferential offer/off market/Inter-se transfer, ESOPs, etc.)",
    x,
    y,
    {
      width: 200,
      align: "center",
    }
  );
  x += 210;
  doc.text("Exchange on which the trade was executed", x, y, {
    width: 100,
    align: "center",
  });

  var nx = doc.x;
  var ny = doc.y;

  doc.lineWidth(0.5);
  doc.rect(50, 30, nx + 100, ny).stroke();
  doc.rect(50, 30, nx + 100, ny + 200).stroke();

  var y = 130;
  var x = 50;

  var createdAtStr = await getDateString(data.createdAt);
  doc.text(createdAtStr, x + 5, y, { width: 70 });
  doc.text(data.mode, x + 100, y, { width: 200 });
  doc.text(data.stock_exchange, x + 320, y, { width: 100 });

  // line cap settings
  doc
    .lineCap("butt")
    .moveTo(50 + 80, 30)
    .lineTo(50 + 80, 305)
    .stroke();

  doc
    .lineCap("butt")
    .moveTo(50 + 300, 30)
    .lineTo(50 + 300, 305)
    .stroke();

  doc.moveDown();

  doc.text(
    "Note: “Securities” shall have the meaning as defined under regulation 2(1) (i) of SEBI  (Prohibition of Insider Trading) Regulations, 2015",
    50,
    320
  );

  doc.moveDown();
  doc.moveDown();

  doc.fontSize(9);
  doc.text("Machine generated document.\n No need of signature");

  doc.addPage();

  //Annwexure 8

  doc.font("Times-Roman");
  doc.fontSize(16);
  doc.text("ANNEXURE 8", {
    align: "center",
  });
  doc.moveDown();
  doc.fontSize(12);
  doc.text("Name of Companny: Azko Novel", 50);
  doc.moveDown();
  doc.text("ISIN: IN224234125", 50);
  doc.moveDown();

  doc.text(
    "Details of change in holding of Securities of Promoter, Member of the of the Promoter " +
      "Group, Designated Person or Director of a listed company and immediate relatives of such " +
      "persons and by other such persons as mentioned in regulation 6(2)."
  );
  // doc.text("Id:"+payments[0].Loan.Borrower.id)
  doc.fontSize(11);
  // these examples are easier to see with a large line width
  doc.lineWidth(0.5);

  var x = 50;
  var y = doc.y + 20;

  var stY = y;
  var maxY = y;

  doc.text("Name, PAN, CIN/DIN & address with contact nos.", x, y, {
    width: 100,
    align: "center",
  });
  x += 110;

  doc
    .lineCap("butt")
    .moveTo(x - 5, y - 5)
    .lineTo(x - 5, 560)
    .stroke();

  doc.text(
    "Category of person (Promoter/Member of the  promoter" +
      "group/designated person/Directors/Immediate " +
      " relative to/others etc.)",
    x,
    y,
    {
      width: 100,
      align: "center",
    }
  );

  var box2X = doc.x + 105;
  var maxY2 = doc.y;
  x += 110;

  doc
    .lineCap("butt")
    .moveTo(x - 5, y - 5)
    .lineTo(x - 5, 560)
    .stroke();

  if (doc.y > maxY2) {
    maxY2 = doc.y;
  }
  doc.text("Securities held prior to acquisition/disposal", x, y, {
    width: 100,
    align: "center",
  });
  x += 110;
  doc
    .lineCap("butt")
    .moveTo(x - 5, y - 5)
    .lineTo(x - 5, 560)
    .stroke();

  if (doc.y > maxY2) {
    maxY2 = doc.y;
  }
  doc.text("Securities Acquired/Disposal", x, y, {
    width: 150,
    align: "center",
  });
  x += 160;

  doc
    .lineCap("butt")
    .moveTo(x - 5, y - 5)
    .lineTo(x - 5, 560)
    .stroke();

  if (doc.y > maxY2) {
    maxY2 = doc.y;
  }

  doc.text("Securities held post acquisition/disposal", x, y, {
    width: 100,
    align: "center",
  });

  x += 110;

  doc
    .lineCap("butt")
    .moveTo(x - 5, y - 5)
    .lineTo(x - 5, 560)
    .stroke();

  if (doc.y > maxY2) {
    maxY2 = doc.y;
  }
  doc.text(
    "Date of allotment advice/acquisition shares/disposal of shares specify",
    x,
    y,
    {
      width: 100,
      align: "center",
    }
  );
  x += 110;
  // doc.lineCap('butt')
  // .moveTo(x-5, y - 5)
  // .lineTo(x-5, 560)
  // .stroke();

  if (doc.y > maxY2) {
    maxY2 = doc.y;
  }

  //end of first layer headline

  y = y + 50;
  x = 270;

  doc.text(
    "Type of securities (For e.g.-Share, warrants, Convertible debentures, Rights entitlements, etc.)",
    x,
    y,
    {
      width: 50,
      align: "center",
    }
  );

  x += 55;

  doc
    .lineCap("butt")
    .moveTo(x - 3, y - 3)
    .lineTo(x - 3, 560)
    .stroke();

  if (doc.y > maxY) {
    console.log("1 doc y", doc.y, maxY);
    maxY = doc.y;
  }

  doc.text("No & % of shareholding", x, y, {
    width: 50,
    align: "center",
  });
  if (doc.y > maxY) {
    console.log("2 doc y", doc.y, maxY);

    maxY = doc.y;
  }
  x += 55;

  doc.text(
    "Type of securities (For e.g.-Share, warrants, Convertible debentures, Rights  entitlements, etc. etc.",
    x,
    y,
    {
      width: 50,
      align: "center",
    }
  );
  x += 55;
  if (doc.y > maxY) {
    console.log("3 doc y", doc.y, maxY);

    maxY = doc.y;
  }

  doc
    .lineCap("butt")
    .moveTo(x - 3, y - 3)
    .lineTo(x - 3, 560)
    .stroke();

  doc.text("No", x, y, {
    width: 15,
    align: "center",
  });
  x += 20;

  doc
    .lineCap("butt")
    .moveTo(x - 3, y - 3)
    .lineTo(x - 3, 560)
    .stroke();

  if (doc.y > maxY) {
    console.log("4 doc y", doc.y, maxY);

    maxY = doc.y;
  }
  doc.text("Value", x, y, {
    width: 30,
    align: "center",
  });

  if (doc.y > maxY) {
    console.log("5 doc y", doc.y, maxY);

    maxY = doc.y;
  }
  x += 35;

  doc
    .lineCap("butt")
    .moveTo(x - 3, y - 3)
    .lineTo(x - 3, 560)
    .stroke();

  doc.text(
    "Transaction type (Purchase/Sale/pledge/revocation/Invocation others-please specify",
    x,
    y,
    {
      width: 40,
      align: "center",
    }
  );
  x += 45;

  doc.text(
    "Type of securities (For e.g.-Share, warrants, Convertible debentures, Rights entitlements, etc.)",
    x,
    y,
    {
      width: 50,
      align: "center",
    }
  );
  if (doc.y > maxY) {
    console.log("6 doc y", doc.y, maxY);

    maxY = doc.y;
  }
  x += 55;

  doc
    .lineCap("butt")
    .moveTo(x - 3, y - 3)
    .lineTo(x - 3, 560)
    .stroke();

  doc.text("No & % of shareholding", x, y, {
    width: 50,
    align: "center",
  });
  if (doc.y > maxY) {
    console.log("7 doc y", doc.y, maxY);

    maxY = doc.y;
  }
  x += 55;

  doc.text("From", x, y, {
    width: 40,
    align: "center",
  });
  x += 45;
  if (doc.y > maxY) {
    console.log("8 doc y", doc.y, maxY);

    maxY = doc.y;
  }

  doc
    .lineCap("butt")
    .moveTo(x - 3, y - 3)
    .lineTo(x - 3, 560)
    .stroke();

  doc.text("To", x, y, {
    width: 40,
    align: "center",
  });
  x += 45;

  endX = x;
  if (doc.y > maxY) {
    console.log("9 doc y", doc.y, maxY);

    maxY = doc.y;
  }
  console.log("endX", endX);
  doc.rect(50, stY - 5, endX - 40, 200).stroke();
  doc.rect(50, stY - 5, endX - 40, 400).stroke();
  console.log("endX", endX);
  doc.rect(box2X, stY - 5, 480, 52).stroke();

  var y = 370;
  var x = 60;

  doc.text(data.Folio.Employee.name, x, y, { width: 100 });
  doc.text(data.pan, x, y + 10, { width: 100 });
  doc.text(data.Folio.Employee.address, x, y + 20, { width: 100 });
  doc.text(data.Folio.Employee.phone, x, y + 30, { width: 100 });

  doc.text(data.category, x + 100, y, { width: 100 });

  doc.text(data.previous_security_type, x + 210, y, { width: 50 });
  data.previous_total_share;
  doc.text(data.previous_total_share, x + 270, y, { width: 50 });

  doc.text(data.security_type, x + 320, y, { width: 50 });

  doc.text(data.transaction_quantity, x + 375, y, { width: 15 });
  doc.text(data.transaction_price, x + 395, y, { width: 40 });
  doc.text(data.request_type, x + 430, y, { width: 40 });

  doc.text(data.Folio.Employee.security_type, x + 480, y, { width: 50 });
  doc.text(data.Folio.Employee.total_share, x + 530, y, { width: 50 });

  var date_requested_from_Str = await getDateString(data.date_requested_from);
  var date_requested_to_Str = await getDateString(data.date_requested_to);
  doc.text(date_requested_from_Str, x + 590, y, { width: 40 });
  doc.text(date_requested_to_Str, x + 630, y, { width: 50 });

  // doc.text(data.Folio.Employee.name,x, y, {width:100})
  // doc.text(data.pan,x, y+10, {width:100})
  // doc.text(data.Folio.Employee.address,x, y+20, {width:100})
  // doc.text(data.Folio.Employee.phone,x, y+30, {width:100})

  // doc.text(data.category,x+100, y, {width:100})

  // doc.text(data.request_type,x+210, y, {width:50})

  // doc.text(10,x+270, y, {width:50})

  // doc.text(data.request_type,x+320, y, {width:50})

  // doc.text(10,x+375, y, {width:15})
  // doc.text(100,x+395, y, {width:40})
  // doc.text(130,x+430, y, {width:40})

  // doc.text(data.request_type,x+480, y, {width:50})
  // doc.text(10,x+530, y, {width:50})

  // doc.text(data.date_requested_from,x+590, y, {width:40})
  // doc.text(data.date_requested_to,x+630, y, {width:50})

  doc.addPage();

  x = 50;
  y = 50;

  doc.text("Date of intimation to Company", x, y, {
    width: 70,
    align: "center",
  });
  if (doc.y > maxY2) {
    maxY2 = doc.y;
  }

  x = x + 100;
  doc.text(
    "Mode of acquisition/disposal(on market/public/rights/preferential offer/off market/Inter-se transfer, ESOPs, etc.)",
    x,
    y,
    {
      width: 200,
      align: "center",
    }
  );
  x += 210;
  doc.text("Exchange on which the trade was executed", x, y, {
    width: 100,
    align: "center",
  });

  var nx = doc.x;
  var ny = doc.y;

  doc.lineWidth(0.5);
  doc.rect(50, 30, nx + 100, ny).stroke();
  doc.rect(50, 30, nx + 100, ny + 200).stroke();

  var y = 130;
  var x = 50;

  var createdAtStr = await getDateString(data.createdAt);
  doc.text(createdAtStr, x + 5, y, { width: 70 });
  doc.text(data.mode, x + 100, y, { width: 200 });
  doc.text(data.stock_exchange, x + 320, y, { width: 100 });

  // line cap settings
  doc
    .lineCap("butt")
    .moveTo(50 + 80, 30)
    .lineTo(50 + 80, 305)
    .stroke();

  doc
    .lineCap("butt")
    .moveTo(50 + 300, 30)
    .lineTo(50 + 300, 305)
    .stroke();

  doc.moveDown();

  doc.text(
    "Note: “Securities” shall have the meaning as defined under regulation 2(1) (i) of SEBI  (Prohibition of Insider Trading) Regulations, 2015",
    50,
    320
  );

  doc.moveDown();
  doc.moveDown();

  doc.text("Machine enerated no need of signature");

  doc.end();

  return doc;
};

async function getDate(dateString) {
  newDate = new Date(dateString.replace(pattern, "$3-$2-$1")).setHours(0, 0, 0);
  offset = 5.5;
  newDate = newDate + 3600000 * offset;
  newDate = new Date(newDate);
  return newDate;
}

async function addDays(baseDate, days) {
  try {
    return new Date(baseDate.setDate(baseDate.getDate() + days));
  } catch (error) {
    console.error("addDays:: error: ", error);
  }
}
var pattern = /(\d{2})\/(\d{2})\/(\d{4})/;

var getAnnexure1And2 = async (req, EmployeeData, FolioData, db, requestId) => {
  var request_type = req.body.request_type;

  var proposed_dealing_from_date_str = req.body.date_requested_from;
  console.error(
    "proposed_dealing_from_date_str = ",
    proposed_dealing_from_date_str
  );
  if (typeof proposed_dealing_from_date_str != "string") {
    dtStr = proposed_dealing_from_date_str;
    dtStr =
      dtStr.getFullYear() +
      "-" +
      (dtStr.getMonth() + 1) +
      "-" +
      dtStr.getDate();
    proposed_dealing_from_date_str = dtStr;
  }
  // var proposed_dealing_from_date = await getDate(proposed_dealing_from_date_str)
  // console.error("proposed_dealing_from_date = ",proposed_dealing_from_date)

  var proposed_dealing_to_date_str = req.body.date_requested_to;
  console.error(
    "proposed_dealing_to_date_str = ",
    proposed_dealing_to_date_str
  );
  if (typeof proposed_dealing_to_date_str != "string") {
    dtStr = proposed_dealing_to_date_str;
    dtStr =
      dtStr.getFullYear() +
      "-" +
      (dtStr.getMonth() + 1) +
      "-" +
      dtStr.getDate();
    proposed_dealing_to_date_str = dtStr;
  }
  // var proposed_dealing_to_date = await getDate(proposed_dealing_to_date_str)
  // console.error("proposed_dealing_to_date = ",proposed_dealing_to_date)

  var proposed_quantity = Number(req.body.request_quantity);
  var proposed_price = Number(req.body.proposed_price);
  var market_price = Number(req.body.market_price);
  var mode = req.body.mode;
  var folioId = req.body.folio_id;
  var category = req.body.category;
  console.error("employeeData = ", EmployeeData);
  var pan = EmployeeData.pan;
  var security_type = req.body.security_type;
  // var stock_exchange = req.body.stock_exchange
  // console.log("EmployeeData = ", EmployeeData.Company);

  if (category == "Self") {
    category = EmployeeData.category;
  } else {
    pan = FolioData.emp_relative_pan;
  }
  var previous_total_share = EmployeeData.total_share;
  var KMP_Name = EmployeeData.name;
  var designation = EmployeeData.designation;
  var company = EmployeeData.Company.name;
  var company_add = EmployeeData.Company.address;
  var transaction_folio = FolioData.folio;
  var prior_quantity = FolioData.current_share;
  var nowDate = new Date();

  // // making entry in DATABASE
  // var RequestData = {"pan": pan,"request_folio": transaction_folio,"category": category,"security_type": security_type,
  //                     "mode": mode,"request_type": request_type,"date_requested_from": proposed_dealing_from_date,
  //                     "date_requested_to": proposed_dealing_to_date,"request_quantity": proposed_quantity,previous_total_share: previous_total_share,
  //                     "proposed_price": proposed_price,"market_price": market_price,
  //                     "previous_quantity": prior_quantity,"request_date": nowDate}
  // console.error("request data", RequestData)

  // var requestData = await db.Requests.create(RequestData)
  // console.log("requestData = ",requestData.id)

  // creating PDF
  var header_data = [];
  var row_data = [];
  header_data.push("");
  header_data.push("");
  row_data.push(["Name of the applicant", KMP_Name]);
  row_data.push(["Designation", designation]);
  row_data.push(["Number of securities held as on date", prior_quantity]);
  row_data.push(["Folio No. / DP ID / Client ID No.", transaction_folio]);
  row_data.push(["The proposal is for", request_type]);
  row_data.push([
    "Proposed date of dealing in securities",
    proposed_dealing_from_date_str,
  ]);
  row_data.push([
    "Estimated number of securities proposed to be acquired/subscribed/sold",
    proposed_quantity,
  ]);
  row_data.push(["Price at which the transaction is proposed", proposed_price]);
  row_data.push([
    "Current market price (as on date of application)",
    market_price,
  ]);
  row_data.push([
    "Whether the proposed transaction will be through stock exchange or off-market deal",
    mode,
  ]);
  row_data.push([
    "Folio No. / DP ID / Client ID No. where the securities will be credited / debited",
    transaction_folio,
  ]);
  const doc = new PDFDocument({
    // layout : 'landscape'
  });
  // doc.pipe(fs.createWriteStream('example.pdf'));
  const table0 = {
    headers: header_data,
    rows: row_data,
  };
  doc.font("Times-Roman");
  doc.fontSize(12);
  doc.text("ANNEXURE 1", {
    align: "center",
  });
  doc.moveDown();
  doc.text("APPLICATION  FOR  PRE-DEALING  APPROVAL", {
    align: "center",
  });
  doc.fontSize(11);
  doc.moveDown();
  var dateStr = await getDateString(nowDate);
  doc.text(
    "Date: " + dateStr + "\n\n\n\nTo,\nThe Compliance Officer,\n" + company,
    {
      align: "left",
    }
  );
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc.text("Dear Sir/Madam,", {
    align: "left",
  });
  doc.moveDown();
  doc.text(
    "Application for Pre-dealing approval in securities of the Company",
    {
      align: "left",
    }
  );
  doc.moveDown();
  doc.text(
    "Pursuant to the SEBI (prohibition of Insider Trading) Regulations, 2015 as amended and the Company’s Insider Trading Policy, I seek approval to purchase / sale of " +
      proposed_quantity +
      " equity shares of the Company as per details given below:",
    {
      align: "left",
    }
  );
  doc.moveDown();
  doc.table(table0, {
    prepareHeader: () => doc.font("Times-Roman").fontSize(11),
    prepareRow: (row, i) => doc.font("Times-Roman").fontSize(11),
  });
  doc.moveDown();
  doc.text("I enclose herewith the form of Undertaking signed by me.", {
    align: "left",
  });
  doc.moveDown();
  doc.moveDown();
  doc.text("*This is system generated. Does not require signature.", {
    align: "left",
  });
  doc.moveDown();
  doc.text("Request ID: " + requestId, {
    align: "left",
  });
  doc.moveDown();
  doc.moveDown();
  doc.text("ANNEXURE 2", {
    align: "center",
  });
  doc.moveDown();
  doc.text(
    "FORMAT OF UNDERTAKING TO BE ACCOMPANIED WITH \nTHE APPLICATION FOR PRE-CLEARANCE",
    {
      align: "center",
    }
  );
  doc.moveDown();
  doc.moveDown();
  doc.text("UNDERTAKING", {
    align: "center",
  });
  doc.text("\n\nTo,\nThe Compliance Officer,\n" + company, {
    align: "left",
  });
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc.text(
    "I, " +
      KMP_Name +
      " " +
      designation +
      ", of the Company residing at " +
      company_add +
      ", am desirous of dealing in " +
      proposed_quantity +
      " shares of the Company as mentioned in my application dated " +
      dateStr +
      " for pre-clearance of the transaction.",
    {
      align: "left",
    }
  );
  doc.moveDown();
  doc.text(
    "I further declare that I am not in possession of or otherwise privy to any unpublished Price Sensitive Information (as defined in the Company’s Code of Conduct for prevention of Insider Trading (the Code) up to the time of signing this Undertaking.",
    {
      align: "left",
    }
  );
  doc.moveDown();
  doc.text(
    "In the event that I have access to or received any information that could be construed as “Price Sensitive Information” as defined in the Code, after the signing of this undertaking but before executing the transaction for which approval is sought, I shall inform the Compliance Officer of the same and shall completely refrain from dealing in the securities of the Company until such information becomes public.I declare that I have not contravened the provisions of the Code as notified by the Company from time to time.",
    {
      align: "left",
    }
  );
  doc.moveDown();
  doc.text(
    "I undertake to submit the necessary report within four days of execution of the transaction / a ‘Nil’ report if the transaction is not undertaken.\nIf approval is granted, I shall execute the deal within 7 days of the receipt of approval failing which I shall seek pre-clearance.",
    {
      align: "left",
    }
  );
  doc.moveDown();
  doc.text(
    "I declare that I have made full and true disclosure in the matter.",
    {
      align: "left",
    }
  );
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc.text("Date :" + dateStr, {
    align: "left",
  });
  doc.moveDown();
  doc.moveDown();
  doc.text("*This is system generated. Does not require signature.", {
    align: "left",
  });
  doc.moveDown();
  doc.text("Request ID: " + requestId, {
    align: "left",
  });

  doc.end();

  return doc;
};

const getConnectedPersons = async (body) => {
  try {
    const doc = new PDFDocument({
      size: "B4",
      layout: "landscape",
    });
    var headers = [
      "SL.",
      "Emp. Code",
      "Name",
      "Email",
      "PAN",
      "Designation",
      "Status",
      "Appointed On",
      "Folio 1",
      "Share 1",
      "Folio 2",
      "Share 2",
      "Folio 3",
      "Share 3",
      "Folio 4",
      "Share 4",
      "Folio 5",
      "Share 5",
    ];
    var tbody = [];
    for (var i = 0; i < body.length; i++) {
      var row = [];
      row[0] = i + 1;
      row[1] = body[i].emp_code;
      row[2] = body[i].name;
      row[3] = body[i].email;
      row[4] = body[i].pan;
      row[5] = body[i].designation;
      row[6] = body[i].status;
      const date = new Date(body[i].createdAt);
      var d = await getDateString(date, true);
      // var d = moment(date).format('d/mm/YYYY');
      row[7] = d;
      for (var j = 0; j < 5; j++) {
        row.push(body[i].Folios[j] ? body[i].Folios[j].folio : "NA");
        row.push(body[i].Folios[j] ? body[i].Folios[j].current_share : "NA");
      }
      tbody.push(row);
    }
    var table = {
      headers: headers,
      rows: tbody,
    };
    doc.table(table, {
      prepareHeader: () => doc.font("Times-Bold").fontSize(11),
      prepareRow: (row, i) => doc.font("Times-Roman").fontSize(8.5),
    });
    doc.end();
    return doc;
  } catch (err) {
    throw err;
  }
};

const compareTransactionPdf = async (body, formDate, toDate) => {
  console.log(body);
  try {
    const doc = new PDFDocument({
      size: "B4",
      layout: "landscape",
    });
    doc.text(
      "Previous Benpos Date: " +
        getDateValue(formDate) +
        "                                Current Benpos Date: " +
        getDateValue(toDate)
    );
    doc.moveDown(2);
    var headers = [
      "Epm. Code",
      "PAN",
      "Name",
      "Buy/Sell",
      "Valid",
      "Curr. Total Share",
      "Prev. Total Share",
      "Req. Status",
      "Appr. Date",
      "Folio-1",
      "Folio-2",
      "Folio-3",
      "Folio-4",
      "Folio-5",
    ];
    var tbody = [];
    for (var i = 0; i < body.length; i++) {
      var row = [];
      row[0] = body[i].code;
      row[1] = body[i].pan;
      row[2] = body[i].name;
      row[3] = body[i].sell;
      row[4] = body[i].valid;
      row[5] = body[i].curr;
      row[6] = body[i].prev;
      row[7] = body[i].reqStatus;
      var apprDate =
        body[i].apprDate == "No Data" ? "No Data" : new Date(body[i].apprDate);
      var d = apprDate == "No Data" ? "No Data" : await getDateString(apprDate);
      row[8] = d;
      for (j = 0; j < body[i].folio.length; j++) {
        row[9 + j] = body[i].folio[j];
      }
      tbody.push(row);
    }
    var table = {
      headers: headers,
      rows: tbody,
    };
    doc.table(table, {
      prepareHeader: () => doc.font("Times-Bold").fontSize(11),
      prepareRow: (row, i) => doc.font("Times-Roman").fontSize(8.5),
    });
    doc.end();
    return doc;
  } catch (err) {
    throw err;
  }
};

const getViloationsPdf = async (body) => {
  // console.log(body)
  try {
    const doc = new PDFDocument({
      size: "B4",
      layout: "landscape",
    });
    var headers = [
      "Emp. Code",
      "PAN",
      "Name",
      "Buy/Sell",
      "BENPOS Date",
      "Curr. Total Share",
      "Prev. Total Share",
      "Req. Status",
      "Appr. Date",
      "Folio-1",
      "Folio-2",
      "Folio-3",
      "Folio-4",
      "Folio-5",
    ];
    var tbody = [];
    for (var i = 0; i < body.length; i++) {
      var row = [];
      row[0] = body[i].code;
      row[1] = body[i].pan;
      row[2] = body[i].name;
      row[3] = body[i].sell;
      // // const date = new Date(body[i].benpose_date);
      // var benpose_date = new Date(body[i].benpose_date)
      // var bd = await getDateString(benpose_date)
      row[4] = body[i].benpose_date;
      row[5] = body[i].curr;
      row[6] = body[i].prev;
      row[7] = body[i].reqStatus;
      var apprDate =
        body[i].apprDate == "No Data" ? "No Data" : new Date(body[i].apprDate);
      var d = apprDate == "No Data" ? "No Data" : await getDateString(apprDate);
      row[8] = d;
      for (var j = 0; j < body[i].folio.length; j++) {
        row[9 + j] = body[i].folio[j];
      }
      tbody.push(row);
    }
    var table = {
      headers: headers,
      rows: tbody,
    };
    doc.table(table, {
      prepareHeader: () => doc.font("Times-Bold").fontSize(11),
      prepareRow: (row, i) => doc.font("Times-Roman").fontSize(8.5),
    });
    doc.end();
    return doc;
  } catch (err) {
    throw err;
  }
};

const getActivityPdf = async (body) => {
  try {
    const doc = new PDFDocument({
      size: "A4",
      // layout: "landscape"
    });
    var headers = [
      "Sl.",
      "Timestamp",
      "Activity",
      "By",
      "For",
      "Period",
      "Status",
    ];
    var tbody = [];
    for (var i = 0; i < body.length; i++) {
      var row = [];
      row[0] = i + 1;
      var date = new Date(body[i].createdAt);
      var d = await getDateString(date, true);
      // var d = moment(date).format("d/mm/yyyy") ;
      row[1] = d;
      row[2] = body[i].activity;
      row[3] = body[i].done_by;
      row[4] = body[i].done_for;
      row[5] = body[i].period;
      row[6] = body[i].status;
      tbody.push(row);
    }
    var table = {
      headers: headers,
      rows: tbody,
    };
    doc.table(table, {
      prepareHeader: () => doc.font("Times-Bold").fontSize(11),
      prepareRow: (row, i) => doc.font("Times-Roman").fontSize(8.5),
    });
    doc.end();
    return doc;
  } catch (err) {
    throw err;
  }
};

const getRequestPdf = async (body) => {
  try {
    const doc = new PDFDocument({
      size: "B4",
      layout: "landscape",
    });
    var headers = [
      "Id",
      "Name",
      "Category",
      "Security Type",
      "Mode",
      "Tr. Folio",
      "Request Type",
      "Valid Until",
      "Proposed Quantity",
      "Proposed Price",
      "Timestamp",
    ];
    var tbody = [];
    for (var i = 0; i < body.length; i++) {
      var row = [];
      row[0] = body[i].id;
      row[1] = body[i].Folio.Employee.name;
      row[2] = body[i].category;
      row[3] = body[i].security_type;
      row[4] = body[i].mode;
      row[5] = body[i].Folio.folio;
      row[6] = body[i].request_type;
      var date = new Date(body[i].date_requested_to);
      var d = await getDateString(date);
      // var d = moment(date).format("d/mm/yyyy");
      row[7] = d;
      row[8] = body[i].request_quantity;
      row[9] = body[i].proposed_price;
      var date1 = new Date(body[i].createdAt);
      var d1 = await getDateString(date1, true);
      // var d1 = moment(date1).format("d/mm/yyyy");
      row[10] = d1;
      tbody.push(row);
    }
    var table = {
      headers: headers,
      rows: tbody,
    };
    doc.table(table, {
      prepareHeader: () => doc.font("Times-Bold").fontSize(11),
      prepareRow: (row, i) => doc.font("Times-Roman").fontSize(8.5),
    });
    doc.end();
    return doc;
  } catch (err) {
    throw err;
  }
};

async function upsiPDF(data, is_compliance, empData) {
  try {
    const doc = new PDFDocument({
      size: "B4",
      layout: "landscape",
    });
    var headers = [
      "SL. No.",
      "TImestamp",
      "Sender(PAN)",
      "Receiver(PAN)",
      "Information Shared",
    ];
    if (is_compliance) headers.push("Conversations & Time");
    var tbody = [];
    for (var i = 0; i < data.length; i++) {
      var row = [];
      row[0] = i + 1;
      var date = new Date(data[i].createdAt);
      var d = await getDateString2(date, true);
      row[1] = d;
      row[2] = data[i].shared_by;
      var shared_with = data[i].shared_with;
      if (!is_compliance && !data[i].shared_by.includes(empData?.pan)) {
        shared_with = empData.name + "(" + empData.pan + ")";
      }
      row[3] = shared_with;
      row[4] = data[i].subject;
      if (is_compliance) {
        row[5] =
          data[i].Conversations?.length > 0
            ? await getConversationLog(data[i].Conversations)
            : "No Conversation";
      }
      tbody.push(row);
    }
    var table = {
      headers: headers,
      rows: tbody,
    };
    doc.table(table, {
      prepareHeader: () => doc.font("Times-Bold").fontSize(11),
      prepareRow: (row, i) => doc.font("Times-Roman").fontSize(8.5),
    });
    doc.end();
    return doc;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

module.exports = {
  getAnnexure1And2,
  getAnnexure3,
  getAnnexure4,
  getAnnexure5,
  getAnnexure6,
  getAnnexure7And8,
  getConnectedPersons,
  compareTransactionPdf,
  getViloationsPdf,
  getActivityPdf,
  getRequestPdf,
  upsiPDF,
};
