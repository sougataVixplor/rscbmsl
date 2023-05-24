var sequelize = require("sequelize");
const Op = sequelize.Op;
var pattern = /(\d{2})\/(\d{2})\/(\d{4})/;
const pattern1 = /(\d{2})\-(\d{2})\-(\d{4})/;
const sentMail = require("../util/SentMail");
const localUpload = require("../util/storageLocal").upload;
const localgetPublicUrl = require("../util/storageLocal").getPublicUrl;
const decryptData = require("../util/common").decryptData;
const encryptData = require("../util/common").encryptData;
const encryptCredentials = require("../util/common").encryptCredentials;
const decryptCredentials = require("../util/common").decryptCredentials;
const getPdf = require("../util/common").getPdf;
const fs = require("fs");
const createConversation = require("../util/common").createConversation;
const queryBuilder = require("../util/common").queryBuilder;
const config = require("../config/config");
const env = process.env.NODE_ENV || "development";
const extractName = require("../util/common").extractName;

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

  async function getNames(mailIds) {
    try {
      var names = "";
      for (i = 0; i < mailIds.length; i++) {
        var data = await db.Employees.findOne({
          where: {
            email: mailIds[i],
          },
        });
        if (data) {
          names = names + data.name + "(" + data.pan + ")" + ",";
        } else {
          names = names + mailIds[i] + "(NOPAN),";
        }
      }
      names = names.substring(0, names.length - 1);
      return names;
    } catch (err) {
      throw err;
    }
  }

  app.post("/upsi", async (req, res) => {
    try {
      let sent_failed_mail_id = "";
      var out = await localUpload.fields([{ name: "attachment", maxCount: 1 }])(
        req,
        res,
        async function (err) {
          try {
            if (err) {
              throw err;
            } else {
              // Check if attachment uploaded or not if yes then store it's path
              let url = null;
              if (req.files["attachment"] && req.files["attachment"][0]) {
                url = await localgetPublicUrl(
                  req.files["attachment"][0].filename
                    ? req.files["attachment"][0].filename
                    : req.files["attachment"][0].key
                    ? req.files["attachment"][0].key
                    : req.files["attachment"][0].originalname
                );
              }

              // Decrypt JSON.parse(req.body.data).data
              let decryptedData = JSON.parse(
                await decryptData(JSON.parse(req.body.data).data)
              );

              // Get shared_by and shared_with

              let shared_by = decryptedData.shared_by;
              let shared_with = decryptedData.shared_with;

              let shared_by_info = await getNames(shared_by);

              let emp = await db.Employees.findByPk(req.user.userPAN);

              //Sent UPSI
              let subject =
                decryptedData?.subject || "Disclaimer for UPSI Share";

              let information = decryptedData?.information || "";

              let disclaimer = null;

              if (req.user.is_compliance) {
                disclaimer = "Dear Insider,\n\n";
                disclaimer = disclaimer + "\n" + information + "\n\n";
                disclaimer = disclaimer + "Yours faithfully,\n" + emp.name;
              } else {
                disclaimer = "Dear Insider,\n\n";
                disclaimer = disclaimer + "\n" + information + "\n\n";
                disclaimer =
                  disclaimer +
                  "Yours faithfully,\n" +
                  emp.name +
                  "\n" +
                  emp.designation;
              }

              let attachmentFile = [];

              if (url) {
                let fileName = extractName(url);
                attachmentFile.push({
                  filename: fileName[0] + "." + fileName[1],
                  path: url,
                });
              }

              const transactionresult = await db.sequelize.transaction(
                async (transaction) => {
                  let UPSILogsData = await db.UPSILogs.create(
                    {
                      ...decryptedData,
                      shared_by: shared_by_info,
                      shared_with: "",
                      subject: subject,
                      information: information,
                    },
                    { transaction: transaction }
                  );

                  let errorId = [];
                  let shared_with_success = [];

                  for (let x = 0; x < shared_with.length; x++) {
                    let query = {
                      email: shared_with[x],
                      upsi_id: UPSILogsData.id,
                      sender_id: req.user.userPAN,
                      type: "receive",
                    };

                    let conversationurl =
                      config[env].frontendUrl +
                      "/login?query=" +
                      encodeURIComponent(
                        await encryptData(JSON.stringify(query))
                      );

                    let extra =
                      "\n" +
                      conversationurl +
                      "\nClick on the above link to start coversation for this UPSI (Registered user only)\n\n";

                    let mailRes = await sentMail.sentMail({
                      to: shared_with[x],
                      subject: subject,
                      text: disclaimer + extra,
                      attachments: attachmentFile,
                    });

                    if (mailRes.status !== 200) {
                      if (sent_failed_mail_id === "") {
                        sent_failed_mail_id += shared_with[x];
                      } else {
                        sent_failed_mail_id += "," + shared_with[x];
                        let err_emp = await db.Employees.findOne({
                          where: { email: shared_with[x] },
                          transaction: transaction,
                        });
                        errorId.push(err_emp.pan);
                      }
                    } else {
                      shared_with_success.push(shared_with[x]);
                    }
                  }

                  let shared_with_info = await getNames(shared_with_success);

                  // Update UPSI log with shared_with_success
                  await db.UPSILogs.update(
                    {
                      shared_with: shared_with_info,
                    },
                    { where: { id: UPSILogsData.id }, transaction: transaction }
                  );

                  await createConversation(UPSILogsData, transaction, errorId);

                  if (url) {
                    fs.unlinkSync(url);
                  }
                }
              );

              let success_message = "UPSI sent successfully";

              if (sent_failed_mail_id !== "") {
                success_message += " except " + sent_failed_mail_id;
              }

              console.log("UPSI sent except : ", sent_failed_mail_id);
              res.status(200).json({
                message: success_message,
              });
            }
          } catch (err) {
            console.log(err);
            res.status(500).json({ message: err.message });
          }
        }
      );
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/upsiA", async (req, res) => {
    try {
      var out = await localUpload.fields([{ name: "attachment", maxCount: 1 }])(
        req,
        res,
        async function (err) {
          try {
            if (err) {
              console.log(err);
              throw err;
            } else {
              url = null;
              attachmentFile = [];
              if (req.files["attachment"] && req.files["attachment"][0]) {
                url = await localgetPublicUrl(
                  req.files["attachment"][0].filename
                    ? req.files["attachment"][0].filename
                    : req.files["attachment"][0].key
                    ? req.files["attachment"][0].key
                    : req.files["attachment"][0].originalname
                );
              }

              // console.log(JSON.parse(req.body.data).data);
              decryptedData = await decryptData(JSON.parse(req.body.data).data);
              req.body.data = JSON.parse(decryptedData);
              // console.log(req.body);
              // req.body.data = JSON.parse(req.body.data);
              // console.log(req.body.data);
              var shared_by = req.body.data.shared_by;
              var shared_with = req.body.data.shared_with;
              var shared_by_info = await getNames(shared_by);
              // for(k=0;k<shared_by.length;k++){
              //     shared_by_info += shared_by[k]+","
              // }
              // shared_by_info = shared_by_info.substring(0,shared_by_info.length-1)
              var shared_with_info = await getNames(shared_with);
              // for(j=0;j<shared_with.length;j++){
              //     shared_with_info += shared_with[j]+","
              // }
              // shared_with_info = shared_with_info.substring(0,shared_with_info.length-1)
              // console.error("shared_by_info = ",shared_by_info)
              // console.error("shared_with_info = ",shared_with_info)
              req.body.data.shared_by = shared_by_info;
              req.body.data.shared_with = shared_with_info;
              var information = req.body.data.information || "";
              var subject = "Disclaimer for UPSI Share";
              if ("subject" in req.body.data) {
                if (
                  req.body.data.subject != "" ||
                  req.body.data.subject != " "
                ) {
                  subject = req.body.data.subject;
                }
              }
              req.body.data.subject = subject;
              const result = await db.sequelize.transaction(async (t) => {
                var nowDate = new Date();
                var coData = await db.Employees.findOne({
                  where: {
                    is_active: true,
                    is_compliance: true,
                  },
                  transaction: t,
                });
                // var companyData = await db.Company.findOne({
                //     where:{
                //         id: req.user.companyId
                //     }
                // })
                // add UPSI Log
                const UPSILogsData = await db.UPSILogs.create(req.body.data, {
                  transaction: t,
                });
                const emp = await db.Employees.findByPk(req.user.userPAN, {
                  transaction: t,
                });
                await createConversation(UPSILogsData, t);
                // const designation = req.user.is_compliance
                //   ? "Compliance Officer"
                //   : "Insider";
                var Disclaimer = null;
                if (req.user.is_compliance) {
                  var Disclaimer = "Dear Insider,\n\n";
                  // Disclaimer = Disclaimer+"The UPSI is shared with you on a need-to-know basis.You should maintain the confidentiality of all the Price-Sensitive Information and should not pass on such information to any person directly or indirectly, by way of making a recommendation for the purchase or sale of securities relating to "+companyData.name+".\n"
                  Disclaimer = Disclaimer + "\n" + information + "\n\n";
                  Disclaimer = Disclaimer + "Yours faithfully,\n" + emp.name;
                } else {
                  var Disclaimer = "Dear Insider,\n\n";
                  // Disclaimer = Disclaimer+"The UPSI is shared with you on a need-to-know basis.You should maintain the confidentiality of all the Price-Sensitive Information and should not pass on such information to any person directly or indirectly, by way of making a recommendation for the purchase or sale of securities relating to "+companyData.name+".\n"
                  Disclaimer = Disclaimer + "\n" + information + "\n\n";
                  Disclaimer =
                    Disclaimer +
                    "Yours faithfully,\n" +
                    emp.name +
                    "\n" +
                    emp.designation;
                }
                // shared_by = shared_by.split(",")
                // shared_with = shared_with.split(",")

                // sending mail
                var mailresponses = [];
                if (url) {
                  doc = await getPdf(url);
                  var fileName = extractName(url);
                  attachmentFile.push({
                    filename: fileName[0] + "." + fileName[1],
                    path: url,
                  });
                }

                for (x = 0; x < shared_with.length; x++) {
                  var query = {
                    email: shared_with[x],
                    upsi_id: UPSILogsData.id,
                    sender_id: req.user.userPAN,
                    type: "receive",
                  };
                  var conversationurl =
                    config[env].frontendUrl +
                    "/login?query=" +
                    encodeURIComponent(
                      await encryptData(JSON.stringify(query))
                    );

                  var extra =
                    "\n" +
                    conversationurl +
                    "\nClick on the above link to start coversation for this UPSI (Registered user only)\n\n";
                  console.log("subject", subject);
                  var mailRes = await sentMail.sentMail({
                    to: shared_with[x],
                    subject: subject,
                    text: Disclaimer + extra,
                    attachments: attachmentFile,
                  });
                  mailresponses.push(mailRes);
                }
                if (url) {
                  fs.unlinkSync(url);
                }
                res.status(200).json({
                  message: "UPSI Shared successfully",
                  mailresponses: mailresponses,
                });
              });
            }
          } catch (err) {
            console.log(err);
            res.status(500).json({ message: "Error to create user" });
          }
        }
      );
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Error to create user" });
    }
  });

  app.get("/upsi", async (req, res) => {
    console.error("req user", req.user);
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
      var UPSILogsData = [];
      if (req.user.is_compliance) {
        UPSILogsData = await db.UPSILogs.findAll({
          where: {
            createdAt: { [Op.between]: [fromDate, toDate] },
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
        });
      }
      res
        .status(200)
        .json({ message: "UPSI fetched successfully", data: UPSILogsData });
    } catch (error) {
      console.error("upsi info fetch error", error);
      res.status(500).json({ message: "upsi info fetch error:: " + error });
    }
  });

  //fetch conversations
  app.get("/conversation", async (req, res) => {
    try {
      var data = { ...req.query };
      var conversation = null;
      if (data.type === "log") {
        conversation = await db.Conversations.findAll({
          where: {
            upsi_id: data.upsi_id,
            status: "conversation",
          },
          order: [["createdAt", "ASC"]],
          attributes: [
            "id",
            "createdAt",
            "upsi_id",
            "sender_id",
            "receiver_id",
          ],
          include: [
            {
              model: db.Employees,
              as: "Sender",
              attributes: ["pan", "name"],
            },
            {
              model: db.Employees,
              as: "Receiver",
              attributes: ["pan", "name"],
            },
          ],
        });
      } else {
        const sender_id = data.sender_id;
        const receiver_id = data.receiver_id;
        delete data.sender_id;
        delete data.receiver_id;
        conversation = await db.Conversations.findAll({
          where: {
            ...data,
            [sequelize.Op.or]: [
              {
                [sequelize.Op.and]: [
                  { sender_id: sender_id },
                  { receiver_id: receiver_id },
                ],
              },
              {
                [sequelize.Op.and]: [
                  { sender_id: receiver_id },
                  { receiver_id: sender_id },
                ],
              },
            ],
          },
          attributes: [
            "id",
            "information",
            "createdAt",
            "upsi_id",
            "sender_id",
            "receiver_id",
          ],
          include: {
            model: db.Employees,
            as: "Sender",
            attributes: ["pan", "name"],
          },
        });
      }
      console.log("Conversation fetched successfully");
      res.status(200).json({
        message: "Conversation fetched successfully",
        data: conversation,
      });
    } catch (err) {
      console.log("Error to fetch conversations", err);
      res
        .status(500)
        .json({ message: "Error to fetch conversations : " + err });
    }
  });

  app.post("/conversation", async (req, res) => {
    var out = await localUpload.fields([{ name: "attachment", maxCount: 1 }])(
      req,
      res,
      async function (err) {
        try {
          if (err) {
            console.log(err);
            throw "Unexpected error occured";
          } else {
            var data = {
              information: await decryptData(req.body.information),
              upsi_id: parseInt(await decryptData(req.body.upsi_id)),
              sender_id: await decryptData(req.body.sender_id),
              receiver_id: await decryptData(req.body.receiver_id),
              status: "conversation",
              attachmentUrl: null,
            };
            var url = "";
            if (req.files["attachment"] && req.files["attachment"][0]) {
              url = await localgetPublicUrl(
                req.files["attachment"][0].filename
                  ? req.files["attachment"][0].filename
                  : req.files["attachment"][0].key
                  ? req.files["attachment"][0].key
                  : req.files["attachment"][0].originalname
              );
            }
            const upsi = await db.UPSILogs.findByPk(data.upsi_id);
            const send_by = await db.Employees.findByPk(data.sender_id);
            const send_to = await db.Employees.findByPk(data.receiver_id);
            const attachmentFile = [];
            if (url) {
              var fileName = extractName(url);
              attachmentFile.push({
                filename: fileName[0] + "." + fileName[1],
                path: url,
              });
            }
            console.log(req.user);
            console.log(upsi);
            var query = {
              email: send_to.email,
              upsi_id: upsi.id,
              type: req.user.userPAN == upsi.sender_id ? "receive" : "send",
              sender_id: req.user.userPAN,
            };
            var conversationurl =
              config[env].frontendUrl +
              "/login?query=" +
              encodeURIComponent(await encryptData(JSON.stringify(query)));
            var extra =
              "\n" +
              conversationurl +
              "\nClick on the above link to start coversation for this UPSI\n\n";
            var mailRes = await sentMail.sentMail({
              to: send_to.email,
              mailId: send_by.email,
              subject: upsi.subject,
              text: data.information + extra,
              attachments: attachmentFile,
            });
            if (mailRes.status == 500) {
              throw "Error to sent mail";
            }
            if (url) fs.unlinkSync(url);
            var con = await db.Conversations.create(data);
            res.status(200).json({
              message: "Conversation created successfully",
              id: con.id,
            });
          }
        } catch (err) {
          console.log(err);
          res.status(500).json({ message: "Error occured " + err });
        }
      }
    );
  });
};
