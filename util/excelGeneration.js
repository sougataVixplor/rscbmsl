const moment = require("moment");
var XLSX = require("xlsx");
const getTimeString = require("./common").getTimeString;
const getDateString2 = require("./common").getDateString2;

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

const getConnectedPersonsExcel = async (body) => {
  try {
    var headers = [
      "SL.",
      "Emp. Code",
      "Emp. Sub Code",
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
      "Total Login",
      "Last Login",
    ];
    var tbody = [];
    for (var i = 0; i < body.length; i++) {
      var row = {};
      row[headers[0]] = tbody.length + 1;
      row[headers[1]] = body[i].emp_code;
      row[headers[2]] = "";
      row[headers[3]] = body[i].name;
      row[headers[4]] = body[i].email;
      row[headers[5]] = body[i].pan;
      row[headers[6]] = body[i].designation;
      row[headers[7]] = body[i].status;
      const date = new Date(body[i].date_of_appointment_as_insider);
      var d = await getDateString(date);
      row[headers[8]] = d;

      // Folio 1 details
      row[headers[9]] = body[i].Folios[0] ? body[i].Folios[0].folio : "NA";
      row[headers[10]] = body[i].Folios[0]
        ? body[i].Folios[0].current_share
        : "NA";
      // Folio 2 details
      row[headers[11]] = body[i].Folios[1] ? body[i].Folios[1].folio : "NA";
      row[headers[12]] = body[i].Folios[1]
        ? body[i].Folios[1].current_share
        : "NA";
      // Folio 3 details
      row[headers[13]] = body[i].Folios[2] ? body[i].Folios[2].folio : "NA";
      row[headers[14]] = body[i].Folios[2]
        ? body[i].Folios[2].current_share
        : "NA";
      // Folio 4 details
      row[headers[15]] = body[i].Folios[3] ? body[i].Folios[3].folio : "NA";
      row[headers[16]] = body[i].Folios[3]
        ? body[i].Folios[3].current_share
        : "NA";
      // Folio 5 details
      row[headers[17]] = body[i].Folios[3] ? body[i].Folios[3].folio : "NA";
      row[headers[18]] = body[i].Folios[3]
        ? body[i].Folios[3].current_share
        : "NA";
      row[headers[19]] = body[i].totalLogin;
      if (body[i].totalLogin != 0) {
        var time = getTimeString(new Date(body[i].lastLogin));
        var date2 = getDateString2(new Date(body[i].lastLogin));
        row[headers[20]] = date2 + ", " + time;
      }
      tbody.push(row);
      for (var j = 0; j < body[i].Relatives.length; j++) {
        currRelative = body[i].Relatives[j];
        var row = {};
        row[headers[0]] = tbody.length + 1;
        row[headers[1]] = "";
        row[headers[2]] = currRelative.emp_sub_code;
        row[headers[3]] = currRelative.name;
        row[headers[4]] = currRelative.email;
        row[headers[5]] = currRelative.pan;
        row[headers[6]] = currRelative.designation;
        row[headers[7]] = currRelative.status;
        const date = new Date(currRelative.createdAt);
        var d = await getDateString(date);
        row[headers[8]] = d;

        // Folio 1 details
        row[headers[9]] = currRelative.Folios[0]
          ? currRelative.Folios[0].folio
          : "NA";
        row[headers[10]] = currRelative.Folios[0]
          ? currRelative.Folios[0].current_share
          : "NA";
        // Folio 2 details
        row[headers[11]] = currRelative.Folios[1]
          ? currRelative.Folios[1].folio
          : "NA";
        row[headers[12]] = currRelative.Folios[1]
          ? currRelative.Folios[1].current_share
          : "NA";
        // Folio 3 details
        row[headers[13]] = currRelative.Folios[2]
          ? currRelative.Folios[2].folio
          : "NA";
        row[headers[14]] = currRelative.Folios[2]
          ? currRelative.Folios[2].current_share
          : "NA";
        // Folio 4 details
        row[headers[15]] = currRelative.Folios[3]
          ? currRelative.Folios[3].folio
          : "NA";
        row[headers[16]] = currRelative.Folios[3]
          ? currRelative.Folios[3].current_share
          : "NA";
        // Folio 5 details
        row[headers[17]] = currRelative.Folios[3]
          ? currRelative.Folios[3].folio
          : "NA";
        row[headers[18]] = currRelative.Folios[3]
          ? currRelative.Folios[3].current_share
          : "NA";
        tbody.push(row);
      }
    }
    // // Reading our test file
    // const file = reader.readFile('./test.xlsx')

    // // Sample data set
    // let student_data = [{
    //     Student:'Nikhil',
    //     Age:22,
    //     Branch:'ISE',
    //     Marks: 70
    // },
    // {
    //     Student:'Amitha',
    //     Age:21,
    //     Branch:'EC',
    //     Marks:80
    // }]

    const ws = XLSX.utils.json_to_sheet(tbody);

    // reader.utils.book_append_sheet(file,ws,"Sheet3")

    // // Writing to our file
    // reader.writeFile(file,'./test.xlsx')
    return ws;
  } catch (err) {
    throw err;
  }
};

const getInsiderExcel = async (body) => {
  try {
    var headers = [
      "SL.",
      "Emp. Code",
      "Emp. Sub Code",
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
      var row = {};
      row[headers[0]] = tbody.length + 1;
      row[headers[1]] = body[i].emp_code;
      row[headers[2]] = "";
      row[headers[3]] = body[i].name;
      row[headers[4]] = body[i].email;
      row[headers[5]] = body[i].pan;
      row[headers[6]] = body[i].designation;
      row[headers[7]] = body[i].status;
      const date = new Date(body[i].createdAt);
      var d = await getDateString(date);
      row[headers[8]] = d;

      // Folio 1 details
      row[headers[9]] = body[i].Folios[0] ? body[i].Folios[0].folio : "";
      row[headers[10]] = body[i].Folios[0]
        ? body[i].Folios[0].current_share
        : "";
      // Folio 2 details
      row[headers[11]] = body[i].Folios[1] ? body[i].Folios[1].folio : "";
      row[headers[12]] = body[i].Folios[1]
        ? body[i].Folios[1].current_share
        : "";
      // Folio 3 details
      row[headers[13]] = body[i].Folios[2] ? body[i].Folios[2].folio : "";
      row[headers[14]] = body[i].Folios[2]
        ? body[i].Folios[2].current_share
        : "";
      // Folio 4 details
      row[headers[15]] = body[i].Folios[3] ? body[i].Folios[3].folio : "";
      row[headers[16]] = body[i].Folios[3]
        ? body[i].Folios[3].current_share
        : "";
      // Folio 5 details
      row[headers[17]] = body[i].Folios[3] ? body[i].Folios[3].folio : "";
      row[headers[18]] = body[i].Folios[3]
        ? body[i].Folios[3].current_share
        : "";
      tbody.push(row);
      for (var j = 0; j < body[i].Relatives.length; j++) {
        currRelative = body[i].Relatives[j];
        var row = {};
        row[headers[0]] = tbody.length + 1;
        row[headers[1]] = "";
        row[headers[2]] = currRelative.emp_sub_code;
        row[headers[3]] = currRelative.name;
        row[headers[4]] = currRelative.email;
        row[headers[5]] = currRelative.pan;
        row[headers[6]] = currRelative.designation;
        row[headers[7]] = currRelative.status;
        const date = new Date(currRelative.createdAt);
        var d = await getDateString(date);
        row[headers[8]] = d;

        // Folio 1 details
        row[headers[9]] = currRelative.Folios[0]
          ? currRelative.Folios[0].folio
          : "";
        row[headers[10]] = currRelative.Folios[0]
          ? currRelative.Folios[0].current_share
          : "";
        // Folio 2 details
        row[headers[11]] = currRelative.Folios[1]
          ? currRelative.Folios[1].folio
          : "";
        row[headers[12]] = currRelative.Folios[1]
          ? currRelative.Folios[1].current_share
          : "";
        // Folio 3 details
        row[headers[13]] = currRelative.Folios[2]
          ? currRelative.Folios[2].folio
          : "";
        row[headers[14]] = currRelative.Folios[2]
          ? currRelative.Folios[2].current_share
          : "";
        // Folio 4 details
        row[headers[15]] = currRelative.Folios[3]
          ? currRelative.Folios[3].folio
          : "";
        row[headers[16]] = currRelative.Folios[3]
          ? currRelative.Folios[3].current_share
          : "";
        // Folio 5 details
        row[headers[17]] = currRelative.Folios[3]
          ? currRelative.Folios[3].folio
          : "";
        row[headers[18]] = currRelative.Folios[3]
          ? currRelative.Folios[3].current_share
          : "";
        tbody.push(row);
      }
    }
    // // Reading our test file
    // const file = reader.readFile('./test.xlsx')

    // // Sample data set
    // let student_data = [{
    //     Student:'Nikhil',
    //     Age:22,
    //     Branch:'ISE',
    //     Marks: 70
    // },
    // {
    //     Student:'Amitha',
    //     Age:21,
    //     Branch:'EC',
    //     Marks:80
    // }]

    const ws = XLSX.utils.json_to_sheet(tbody);

    // reader.utils.book_append_sheet(file,ws,"Sheet3")

    // // Writing to our file
    // reader.writeFile(file,'./test.xlsx')
    return ws;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  getConnectedPersonsExcel,
  getInsiderExcel,
};
