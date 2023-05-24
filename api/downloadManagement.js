const getConnectedPersons =
  require("../util/pdfGeneration").getConnectedPersons;
const getConnectedPersonsExcel =
  require("../util/excelGeneration").getConnectedPersonsExcel;
const getInsiderExcel = require("../util/excelGeneration").getInsiderExcel;

const fs = require("fs");
var sequelize = require("sequelize");
const compareTransaction = require("../util/common").compareTransaction;
const compareTransactionNew = require("../util/common").compareTransactionNew;
const getCompareTransactionPdf =
  require("../util/pdfGeneration").compareTransactionPdf;
const Op = sequelize.Op;
const getViolationData = require("../util/common").getViolationData;
const getViloationsPdf = require("../util/pdfGeneration").getViloationsPdf;
const getActivityPdf = require("../util/pdfGeneration").getActivityPdf;
const getRequestPdf = require("../util/pdfGeneration").getRequestPdf;
const upsiPDF = require("../util/pdfGeneration").upsiPDF;
var XLSX = require("xlsx");
var Readable = require("stream").Readable;
const handleSearch = require("../util/common").handleSearch;

const pattern = /(\d{2})\/(\d{2})\/(\d{4})/;
const pattern1 = /(\d{2})\-(\d{2})\-(\d{4})/;

module.exports = (app, db) => {
  //Get list of connected persons
  app.get("/insidersPdf", (req, res) => {
    db.Employees.findAll({
      where: {
        is_compliance: false,
        isManagement: false,
        ...req.query,
      },
      order: [["status", "ASC"]],
      include: [
        {
          model: db.Company,
        },
        {
          model: db.Relatives,
          include: [
            {
              model: db.Folios,
            },
          ],
          where: {
            is_active: true,
            status: "Active",
          },
          required: false,
        },
        {
          model: db.Folios,
          where: {
            is_active: true,
            emp_relative_pan: null,
          },
          required: false,
        },
      ],
    })
      .then((data) => {
        console.log("Data fetched successfully");
        getInsiderExcel(data)
          .then(async (doc) => {
            // res.setHeader('Content-disposition', 'attachment; filename=connected persons.pdf');
            // res.setHeader('Content-type', 'application/pdf');
            // console.log('pdf downloaded successfully');
            // doc.pipe(res);
            res.setHeader(
              "Content-Type",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
              "Content-Disposition",
              "attachment; filename=" + "connected persons.xlsx"
            );
            //   console.error("doc:: ",doc)
            var wb = XLSX.utils.book_new(); // create workbook
            //   var ws = XLSX.utils.json_to_sheet(doc);            // convert data to sheet
            XLSX.utils.book_append_sheet(wb, doc, "connected persons"); // add sheet to workbook
            const wbOpts = { bookType: "xlsx", type: "buffer" };
            const resp = XLSX.write(wb, wbOpts); // write workbook buffer
            const stream = await bufferToStream(resp); // convert buffer to stream
            stream.pipe(res);
            //   const wb = XLSX.utils.book_new()
            //   XLSX.utils.book_append_sheet(wb, doc, 'connected persons')
            //   const wb_opts = {bookType: 'xlsx', type: 'binary'};   // workbook options
            //   XLSX.writeFile(wb, "connected persons.xlsx", wb_opts);
            //   const stream = fs.createReadStream("connected persons.xlsx");         // create read stream
            //   try {
            // 	fs.unlinkSync("connected persons.xlsx")
            // 	//file removed
            //   } catch(err) {
            // 	console.error("removing file:: ",err)
            //   }
            //   stream.pipe(res);
            // //   XLSX.writeFile(wb, 'sampleData.export.xlsx')
            //   return XLSX.writeFile(wb,res).then(function () {
            // 	res.status(200).end();
            //   });
          })
          .catch((err) => {
            console.log(err);
            res.status(500).json({ error: err });
          });
      })
      .catch((err) => {
        console.error("Database error:", err);
        res.status(500).json({ error: "Database error" });
      });
  });

  //Get list of connected persons
  app.get("/usersPdf", (req, res) => {
    db.Employees.findAll({
      where: {
        is_compliance: false,
        isManagement: false,
        ...req.query,
      },
      order: [["status", "ASC"]],
      include: [
        {
          model: db.Company,
        },
        {
          model: db.Relatives,
          include: [
            {
              model: db.Folios,
            },
          ],
          where: {
            is_active: true,
            status: "Active",
          },
          required: false,
        },
        {
          model: db.Folios,
          where: {
            is_active: true,
            emp_relative_pan: null,
          },
          required: false,
        },
      ],
    })
      .then((data) => {
        console.log("Data fetched successfully");
        getConnectedPersonsExcel(data)
          .then(async (doc) => {
            // res.setHeader('Content-disposition', 'attachment; filename=connected persons.pdf');
            // res.setHeader('Content-type', 'application/pdf');
            // console.log('pdf downloaded successfully');
            // doc.pipe(res);
            res.setHeader(
              "Content-Type",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
              "Content-Disposition",
              "attachment; filename=" + "connected persons.xlsx"
            );
            //   console.error("doc:: ",doc)
            var wb = XLSX.utils.book_new(); // create workbook
            //   var ws = XLSX.utils.json_to_sheet(doc);            // convert data to sheet
            XLSX.utils.book_append_sheet(wb, doc, "connected persons"); // add sheet to workbook
            const wbOpts = { bookType: "xlsx", type: "buffer" };
            const resp = XLSX.write(wb, wbOpts); // write workbook buffer
            const stream = await bufferToStream(resp); // convert buffer to stream
            stream.pipe(res);
            //   const wb = XLSX.utils.book_new()
            //   XLSX.utils.book_append_sheet(wb, doc, 'connected persons')
            //   const wb_opts = {bookType: 'xlsx', type: 'binary'};   // workbook options
            //   XLSX.writeFile(wb, "connected persons.xlsx", wb_opts);
            //   const stream = fs.createReadStream("connected persons.xlsx");         // create read stream
            //   try {
            // 	fs.unlinkSync("connected persons.xlsx")
            // 	//file removed
            //   } catch(err) {
            // 	console.error("removing file:: ",err)
            //   }
            //   stream.pipe(res);
            // //   XLSX.writeFile(wb, 'sampleData.export.xlsx')
            //   return XLSX.writeFile(wb,res).then(function () {
            // 	res.status(200).end();
            //   });
          })
          .catch((err) => {
            console.log(err);
            res.status(500).json({ error: err });
          });
      })
      .catch((err) => {
        console.error("Database error:", err);
        res.status(500).json({ error: "Database error" });
      });
  });

  //Get pdf of compareTransaction
  app.get("/compareTransactionPdf", async (req, res) => {
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
      var prev_benpos_data = await getBenposData(fromDate, toDate, false);
      var current_benpos_data = await getBenposData(toDate, fromDate);
      var prev_benpos_date = prev_benpos_data.refDate;
      prev_benpos_date = new Date(prev_benpos_date.setHours(0, 0, 0));
      var current_benpos_date = current_benpos_data.refDate;
      current_benpos_date = new Date(current_benpos_date.setHours(0, 0, 0));
      var transactionData = {
        prev_benpos_date: prev_benpos_date,
        prev_benpos_data: prev_benpos_data.data,
        current_benpos_date: current_benpos_date,
        current_benpos_data: current_benpos_data.data,
      };
      // compareTransaction(transactionData)
      compareTransactionNew(transactionData)
        .then((data) => {
          console.log("Transaction Compared successfully");
          getCompareTransactionPdf(
            data,
            transactionData.prev_benpos_date,
            transactionData.current_benpos_date
          )
            .then((doc) => {
              console.log(
                "Transaction Comparison converted to pdf successfully"
              );
              res.setHeader(
                "Content-disposition",
                "attachment; filename=Compare Transaction.pdf"
              );
              res.setHeader("Content-type", "application/pdf");
              doc.pipe(res);
            })
            .catch((err) => {
              console.log(err);
              res
                .status(500)
                .json({
                  message: "error while compare transaction download:: " + err,
                });
            });
        })
        .catch((err) => {
          console.log(err);
          res
            .status(500)
            .json({
              message: "error while compare transaction download:: " + err,
            });
        });
    } catch (error) {
      console.error("transaction fetch error:", error);
      res.status(500).json({ message: "transaction fetch error :: " + error });
    }
  });

  //Get list of violated transactions list as pdf
  app.get("/violationPdf", async (req, res) => {
    try {
      fromDateStr = req.query.startDate;
      toDateStr = req.query.endDate;
      console.log("fromDateStr = ", fromDateStr);
      console.log("toDateStr = ", toDateStr);
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
                  isManagement: false,
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
      getViolationData(transactionData)
        .then((data) => {
          console.log("Get violation data successfully");
          getViloationsPdf(data)
            .then((doc) => {
              console.log("Violation data converted to pdf successfully");
              res.setHeader(
                "Content-disposition",
                "attachment; filename=Violation.pdf"
              );
              res.setHeader("Content-type", "application/pdf");
              doc.pipe(res);
            })
            .catch((err) => {
              console.log(err);
              res
                .status(500)
                .json({ message: "error while Violation download:: " + err });
            });
        })
        .catch((err) => {
          console.log(err);
          res
            .status(500)
            .json({ message: "error while Violation download:: " + err });
        });
    } catch (err) {
      console.log(err);
      res
        .status(500)
        .json({ message: "error while Violation download:: " + err });
    }
  });

  //Get activity log as pdf
  app.get("/activityPdf", async (req, res) => {
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
      var ActivityLogsData = await db.ActivityLogs.findAll({
        where: {
          createdAt: { [Op.between]: [fromDate, toDate] },
        },
      });
      getActivityPdf(ActivityLogsData)
        .then((doc) => {
          console.log("Activity log data converted to pdf successfully");
          res.setHeader(
            "Content-disposition",
            "attachment; filename=Activity Log.pdf"
          );
          res.setHeader("Content-type", "application/pdf");
          doc.pipe(res);
        })
        .catch((err) => {
          console.log(err);
          res
            .status(500)
            .json({ message: "error while activity log download:: " + err });
        });
    } catch (err) {
      console.log(err);
      res
        .status(500)
        .json({ message: "error while activity log download:: " + err });
    }
  });

  //Download Requested Transaction as pdf
  app.get("/requestPdf", (req, res) => {
    db.Requests.findAll({
      include: [
        {
          model: db.Folios,
          include: [
            {
              model: db.Employees,
              where: {
                is_active: true,
                isManagement: false,
              },
            },
          ],
          required: false,
        },
      ],
      where: {
        ...req.query,
      },
      required: false,
    })
      .then((data) => {
        console.log("Requests fetched");
        getRequestPdf(data)
          .then((doc) => {
            console.log("Request data converted to pdf successfully");
            res.setHeader(
              "Content-disposition",
              "attachment; filename=Requests.pdf"
            );
            res.setHeader("Content-type", "application/pdf");
            doc.pipe(res);
          })
          .catch((err) => {
            console.log(err);
            res
              .status(500)
              .json({ message: "error while request download:: " + err });
          });
      })
      .catch((err) => {
        console.error("Fetch Requests error", err);
        res.status(500).json({ message: "Fetch Request error:: " + err });
      });
  });

  // Download UPSI PDF
  app.get("/upsiPDF", async (req, res) => {
    console.error("req user", req.user);
    try {
      fromDateStr = req.query.startDate;
      toDateStr = req.query.endDate;
      const query = req.query.query;
      delete req.query.query;
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
      var UPSILogsData = [];
      var empData = null;
      if (req.user.is_compliance) {
        UPSILogsData = await db.UPSILogs.findAll({
          where: {
            createdAt: { [Op.between]: [fromDate, toDate] },
          },
          include: {
            model: db.Conversations,
            where: { status: "conversation" },
            required: false,
            include: [
              {
                model: db.Employees,
                as: "Sender",
              },
              {
                model: db.Employees,
                as: "Receiver",
              },
            ],
            order: [["createdAt", "ASC"]],
          },
        });
      } else {
        empData = await db.Employees.findOne({
          where: { id: req.user.userId },
        });
        UPSILogsData = await db.UPSILogs.findAll({
          where: {
            [sequelize.Op.and]: [
              { createdAt: { [Op.between]: [fromDate, toDate] } },
              {
                [sequelize.Op.or]: [
                  {
                    shared_by: {
                      [Op.like]: "%" + empData.pan + "%",
                    },
                  },
                  {
                    shared_with: {
                      [Op.like]: "%" + empData.pan + "%",
                    },
                  },
                ],
              },
            ],
          },
          include: {
            model: db.Conversations,
            where: { status: "conversation" },
            required: false,
            include: [
              {
                model: db.Employees,
                as: "Sender",
              },
              {
                model: db.Employees,
                as: "Receiver",
              },
            ],
            order: [["createdAt", "ASC"]],
          },
        });
      }
      var filterData = handleSearch(UPSILogsData, query, [
        "createdAt",
        "shared_by",
        "shared_with",
        "subject",
        "information",
      ]);
      // console.log(filterData, UPSILogsData)
      var doc = await upsiPDF(
        filterData.sort((a, b) =>
          new Date(a.createdAt) > new Date(b.createdAt) ? 1 : -1
        ),
        req.user.is_compliance,
        empData
      );
      doc.pipe(res);
    } catch (error) {
      console.error("upsi info fetch error", error);
      res.status(500).json({ message: "upsi info fetch error:: " + error });
    }
  });

  //Functions------------------------------------------------------------------------

  async function bufferToStream(buffer) {
    var stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    return stream;
  }

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
                  isManagement: false,
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
};
