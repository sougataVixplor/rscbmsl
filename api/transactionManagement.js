const fs = require("fs");
var sequelize = require("sequelize");
var XLSX = require("xlsx");
const Op = sequelize.Op;
process.env.SECRET_KEY = "secret";
const localUpload = require("../util/storageLocal").upload;
const localgetPublicUrl = require("../util/storageLocal").getPublicUrl;
const trackActivity = require("../util/activityTrack").trackActivity;
const compareTransaction = require("../util/common").compareTransaction;
const compareTransactionNew = require("../util/common").compareTransactionNew;
const getViolationData = require("../util/common").getViolationData;
const decryptData = require("../util/common").decryptData;
const encryptData = require("../util/common").encryptData;
const encryptCredentials = require("../util/common").encryptCredentials;
const decryptCredentials = require("../util/common").decryptCredentials;
var pattern = /(\d{2})\/(\d{2})\/(\d{4})/;
const pattern1 = /(\d{2})\-(\d{2})\-(\d{4})/;

module.exports = (app, db) => {
  async function gettransactionData(fromDate, toDate) {
    try {
      var transactionData = await db.UploadDatas.findAll({
        where: {
          current_benpos_date: { [Op.between]: [fromDate, toDate] },
        },
        include: [
          {
            model: db.Requests,
          },
          {
            model: db.Folios,
            include: [
              {
                model: db.Employees,
                where: {
                  is_active: true,
                },
                required: false,
              },
              {
                model: db.Relatives,
                where: {
                  is_active: true,
                },
                required: false,
              },
            ],
          },
        ],
        required: false,
      });
      return transactionData;
    } catch (error) {
      console.error("gettransactionData:: error: ", error);
      throw error;
    }
  }

  async function getBenposData(ref_date, limitDate, isCurrent = true) {
    try {
      let data;
      let rDate;
      console.log("ref_date = ", ref_date.toString());
      var dateLimit = new Date(limitDate.setHours(0, 0, 0));
      var fromDate = new Date(ref_date.setHours(0, 0, 0));
      var toDate = new Date(ref_date.setHours(23, 59, 59));
      console.log("dateLimit = ", dateLimit.toString());
      console.log("fromDate = ", fromDate.toString());
      console.log("toDate = ", toDate.toString());
      var transactionData = await gettransactionData(fromDate, toDate);
      if (transactionData.length == 0) {
        if (isCurrent) {
          flag = true;
          benpos_data_not_fount_count = 0;
          temp_date = ref_date;
          while (flag) {
            temp_date = await subDays(temp_date, 1);
            console.log("temp_date = ", temp_date.toString());
            var fromDate1 = new Date(temp_date.setHours(0, 0, 0));
            var toDate1 = new Date(temp_date.setHours(23, 59, 59));
            console.log("fromDate1 = ", fromDate1.toString());
            console.log("toDate1 = ", toDate1.toString());
            var transactionData1 = await gettransactionData(fromDate1, toDate1);
            benpos_data_not_fount_count += 1;
            console.log(
              "benpos_data_not_fount_count = ",
              benpos_data_not_fount_count
            );
            console.log("transactionData1.length = ", transactionData1.length);
            if (transactionData1.length > 0) {
              flag = false;
            }
            if (fromDate1.getTime() < dateLimit.getTime()) {
              flag = false;
            }
            // if (benpos_data_not_fount_count >= 30){
            //     flag = false
            // }
          }
          rDate = temp_date;
          data = transactionData1;
        } else {
          flag = true;
          benpos_data_not_fount_count = 0;
          temp_date = ref_date;
          while (flag) {
            temp_date = await addDays(temp_date, 1);
            console.log("temp_date = ", temp_date.toString());
            var fromDate2 = new Date(temp_date.setHours(0, 0, 0));
            var toDate2 = new Date(temp_date.setHours(23, 59, 59));
            console.log("fromDate2 = ", fromDate2.toString());
            console.log("toDate2 = ", toDate2.toString());
            var transactionData2 = await gettransactionData(fromDate2, toDate2);
            benpos_data_not_fount_count += 1;
            console.log(
              "benpos_data_not_fount_count = ",
              benpos_data_not_fount_count
            );
            console.log("transactionData2.length = ", transactionData2.length);

            if (transactionData2.length > 0) {
              flag = false;
            }
            if (fromDate2.getTime() > dateLimit.getTime()) {
              flag = false;
            }
            // if (benpos_data_not_fount_count >= 30){
            //     flag = false
            // }
          }
          rDate = temp_date;
          data = transactionData2;
        }
      } else {
        rDate = ref_date;
        data = transactionData;
      }
      return { refDate: rDate, data: data };
    } catch (error) {
      console.error("getBenposData:: error: ", error);
      throw error;
    }
  }

  // get transaction list
  app.get("/transaction", async (req, res) => {
    try {
      fromDateStr = req.query.startDate;
      toDateStr = req.query.endDate;
      console.error("fromDateStr = ", fromDateStr);
      console.error("toDateStr = ", toDateStr);
      let fromDate;
      let toDate;
      if (fromDateStr.includes("/") || fromDateStr.includes("-")) {
        fromDate = await getDate(fromDateStr);
        fromDate = new Date(fromDate.setHours(00, 00, 00));
      } else {
        throw "Date Format Error";
      }
      if (toDateStr.includes("/") || toDateStr.includes("-")) {
        toDate = await getDate(toDateStr);
        toDate = new Date(toDate.setHours(23, 59, 59));
      } else {
        throw "Date Format Error";
      }
      console.log("fromDate : ", fromDate);
      console.log("toDate : ", toDate);
      // var prev_benpos_date = fromDate
      // var current_benpos_date = toDate
      var prev_benpos_data = await getBenposData(fromDate, toDate, false);
      var current_benpos_data = await getBenposData(toDate, fromDate);
      var prev_benpos_date = prev_benpos_data.refDate;
      prev_benpos_date = new Date(prev_benpos_date.setHours(0, 0, 0));
      var current_benpos_date = current_benpos_data.refDate;
      current_benpos_date = new Date(current_benpos_date.setHours(0, 0, 0));
      var transactionData = {};
      if (prev_benpos_date.getTime() == current_benpos_date.getTime()) {
        transactionData = {
          prev_benpos_date: prev_benpos_date,
          prev_benpos_data: [],
          current_benpos_date: current_benpos_date,
          current_benpos_data: current_benpos_data.data,
        };
      } else {
        transactionData = {
          prev_benpos_date: prev_benpos_date,
          prev_benpos_data: prev_benpos_data.data,
          current_benpos_date: current_benpos_date,
          current_benpos_data: current_benpos_data.data,
        };
      }
      // compareData = await compareTransaction(transactionData)
      compareData = await compareTransactionNew(transactionData);

      res.status(200).json({
        data: await encryptData(
          JSON.stringify({
            message: "transaction fetch successfully",
            data: {
              transactionData: transactionData,
              compareData: compareData,
              prev_benpos_date: transactionData.prev_benpos_date,
              current_benpos_date: transactionData.current_benpos_date,
            },
          })
        ),
      });
      // res.status(200).json({'message':'transaction fetch successfully',"data":{transactionData: transactionData,compareData: compareData,prev_benpos_date: transactionData.prev_benpos_date,current_benpos_date: transactionData.current_benpos_date}})
    } catch (error) {
      console.error("transaction fetch error:", error);
      res.status(500).json({ message: "transaction fetch error :: " + error });
    }
  });

  // get violation report
  app.get("/violations", async (req, res) => {
    try {
      fromDateStr = req.query.startDate;
      toDateStr = req.query.endDate;
      console.error("fromDateStr = ", fromDateStr);
      console.error("toDateStr = ", toDateStr);
      let fromDate;
      let toDate;
      if (fromDateStr.includes("/") || fromDateStr.includes("-")) {
        fromDate = await getDate(fromDateStr);
        fromDate = new Date(fromDate.setHours(00, 00, 00));
      } else {
        throw "Date Format Error";
      }
      if (toDateStr.includes("/") || toDateStr.includes("-")) {
        toDate = await getDate(toDateStr);
        toDate = new Date(toDate.setHours(23, 59, 59));
      } else {
        throw "Date Format Error";
      }
      var transactionData = await db.UploadDatas.findAll({
        where: {
          current_benpos_date: { [Op.between]: [fromDate, toDate] },
          is_share_changed: true,
        },
        include: [
          {
            model: db.Requests,
          },
          {
            model: db.Folios,
            include: [
              {
                model: db.Employees,
                where: {
                  is_active: true,
                },
                required: false,
              },
              {
                model: db.Relatives,
                where: {
                  is_active: true,
                },
                required: false,
              },
            ],
          },
        ],
      });
      violationData = await getViolationData(transactionData);
      res.status(200).json({
        data: await encryptData(
          JSON.stringify({
            message: "violations fetch successfully",
            data: violationData,
          })
        ),
      });
      // res.status(200).json({'message':'transaction fetch successfully',"data":violationData})
    } catch (error) {
      console.error("transaction fetch error:", error);
      res.status(500).json({ message: "transaction fetch error :: " + error });
    }
  });

  async function getDate(dateString) {
    var newDate = new Date();
    if (dateString.includes("/")) {
      newDate = new Date(
        new Date(dateString.replace(pattern, "$3-$2-$1")).setHours(0, 0, 0)
      );
    } else {
      newDate = new Date(
        new Date(dateString.replace(pattern1, "$3-$2-$1")).setHours(0, 0, 0)
      );
    }
    // offset = 5.5
    // newDate = newDate + (3600000 * offset)
    // newDate = new Date(newDate)
    return newDate;
  }

  async function ExcelDateToJSDate(date) {
    var fileDate = new Date(Math.round((date - 25569) * 86400 * 1000));
    var mon = fileDate.getMonth() + 1;
    if (mon < 9) {
      mon = "0" + mon;
    }
    var day = fileDate.getDate();
    if (day < 9) {
      day = "0" + day;
    }
    // var fileStr = day+"/"+mon+"/"+fileDate.getFullYear()
    var fileStr = fileDate.getFullYear() + "-" + mon + "-" + day;
    console.error("fileStr = ", fileStr);
    fileDate = await new Date(new Date(fileStr).setHours(00, 00, 00));
    return fileDate;
  }

  async function getEmpDetails(empPAN) {
    try {
      var empData = await db.Employees.findAll({
        where: {
          pan: empPAN,
          is_active: true,
        },
      });
      return empData;
    } catch (error) {
      console.error("getEmpDetails:: error: ", error);
      throw error;
    }
  }

  async function getEmpRelDetails(empPAN) {
    try {
      var empData = await db.Relatives.findAll({
        where: {
          pan: empPAN,
          is_active: true,
        },
      });
      return empData;
    } catch (error) {
      console.error("getEmpRelDetails:: error: ", error);
      throw error;
    }
  }

  async function addDays(baseDate, days) {
    try {
      return new Date(baseDate.setDate(baseDate.getDate() + days));
    } catch (error) {
      console.error("addDays:: error: ", error);
    }
  }

  async function subDays(baseDate, days) {
    try {
      return new Date(baseDate.setDate(baseDate.getDate() - days));
    } catch (error) {
      console.error("subDays:: error: ", error);
    }
  }

  async function subMonths(baseDate, months) {
    try {
      return new Date(baseDate.setMonth(baseDate.getMonth() - months));
    } catch (error) {
      console.error("subMonths:: error: ", error);
    }
  }

  async function isValidRequestExists(pan, folioData, fileDate, share) {
    try {
      var isValid = true;
      var requestInfo = [];
      console.error(">>>>>>>>>>> isValidRequestExists");
      console.log("fileDate = ", fileDate);
      const baseDate = new Date(fileDate);
      console.log("baseDate = ", baseDate);
      var sevenDayBack = await subDays(baseDate, 7);
      console.log("sevenDayBack = ", sevenDayBack);
      var benposeDate = new Date(fileDate);
      benposeDate = new Date(benposeDate.setHours(23, 59, 59));
      console.log("benposeDate = ", benposeDate);
      console.log("fileDate = ", fileDate);
      var reqData = await db.Requests.findAll({
        where: {
          pan: pan,
          request_status: { [Op.in]: ["Approved", "Completed"] },
          date_requested_to: { [Op.between]: [sevenDayBack, benposeDate] },
        },
      });
      console.log("reqData = ", reqData);
      var close_dates = await db.Company.findAll();
      var window_close_from = close_dates[0].window_close_from;
      var window_close_to = close_dates[0].window_close_to;
      if (window_close_from != null || window_close_to != null) {
        window_close_from = new Date(window_close_from.setHours(0, 0, 0));
        window_close_to = new Date(window_close_to.setHours(23, 59, 59));
        var shrChangeDate = new Date(fileDate.setHours(0, 0, 0));
        console.error("window_close_from = ", window_close_from);
        console.error("window_close_to = ", window_close_to);
        console.error("shrChangeDate = ", shrChangeDate);
        console.error("currDate = ", currDate);
        var reqData1 = await db.Requests.findAll({
          where: {
            pan: pan,
            request_status: { [Op.in]: ["Completed"] },
            transaction_date: {
              [Op.between]: [window_close_from, window_close_to],
            },
          },
        });
        if (reqData1.length > 0) {
          // transaction in cosed period
          // not valid
          return [false, []];
        }
        if (
          window_close_from.getTime() < shrChangeDate.getTime() &&
          shrChangeDate.getTime() < window_close_to.getTime()
        ) {
          // share change happend in cosed period time range
          console.error("share change happend in cosed period time range");
          return [false, []];
        }
      }
      console.log("reqData = ", reqData);
      if (reqData.length > 0) {
        for (var r = 0; r < reqData.length; r++) {
          var isValid = false;
          if (reqData[r].request_quantity >= share) {
            var currDate = new Date(fileDate.setHours(0, 0, 0));
            var date_requested_to = reqData[r].date_requested_to;
            date_requested_to = new Date(date_requested_to.setHours(0, 0, 0));
            var date_requested_from = reqData[r].date_requested_from;
            date_requested_from = new Date(
              date_requested_from.setHours(0, 0, 0)
            );
            var transaction_date = reqData[r].transaction_date;
            console.error("transaction_date = ", transaction_date);
            console.error("date_requested_from = ", date_requested_from);
            console.error("date_requested_to = ", date_requested_to);
            console.error("currDate = ", currDate);
            if (window_close_from != null || window_close_to != null) {
              if (
                window_close_from.getTime() <= fileDate.getTime() &&
                fileDate.getTime() <= window_close_to.getTime()
              ) {
                isValid = false;
              } else {
                isValid = true;
              }
            } else {
              isValid = true;
            }
            if (
              date_requested_from.getTime() < currDate.getTime() &&
              currDate.getTime() < date_requested_to.getTime()
            ) {
              // share change happend in approval time range
              console.error("share change happend in approval time range");
              isValid = true;
            } else {
              if (transaction_date != null) {
                transaction_date = new Date(transaction_date.setHours(0, 0, 0));
                if (
                  date_requested_from.getTime() < transaction_date.getTime() &&
                  transaction_date.getTime() < date_requested_to.getTime()
                ) {
                  // transaction date is in approval time range
                  console.error("transaction date is in approval time range");
                  isValid = true;
                }
              }
            }
          }
          requestInfo.push({ reqId: reqData[r].id, isValid: isValid });
        }
        console.log("requestInfo = ", requestInfo);
        return [true, requestInfo];
      } else {
        return [false, []];
      }
    } catch (error) {
      console.error("isValidRequestExists:: error: ", error);
      throw error;
    }
  }

  async function isFolioExists(pan, folio, current_share) {
    try {
      var updatedFolioInfo = await db.Folios.findAll({
        where: {
          folio: folio,
        },
      });
      if (updatedFolioInfo.length > 0) {
        console.log("Folio already exists...");
        var newData = {
          id: updatedFolioInfo[0].id,
          emp_pan: updatedFolioInfo[0].emp_pan,
          emp_relative_pan: updatedFolioInfo[0].emp_relative_pan,
          folio: updatedFolioInfo[0].folio,
          current_share: updatedFolioInfo[0].current_share,
        };
        return [true, newData];
      } else {
        var EmpInfo = await db.Employees.findAll({
          where: {
            pan: pan,
          },
        });
        if (EmpInfo.length > 0) {
          // input pan is employee pan
          var newData = {
            emp_pan: pan,
            folio: folio,
            current_share: current_share,
          };
          return [false, newData];
        } else {
          // input pan is employee's relative pan
          var EmpRelativeInfo = await db.Relatives.findAll({
            where: {
              pan: pan,
              is_active: true,
            },
          });
          if (EmpRelativeInfo.length > 0) {
            var newData = {
              emp_pan: EmpRelativeInfo[0].emp_pan,
              emp_relative_pan: pan,
              folio: folio,
              current_share: current_share,
            };
            return [false, newData];
          } else {
            console.log("Unknown Pan - ", pan);
            return [false, {}];
          }
        }
      }
    } catch (error) {
      console.error("isFolioExists:: error: ", error);
      throw error;
    }
  }

  async function isDataExists(fileDate) {
    try {
      var currDate = new Date(fileDate);
      console.error("currDate = ", currDate);
      currDate_from = new Date(currDate.setHours(0, 0, 0));
      console.error("currDate_from = ", currDate_from);
      currDate = new Date(fileDate);
      console.error("currDate = ", currDate);
      currDate_to = new Date(currDate.setHours(23, 59, 59));
      console.error("currDate_to = ", currDate_to);
      var benposData = await db.UploadDatas.findAll({
        where: {
          current_benpos_date: { [Op.between]: [currDate_from, currDate_to] },
        },
      });
      if (benposData.length > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("isDataExists:: error: ", error);
      throw error;
    }
  }

  app.post("/weeklyData", async (req, res) => {
    let weeklyData = {};
    try {
      var activityData = {
        activity: "Benpos Data Upload",
        description: "",
        done_by: [req.user.userId],
        done_for: [],
      };
      var activity_id = await trackActivity(activityData, db);
      //uploading master excel to local and reading it as list od object
      console.log("requestes params are", req.query);
      var out = await localUpload.fields([{ name: "weeklyData", maxCount: 1 }])(
        req,
        res,
        async function (err) {
          // console.log("name", req.body.name);
          try {
            if (err) {
              console.log("Either no file selected or upload error", err);
              throw "NO weeklyData Excel";
            }
            // console.log(req.files);
            if (req.files) {
              try {
                var errorList = [];
                req.body["weeklyData"] = localgetPublicUrl(
                  req.files["weeklyData"][0].filename
                    ? req.files["weeklyData"][0].filename
                    : req.files["weeklyData"][0].key
                    ? req.files["weeklyData"][0].key
                    : req.files["weeklyData"][0].originalname
                );
                const path = req.body["weeklyData"];
                console.log("path>>>>>>>>", path);
                var workbook = XLSX.readFile(req.body["weeklyData"]);
                var sheet_name_list = workbook.SheetNames;
                weeklyData = XLSX.utils.sheet_to_json(
                  workbook.Sheets[sheet_name_list[0]]
                );
                // for(i=0;i<weeklyData.length;i++){
                try {
                  // Date check code here
                  inputDateStr = req.query.date;
                  console.error("inputDateStr = ", inputDateStr);
                  inputDate = await getDate(inputDateStr);
                  fileDateStr = weeklyData[0].CUR_BENPOS_DATE;
                  fileDateStr = fileDateStr.toString();
                  console.error("fileDateStr = ", fileDateStr);
                  let fileDate;
                  if (fileDateStr.includes("/") || fileDateStr.includes("-")) {
                    console.error("fileDate(/) = ", fileDate);
                    fileDate = await getDate(fileDateStr);
                  } else {
                    try {
                      fileDateTime = Number(fileDateStr);
                      console.error("fileDateTime = ", fileDateTime);
                      fileDate = await ExcelDateToJSDate(fileDateStr); //new Date((fileDateTime - (25567 + 1))*86400*1000)
                      console.error("fileDate(try) = ", fileDate.toString());
                    } catch (error) {
                      console.error("error in weeklyData date parse", error);
                      fileDate = await getDate(fileDateStr);
                    }
                  }
                  console.error("inputDate = ", inputDate.toString());
                  console.error("fileDate = ", fileDate.toString());

                  fs.unlinkSync(req.body["weeklyData"]);
                  var isBenposDataExists = await isDataExists(fileDate);
                  console.error("isBenposDataExists = ", isBenposDataExists);
                  if (fileDate.getTime() != inputDate.getTime()) {
                    console.error("date match error....");
                    res.status(400).json({
                      message: "input Date doesn't match with file Date ",
                    });
                  } else if (isBenposDataExists) {
                    console.error("data already exists for this date....");
                    res.status(400).json({
                      message: "data already exists for this benpose date ",
                    });
                  } else {
                    var variationDatas = [];
                    var updatedDataId = [];
                    var updatedUploadDatas = [];
                    const result = await db.sequelize.transaction(async (t) => {
                      try {
                        for (var i = 0; i < weeklyData.length; i++) {
                          try {
                            var newUploadDataId = [];
                            var validFlag = true;
                            var record = weeklyData[i];
                            var folio_1 = "";
                            var share_1 = 0;
                            var folio_2 = "";
                            var share_2 = 0;
                            var folio_3 = "";
                            var share_3 = 0;
                            var folio_4 = "";
                            var share_4 = 0;
                            var folio_5 = "";
                            var share_5 = 0;
                            var pan = record.FPAN_NO;
                            var total_share = record.TOT_SHARES;
                            var empData = await getEmpDetails(pan);
                            console.error("pan = ", pan);
                            console.error("empData = ", empData);
                            if (empData.length == 0) {
                              empData = await getEmpRelDetails(pan);
                            }
                            if (empData.length > 0) {
                              console.error("pan = ", pan);
                              console.error("empData = ", empData);
                              var previous_total_share = empData[0].total_share;
                              console.error(
                                "previous_total_share = ",
                                previous_total_share
                              );
                              var is_total_share_changed = false;
                              if (previous_total_share != total_share) {
                                is_total_share_changed = true;
                              }
                              let file_date;
                              file_date_str = record.CUR_BENPOS_DATE;
                              file_date_str = file_date_str.toString();
                              if (
                                file_date_str.includes("/") ||
                                file_date_str.includes("-")
                              ) {
                                console.error(
                                  "file_date_str(/) = ",
                                  file_date_str
                                );
                                file_date = await getDate(file_date_str);
                              } else {
                                try {
                                  file_dateTime = Number(file_date_str);
                                  file_date = await ExcelDateToJSDate(
                                    file_dateTime
                                  ); //new Date((fileDateTime - (25567 + 1))*86400*1000)
                                } catch (error) {
                                  console.error(
                                    "error in weeklyData date parse",
                                    error
                                  );
                                  file_date = await getDate(file_date_str);
                                }
                              }
                              record.CUR_BENPOS_DATE = file_date;
                              if ("FOLIO_NO_1" in record) {
                                folio_1 = record.FOLIO_NO_1;
                                folio_1 = folio_1.toString();
                                if ("SHARES_1" in record) {
                                  share_1 = record.SHARES_1;
                                }
                                console.error("pan = ", pan);
                                console.error("folio_1 = ", folio_1);
                                console.error("share_1 = ", share_1);
                                var folioResp = await isFolioExists(
                                  pan,
                                  folio_1,
                                  share_1
                                );
                                var exist = folioResp[0];
                                var newData = folioResp[1];
                                console.error("exist = ", exist);
                                var previous_share_1 = 0;
                                // console.error("exist = ",exist)
                                // console.error("folioResp = ",folioResp)
                                if (exist) {
                                  console.log("FOLIO EXISTS");
                                  previous_share_1 = newData.current_share;
                                  // update current share
                                  if (newData.current_share != share_1) {
                                    console.log("share chjanged in folio 1");
                                    var reqResp = await isValidRequestExists(
                                      pan,
                                      newData,
                                      file_date,
                                      share_1
                                    );
                                    var reqExists = reqResp[0];
                                    var requestInfos = reqResp[1];
                                    var isValid = true;
                                    if (reqExists) {
                                      console.log("VALID REQ EXISTS");
                                      console.log(
                                        "requestInfos = ",
                                        requestInfos
                                      );
                                      for (
                                        var e = 0;
                                        e < requestInfos.length;
                                        e++
                                      ) {
                                        if (!requestInfos[e].isValid) {
                                          isValid = false;
                                        }
                                      }
                                    } else {
                                      isValid = false;
                                    }
                                    // check for transaction in last 6 months
                                    var base_date = new Date(file_date);
                                    var old_date = await subMonths(
                                      base_date,
                                      6
                                    );
                                    base_date = new Date(
                                      new Date(file_date).setHours(23, 59, 59)
                                    );
                                    var trans = await db.UploadDatas.findAll({
                                      where: {
                                        pan: pan,
                                        is_share_changed: true,
                                        current_benpos_date: {
                                          [Op.between]: [old_date, base_date],
                                        },
                                      },
                                      order: [["current_benpos_date", "DESC"]],
                                    });
                                    if (trans.length > 0) {
                                      isValid = false;
                                    }
                                    // check if transaction done in window closure period
                                    var compData = await db.Company.findAll();
                                    var window_close_from = new Date(
                                      new Date(
                                        compData[0].window_close_from
                                      ).setHours(00, 00, 00)
                                    );
                                    var window_close_to = new Date(
                                      new Date(
                                        compData[0].window_close_to
                                      ).setHours(23, 59, 59)
                                    );
                                    base_date = new Date(
                                      new Date(file_date).setHours(00, 00, 00)
                                    );
                                    if (
                                      window_close_from.getTime() <=
                                        base_date.getTime() &&
                                      base_date.getTime() <=
                                        window_close_to.getTime()
                                    ) {
                                      isValid = false;
                                    }
                                    // fetch the last date when share changed
                                    var last_share_change_date = null;
                                    var lastTransInfo =
                                      await db.UploadDatas.findAll({
                                        where: {
                                          pan: pan,
                                          is_share_changed: true,
                                        },
                                        order: [
                                          ["current_benpos_date", "DESC"],
                                        ],
                                      });
                                    if (lastTransInfo.length > 0) {
                                      last_share_change_date =
                                        lastTransInfo[0].current_benpos_date;
                                    }
                                    // add upload data record
                                    var newUploadData = {
                                      previous_share: previous_share_1,
                                      pan: pan,
                                      current_share: share_1,
                                      total_share: total_share,
                                      current_benpos_date: file_date,
                                      is_share_changed: is_total_share_changed,
                                      is_valid: isValid,
                                      transaction_folio: folio_1,
                                      last_share_change_date:
                                        last_share_change_date,
                                      previous_total_share:
                                        previous_total_share,
                                    };
                                    var newFolioInfo1 =
                                      await db.UploadDatas.create(
                                        newUploadData,
                                        { transaction: t }
                                      );
                                    var variationData = newUploadData;
                                    variationData["name"] = empData[0].name;
                                    variationData["email"] = empData[0].email;
                                    variationData["previous_total_share"] =
                                      previous_total_share;
                                    variationDatas.push(variationData);
                                    if (!isValid) {
                                      validFlag = isValid;
                                    }
                                    newUploadDataId.push(newFolioInfo1.id);
                                    // add upload data id to request
                                    for (
                                      var f = 0;
                                      f < requestInfos.length;
                                      f++
                                    ) {
                                      // updatedDataId.push({data_id: newFolioInfo1.id,reqId: requestInfos[f].reqId,
                                      //     previous_total_share: previous_total_share})
                                      var updatedDataInfo =
                                        await db.Requests.update(
                                          {
                                            data_id: newFolioInfo1.id,
                                            previous_total_share:
                                              previous_total_share,
                                          },
                                          {
                                            where: {
                                              id: requestInfos[f].reqId,
                                            },
                                            transaction: t,
                                          }
                                        );
                                    }
                                    // change current share in Folio table
                                    var updatedFolioInfo1 =
                                      await db.Folios.update(
                                        { current_share: share_1 },
                                        {
                                          where: {
                                            folio: folio_1,
                                          },
                                          transaction: t,
                                        }
                                      );
                                  } else {
                                    // fetch the last date when share changed
                                    var last_share_change_date = null;
                                    var lastTransInfo =
                                      await db.UploadDatas.findAll({
                                        where: {
                                          pan: pan,
                                          is_share_changed: true,
                                        },
                                        order: [
                                          ["current_benpos_date", "DESC"],
                                        ],
                                      });
                                    if (lastTransInfo.length > 0) {
                                      last_share_change_date =
                                        lastTransInfo[0].current_benpos_date;
                                    }
                                    var isValid = true;
                                    // add upload data record
                                    var newUploadData = {
                                      previous_share: previous_share_1,
                                      pan: pan,
                                      current_share: share_1,
                                      total_share: total_share,
                                      current_benpos_date: file_date,
                                      is_share_changed: is_total_share_changed,
                                      is_valid: isValid,
                                      transaction_folio: folio_1,
                                      last_share_change_date:
                                        last_share_change_date,
                                      previous_total_share:
                                        previous_total_share,
                                    };
                                    var newFolioInfo1 =
                                      await db.UploadDatas.create(
                                        newUploadData,
                                        { transaction: t }
                                      );
                                    if (!isValid) {
                                      validFlag = isValid;
                                    }
                                    newUploadDataId.push(newFolioInfo1.id);
                                  }
                                } else {
                                  // check if change have a valid request
                                  var reqResp = await isValidRequestExists(
                                    pan,
                                    newData,
                                    file_date,
                                    share_1
                                  );
                                  var reqExists = reqResp[0];
                                  var requestInfos = reqResp[1];
                                  var isValid = true;
                                  if (reqExists) {
                                    console.log("VALIS REQ EXISTS");
                                    console.log(
                                      "requestInfos = ",
                                      requestInfos
                                    );
                                    for (
                                      var e = 0;
                                      e < requestInfos.length;
                                      e++
                                    ) {
                                      if (!requestInfos[e].isValid) {
                                        isValid = false;
                                      }
                                    }
                                  } else {
                                    isValid = false;
                                  }
                                  // check for transaction in last 6 months
                                  var base_date = new Date(file_date);
                                  var old_date = await subMonths(base_date, 6);
                                  base_date = new Date(
                                    new Date(file_date).setHours(23, 59, 59)
                                  );
                                  var trans = await db.UploadDatas.findAll({
                                    where: {
                                      pan: pan,
                                      is_share_changed: true,
                                      current_benpos_date: {
                                        [Op.between]: [old_date, base_date],
                                      },
                                    },
                                    order: [["current_benpos_date", "DESC"]],
                                  });
                                  if (trans.length > 0) {
                                    isValid = false;
                                  }
                                  // check if transaction done in window closure period
                                  var compData = await db.Company.findAll();
                                  var window_close_from = new Date(
                                    new Date(
                                      compData[0].window_close_from
                                    ).setHours(00, 00, 00)
                                  );
                                  var window_close_to = new Date(
                                    new Date(
                                      compData[0].window_close_to
                                    ).setHours(23, 59, 59)
                                  );
                                  base_date = new Date(
                                    new Date(file_date).setHours(00, 00, 00)
                                  );
                                  if (
                                    window_close_from.getTime() <=
                                      base_date.getTime() &&
                                    base_date.getTime() <=
                                      window_close_to.getTime()
                                  ) {
                                    isValid = false;
                                  }
                                  // fetch the last date when share changed
                                  var last_share_change_date = null;
                                  var lastTransInfo =
                                    await db.UploadDatas.findAll({
                                      where: {
                                        pan: pan,
                                        is_share_changed: true,
                                      },
                                      order: [["current_benpos_date", "DESC"]],
                                    });
                                  if (lastTransInfo.length > 0) {
                                    last_share_change_date =
                                      lastTransInfo[0].current_benpos_date;
                                  }
                                  // add folio info
                                  var newFolioInfo1 = await db.Folios.create(
                                    newData,
                                    { transaction: t }
                                  );
                                  // add upload data record
                                  var newUploadData = {
                                    previous_share: previous_share_1,
                                    pan: pan,
                                    current_share: share_1,
                                    total_share: total_share,
                                    current_benpos_date: file_date,
                                    is_share_changed: is_total_share_changed,
                                    is_valid: isValid,
                                    transaction_folio: folio_1,
                                    last_share_change_date:
                                      last_share_change_date,
                                    previous_total_share: previous_total_share,
                                  };
                                  var newFolioInfo1 =
                                    await db.UploadDatas.create(newUploadData, {
                                      transaction: t,
                                    });
                                  if (!isValid) {
                                    validFlag = isValid;
                                  }
                                  newUploadDataId.push(newFolioInfo1.id);
                                  var variationData = newUploadData;
                                  variationData["name"] = empData[0].name;
                                  variationData["email"] = empData[0].email;
                                  variationData["previous_total_share"] =
                                    previous_total_share;
                                  variationDatas.push(variationData);
                                }
                                console.error(
                                  "validFlag folio 1 = ",
                                  validFlag
                                );
                              }
                              if ("FOLIO_NO_2" in record) {
                                folio_2 = record.FOLIO_NO_2;
                                folio_2 = folio_2.toString();
                                if ("SHARES_2" in record) {
                                  share_2 = record.SHARES_2;
                                }
                                var folioResp = await isFolioExists(
                                  pan,
                                  folio_2,
                                  share_2
                                );
                                var exist = folioResp[0];
                                var newData = folioResp[1];
                                console.error("exist = ", exist);
                                var previous_share_2 = 0;
                                // console.error("newData = ",newData)
                                if (exist) {
                                  console.log("FOLIO EXISTS");
                                  previous_share_2 = newData.current_share;
                                  // update current share
                                  if (newData.current_share != share_2) {
                                    console.log("share chjanged in folio 2");
                                    var reqResp = await isValidRequestExists(
                                      pan,
                                      newData,
                                      file_date,
                                      share_2
                                    );
                                    var reqExists = reqResp[0];
                                    var requestInfos = reqResp[1];
                                    var isValid = true;
                                    if (reqExists) {
                                      console.log("VALIS REQ EXISTS");
                                      console.log(
                                        "requestInfos = ",
                                        requestInfos
                                      );
                                      for (
                                        var e = 0;
                                        e < requestInfos.length;
                                        e++
                                      ) {
                                        if (!requestInfos[e].isValid) {
                                          isValid = false;
                                        }
                                      }
                                    } else {
                                      isValid = false;
                                    }
                                    // check for transaction in last 6 months
                                    var base_date = new Date(file_date);
                                    var old_date = await subMonths(
                                      base_date,
                                      6
                                    );
                                    base_date = new Date(
                                      new Date(file_date).setHours(23, 59, 59)
                                    );
                                    var trans = await db.UploadDatas.findAll({
                                      where: {
                                        pan: pan,
                                        is_share_changed: true,
                                        current_benpos_date: {
                                          [Op.between]: [old_date, base_date],
                                        },
                                      },
                                      order: [["current_benpos_date", "DESC"]],
                                    });
                                    if (trans.length > 0) {
                                      isValid = false;
                                    }
                                    // check if transaction done in window closure period
                                    var compData = await db.Company.findAll();
                                    var window_close_from = new Date(
                                      new Date(
                                        compData[0].window_close_from
                                      ).setHours(00, 00, 00)
                                    );
                                    var window_close_to = new Date(
                                      new Date(
                                        compData[0].window_close_to
                                      ).setHours(23, 59, 59)
                                    );
                                    base_date = new Date(
                                      new Date(file_date).setHours(00, 00, 00)
                                    );
                                    if (
                                      window_close_from.getTime() <=
                                        base_date.getTime() &&
                                      base_date.getTime() <=
                                        window_close_to.getTime()
                                    ) {
                                      isValid = false;
                                    }
                                    // fetch the last date when share changed
                                    var last_share_change_date = null;
                                    var lastTransInfo =
                                      await db.UploadDatas.findAll({
                                        where: {
                                          pan: pan,
                                          is_share_changed: true,
                                        },
                                        order: [
                                          ["current_benpos_date", "DESC"],
                                        ],
                                      });
                                    if (lastTransInfo.length > 0) {
                                      last_share_change_date =
                                        lastTransInfo[0].current_benpos_date;
                                    }
                                    // add upload data record
                                    var newUploadData = {
                                      previous_share: previous_share_2,
                                      pan: pan,
                                      current_share: share_2,
                                      total_share: total_share,
                                      current_benpos_date: file_date,
                                      is_share_changed: is_total_share_changed,
                                      is_valid: isValid,
                                      transaction_folio: folio_2,
                                      last_share_change_date:
                                        last_share_change_date,
                                      previous_total_share:
                                        previous_total_share,
                                    };
                                    var newFolioInfo1 =
                                      await db.UploadDatas.create(
                                        newUploadData,
                                        { transaction: t }
                                      );
                                    if (!isValid) {
                                      validFlag = isValid;
                                    }
                                    newUploadDataId.push(newFolioInfo1.id);
                                    var variationData = newUploadData;
                                    console.error(
                                      "variationData = ",
                                      variationData
                                    );
                                    variationData["name"] = empData[0].name;
                                    variationData["email"] = empData[0].email;
                                    variationData["previous_total_share"] =
                                      previous_total_share;
                                    console.error(
                                      "variationData = ",
                                      variationData
                                    );
                                    variationDatas.push(variationData);
                                    // add upload data id to request
                                    console.error(
                                      "requestInfos = ",
                                      requestInfos
                                    );
                                    for (
                                      var f = 0;
                                      f < requestInfos.length;
                                      f++
                                    ) {
                                      // updatedDataId.push({data_id: newFolioInfo1.id,reqId: requestInfos[f].reqId,
                                      //     previous_total_share: previous_total_share})
                                      var updatedDataInfo =
                                        await db.Requests.update(
                                          {
                                            data_id: newFolioInfo1.id,
                                            previous_total_share:
                                              previous_total_share,
                                          },
                                          {
                                            where: {
                                              id: requestInfos[f].reqId,
                                            },
                                            transaction: t,
                                          }
                                        );
                                    }
                                    // change current share in Folio table
                                    var updatedFolioInfo1 =
                                      await db.Folios.update(
                                        { current_share: share_2 },
                                        {
                                          where: {
                                            folio: folio_2,
                                          },
                                          transaction: t,
                                        }
                                      );
                                  } else {
                                    // fetch the last date when share changed
                                    var last_share_change_date = null;
                                    var lastTransInfo =
                                      await db.UploadDatas.findAll({
                                        where: {
                                          pan: pan,
                                          is_share_changed: true,
                                        },
                                        order: [
                                          ["current_benpos_date", "DESC"],
                                        ],
                                      });
                                    if (lastTransInfo.length > 0) {
                                      last_share_change_date =
                                        lastTransInfo[0].current_benpos_date;
                                    }
                                    // add upload data record
                                    var isValid = true;
                                    var newUploadData = {
                                      previous_share: previous_share_2,
                                      pan: pan,
                                      current_share: share_2,
                                      total_share: total_share,
                                      current_benpos_date: file_date,
                                      is_share_changed: is_total_share_changed,
                                      is_valid: isValid,
                                      transaction_folio: folio_2,
                                      last_share_change_date:
                                        last_share_change_date,
                                      previous_total_share:
                                        previous_total_share,
                                    };
                                    var newFolioInfo1 =
                                      await db.UploadDatas.create(
                                        newUploadData,
                                        { transaction: t }
                                      );
                                    if (!isValid) {
                                      validFlag = isValid;
                                    }
                                    newUploadDataId.push(newFolioInfo1.id);
                                  }
                                } else {
                                  // check if change have a valid request
                                  var reqResp = await isValidRequestExists(
                                    pan,
                                    newData,
                                    file_date,
                                    share_2
                                  );
                                  var reqExists = reqResp[0];
                                  var requestInfos = reqResp[1];
                                  var isValid = true;
                                  if (reqExists) {
                                    console.log("VALIS REQ EXISTS");
                                    console.log(
                                      "requestInfos = ",
                                      requestInfos
                                    );
                                    for (
                                      var e = 0;
                                      e < requestInfos.length;
                                      e++
                                    ) {
                                      if (!requestInfos[e].isValid) {
                                        isValid = false;
                                      }
                                    }
                                  } else {
                                    isValid = false;
                                  }
                                  // check for transaction in last 6 months
                                  var base_date = new Date(file_date);
                                  var old_date = await subMonths(base_date, 6);
                                  base_date = new Date(
                                    new Date(file_date).setHours(23, 59, 59)
                                  );
                                  var trans = await db.UploadDatas.findAll({
                                    where: {
                                      pan: pan,
                                      is_share_changed: true,
                                      current_benpos_date: {
                                        [Op.between]: [old_date, base_date],
                                      },
                                    },
                                    order: [["current_benpos_date", "DESC"]],
                                  });
                                  if (trans.length > 0) {
                                    isValid = false;
                                  }
                                  // check if transaction done in window closure period
                                  var compData = await db.Company.findAll();
                                  var window_close_from = new Date(
                                    new Date(
                                      compData[0].window_close_from
                                    ).setHours(00, 00, 00)
                                  );
                                  var window_close_to = new Date(
                                    new Date(
                                      compData[0].window_close_to
                                    ).setHours(23, 59, 59)
                                  );
                                  base_date = new Date(
                                    new Date(file_date).setHours(00, 00, 00)
                                  );
                                  if (
                                    window_close_from.getTime() <=
                                      base_date.getTime() &&
                                    base_date.getTime() <=
                                      window_close_to.getTime()
                                  ) {
                                    isValid = false;
                                  }
                                  // fetch the last date when share changed
                                  var last_share_change_date = null;
                                  var lastTransInfo =
                                    await db.UploadDatas.findAll({
                                      where: {
                                        pan: pan,
                                        is_share_changed: true,
                                      },
                                      order: [["current_benpos_date", "DESC"]],
                                    });
                                  if (lastTransInfo.length > 0) {
                                    last_share_change_date =
                                      lastTransInfo[0].current_benpos_date;
                                  }
                                  // add folio info
                                  var newFolioInfo1 = await db.Folios.create(
                                    newData,
                                    { transaction: t }
                                  );
                                  // add upload data record
                                  var newUploadData = {
                                    previous_share: previous_share_2,
                                    pan: pan,
                                    current_share: share_2,
                                    total_share: total_share,
                                    current_benpos_date: file_date,
                                    is_share_changed: is_total_share_changed,
                                    is_valid: isValid,
                                    transaction_folio: folio_2,
                                    last_share_change_date:
                                      last_share_change_date,
                                    previous_total_share: previous_total_share,
                                  };
                                  var newFolioInfo1 =
                                    await db.UploadDatas.create(newUploadData, {
                                      transaction: t,
                                    });
                                  if (!isValid) {
                                    validFlag = isValid;
                                  }
                                  newUploadDataId.push(newFolioInfo1.id);
                                  var variationData = newUploadData;
                                  console.error(
                                    "variationData = ",
                                    variationData
                                  );
                                  variationData["name"] = empData[0].name;
                                  variationData["email"] = empData[0].email;
                                  variationData["previous_total_share"] =
                                    previous_total_share;
                                  console.error(
                                    "variationData = ",
                                    variationData
                                  );
                                  variationDatas.push(variationData);
                                }
                                console.error(
                                  "validFlag folio 2 = ",
                                  validFlag
                                );
                              }
                              if ("FOLIO_NO_3" in record) {
                                folio_3 = record.FOLIO_NO_3;
                                folio_3 = folio_3.toString();
                                if ("SHARES_3" in record) {
                                  share_3 = record.SHARES_3;
                                }
                                var folioResp = await isFolioExists(
                                  pan,
                                  folio_3,
                                  share_3
                                );
                                var exist = folioResp[0];
                                var newData = folioResp[1];
                                console.error("exist = ", exist);
                                var previous_share_3 = 0;
                                // console.error("newData = ",newData)
                                if (exist) {
                                  console.log("FOLIO EXISTS");
                                  previous_share_3 = newData.current_share;
                                  // update current share
                                  if (newData.current_share != share_3) {
                                    console.log("share chjanged in folio 3");
                                    var reqResp = await isValidRequestExists(
                                      pan,
                                      newData,
                                      file_date,
                                      share_3
                                    );
                                    var reqExists = reqResp[0];
                                    var requestInfos = reqResp[1];
                                    var isValid = true;
                                    if (reqExists) {
                                      console.log("VALIS REQ EXISTS");
                                      console.log(
                                        "requestInfos = ",
                                        requestInfos
                                      );
                                      for (
                                        var e = 0;
                                        e < requestInfos.length;
                                        e++
                                      ) {
                                        if (!requestInfos[e].isValid) {
                                          isValid = false;
                                        }
                                      }
                                    } else {
                                      isValid = false;
                                    }
                                    // check for transaction in last 6 months
                                    var base_date = new Date(file_date);
                                    var old_date = await subMonths(
                                      base_date,
                                      6
                                    );
                                    base_date = new Date(
                                      new Date(file_date).setHours(23, 59, 59)
                                    );
                                    var trans = await db.UploadDatas.findAll({
                                      where: {
                                        pan: pan,
                                        is_share_changed: true,
                                        current_benpos_date: {
                                          [Op.between]: [old_date, base_date],
                                        },
                                      },
                                      order: [["current_benpos_date", "DESC"]],
                                    });
                                    if (trans.length > 0) {
                                      isValid = false;
                                    }
                                    // check if transaction done in window closure period
                                    var compData = await db.Company.findAll();
                                    var window_close_from = new Date(
                                      new Date(
                                        compData[0].window_close_from
                                      ).setHours(00, 00, 00)
                                    );
                                    var window_close_to = new Date(
                                      new Date(
                                        compData[0].window_close_to
                                      ).setHours(23, 59, 59)
                                    );
                                    base_date = new Date(
                                      new Date(file_date).setHours(00, 00, 00)
                                    );
                                    if (
                                      window_close_from.getTime() <=
                                        base_date.getTime() &&
                                      base_date.getTime() <=
                                        window_close_to.getTime()
                                    ) {
                                      isValid = false;
                                    }
                                    // fetch the last date when share changed
                                    var last_share_change_date = null;
                                    var lastTransInfo =
                                      await db.UploadDatas.findAll({
                                        where: {
                                          pan: pan,
                                          is_share_changed: true,
                                        },
                                        order: [
                                          ["current_benpos_date", "DESC"],
                                        ],
                                      });
                                    if (lastTransInfo.length > 0) {
                                      last_share_change_date =
                                        lastTransInfo[0].current_benpos_date;
                                    }
                                    // add upload data record
                                    var newUploadData = {
                                      previous_share: previous_share_3,
                                      pan: pan,
                                      current_share: share_3,
                                      total_share: total_share,
                                      current_benpos_date: file_date,
                                      is_share_changed: is_total_share_changed,
                                      is_valid: isValid,
                                      transaction_folio: folio_3,
                                      last_share_change_date:
                                        last_share_change_date,
                                      previous_total_share:
                                        previous_total_share,
                                    };
                                    var newFolioInfo1 =
                                      await db.UploadDatas.create(
                                        newUploadData,
                                        { transaction: t }
                                      );
                                    if (!isValid) {
                                      validFlag = isValid;
                                    }
                                    newUploadDataId.push(newFolioInfo1.id);
                                    var variationData = newUploadData;
                                    variationData["name"] = empData[0].name;
                                    variationData["email"] = empData[0].email;
                                    variationData["previous_total_share"] =
                                      previous_total_share;
                                    variationDatas.push(variationData);
                                    // add upload data id to request
                                    for (
                                      var f = 0;
                                      f < requestInfos.length;
                                      f++
                                    ) {
                                      // updatedDataId.push({data_id: newFolioInfo1.id,reqId: requestInfos[f].reqId,
                                      //     previous_total_share: previous_total_share})
                                      var updatedDataInfo =
                                        await db.Requests.update(
                                          {
                                            data_id: newFolioInfo1.id,
                                            previous_total_share:
                                              previous_total_share,
                                          },
                                          {
                                            where: {
                                              id: requestInfos[f].reqId,
                                            },
                                            transaction: t,
                                          }
                                        );
                                    }
                                    // change current share in Folio table
                                    var updatedFolioInfo1 =
                                      await db.Folios.update(
                                        { current_share: share_3 },
                                        {
                                          where: {
                                            folio: folio_3,
                                          },
                                          transaction: t,
                                        }
                                      );
                                  } else {
                                    // fetch the last date when share changed
                                    var last_share_change_date = null;
                                    var lastTransInfo =
                                      await db.UploadDatas.findAll({
                                        where: {
                                          pan: pan,
                                          is_share_changed: true,
                                        },
                                        order: [
                                          ["current_benpos_date", "DESC"],
                                        ],
                                      });
                                    if (lastTransInfo.length > 0) {
                                      last_share_change_date =
                                        lastTransInfo[0].current_benpos_date;
                                    }
                                    // add upload data record
                                    var isValid = true;
                                    var newUploadData = {
                                      previous_share: previous_share_3,
                                      pan: pan,
                                      current_share: share_3,
                                      total_share: total_share,
                                      current_benpos_date: file_date,
                                      is_share_changed: is_total_share_changed,
                                      is_valid: isValid,
                                      transaction_folio: folio_3,
                                      last_share_change_date:
                                        last_share_change_date,
                                      previous_total_share:
                                        previous_total_share,
                                    };
                                    var newFolioInfo1 =
                                      await db.UploadDatas.create(
                                        newUploadData,
                                        { transaction: t }
                                      );
                                    if (!isValid) {
                                      validFlag = isValid;
                                    }
                                    newUploadDataId.push(newFolioInfo1.id);
                                  }
                                } else {
                                  // check if change have a valid request
                                  var reqResp = await isValidRequestExists(
                                    pan,
                                    newData,
                                    file_date,
                                    share_3
                                  );
                                  var reqExists = reqResp[0];
                                  var requestInfos = reqResp[1];
                                  var isValid = true;
                                  if (reqExists) {
                                    console.log("VALIS REQ EXISTS");
                                    console.log(
                                      "requestInfos = ",
                                      requestInfos
                                    );
                                    for (
                                      var e = 0;
                                      e < requestInfos.length;
                                      e++
                                    ) {
                                      if (!requestInfos[e].isValid) {
                                        isValid = false;
                                      }
                                    }
                                  } else {
                                    isValid = false;
                                  }
                                  // check for transaction in last 6 months
                                  var base_date = new Date(file_date);
                                  var old_date = await subMonths(base_date, 6);
                                  base_date = new Date(
                                    new Date(file_date).setHours(23, 59, 59)
                                  );
                                  var trans = await db.UploadDatas.findAll({
                                    where: {
                                      pan: pan,
                                      is_share_changed: true,
                                      current_benpos_date: {
                                        [Op.between]: [old_date, base_date],
                                      },
                                    },
                                    order: [["current_benpos_date", "DESC"]],
                                  });
                                  if (trans.length > 0) {
                                    isValid = false;
                                  }
                                  // check if transaction done in window closure period
                                  var compData = await db.Company.findAll();
                                  var window_close_from = new Date(
                                    new Date(
                                      compData[0].window_close_from
                                    ).setHours(00, 00, 00)
                                  );
                                  var window_close_to = new Date(
                                    new Date(
                                      compData[0].window_close_to
                                    ).setHours(23, 59, 59)
                                  );
                                  base_date = new Date(
                                    new Date(file_date).setHours(00, 00, 00)
                                  );
                                  if (
                                    window_close_from.getTime() <=
                                      base_date.getTime() &&
                                    base_date.getTime() <=
                                      window_close_to.getTime()
                                  ) {
                                    isValid = false;
                                  }
                                  // fetch the last date when share changed
                                  var last_share_change_date = null;
                                  var lastTransInfo =
                                    await db.UploadDatas.findAll({
                                      where: {
                                        pan: pan,
                                        is_share_changed: true,
                                      },
                                      order: [["current_benpos_date", "DESC"]],
                                    });
                                  if (lastTransInfo.length > 0) {
                                    last_share_change_date =
                                      lastTransInfo[0].current_benpos_date;
                                  }
                                  // add folio info
                                  var newFolioInfo1 = await db.Folios.create(
                                    newData,
                                    { transaction: t }
                                  );
                                  // add upload data record
                                  var newUploadData = {
                                    previous_share: previous_share_3,
                                    pan: pan,
                                    current_share: share_3,
                                    total_share: total_share,
                                    current_benpos_date: file_date,
                                    is_share_changed: is_total_share_changed,
                                    is_valid: isValid,
                                    transaction_folio: folio_3,
                                    last_share_change_date:
                                      last_share_change_date,
                                    previous_total_share: previous_total_share,
                                  };
                                  var newFolioInfo1 =
                                    await db.UploadDatas.create(newUploadData, {
                                      transaction: t,
                                    });
                                  if (!isValid) {
                                    validFlag = isValid;
                                  }
                                  newUploadDataId.push(newFolioInfo1.id);
                                  var variationData = newUploadData;
                                  variationData["name"] = empData[0].name;
                                  variationData["email"] = empData[0].email;
                                  variationData["previous_total_share"] =
                                    previous_total_share;
                                  variationDatas.push(variationData);
                                }
                                console.error(
                                  "validFlag folio 3 = ",
                                  validFlag
                                );
                              }
                              if ("FOLIO_NO_4" in record) {
                                folio_4 = record.FOLIO_NO_4;
                                folio_4 = folio_4.toString();
                                if ("SHARES_4" in record) {
                                  share_4 = record.SHARES_4;
                                }
                                var folioResp = await isFolioExists(
                                  pan,
                                  folio_4,
                                  share_4
                                );
                                var exist = folioResp[0];
                                var newData = folioResp[1];
                                console.error("exist = ", exist);
                                var previous_share_4 = 0;
                                // console.error("newData = ",newData)
                                if (exist) {
                                  console.log("FOLIO EXISTS");
                                  previous_share_4 = newData.current_share;
                                  // update current share
                                  if (newData.current_share != share_4) {
                                    console.log("share chjanged in folio 4");
                                    var reqResp = await isValidRequestExists(
                                      pan,
                                      newData,
                                      file_date,
                                      share_4
                                    );
                                    var reqExists = reqResp[0];
                                    var requestInfos = reqResp[1];
                                    var isValid = true;
                                    if (reqExists) {
                                      console.log("VALIS REQ EXISTS");
                                      console.log(
                                        "requestInfos = ",
                                        requestInfos
                                      );
                                      for (
                                        var e = 0;
                                        e < requestInfos.length;
                                        e++
                                      ) {
                                        if (!requestInfos[e].isValid) {
                                          isValid = false;
                                        }
                                      }
                                    } else {
                                      isValid = false;
                                    }
                                    // check for transaction in last 6 months
                                    var base_date = new Date(file_date);
                                    var old_date = await subMonths(
                                      base_date,
                                      6
                                    );
                                    base_date = new Date(
                                      new Date(file_date).setHours(23, 59, 59)
                                    );
                                    var trans = await db.UploadDatas.findAll({
                                      where: {
                                        pan: pan,
                                        is_share_changed: true,
                                        current_benpos_date: {
                                          [Op.between]: [old_date, base_date],
                                        },
                                      },
                                      order: [["current_benpos_date", "DESC"]],
                                    });
                                    if (trans.length > 0) {
                                      isValid = false;
                                    }
                                    // check if transaction done in window closure period
                                    var compData = await db.Company.findAll();
                                    var window_close_from = new Date(
                                      new Date(
                                        compData[0].window_close_from
                                      ).setHours(00, 00, 00)
                                    );
                                    var window_close_to = new Date(
                                      new Date(
                                        compData[0].window_close_to
                                      ).setHours(23, 59, 59)
                                    );
                                    base_date = new Date(
                                      new Date(file_date).setHours(00, 00, 00)
                                    );
                                    if (
                                      window_close_from.getTime() <=
                                        base_date.getTime() &&
                                      base_date.getTime() <=
                                        window_close_to.getTime()
                                    ) {
                                      isValid = false;
                                    }
                                    // fetch the last date when share changed
                                    var last_share_change_date = null;
                                    var lastTransInfo =
                                      await db.UploadDatas.findAll({
                                        where: {
                                          pan: pan,
                                          is_share_changed: true,
                                        },
                                        order: [
                                          ["current_benpos_date", "DESC"],
                                        ],
                                      });
                                    if (lastTransInfo.length > 0) {
                                      last_share_change_date =
                                        lastTransInfo[0].current_benpos_date;
                                    }
                                    // add upload data record
                                    var newUploadData = {
                                      previous_share: previous_share_4,
                                      pan: pan,
                                      current_share: share_4,
                                      total_share: total_share,
                                      current_benpos_date: file_date,
                                      is_share_changed: is_total_share_changed,
                                      is_valid: isValid,
                                      transaction_folio: folio_4,
                                      last_share_change_date:
                                        last_share_change_date,
                                      previous_total_share:
                                        previous_total_share,
                                    };
                                    var newFolioInfo1 =
                                      await db.UploadDatas.create(
                                        newUploadData,
                                        { transaction: t }
                                      );
                                    if (!isValid) {
                                      validFlag = isValid;
                                    }
                                    newUploadDataId.push(newFolioInfo1.id);
                                    var variationData = newUploadData;
                                    variationData["name"] = empData[0].name;
                                    variationData["email"] = empData[0].email;
                                    variationData["previous_total_share"] =
                                      previous_total_share;
                                    variationDatas.push(variationData);
                                    // add upload data id to request
                                    for (
                                      var f = 0;
                                      f < requestInfos.length;
                                      f++
                                    ) {
                                      // updatedDataId.push({data_id: newFolioInfo1.id,reqId: requestInfos[f].reqId,
                                      //     previous_total_share: previous_total_share})
                                      var updatedDataInfo =
                                        await db.Requests.update(
                                          {
                                            data_id: newFolioInfo1.id,
                                            previous_total_share:
                                              previous_total_share,
                                          },
                                          {
                                            where: {
                                              id: requestInfos[f].reqId,
                                            },
                                            transaction: t,
                                          }
                                        );
                                    }
                                    // change current share in Folio table
                                    var updatedFolioInfo1 =
                                      await db.Folios.update(
                                        { current_share: share_4 },
                                        {
                                          where: {
                                            folio: folio_4,
                                          },
                                          transaction: t,
                                        }
                                      );
                                  } else {
                                    // fetch the last date when share changed
                                    var last_share_change_date = null;
                                    var lastTransInfo =
                                      await db.UploadDatas.findAll({
                                        where: {
                                          pan: pan,
                                          is_share_changed: true,
                                        },
                                        order: [
                                          ["current_benpos_date", "DESC"],
                                        ],
                                      });
                                    if (lastTransInfo.length > 0) {
                                      last_share_change_date =
                                        lastTransInfo[0].current_benpos_date;
                                    }
                                    // add upload data record
                                    var isValid = true;
                                    var newUploadData = {
                                      previous_share: previous_share_4,
                                      pan: pan,
                                      current_share: share_4,
                                      total_share: total_share,
                                      current_benpos_date: file_date,
                                      is_share_changed: is_total_share_changed,
                                      is_valid: isValid,
                                      transaction_folio: folio_4,
                                      last_share_change_date:
                                        last_share_change_date,
                                      previous_total_share:
                                        previous_total_share,
                                    };
                                    var newFolioInfo1 =
                                      await db.UploadDatas.create(
                                        newUploadData,
                                        { transaction: t }
                                      );
                                    if (!isValid) {
                                      validFlag = isValid;
                                    }
                                    newUploadDataId.push(newFolioInfo1.id);
                                  }
                                } else {
                                  // check if change have a valid request
                                  var reqResp = await isValidRequestExists(
                                    pan,
                                    newData,
                                    file_date,
                                    share_4
                                  );
                                  var reqExists = reqResp[0];
                                  var requestInfos = reqResp[1];
                                  var isValid = true;
                                  if (reqExists) {
                                    console.log("VALIS REQ EXISTS");
                                    console.log(
                                      "requestInfos = ",
                                      requestInfos
                                    );
                                    for (
                                      var e = 0;
                                      e < requestInfos.length;
                                      e++
                                    ) {
                                      if (!requestInfos[e].isValid) {
                                        isValid = false;
                                      }
                                    }
                                  } else {
                                    isValid = false;
                                  }
                                  // check for transaction in last 6 months
                                  var base_date = new Date(file_date);
                                  var old_date = await subMonths(base_date, 6);
                                  base_date = new Date(
                                    new Date(file_date).setHours(23, 59, 59)
                                  );
                                  var trans = await db.UploadDatas.findAll({
                                    where: {
                                      pan: pan,
                                      is_share_changed: true,
                                      current_benpos_date: {
                                        [Op.between]: [old_date, base_date],
                                      },
                                    },
                                    order: [["current_benpos_date", "DESC"]],
                                  });
                                  if (trans.length > 0) {
                                    isValid = false;
                                  }
                                  // check if transaction done in window closure period
                                  var compData = await db.Company.findAll();
                                  var window_close_from = new Date(
                                    new Date(
                                      compData[0].window_close_from
                                    ).setHours(00, 00, 00)
                                  );
                                  var window_close_to = new Date(
                                    new Date(
                                      compData[0].window_close_to
                                    ).setHours(23, 59, 59)
                                  );
                                  base_date = new Date(
                                    new Date(file_date).setHours(00, 00, 00)
                                  );
                                  if (
                                    window_close_from.getTime() <=
                                      base_date.getTime() &&
                                    base_date.getTime() <=
                                      window_close_to.getTime()
                                  ) {
                                    isValid = false;
                                  }
                                  // fetch the last date when share changed
                                  var last_share_change_date = null;
                                  var lastTransInfo =
                                    await db.UploadDatas.findAll({
                                      where: {
                                        pan: pan,
                                        is_share_changed: true,
                                      },
                                      order: [["current_benpos_date", "DESC"]],
                                    });
                                  if (lastTransInfo.length > 0) {
                                    last_share_change_date =
                                      lastTransInfo[0].current_benpos_date;
                                  }
                                  // add folio info
                                  var newFolioInfo1 = await db.Folios.create(
                                    newData,
                                    { transaction: t }
                                  );
                                  // add upload data record
                                  var newUploadData = {
                                    previous_share: previous_share_4,
                                    pan: pan,
                                    current_share: share_4,
                                    total_share: total_share,
                                    current_benpos_date: file_date,
                                    is_share_changed: is_total_share_changed,
                                    is_valid: isValid,
                                    transaction_folio: folio_4,
                                    last_share_change_date:
                                      last_share_change_date,
                                    previous_total_share: previous_total_share,
                                  };
                                  var newFolioInfo1 =
                                    await db.UploadDatas.create(newUploadData, {
                                      transaction: t,
                                    });
                                  if (!isValid) {
                                    validFlag = isValid;
                                  }
                                  newUploadDataId.push(newFolioInfo1.id);
                                  var variationData = newUploadData;
                                  variationData["name"] = empData[0].name;
                                  variationData["email"] = empData[0].email;
                                  variationData["previous_total_share"] =
                                    previous_total_share;
                                  variationDatas.push(variationData);
                                }
                                console.error(
                                  "validFlag folio 4 = ",
                                  validFlag
                                );
                              }
                              if ("FOLIO_NO_5" in record) {
                                folio_5 = record.FOLIO_NO_5;
                                folio_5 = folio_5.toString();
                                if ("SHARES_5" in record) {
                                  share_5 = record.SHARES_5;
                                }
                                var folioResp = await isFolioExists(
                                  pan,
                                  folio_5,
                                  share_5
                                );
                                var exist = folioResp[0];
                                var newData = folioResp[1];
                                console.error("exist = ", exist);
                                var previous_share_5 = 0;
                                // console.error("newData = ",newData)
                                if (exist) {
                                  console.log("FOLIO EXISTS");
                                  previous_share_5 = newData.current_share;
                                  // update current share
                                  if (newData.current_share != share_5) {
                                    console.log("share changed in folio 5");
                                    var reqResp = await isValidRequestExists(
                                      pan,
                                      newData,
                                      file_date,
                                      share_5
                                    );
                                    var reqExists = reqResp[0];
                                    var requestInfos = reqResp[1];
                                    var isValid = true;
                                    if (reqExists) {
                                      console.log("VALIS REQ EXISTS");
                                      console.log(
                                        "requestInfos = ",
                                        requestInfos
                                      );
                                      for (
                                        var e = 0;
                                        e < requestInfos.length;
                                        e++
                                      ) {
                                        if (!requestInfos[e].isValid) {
                                          isValid = false;
                                        }
                                      }
                                    } else {
                                      isValid = false;
                                    }
                                    // check for transaction in last 6 months
                                    var base_date = new Date(file_date);
                                    var old_date = await subMonths(
                                      base_date,
                                      6
                                    );
                                    base_date = new Date(
                                      new Date(file_date).setHours(23, 59, 59)
                                    );
                                    var trans = await db.UploadDatas.findAll({
                                      where: {
                                        pan: pan,
                                        is_share_changed: true,
                                        current_benpos_date: {
                                          [Op.between]: [old_date, base_date],
                                        },
                                      },
                                      order: [["current_benpos_date", "DESC"]],
                                    });
                                    if (trans.length > 0) {
                                      isValid = false;
                                    }
                                    // check if transaction done in window closure period
                                    var compData = await db.Company.findAll();
                                    var window_close_from = new Date(
                                      new Date(
                                        compData[0].window_close_from
                                      ).setHours(00, 00, 00)
                                    );
                                    var window_close_to = new Date(
                                      new Date(
                                        compData[0].window_close_to
                                      ).setHours(23, 59, 59)
                                    );
                                    base_date = new Date(
                                      new Date(file_date).setHours(00, 00, 00)
                                    );
                                    if (
                                      window_close_from.getTime() <=
                                        base_date.getTime() &&
                                      base_date.getTime() <=
                                        window_close_to.getTime()
                                    ) {
                                      isValid = false;
                                    }
                                    // fetch the last date when share changed
                                    var last_share_change_date = null;
                                    var lastTransInfo =
                                      await db.UploadDatas.findAll({
                                        where: {
                                          pan: pan,
                                          is_share_changed: true,
                                        },
                                        order: [
                                          ["current_benpos_date", "DESC"],
                                        ],
                                      });
                                    if (lastTransInfo.length > 0) {
                                      last_share_change_date =
                                        lastTransInfo[0].current_benpos_date;
                                    }
                                    // add upload data record
                                    var newUploadData = {
                                      previous_share: previous_share_5,
                                      pan: pan,
                                      current_share: share_5,
                                      total_share: total_share,
                                      current_benpos_date: file_date,
                                      is_share_changed: is_total_share_changed,
                                      is_valid: isValid,
                                      transaction_folio: folio_5,
                                      last_share_change_date:
                                        last_share_change_date,
                                      previous_total_share:
                                        previous_total_share,
                                    };
                                    var newFolioInfo1 =
                                      await db.UploadDatas.create(
                                        newUploadData,
                                        { transaction: t }
                                      );
                                    if (!isValid) {
                                      validFlag = isValid;
                                    }
                                    newUploadDataId.push(newFolioInfo1.id);
                                    var variationData = newUploadData;
                                    variationData["name"] = empData[0].name;
                                    variationData["email"] = empData[0].email;
                                    variationData["previous_total_share"] =
                                      previous_total_share;
                                    variationDatas.push(variationData);
                                    // add upload data id to request
                                    for (
                                      var f = 0;
                                      f < requestInfos.length;
                                      f++
                                    ) {
                                      // updatedDataId.push({data_id: newFolioInfo1.id,reqId: requestInfos[f].reqId,
                                      //     previous_total_share: previous_total_share})
                                      var updatedDataInfo =
                                        await db.Requests.update(
                                          {
                                            data_id: newFolioInfo1.id,
                                            previous_total_share:
                                              previous_total_share,
                                          },
                                          {
                                            where: {
                                              id: requestInfos[f].reqId,
                                            },
                                            transaction: t,
                                          }
                                        );
                                    }
                                    // change current share in Folio table
                                    var updatedFolioInfo1 =
                                      await db.Folios.update(
                                        { current_share: share_5 },
                                        {
                                          where: {
                                            folio: folio_5,
                                          },
                                          transaction: t,
                                        }
                                      );
                                  } else {
                                    // fetch the last date when share changed
                                    var last_share_change_date = null;
                                    var lastTransInfo =
                                      await db.UploadDatas.findAll({
                                        where: {
                                          pan: pan,
                                          is_share_changed: true,
                                        },
                                        order: [
                                          ["current_benpos_date", "DESC"],
                                        ],
                                      });
                                    if (lastTransInfo.length > 0) {
                                      last_share_change_date =
                                        lastTransInfo[0].current_benpos_date;
                                    }
                                    // add upload data record
                                    var isValid = true;
                                    var newUploadData = {
                                      previous_share: previous_share_5,
                                      pan: pan,
                                      current_share: share_5,
                                      total_share: total_share,
                                      current_benpos_date: file_date,
                                      is_share_changed: is_total_share_changed,
                                      is_valid: isValid,
                                      transaction_folio: folio_5,
                                      last_share_change_date:
                                        last_share_change_date,
                                      previous_total_share:
                                        previous_total_share,
                                    };
                                    var newFolioInfo1 =
                                      await db.UploadDatas.create(
                                        newUploadData,
                                        { transaction: t }
                                      );
                                    if (!isValid) {
                                      validFlag = isValid;
                                    }
                                    newUploadDataId.push(newFolioInfo1.id);
                                  }
                                } else {
                                  // check if change have a valid request
                                  var reqResp = await isValidRequestExists(
                                    pan,
                                    newData,
                                    file_date,
                                    share_5
                                  );
                                  var reqExists = reqResp[0];
                                  var requestInfos = reqResp[1];
                                  var isValid = true;
                                  if (reqExists) {
                                    console.log("VALIS REQ EXISTS");
                                    console.log(
                                      "requestInfos = ",
                                      requestInfos
                                    );
                                    for (
                                      var e = 0;
                                      e < requestInfos.length;
                                      e++
                                    ) {
                                      if (!requestInfos[e].isValid) {
                                        isValid = false;
                                      }
                                    }
                                  } else {
                                    isValid = false;
                                  }
                                  // check for transaction in last 6 months
                                  var base_date = new Date(file_date);
                                  var old_date = await subMonths(base_date, 6);
                                  base_date = new Date(
                                    new Date(file_date).setHours(23, 59, 59)
                                  );
                                  var trans = await db.UploadDatas.findAll({
                                    where: {
                                      pan: pan,
                                      is_share_changed: true,
                                      current_benpos_date: {
                                        [Op.between]: [old_date, base_date],
                                      },
                                    },
                                    order: [["current_benpos_date", "DESC"]],
                                  });
                                  if (trans.length > 0) {
                                    isValid = false;
                                  }
                                  // check if transaction done in window closure period
                                  var compData = await db.Company.findAll();
                                  var window_close_from = new Date(
                                    new Date(
                                      compData[0].window_close_from
                                    ).setHours(00, 00, 00)
                                  );
                                  var window_close_to = new Date(
                                    new Date(
                                      compData[0].window_close_to
                                    ).setHours(23, 59, 59)
                                  );
                                  base_date = new Date(
                                    new Date(file_date).setHours(00, 00, 00)
                                  );
                                  if (
                                    window_close_from.getTime() <=
                                      base_date.getTime() &&
                                    base_date.getTime() <=
                                      window_close_to.getTime()
                                  ) {
                                    isValid = false;
                                  }
                                  // fetch the last date when share changed
                                  var last_share_change_date = null;
                                  var lastTransInfo =
                                    await db.UploadDatas.findAll({
                                      where: {
                                        pan: pan,
                                        is_share_changed: true,
                                      },
                                      order: [["current_benpos_date", "DESC"]],
                                    });
                                  if (lastTransInfo.length > 0) {
                                    last_share_change_date =
                                      lastTransInfo[0].current_benpos_date;
                                  }
                                  // add folio info
                                  var newFolioInfo1 = await db.Folios.create(
                                    newData,
                                    { transaction: t }
                                  );
                                  // add upload data record
                                  var newUploadData = {
                                    previous_share: previous_share_5,
                                    pan: pan,
                                    current_share: share_5,
                                    total_share: total_share,
                                    current_benpos_date: file_date,
                                    is_share_changed: is_total_share_changed,
                                    is_valid: isValid,
                                    transaction_folio: folio_5,
                                    last_share_change_date:
                                      last_share_change_date,
                                    previous_total_share: previous_total_share,
                                  };
                                  var newFolioInfo1 =
                                    await db.UploadDatas.create(newUploadData, {
                                      transaction: t,
                                    });
                                  if (!isValid) {
                                    validFlag = isValid;
                                  }
                                  newUploadDataId.push(newFolioInfo1.id);
                                  var variationData = newUploadData;
                                  variationData["name"] = empData[0].name;
                                  variationData["email"] = empData[0].email;
                                  variationData["previous_total_share"] =
                                    previous_total_share;
                                  variationDatas.push(variationData);
                                }
                                console.error(
                                  "validFlag folio 5 = ",
                                  validFlag
                                );
                              }
                              // update valid flag if any folio transaction is invalid
                              console.error("validFlag final = ", validFlag);
                              if (!validFlag) {
                                console.error(
                                  "newUploadDataId= ",
                                  newUploadDataId
                                );
                                for (
                                  var x = 0;
                                  x < newUploadDataId.length;
                                  x++
                                ) {
                                  // updatedUploadDatas.push({udId: newUploadDataId[x],validFlag: validFlag})
                                  var updatedUploadDataInfo1 =
                                    await db.UploadDatas.update(
                                      { is_valid: validFlag },
                                      {
                                        where: {
                                          id: newUploadDataId[x],
                                        },
                                        transaction: t,
                                      }
                                    );
                                }
                              }
                              newUploadDataId.push(newFolioInfo1.id);
                              // updateion for changed total share
                              var updateTotalShare = await db.Employees.update(
                                {
                                  last_benpos_date: file_date,
                                  total_share: total_share,
                                },
                                {
                                  where: {
                                    pan: pan,
                                    is_active: true,
                                  },
                                  transaction: t,
                                }
                              );
                              var updateTotalShare = await db.Relatives.update(
                                {
                                  last_benpos_date: file_date,
                                  total_share: total_share,
                                },
                                {
                                  where: {
                                    pan: pan,
                                    is_active: true,
                                  },
                                  transaction: t,
                                }
                              );
                            }
                          } catch (error) {
                            console.error(
                              "error while updating transaction info in loop:: ",
                              error
                            );
                            errorList.push({
                              user: record.NAME,
                              message:
                                "error while updating benpose of user(" +
                                record.NAME +
                                ") pan(" +
                                record.FPAN_NO +
                                "):: " +
                                error,
                            });
                            throw error;
                          }
                        }
                        return true;
                      } catch (error) {
                        console.error(
                          "error while updating transaction info:: ",
                          error
                        );
                        throw error;
                      }
                    });
                    // console.log("updatedDataId = ",updatedDataId)
                    // for(var f=0;f<updatedDataId.length;f++){
                    //     var newFolioInfo1 = await db.Requests.update({data_id: updatedDataId[f].data_id,previous_total_share: updatedDataId[f].previous_total_share},{
                    //         where:{
                    //             id: updatedDataId[f].reqId
                    //         }
                    //     })
                    // }
                    // console.log("updatedUploadDatas = ",updatedUploadDatas)
                    // for(var x1=0;x1<updatedUploadDatas.length;x1++){
                    //     var data = updatedUploadDatas[x1]
                    //     var updatedUploadDataInfo1 = await db.UploadDatas.update({is_valid: data.validFlag},{
                    //         where:{
                    //             id: data.udId
                    //         }
                    //     })
                    // }
                    var activityData = { activityId: activity_id };
                    activity_id = await trackActivity(activityData, db);
                    var fileObs = req.files.weeklyData;
                    // delete temp created files
                    for (var f = 0; f < fileObs.length; f++) {
                      var temp = fileObs[f];
                      try {
                        fs.unlinkSync(temp.path);
                        console.log("File is deleted.");
                      } catch (error) {
                        console.log(error);
                      }
                    }
                    res.status(200).json({
                      data: await encryptData(
                        JSON.stringify({
                          message: "weeklyData uploaded successfully",
                          errorList: errorList,
                          variationDatas: variationDatas,
                        })
                      ),
                    });
                    // res.status(200).json({'message':"weeklyData uploaded", "errorList": errorList, "variationDatas":variationDatas})
                  }
                } catch (error) {
                  console.error("error in weeklyData insert", error);
                  throw error;
                }
                // }
              } catch (error) {
                console.error("Error in weeklyData upload and read", error);
                throw error;
              }
            } else {
              console.error("NO weeklyData Excel");
            }
          } catch (error) {
            console.error("Error in weeklyData processing");
            res.status(500).json({
              errorList: errorList,
              message: "cann't upload weeklyData:: " + error,
            });
          }
        }
      );
    } catch (error) {
      console.error("Error in weeklyData addition");
      res.status(500).json({
        errorList: errorList,
        message: "cann't add weeklyData:: " + error,
      });
    }
  });
};
