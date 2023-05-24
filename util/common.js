var sequelize = require("sequelize");
const fs = require("fs");
var crypto = require("crypto");
const env = process.env.NODE_ENV || "development";
const credentials = require("../config/config")[env]["credentials"];
var db = require("../models");
const moment = require("moment-timezone");
const { timezone } = require("../config/constants");

async function getDate(date) {
  return (
    date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear()
  );
}

const getUpdatedText = async (text, variables) => {
  try {
    // console.error("variables = ",variables)
    var updatedText = text;
    for (i = 0; i < variables.length; i++) {
      try {
        var symbol = "<<" + i.toString() + ">>";
        // console.error("symbol = ",symbol)
        // console.error("variables[i] = ",variables[i])
        // console.error("updatedText = ",updatedText)
        updatedText = updatedText.replace(symbol, variables[i]);
        // console.error("updatedText = ",updatedText)
      } catch (error) {
        console.error("getUpdatedText:: error in loop: ", error);
      }
    }
    return updatedText;
  } catch (error) {
    console.error("getUpdatedText:: error: ", error);
    throw error;
  }
};

const deleteLocalFile = async (filePath) => {
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error("deleteLocalFile:: error: ", error);
    throw error;
  }
};

const getPdf = async (filePath) => {
  try {
    var buffer = await fs.readFileSync(filePath);
    return buffer;
  } catch (error) {
    console.error("getPdf:: error: ", error);
    throw error;
  }
};

const getCredentialsText = async (text, credentialData) => {
  try {
    if (text.includes("#credentials")) {
      // console.error("getCredentialsText:: ",text)
      updatedText = text.replace(
        "#credentials",
        "login with following details:\nURL: <<0>>\nEmail: <<1>>\n"
      );
      updatedText = await getUpdatedText(updatedText, credentialData);
      // console.error("getCredentialsText:: ",updatedText)
      return updatedText;
    } else {
      return text;
    }
  } catch (error) {
    console.error("getCredentialsText:: error: ", error);
    throw error;
  }
};

// const compareTransaction = async (param) => {
//   var transactionData = param;
//   var current_benpos_data = transactionData.current_benpos_data.sort((a, b)=> (a.pan < b.pan) ? 1 : -1);
//   var prev_benpos_data = transactionData.prev_benpos_data.sort((a, b)=> (a.pan < b.pan) ? 1 : -1 );
//   try {
//     var data = [];
//     var i=0, j=0, k=0;
//     var prev_pan = null;
//     var prev_folio = null;
//     var prev_benpos_date = new Date(new Date(transactionData.prev_benpos_date).setHours(0,0,0))
//     var current_benpos_date = new Date(new Date(transactionData.current_benpos_date).setHours(0,0,0))
//     // console.log('prev_benpos_date ', prev_benpos_date)
//     // console.log('current_benpos_date ', current_benpos_date)
//     if (prev_benpos_date.getTime() ==  current_benpos_date.getTime()){
//       // console.log('Satisfied')
//       while (j < current_benpos_data.length) {
//         var obj = new Object();
//         obj.folio = [];
//         if (current_benpos_data[j].Folio.Employee.pan == prev_pan) {
//           data[k-1].folio.push(current_benpos_data[j].transaction_folio);
//           j++;
//         } else {
//           obj.code = current_benpos_data[j].Folio.Employee.emp_code;
//           obj.pan = current_benpos_data[j].Folio.Employee.pan;
//           obj.name = current_benpos_data[j].Folio.Employee.name;
//           var curr = current_benpos_data[j].total_share;
//           var prev = current_benpos_data[j].previous_total_share;
//           obj.sell = curr - prev;
//           obj.valid = current_benpos_data[j].is_valid ? "Valid" : "Invalid";
//           obj.curr = curr;
//           obj.prev = prev;
//           obj.reqStatus =  current_benpos_data[j].Requests.length == 0 ? "No Data" : current_benpos_data[j].Requests[current_benpos_data[j].Requests.length-1].status;
//           obj.apprDate = current_benpos_data[j].Requests.length == 0 ? "No Data" : current_benpos_data[j].Requests[current_benpos_data[j].Requests.length-1].status;
//           obj.folio.push(current_benpos_data[j].transaction_folio);
//           data[k] = obj;
//           prev_pan = current_benpos_data[j].Folio.Employee.pan;
//           j++;
//           k++;
//         }
//       }
//     }
//     else{
//       while (i < prev_benpos_data.length && j < current_benpos_data.length) {
//         var obj = new Object();
//         obj.folio = [];
//         if (prev_benpos_data[i].pan == current_benpos_data[j].pan) {
//             if (prev_pan != prev_benpos_data[i].pan) {
//               obj.code = current_benpos_data[j].Folio.Employee.emp_code;
//               obj.pan = current_benpos_data[j].Folio.Employee.pan;
//               obj.name = current_benpos_data[j].Folio.Employee.name;
//               var curr = current_benpos_data[j].total_share;
//               var prev = prev_benpos_data[i].total_share;
//               obj.sell = curr - prev;
//               obj.valid = current_benpos_data[j].is_valid ? "Valid" : "Invalid";
//               obj.curr = curr;
//               obj.prev = prev;
//               obj.reqStatus =  current_benpos_data[j].Requests.length == 0 ? "No Data" : current_benpos_data[j].Requests[current_benpos_data[j].Requests.length-1].status;
//               obj.apprDate = current_benpos_data[j].Requests.length == 0 ? "No Data" : current_benpos_data[j].Requests[current_benpos_data[j].Requests.length-1].status;
//               obj.folio.push(current_benpos_data[j].transaction_folio);
//               data[k] = obj;
//               prev_pan = current_benpos_data[j].Folio.Employee.pan;
//               i++;
//               j++;
//               k++;
//             } else {
//               data[k-1].folio.push(prev_benpos_data[i].transaction_folio);
//               i++;
//               j++;
//             }
//         } else {
//           if (prev_benpos_data[i].pan == prev_pan) {
//             data[k-1].folio.push(prev_benpos_data[i].transaction_folio);
//             i++;
//           } else if (current_benpos_data[j].pan == prev_pan) {
//             data[k-1].folio.push(current_benpos_data[j].transaction_folio);
//             j++;
//           } else {
//             if (prev_benpos_data.length - i > current_benpos_data.length - j) {
//               obj.code = prev_benpos_data[i].Folio.Employee.emp_code;
//               obj.pan = prev_benpos_data[i].Folio.Employee.pan;
//               obj.name = prev_benpos_data[i].Folio.Employee.name;
//               var curr = 0;
//               var prev = prev_benpos_data[i].total_share;
//               obj.sell = curr - prev;
//               obj.valid = prev_benpos_data[i].is_valid ? "Valid" : "Invalid";
//               obj.curr = curr;
//               obj.prev = prev;
//               obj.reqStatus =  prev_benpos_data[i].Requests.length == 0 ? "No Data" : prev_benpos_data[i].Requests[prev_benpos_data[i].Requests.length-1].status;
//               obj.apprDate = prev_benpos_data[i].Requests.length == 0 ? "No Data" : prev_benpos_data[i].Requests[prev_benpos_data[i].Requests.length-1].status;
//               obj.folio.push(prev_benpos_data[i].transaction_folio);
//               data[k] = obj;
//               prev_pan = prev_benpos_data[i].Folio.Employee.pan;
//               i++;
//               k++;
//             } else {
//               obj.code = current_benpos_data[j].Folio.Employee.emp_code;
//               obj.pan = current_benpos_data[j].Folio.Employee.pan;
//               obj.name = current_benpos_data[j].Folio.Employee.name;
//               var curr = current_benpos_data[j].total_share;
//               var prev = 0;
//               obj.sell = curr - prev;
//               obj.valid = current_benpos_data[j].is_valid ? "Valid" : "Invalid";
//               obj.curr = curr;
//               obj.prev = prev;
//               obj.reqStatus =  current_benpos_data[j].Requests.length == 0 ? "No Data" : current_benpos_data[j].Requests[current_benpos_data[j].Requests.length-1].status;
//               obj.apprDate = current_benpos_data[j].Requests.length == 0 ? "No Data" : current_benpos_data[j].Requests[current_benpos_data[j].Requests.length-1].status;
//               obj.folio.push(current_benpos_data[j].transaction_folio);
//               data[k] = obj;
//               prev_pan = current_benpos_data[j].Folio.Employee.pan;
//               j++;
//               k++;
//             }
//           }
//         }
//       }
//       while (i < prev_benpos_data.length) {
//         var obj = new Object();
//         obj.folio = [];
//         if (prev_benpos_data[i].Folio.Employee.pan == prev_pan) {
//           data[k-1].folio.push(prev_benpos_data[i].transaction_folio);
//           i++;
//         }else {
//           obj.code = prev_benpos_data[i].Folio.Employee.emp_code;
//           obj.pan = prev_benpos_data[i].Folio.Employee.pan;
//           obj.name = prev_benpos_data[i].Folio.Employee.name;
//           var curr = 0;
//           var prev = prev_benpos_data[i].total_share;
//           obj.sell = curr - prev;
//           obj.valid = prev_benpos_data[i].is_valid ? "Valid" : "Invalid";
//           obj.curr = curr;
//           obj.prev = prev;
//           obj.reqStatus =  prev_benpos_data[i].Requests.length == 0 ? "No Data" : prev_benpos_data[i].Requests[prev_benpos_data[i].Requests.length-1].status;
//           obj.apprDate = prev_benpos_data[i].Requests.length == 0 ? "No Data" : prev_benpos_data[i].Requests[prev_benpos_data[i].Requests.length-1].status;
//           obj.folio.push(prev_benpos_data[i].transaction_folio);
//           data[k] = obj;
//           prev_pan = prev_benpos_data[i].Folio.Employee.pan;
//           i++;
//           k++;
//         }
//       }
//       while (j < current_benpos_data.length) {
//         var obj = new Object();
//         obj.folio = [];
//         if (current_benpos_data[j].Folio.Employee.pan == prev_pan) {
//           data[k-1].folio.push(current_benpos_data[j].transaction_folio);
//           j++;
//         } else {
//           obj.code = current_benpos_data[j].Folio.Employee.emp_code;
//           obj.pan = current_benpos_data[j].Folio.Employee.pan;
//           obj.name = current_benpos_data[j].Folio.Employee.name;
//           var curr = current_benpos_data[j].total_share;
//           var prev = 0;
//           obj.sell = curr - prev;
//           obj.valid = current_benpos_data[j].is_valid ? "Valid" : "Invalid";
//           obj.curr = curr;
//           obj.prev = prev;
//           obj.reqStatus =  current_benpos_data[j].Requests.length == 0 ? "No Data" : current_benpos_data[j].Requests[current_benpos_data[j].Requests.length-1].status;
//           obj.apprDate = current_benpos_data[j].Requests.length == 0 ? "No Data" : current_benpos_data[j].Requests[current_benpos_data[j].Requests.length-1].status;
//           obj.folio.push(current_benpos_data[j].transaction_folio);
//           data[k] = obj;
//           prev_pan = current_benpos_data[j].Folio.Employee.pan;
//           j++;
//           k++;
//         }
//       }
//     }
//     return data;
//   }catch(err){
//     throw err;
//   }
// };

const compareTransactionNew = async (param) => {
  var transactionData = param;
  var current_benpos_data = transactionData.current_benpos_data.sort((a, b) =>
    a.pan < b.pan ? 1 : -1
  );
  var prev_benpos_data = transactionData.prev_benpos_data.sort((a, b) =>
    a.pan < b.pan ? 1 : -1
  );
  try {
    var data = [];
    var i = 0,
      k = 0;
    processedPans = [];
    var prev_pan = null;
    var prev_folio = null;
    var prev_benpos_date = new Date(
      new Date(transactionData.prev_benpos_date).setHours(0, 0, 0)
    );
    var current_benpos_date = new Date(
      new Date(transactionData.current_benpos_date).setHours(0, 0, 0)
    );
    console.log("prev_benpos_date ", prev_benpos_date);
    console.log("current_benpos_date ", current_benpos_date);
    if (prev_benpos_date.getTime() == current_benpos_date.getTime()) {
      console.log("current benpose date is equals to previous benpose date");
      var j = 0;
      while (j < current_benpos_data.length) {
        var obj = new Object();
        obj.folio = [];
        if (current_benpos_data[j].Folio.Employee.pan == prev_pan) {
          data[k - 1].folio.push(current_benpos_data[j].transaction_folio);
          j++;
        } else {
          obj.code = current_benpos_data[j].Folio.Employee.emp_code;
          obj.pan = current_benpos_data[j].Folio.Employee.pan;
          obj.name = current_benpos_data[j].Folio.Employee.name;
          var curr = current_benpos_data[j].total_share;
          var prev = current_benpos_data[j].previous_total_share;
          obj.sell = curr - prev;
          obj.valid = current_benpos_data[j].is_valid ? "Valid" : "Invalid";
          obj.curr = curr;
          obj.prev = prev;
          obj.reqStatus =
            current_benpos_data[j].Requests.length == 0
              ? "No Data"
              : current_benpos_data[j].Requests[
                  current_benpos_data[j].Requests.length - 1
                ].status;
          obj.apprDate =
            current_benpos_data[j].Requests.length == 0
              ? "No Data"
              : current_benpos_data[j].Requests[
                  current_benpos_data[j].Requests.length - 1
                ].status;
          obj.folio.push(current_benpos_data[j].transaction_folio);
          data[k] = obj;
          prev_pan = current_benpos_data[j].Folio.Employee.pan;
          j++;
          k++;
        }
      }
    } else {
      for (var i = 0; i < current_benpos_data.length; i++) {
        currPan = current_benpos_data[i].Folio.Employee.pan;
        console.log("currPan", currPan);
        console.log("processedPans", processedPans);
        if (!processedPans.includes(currPan)) {
          processedPans.push(currPan);
          filteredPrevBenposData = prev_benpos_data.filter((e) => {
            return e.Folio.Employee.pan == currPan;
          });
          filteredCurrBenposData = current_benpos_data.filter((e) => {
            return e.Folio.Employee.pan == currPan;
          });
          if (filteredPrevBenposData.length == 0) {
            // employee not present in prev Benpos data i.e this employee is new
            var obj = new Object();
            obj.folio = [];
            obj.code = filteredCurrBenposData[0].Folio.Employee.emp_code;
            obj.pan = filteredCurrBenposData[0].Folio.Employee.pan;
            obj.name = filteredCurrBenposData[0].Folio.Employee.name;
            var curr = filteredCurrBenposData[0].total_share;
            var prev = filteredCurrBenposData[0].previous_total_share;
            obj.sell = curr - prev;
            obj.valid = filteredCurrBenposData[0].is_valid
              ? "Valid"
              : "Invalid";
            obj.curr = curr;
            obj.prev = prev;
            obj.reqStatus =
              filteredCurrBenposData[0].Requests.length == 0
                ? "No Data"
                : filteredCurrBenposData[0].Requests[
                    filteredCurrBenposData[0].Requests.length - 1
                  ].status;
            obj.apprDate =
              filteredCurrBenposData[0].Requests.length == 0
                ? "No Data"
                : filteredCurrBenposData[0].Requests[
                    filteredCurrBenposData[0].Requests.length - 1
                  ].status;
            for (var l = 0; l < filteredCurrBenposData.length; l++) {
              if (
                !obj.folio.includes(filteredCurrBenposData[l].transaction_folio)
              ) {
                obj.folio.push(filteredCurrBenposData[l].transaction_folio);
              }
            }
            data.push(obj);
          } else if (filteredCurrBenposData.length == 0) {
            // employee not present in current Benpos data i.e this employee is removed
            var obj = new Object();
            obj.folio = [];
            obj.code = filteredPrevBenposData[0].Folio.Employee.emp_code;
            obj.pan = filteredPrevBenposData[0].Folio.Employee.pan;
            obj.name = filteredPrevBenposData[0].Folio.Employee.name;
            var curr = 0;
            var prev = filteredPrevBenposData[0].total_share;
            // var curr = filteredPrevBenposData[0].total_share;
            // var prev = filteredPrevBenposData[0].previous_total_share;
            obj.sell = curr - prev;
            obj.valid = filteredPrevBenposData[0].is_valid
              ? "Valid"
              : "Invalid";
            obj.curr = curr;
            obj.prev = prev;
            obj.reqStatus =
              filteredPrevBenposData[0].Requests.length == 0
                ? "No Data"
                : filteredPrevBenposData[0].Requests[
                    filteredPrevBenposData[0].Requests.length - 1
                  ].status;
            obj.apprDate =
              filteredPrevBenposData[0].Requests.length == 0
                ? "No Data"
                : filteredPrevBenposData[0].Requests[
                    filteredPrevBenposData[0].Requests.length - 1
                  ].status;
            for (var l = 0; l < filteredPrevBenposData.length; l++) {
              if (
                !obj.folio.includes(filteredPrevBenposData[l].transaction_folio)
              ) {
                obj.folio.push(filteredPrevBenposData[l].transaction_folio);
              }
            }
            data.push(obj);
          } else {
            var obj = new Object();
            obj.folio = [];
            obj.code = filteredCurrBenposData[0].Folio.Employee.emp_code;
            obj.pan = filteredCurrBenposData[0].Folio.Employee.pan;
            obj.name = filteredCurrBenposData[0].Folio.Employee.name;
            var curr = filteredCurrBenposData[0].total_share;
            var prev = filteredPrevBenposData[0].total_share;
            obj.sell = curr - prev;
            obj.valid = filteredCurrBenposData[0].is_valid
              ? "Valid"
              : "Invalid";
            obj.curr = curr;
            obj.prev = prev;
            obj.reqStatus =
              filteredCurrBenposData[0].Requests.length == 0
                ? "No Data"
                : filteredCurrBenposData[0].Requests[
                    filteredCurrBenposData[0].Requests.length - 1
                  ].status;
            obj.apprDate =
              filteredCurrBenposData[0].Requests.length == 0
                ? "No Data"
                : filteredCurrBenposData[0].Requests[
                    filteredCurrBenposData[0].Requests.length - 1
                  ].status;
            // for(var l=0; l < filteredPrevBenposData.length; l++){
            //   if(!obj.folio.includes(filteredPrevBenposData[l].transaction_folio)){
            //     obj.folio.push(filteredPrevBenposData[l].transaction_folio);
            //   }
            // }
            for (var l = 0; l < filteredCurrBenposData.length; l++) {
              if (
                !obj.folio.includes(filteredCurrBenposData[l].transaction_folio)
              ) {
                obj.folio.push(filteredCurrBenposData[l].transaction_folio);
              }
            }
            data.push(obj);
          }
        }
      }
    }
    return data;
  } catch (err) {
    throw err;
  }
};

const getViolationData = async (params) => {
  var body = params.sort((a, b) => (a.pan < b.pan ? -1 : 1));
  try {
    var data = [];
    var k = 0;
    var prev_pan = null;
    // var prev_date = null;
    for (var i = 0; i < body.length; i++) {
      var obj = Object();
      obj.folio = [];
      if (prev_pan != body[i].pan) {
        obj.code = body[i].Folio.Employee.emp_code;
        obj.pan = body[i].pan;
        obj.name = body[i].Folio.Employee.name;
        var curr = body[i].total_share;
        var prev = body[i].previous_total_share;
        obj.sell = curr - prev;
        var d = new Date(body[i].current_benpos_date);
        obj.benpose_date = await getDate(d);
        obj.curr = curr;
        obj.prev = prev;
        obj.reqStatus =
          body[i].Requests.length == 0
            ? "No Data"
            : body[i].Requests[body[i].Requests.length - 1].status;
        obj.apprDate =
          body[i].Requests.length == 0
            ? "No Data"
            : body[i].Requests[body[i].Requests.length - 1].status;
        obj.folio.push(body[i].Folio.folio);
        data[k] = obj;
        prev_pan = body[i].pan;
        // prev_date = moment(body[i].current_benpos_date).format("d/mm/yyyy");
        k++;
      } else {
        var flag = false;
        var s = 0;
        for (s = 0; s < data.length; s++) {
          // console.log("data", data);
          console.log("------------------------");
          var date1 = new Date(body[i].current_benpos_date);
          var date2 = data[s].benpose_date;
          console.log(date1);
          console.log(data[s].benpose_date);
          var a = await getDate(date1);
          var b = date2;
          console.log(a);
          console.log(b);
          if (a == b && data[s].pan == body[i].pan) {
            flag = true;
            break;
          }
        }
        if (flag) {
          console.log("THIS");
          data[s].folio.push(body[i].Folio.folio);
        } else {
          obj.code = body[i].Folio.Employee.emp_code;
          obj.pan = body[i].pan;
          obj.name = body[i].Folio.Employee.name;
          var curr = body[i].total_share;
          var prev = body[i].previous_total_share;
          obj.sell = curr - prev;
          var d = new Date(body[i].current_benpos_date);
          obj.benpose_date = await getDate(d);
          obj.curr = curr;
          obj.prev = prev;
          obj.reqStatus =
            body[i].Requests.length == 0
              ? "No Data"
              : body[i].Requests[body[i].Requests.length - 1].status;
          obj.apprDate =
            body[i].Requests.length == 0
              ? "No Data"
              : body[i].Requests[body[i].Requests.length - 1].status;
          obj.folio.push(body[i].Folio.folio);
          data[k] = obj;
          prev_pan = body[i].pan;
          // prev_date = body[i].current_benpos_date;
          k++;
        }
      }
    }
    return data;
  } catch (err) {
    throw err;
  }
};

const getDateString = async (dateObj, timeFlag = false) => {
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
};

const encryptData = async (data) => {
  try {
    var encryptionMethod = "AES-256-CBC";
    var secret = "roAdvl!i$nk#freightroAdvl!i$nk#f";
    var iv = "1234567891011121";
    var encryptor = crypto.createCipheriv(encryptionMethod, secret, iv);
    return encryptor.update(data, "utf8", "base64") + encryptor.final("base64");
  } catch (error) {
    console.error("encryptData:: error in data encryption - ", error);
  }
};

const decryptData = async (encryptedData) => {
  try {
    var encryptionMethod = "AES-256-CBC";
    var secret = "roAdvl!i$nk#freightroAdvl!i$nk#f";
    var iv = "1234567891011121";
    var decryptor = crypto.createDecipheriv(encryptionMethod, secret, iv);
    return (
      decryptor.update(encryptedData, "base64", "utf8") +
      decryptor.final("utf8")
    );
  } catch (error) {
    console.error("decryptData:: error in encryptedData decryption - ", error);
  }
};

const encryptCredentials = async (data, isArray = true) => {
  try {
    if (credentials.length > 0) {
      if (isArray) {
        for (var i = 0; i < data.length; i++) {
          var currData = data[i];
          for (var j = 0; j < credentials.length; j++) {
            currCred = credentials[j];
            if (currData.hasOwnProperty(currCred)) {
              data[i][currCred] = await encryptData(data[i][currCred]);
            }
          }
        }
      } else {
        for (var j = 0; j < credentials.length; j++) {
          currCred = credentials[j];
          if (data.hasOwnProperty(currCred)) {
            data[i][currCred] = await encryptData(data[i][currCred]);
          }
        }
      }
    }
    return data;
  } catch (err) {
    console.error(
      "encryptCredentials:: error in listed credentials encryption - ",
      err
    );
  }
};

const decryptCredentials = async (data, isArray = true) => {
  try {
    if (credentials.length > 0) {
      if (isArray) {
        for (var i = 0; i < data.length; i++) {
          var currData = data[i];
          for (var j = 0; j < credentials.length; j++) {
            currCred = credentials[j];
            if (currData.hasOwnProperty(currCred)) {
              data[i][currCred] = await decryptData(data[i][currCred]);
            }
          }
        }
      } else {
        for (var j = 0; j < credentials.length; j++) {
          currCred = credentials[j];
          if (data.hasOwnProperty(currCred)) {
            data[i][currCred] = await decryptData(data[i][currCred]);
          }
        }
      }
    }
    return data;
  } catch (err) {
    console.error(
      "decryptCredentials:: error in listed credentials decryption - ",
      err
    );
  }
};

const handleSearch = (data, query, keys) => {
  try {
    console.error(data);
    if (query) {
      var op = [];
      for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < keys.length; j++) {
          if (
            data[i][keys[j]] &&
            data[i][keys[j]]
              .toString()
              .toLowerCase()
              .includes(query.toLowerCase()) &&
            !op.find((f) => f.id == data[i].id)
          ) {
            op.push(data[i]);
          }
        }
      }
      return op;
    } else {
      return data;
    }
  } catch (err) {
    throw err;
  }
};

async function getDummyPan(db) {
  try {
    var emp = await db.Employees.findAll({
      where: {
        pan: { [sequelize.Op.like]: "%dummy%" },
      },
      order: [["createdAt", "DESC"]],
    });
    if (emp.length == 0) return "dummy-0";
    else {
      var panInt = parseInt(emp[0].pan.split("-")[1]);
      return "dummy-" + ++panInt;
    }
  } catch (err) {
    throw err;
  }
}

async function createConversation(upsi, t = null, errorList = []) {
  try {
    var sender_id_list = upsi.sender_id.split(",");
    var receiver_id_list = upsi.receiver_id.split(",");
    if (upsi.receiver_id.trim() == "") {
      console.log("No conversation");
    } else {
      for (var i = 0; i < sender_id_list.length; i++) {
        for (var j = 0; j < receiver_id_list.length; j++) {
          if (errorList.findIndex((f) => f === receiver_id_list[j]) === -1) {
            var nc = await db.Conversations.create(
              {
                information: upsi.information,
                upsi_id: upsi.id,
                status: "initial",
                sender_id: sender_id_list[i],
                receiver_id: receiver_id_list[j],
              },
              { transaction: t }
            );
          }
        }
      }
      console.log("Conversations created successfully");
    }
  } catch (err) {
    throw err;
  }
}

function queryBuilder(url, query) {
  var newUrl = url;
  if (
    query &&
    Object.keys(query).length > 0 &&
    Object.values(query).find((v) => v && v != "")
  ) {
    newUrl += "?";
    Object.keys(query).map((q, index) => {
      if (query[q]) {
        if (index > 0 && newUrl.charAt(newUrl.length - 1) != "?") {
          newUrl += "&" + q + "=" + query[q];
        } else {
          newUrl += q + "=" + query[q];
        }
      }
    });
  }
  return newUrl;
}

async function getConversationLog(conversation) {
  try {
    var s = "";
    for (var i = 0; i < conversation.length; i++) {
      var c = conversation[i].dataValues;
      s +=
        "From : " +
        c.Sender.dataValues.name +
        " (" +
        c.Sender.dataValues.pan +
        ") \nTo : " +
        c.Receiver.dataValues.name +
        " (" +
        c.Receiver.dataValues.pan +
        ")" +
        " \nTime : " +
        (await getDateString(new Date(c.createdAt), true)) +
        "\n-----------------------------------\n";
    }
    return s;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

function extractName(url) {
  var name = url.split(".");
  name.splice(url.split(".").length - 1, 1);
  name = name.join(".").split("-");
  name.splice(name.length - 1, 1);
  name = name.join("-");
  if (name.includes("./uploads/")) {
    name = name.replace("./uploads/", "");
  }
  var ext = url.split(".")[url.split(".").length - 1];
  return [name, ext];
}

async function updateLoginDetails(employee, t = null) {
  try {
    const [e, nE] = await db.Employees.update(
      {
        lastLogin: new Date(),
        totalLogin: employee.totalLogin + 1,
      },
      {
        where: { pan: employee.pan },
        transaction: t,
      }
    );
    if (e > 0) console.log("Login detail updated");
    else throw "Login details not updated";
  } catch (err) {
    throw err;
  }
}

function getTimeString(dateObj) {
  var h = dateObj.getHours();
  var m = dateObj.getMinutes();
  var s = dateObj.getSeconds();
  var time = h + ":" + m + ":" + s;
  return time;
}

const getDateString2 = (dateObj, timeFlag = false) => {
  if (timeFlag) {
    return moment(dateObj.getTime())
      .tz(timezone)
      .format("YYYY-MM-DD, h:mm:ss a");
  } else {
    return moment(dateObj.getTime()).tz(timezone).format("YYYY-MM-DD");
  }
};

module.exports = {
  getUpdatedText,
  // compareTransaction,
  compareTransactionNew,
  getViolationData,
  getCredentialsText,
  getPdf,
  getDateString,
  decryptData,
  encryptData,
  encryptCredentials,
  decryptCredentials,
  handleSearch,
  getDummyPan,
  createConversation,
  queryBuilder,
  getConversationLog,
  extractName,
  updateLoginDetails,
  getTimeString,
  getDateString2,
};
