const { getAnnexure7And8 } = require("../util/pdfGeneration");
const ReadableStreamClone = require("readable-stream-clone");
var pattern = /(\d{2})\/(\d{2})\/(\d{4})/;
const pattern1 = /(\d{2})\-(\d{2})\-(\d{4})/;

const pdfGeneration = require("../util/pdfGeneration");
const { getAnnexure1And2 } = require("../util/pdfGeneration");
const trackActivity = require("../util/activityTrack").trackActivity;
const { getAnnexure3 } = require("../util/pdfGeneration");
const { getDateString } = require("../util/common");
const decryptData = require("../util/common").decryptData;
const encryptData = require("../util/common").encryptData;
const encryptCredentials = require("../util/common").encryptCredentials;
const decryptCredentials = require("../util/common").decryptCredentials;

module.exports = (app, db) => {
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
      console.error("getEmpDetails:: error: ", error);
      throw error;
    }
  }

  app.put("/request/:id/complete", async (req, res) => {
    try {
      // data preparation
      decryptedData = await decryptData(req.body.data);
      req.body = JSON.parse(decryptedData);
      var activityData = {
        activity: "Transaction Information Add",
        description: "",
        done_by: [req.user.userId],
        done_for: [req.user.userId],
      };
      var activity_id = await trackActivity(activityData, db);
      var reqData = await db.Requests.findOne({
        where: {
          id: req.params.id,
        },
      });
      var pan = reqData.pan;
      var nowDate = new Date();
      nowDate = new Date(nowDate.setHours(0, 0, 0));
      var date_requested_to = reqData.date_requested_to;
      date_requested_to = new Date(date_requested_to.setHours(0, 0, 0));
      console.error("date_requested_to = ", date_requested_to);
      console.error("nowDate = ", nowDate);
      if (nowDate.getTime() > date_requested_to.getTime()) {
        console.error("Transaction time Expired");
        res.status(400).json({ message: "Transaction time Expired" });
      } else {
        var request_folio = reqData.request_folio;
        console.log("request_folio = ", request_folio);
        var companyData = await db.Folios.findOne({
          include: [
            {
              model: db.Employees,
              include: [
                {
                  model: db.Company,
                },
              ],
            },
          ],
          where: {
            folio: request_folio,
          },
        });
        var company = companyData.Employee.Company.name;
        console.log("company = ", company);
        let dateObj;
        var dateStr = req.body.transaction_date;
        if (dateStr.includes("/") || dateStr.includes("-")) {
          dateObj = await getDate(dateStr);
          dateObj = new Date(dateObj.setHours(00, 00, 00));
        } else {
          throw "Date Format Error";
        }
        var security_type = reqData.security_type;
        var request_type = reqData.request_type;
        var trans_folio = req.body.trans_folio;
        var transaction_price = req.body.transaction_price;
        var transaction_quantity = req.body.transaction_quantity;
        req.body.transaction_date = dateObj;
        var transaction_date = req.body.transaction_date;
        let empData = [];

        // check if transaction done in window closure period
        var compData = await db.Company.findAll();
        var window_close_from = new Date(
          new Date(compData[0].window_close_from).setHours(00, 00, 00)
        );
        var window_close_to = new Date(
          new Date(compData[0].window_close_to).setHours(23, 59, 59)
        );
        base_date = new Date(new Date(transaction_date).setHours(00, 00, 00));
        if (
          window_close_from.getTime() <= base_date.getTime() &&
          base_date.getTime() <= window_close_to.getTime()
        ) {
          throw "Transaction date cannot be in trading window closure period";
        } else {
          empData = await getEmpDetails(pan);
          if (empData.length == 0) {
            empData = await getEmpRelDetails(pan);
            var updatedRel = await db.Relatives.update(
              { security_type: security_type },
              {
                where: {
                  pan: pan,
                  is_active: true,
                },
              }
            );
          } else {
            var updatedEmp = await db.Employees.update(
              { security_type: security_type },
              {
                where: {
                  pan: pan,
                  is_active: true,
                },
              }
            );
          }
          var name = empData[0].name;
          // update transaction information of request
          var updatedReq = await db.Requests.update(req.body, {
            where: {
              id: req.params.id,
            },
          });

          // Pdf creation part
          data = {
            reqId: req.params.id,
            name: name,
            transaction_quantity: transaction_quantity,
            request_type: request_type,
            trans_folio: trans_folio,
            transaction_date: transaction_date,
            transaction_price: transaction_price,
            company: company,
          };
          doc = await pdfGeneration.getAnnexure4(data);

          // const readStream1 = new ReadableStreamClone(doc);
          // const readStream2 = new ReadableStreamClone(doc);

          // var CoData = await getCODetails()
          // // sending mail
          // var mailRes = await sentMail.sentMail({
          //     to: CoData[0].email,
          //     subject: 'Annexure 4',
          //     text: 'Hi, Please find here with attached file',
          //     attachments:[
          //         {
          //             content:readStream2,
          //             filename:'Annexure4.pdf'
          //         }
          //     ]
          // })
          var activityData = { activityId: activity_id };
          activity_id = await trackActivity(activityData, db);
          // console.log("Mail response", mailRes);
          res.setHeader(
            "Content-disposition",
            "attachment; filename=requestComplete-" + req.params.id + ".pdf"
          );
          res.setHeader("Content-type", "application/pdf");
          res.set({ id: req.params.id });
          res.header("Access-Control-Expose-Headers", "id");
          doc.pipe(res);
          // res.status(200).json({'message':'request made successfully'});
        }
      }
    } catch (error) {
      console.error("Error in apply for complete request", error);
      res.status(500).json({ message: "cann't complete request:: " + error });
    }
  });

  app.put("/config", async (req, res) => {
    try {
      var window_close_from_str = req.query.window_close_from;
      var window_close_from_date = await getDate(window_close_from_str);

      var window_close_to_str = req.query.window_close_to;
      var window_close_to_date = await getDate(window_close_to_str);

      var activityData = {
        activity: "Window Closure Period Updated",
        description: "",
        done_by: [req.user.userId],
        done_for: [],
        period:
          (await getDateString(window_close_from_date)) +
          " to " +
          (await getDateString(window_close_to_date)),
      };
      var activity_id = await trackActivity(activityData, db);
      const companyData = await db.Company.findAll();
      companyId = companyData[0].id;
      console.error("req.body = ", req.body);
      if ("purpose" in req.body) {
        req.query["purpose"] = req.body.purpose;
      }
      console.error("req.query = ", req.query);
      // update Company info
      const newcompanyData = await db.Company.update(req.query, {
        where: {
          id: companyId,
        },
      });
      console.error("newcompanyData = ", newcompanyData);
      if (newcompanyData[0] > 0) {
        // // mail the updated close period to all Employee
        // var emps = await db.Employees.findAll({
        //     where:{
        //         is_active: true,
        //         is_compliance: false
        //     },
        //     include:[{model:db.Company}]
        // })
        // var mailIds = []
        // for(e=0;e<emps.length;e++){
        //     mailIds.push(emps[e].email)
        // }
        // var coData = await db.Employees.findOne({
        //     where:{
        //         is_active: true,
        //         is_compliance: true
        //     }
        // })
        // // sending mail
        // var subject = "Trading Window closure intimation"
        // var text = "Dear Insider,\n\n"
        // text = text+"In terms of the Company's Policy for Prevention of Insider Trading, pursuant to SEBI (Prohibition of Insider Trading) Regulations, 2015, as amended, the Trading Window will remain closed for all Connected Persons from "+req.query.window_close_from+" until two trading days from the date of declaration of the  financial results of the Company for the quarter and year ending "+window_close_to+" for "+req.body.purpose+". All Connected Persons (including immediate relatives) shall not deal in the securities of the Company during the ‘Prohibited Period’ when the trading window is closed. \n\n\n"
        // text = text+"Yours faithfully,\nfor "+emps.Company.name+"\n"+coData.name+"\nCompliance Officer"
        // console.error("text = ")
        // console.error(text)
        // // var mailRes = await sentMail.sentMail({
        // //     to: mailIds,
        // //     subject: subject,
        // //     text: text
        // // })
        var activityData = { activityId: activity_id };
        activity_id = await trackActivity(activityData, db);
        res.status(200).json({ message: "updation successfull" });
      } else {
        res.status(500).json({ message: "updation not successfull" });
      }
    } catch (error) {
      console.error("request fetch error", error);
      res.status(500).json({ message: "request fetch error:: " + error });
    }
  });

  app.get("/request/:id", (req, res) => {
    db.Requests.findByPk(req.params.id)
      .then(async (data) => {
        console.log("Request fetched");
        res.status(200).json({
          data: await encryptData(
            JSON.stringify({
              message: "Requests fetched",
              data: data,
            })
          ),
        });
        // res.status(200).json({message:"Request fetched", data})
      })
      .catch((err) => {
        console.error("Fetch Request error", err);
        res.status(500).json({ message: "Fetch Request error:: " + err });
      });
  });

  app.get("/requests", (req, res) => {
    console.log("q", req.query);
    db.Requests.findAll({
      include: [
        {
          model: db.Folios,
          include: [
            { model: db.Employees },
            {
              model: db.Relatives,
              include: [{ model: db.Employees }],
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
      .then(async (data) => {
        if (req.query.hasOwnProperty("pan")) {
          db.Requests.findAll({
            include: [
              {
                model: db.Folios,
                include: [
                  {
                    model: db.Employees,
                    where: {
                      pan: req.query.pan,
                    },
                  },
                  {
                    model: db.Relatives,
                  },
                ],
                required: false,
              },
            ],
            required: false,
          })
            .then(async (data1) => {
              data1 = data1.filter((e) => {
                return e.Folio && e.Folio.Relative;
              });
              data = [...data, ...data1];
              res.status(200).json({
                data: await encryptData(
                  JSON.stringify({
                    message: "Requests fetched",
                    data: data,
                  })
                ),
              });
              // res.status(200).json({message:"Requests fetched", data})
            })
            .catch((err) => {
              console.error("Fetch Requests error", err);
              res.status(500).json({ message: "Fetch Request error:: " + err });
            });
        } else {
          console.log("Requests fetched", data);
          res.status(200).json({
            data: await encryptData(
              JSON.stringify({
                message: "Requests fetched",
                data: data,
              })
            ),
          });
          // res.status(200).json({message:"Requests fetched", data})
        }
      })
      .catch((err) => {
        console.error("Fetch Requests error", err);
        res.status(500).json({ message: "Fetch Request error:: " + err });
      });
  });

  app.post("/request/:id/complete", async (req, res) => {
    console.log("request post complete");
    db.Requests.findByPk(req.params.id, {
      include: {
        model: db.Folios,
        include: [
          {
            model: db.Employees,
            where: {
              is_active: true,
            },
            include: {
              model: db.Company,
            },
            required: false,
          },
          {
            model: db.UploadDatas,
          },
        ],
        required: false,
      },
    })
      .then(async (data) => {
        var activityData = {
          activity: "Annexure-7 & Annexure-8 generated",
          description: "",
          done_by: [req.user.userId],
          done_for: [data.Folio.Employee.id],
        };
        var activity_id = await trackActivity(activityData, db);
        var annex7 = await getAnnexure7And8(data);
        console.error("done for = ", data.Folio.Employee.id);
        activityData = {
          activityId: activity_id,
          done_for: [data.Folio.Employee.id],
        };
        activity_id = await trackActivity(activityData, db);
        res.setHeader(
          "Content-disposition",
          "attachment; filename=Annexure7-8.pdf"
        );
        res.set({ id: req.params.id });
        res.header("Access-Control-Expose-Headers", "id");
        annex7.pipe(res);
      })
      .catch((err) => {
        console.error("Db Error", err);
        res.status(500).json({ message: "Db Error:: " + err });
      });
  });

  app.post("/request", async (req, res) => {
    try {
      decryptedData = await decryptData(req.body.data);
      req.body = JSON.parse(decryptedData);
      // data preparation
      var proposed_dealing_from_date_str = req.body.date_requested_from;
      // console.error("proposed_dealing_from_date_str = ",proposed_dealing_from_date_str)
      var proposed_dealing_from_date = await getDate(
        proposed_dealing_from_date_str
      );
      // console.error("proposed_dealing_from_date = ",proposed_dealing_from_date)

      var proposed_dealing_to_date_str = req.body.date_requested_to;
      // console.error("proposed_dealing_to_date_str = ",proposed_dealing_to_date_str)
      var proposed_dealing_to_date = await getDate(
        proposed_dealing_to_date_str
      );
      // console.error("proposed_dealing_to_date = ",proposed_dealing_to_date)

      var activityData = {
        activity: "Pre-transaction Approval Request",
        description: "",
        done_by: [req.user.userId],
        done_for: [],
        period:
          (await getDateString(proposed_dealing_from_date)) +
          " to " +
          (await getDateString(proposed_dealing_to_date)),
      };
      var activity_id = await trackActivity(activityData, db);
      console.log(">>>>>>>>>>>>>>>> requests >>>>>>>>");
      var EmployeeData = await db.Employees.findOne({
        include: [
          {
            model: db.Company,
            include: [
              {
                model: db.Employees,
                where: {
                  is_compliance: true,
                },
                required: false,
              },
            ],
          },
          {
            model: db.Relatives,
            where: {
              is_active: true,
            },
            required: false,
          },
          {
            model: db.Folios,
          },
        ],
        where: {
          id: req.user.userId,
        },
      });
      var FolioData = await db.Folios.findOne({
        where: {
          id: req.body.folio_id,
        },
      });
      var request_type = req.body.request_type;

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
        console.log("category = ", category);
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

      // making entry in DATABASE
      var RequestData = {
        pan: pan,
        request_folio: transaction_folio,
        category: category,
        security_type: security_type,
        mode: mode,
        request_type: request_type,
        date_requested_from: proposed_dealing_from_date,
        date_requested_to: proposed_dealing_to_date,
        request_quantity: proposed_quantity,
        previous_total_share: previous_total_share,
        proposed_price: proposed_price,
        market_price: market_price,
        previous_quantity: prior_quantity,
        request_date: nowDate,
      };
      console.error("request data", RequestData);

      var requestData = await db.Requests.create(RequestData);
      console.log("requestData = ", requestData.id);
      var requestId = requestData.id;
      var reqPDF = await getAnnexure1And2(
        req,
        EmployeeData,
        FolioData,
        db,
        requestId
      );

      // var mailPDF = new ReadableStreamClone(reqPDF);
      var downPDF = new ReadableStreamClone(reqPDF);
      // // sending mail
      // var mailRes = await sentMail.sentMail({
      //     to: EmployeeData.Company.Employees[0].email,
      //     subject: "New Request",
      //     text: "Hi, new request recieved",
      //     attachments:[
      //         {
      //             content:mailPDF,
      //             filename:'Annexure1&2.pdf'
      //         }
      //     ]
      // })

      var activityData = {
        activityId: activity_id,
        done_for: [EmployeeData.id],
      };
      activity_id = await trackActivity(activityData, db);
      res.setHeader(
        "Content-disposition",
        "attachment; filename=newRequest-" + requestId + ".pdf"
      );
      res.setHeader("Content-type", "application/pdf");
      res.set({ id: requestId });
      res.header("Access-Control-Expose-Headers", "id");
      downPDF.pipe(res);
    } catch (error) {
      console.error("Error in apply for request", error);
      res.status(500).json({ message: "cann't request :: " + error });
    }
  });

  async function addDays(baseDate, days) {
    try {
      return new Date(baseDate.setDate(baseDate.getDate() + days));
    } catch (error) {
      console.error("addDays:: error: ", error);
    }
  }

  app.put("/request", async (req, res) => {
    try {
      // data preparation
      let activity_id;
      console.error("req.query = ", req.query);
      if ("reason" in req.body) {
        req.query["reason"] = req.body.reason;
      } else {
        req.query["reason"] = "";
      }
      console.error("req.query = ", req.query);
      console.error("req.id = ", req.query.id);
      console.error("req.status = ", req.query.status);
      var requestId = req.query.id;
      var request_status = req.query.status;

      var requestData = await db.Requests.findOne({
        where: {
          id: requestId,
        },
        include: [
          {
            model: db.Folios,
            include: [
              {
                model: db.Employees,
                include: [
                  {
                    model: db.Company,
                  },
                ],
              },
            ],
          },
        ],
      });

      var EmployeeData = requestData.Folio.Employee;
      var KMP_Name = EmployeeData.name;
      var designation = EmployeeData.designation;
      var company = EmployeeData.Company.name;
      var add = EmployeeData.address;
      var request_quantity = Number(requestData.request_quantity);
      var request_date = requestData.request_date;
      var date_requested_from = new Date();
      var date_requested_from_str = date_requested_from.toString();
      var reason = requestData.reason;
      console.error("date_requested_from_str = ", date_requested_from_str);
      console.error("date_requested_from = ", date_requested_from);

      var date_requested_to = await addDays(new Date(), 7);
      var date_requested_to_str = date_requested_to.toString();
      console.error("date_requested_to_str = ", date_requested_to_str);
      console.error("date_requested_to = ", date_requested_to);

      // Request Data Update
      newRequestData = {};
      if (request_status == "Approved") {
        var activityData = {
          activity: "Pre-transaction Request Approved",
          description: "",
          done_by: [req.user.userId],
          done_for: [requestData.Folio.Employee.id],
        };
        activity_id = await trackActivity(activityData, db);
        newRequestData = {
          date_requested_from: date_requested_from,
          date_requested_to: date_requested_to,
          request_status: request_status,
          approval_date: new Date(),
        };
      } else {
        var activityData = {
          activity: "Pre-transaction Request Rejected",
          description: "",
          done_by: [req.user.userId],
          done_for: [requestData.Folio.Employee.id],
        };
        activity_id = await trackActivity(activityData, db);
        newRequestData = {
          request_status: request_status,
          approval_date: new Date(),
          reason: req.query.reason,
        };
      }
      var newRequestInfo = await db.Requests.update(newRequestData, {
        where: {
          id: requestId,
        },
      });
      console.error("newRequestInfo = ", newRequestInfo);
      if (newRequestInfo[0] == 0) {
        throw "Request Update Error";
      }
      // pdf creation
      data = {
        KMP_Name: KMP_Name,
        designation: designation,
        add: add,
        requestData_id: requestData.id,
        company: company,
        request_status: request_status,
        date_requested_to: date_requested_to,
        request_quantity: request_quantity,
        request_date: request_date,
        reason: req.query.reason,
      };

      var reqPDF = await getAnnexure3(data);
      const readStream1 = new ReadableStreamClone(reqPDF);
      // const readStream2 = new ReadableStreamClone(reqPDF);
      // // sending mail
      // var mailRes = await sentMail.sentMail({
      //     to: EmployeeData.email,
      //     subject: 'Request status update',
      //     text: 'Hi, your request is now ' + request_status,
      //     attachments:[
      //         {
      //             content:readStream2,
      //             filename:'Annexure3.pdf'
      //         }
      //     ]
      // })

      var activityData = { activityId: activity_id };
      activity_id = await trackActivity(activityData, db);
      res.setHeader(
        "Content-disposition",
        "attachment; filename=requestStatust-" + req.query.id + ".pdf"
      );
      res.setHeader("Content-type", "application/pdf");
      res.set({ id: req.query.id });
      res.header("Access-Control-Expose-Headers", "id");
      readStream1.pipe(res);
      // res.status(200).json({message:"Request status updated:",mailTo: [EmployeeData.email]})
    } catch (error) {
      console.error("Error in apply for request approved", error);
      res.status(500).json({ message: "cann't request approved:: " + error });
    }
  });
};
