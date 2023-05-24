const bcrypt = require("bcrypt");
var crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sequelize = require("sequelize");
var XLSX = require("xlsx");
const localUpload = require("../util/storageLocal").upload;
const localgetPublicUrl = require("../util/storageLocal").getPublicUrl;
const trackActivity = require("../util/activityTrack").trackActivity;
const env = process.env.NODE_ENV || "development";
var accessTokenSecret = require("../config/config")[env]["accessTokenSecret"];
var refreshAccessTokenSecret =
  require("../config/config")[env]["refreshAccessTokenSecret"];
var config = require("../config/config")[env];
var expTime = config.expTime;
var backendUrl = config.backendUrl;
var fs = require("fs");
const Op = sequelize.Op;
const { json } = require("body-parser");
var pattern = /(\d{2})\/(\d{2})\/(\d{4})/;
const pattern1 = /(\d{2})\-(\d{2})\-(\d{4})/;
const fetch = require("node-fetch");
const sentMail = require("../util/SentMail").sentMail;
const getAnnexure6 = require("../util/pdfGeneration").getAnnexure6;
const getAnnexure5 = require("../util/pdfGeneration").getAnnexure5;
const getUpdatedText = require("../util/common").getUpdatedText;
const getCredentialsText = require("../util/common").getCredentialsText;
const decryptData = require("../util/common").decryptData;
const encryptData = require("../util/common").encryptData;
const getDummyPan = require("../util/common").getDummyPan;
const updateLoginDetails = require("../util/common").updateLoginDetails;
var PDFDocument = require("pdfkit");
process.env.SECRET_KEY = "secret";

module.exports = (app, db) => {
  async function getRandomPass() {
    try {
      var pass = crypto.randomBytes(4).toString("hex");
      return pass;
    } catch (error) {
      console.error("getRandomPass:: error: ", error);
      throw error;
    }
  }

  app.post("/refreshtoken", (req, res) => {
    db.Employees.findOne({
      where: {
        id: req.user.userId,
      },
    })
      .then((userDetails) => {
        const token = req.body.refreshAccessToken;
        const refreshToken = userDetails.refreshAccessToken;
        if (!token) {
          return res.status(401).json({ message: "Invalid request" });
        }
        if (refreshToken !== token) {
          console.error("Wrong refresh token");
          return res.status(403).json({ message: "unauthorised access" });
        }
        jwt.verify(token, refreshAccessTokenSecret, (err, user) => {
          if (err) {
            return res.status(403).json({ message: "unauthorised access" });
          }
          console.log("Access token info:: ", user);
          const accessToken = jwt.sign(
            {
              userId: userDetails.id,
              companyId: userDetails.company_id,
              userPAN: userDetails.pan,
              is_compliance: userDetails.is_compliance,
            },
            accessTokenSecret,
            { expiresIn: expTime }
          );
          console.log("Access token refreshed");
          res.status(200).json({
            accessToken: accessToken,
          });
        });
      })
      .catch((err) => {
        console.error("Database error", err);
        res.status(500).json({ message: "Database error:: " + err });
      });
  });

  // get user list
  app.get("/users", (req, res) => {
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
      .then(async (usersInfo) => {
        // console.log(">>>>>>>>>>>>>>>>>>>",usersInfo)
        if (usersInfo.length > 0) {
          res.status(200).json({
            data: await encryptData(
              JSON.stringify({
                message: "usersInfo fetched",
                data: usersInfo,
              })
            ),
          });
          // res.status(200).json({'data': usersInfo});
        } else {
          console.error("No user exists:", usersInfo);
          res.status(200).json({
            data: await encryptData(
              JSON.stringify({
                message: "usersInfo fetched",
                data: usersInfo,
              })
            ),
          });
          // res.status(200).json({'data': usersInfo});
        }
      })
      .catch((err) => {
        console.error("Database error:", err);
        res.status(500).json({ message: "Database error:: " + err });
      });
  });

  app.get("/users/:status", (req, res) => {
    db.Employees.findAll({
      where: {
        status: req.params.status,
        isManagement: false,
        is_active: true,
      },
      include: [
        {
          model: db.Company,
        },
        {
          model: db.Relatives,
          where: {
            is_active: true,
            status: "Active",
          },
          required: false,
        },
        {
          model: db.Folios,
        },
      ],
    })
      .then(async (data) => {
        console.log("Request fetched");
        res.status(200).json({
          data: await encryptData(
            JSON.stringify({
              message: "Request fetched",
              data: data,
            })
          ),
        });
        // res.status(200).json({message:"Request fetched", "data":data})
      })
      .catch((err) => {
        console.error("fetched request error", err);
        res.status(500).json({ message: "fetched request error:: " + err });
      });
  });

  // login
  app.post("/login", async (req, res) => {
    decryptedData = await decryptData(req.body.data);
    req.body = JSON.parse(decryptedData);
    // console.error("req.body:: ",req.body)
    db.Employees.findOne({
      include: [
        {
          model: db.Company,
        },
        {
          model: db.Relatives,
          where: {
            is_active: true,
            status: "Active",
          },
          include: [{ model: db.Folios }],
          required: false,
        },
        {
          model: db.Folios,
        },
      ],
      where: {
        email: req.body.email,
      },
    })
      .then((userDetails) => {
        if (!userDetails) {
          console.log("Employee does not exist");
          res.status(404).json({ message: "Employee does not exist" });
        } else if (userDetails && !userDetails.is_active) {
          console.error("Employee not active");
          res
            .status(401)
            .json({ message: "Employee not active...Contact admin" });
        } else if (
          userDetails &&
          bcrypt.compareSync(req.body.password, userDetails.password)
        ) {
          user_pan = userDetails.pan;
          user_company = userDetails.company_id;
          user_id = userDetails.id;
          const accessToken = jwt.sign(
            {
              userId: user_id,
              companyId: user_company,
              userPAN: user_pan,
              is_compliance: userDetails.is_compliance,
            },
            accessTokenSecret,
            { expiresIn: expTime }
          );
          const refreshAccessToken = jwt.sign(
            {
              userId: user_id,
              companyId: user_company,
              userPAN: user_pan,
              is_compliance: userDetails.is_compliance,
            },
            refreshAccessTokenSecret
          );
          // console.log("ID", user.email, refreshAccessToken);
          db.Employees.update(
            { refreshAccessToken: refreshAccessToken },
            {
              where: {
                id: user_id,
              },
            }
          )
            .then(async ([nrows, rows]) => {
              if (nrows > 0) {
                console.log("User detail fetched rows = ", nrows);
                userDetails.password = null;
                userDetails.temp_info = null;
                // console.log("User detail fetched", userDeail);
                var ld = await updateLoginDetails(userDetails);
                res.status(200).json({
                  data: await encryptData(
                    JSON.stringify({
                      message: "Successfully login",
                      userDetails: userDetails,
                      accessToken: accessToken,
                      refreshAccessToken: refreshAccessToken,
                    })
                  ),
                });
              } else {
                // console.error("Can not save refresh token", nrows);
                res.status(500).json({ message: "Database error" });
              }
            })
            .catch((err) => {
              console.error("Can not save refresh token", err);
              res.status(500).json({ message: "Database error:: " + err });
            });
        } else {
          console.error("Invalid password");
          res.status(401).json({ message: "Invalid password" });
        }
      })
      .catch((err) => {
        console.error("Login faild", err);
        res.status(500).json({ message: "Failed to login:: " + err });
      });
  });

  // logout
  app.post("/logout", (req, res) => {
    db.Employees.update(
      { refreshAccessToken: "" },
      {
        where: {
          id: req.user.userId,
        },
      }
    )
      .then(([nrows]) => {
        if (nrows > 0) {
          console.log("Successfully logged out");
          res.status(200).json({ message: "Successfully logged out" });
        } else {
          console.error("Database error in logout");
          res.status(500).json({ message: "Database error" });
        }
      })
      .catch((err) => {
        console.error("Database error in logout", err);
        res.status(500).json({ message: "Database error:: " + err });
      });
  });

  // reset password of an user
  app.put("/user/:userId/resetpassword", async (req, res) => {
    var activityData = {
      activity: "Reset Password",
      description: "",
      done_by: [req.user.userId],
      done_for: [req.params.userId],
    };
    var activity_id = await trackActivity(activityData, db);
    var userData = await db.Employees.findOne({
      include: [
        {
          model: db.Company,
        },
      ],
      where: {
        id: req.params.userId,
      },
    });
    // const tempPass = userData.pan;
    var tempPass = await getRandomPass();
    console.log("tempPass = ", tempPass);
    console.log("userData.email = ", userData.email);
    const hashedPass = bcrypt.hashSync(tempPass, 10); //Hashing the password
    db.Employees.update(
      { password: hashedPass },
      {
        where: {
          id: req.params.userId,
        },
      }
    )
      .then(async ([nrows]) => {
        if (nrows > 0) {
          console.log("password reset Successfully");
          var adminData = await db.Employees.findAll({
            where: {
              is_compliance: true,
            },
          });
          var text =
            "Dear Insider,\n\tYour Password has been reset successfully. Your new password is '" +
            tempPass +
            "'.\n\n";
          text =
            text +
            "Yours faithfully,\nfor " +
            userData.Company.name +
            "\n" +
            adminData[0].name;
          console.error("text = ", text);
          var mailRes = await sentMail({
            to: userData.email,
            subject: "Password Reset Successful",
            text: text,
          });
          console.error("mailRes = ", mailRes);
          var activityData = { activityId: activity_id };
          activity_id = await trackActivity(activityData, db);
          res.status(200).json({
            message: "password reset Successfully",
            password: tempPass,
            mailRes: mailRes,
          });
        } else {
          console.error("Database error in reset password");
          res.status(500).json({ message: "Database error in reset password" });
        }
      })
      .catch((err) => {
        console.error("Database error in reset password", err);
        res
          .status(500)
          .json({ message: "Database error in reset password:: " + err });
      });
  });

  async function validatePassword(password, name) {
    try {
      companyData = await db.Company.findAll();
      cNameParts = companyData[0].name.split(" ");
      cName = cNameParts[0].toLowerCase();
      if (cName.length < 3 && cNameParts.length > 1) {
        cName = cNameParts[0].toLowerCase() + " " + cNameParts[1].toLowerCase();
      }
      uName = name.split(" ")[0].toLowerCase();
      console.error("password.toLowerCase():: ", password.toLowerCase());
      console.error("cName.toLowerCase():: ", cName.toLowerCase());
      console.error(password.toLowerCase().includes(cName.toLowerCase()));
      console.error(
        "cName.replace(' ','').toLowerCase():: ",
        cName.replace(" ", "").toLowerCase()
      );
      console.error(
        password.toLowerCase().includes(cName.replace(" ", "").toLowerCase())
      );
      console.error("uName.toLowerCase():: ", uName.toLowerCase());
      console.error(password.toLowerCase().includes(uName.toLowerCase()));
      if (
        password.toLowerCase().includes(cName.toLowerCase()) ||
        password.toLowerCase().includes(cName.replace(" ", "").toLowerCase()) ||
        password.toLowerCase().includes(uName.toLowerCase())
      ) {
        return false;
      } else {
        return true;
      }
    } catch (error) {
      console.error("validatePassword:: error: ", error);
      throw error;
    }
  }

  // change password
  app.post("/user/:userId/changepassword", async (req, res) => {
    // Activity add
    decryptedData = await decryptData(req.body.data);
    req.body = JSON.parse(decryptedData);
    console.log("changepassword by = ", req.user);
    var activityData = {
      activity: "change password",
      description: "",
      done_by: [req.user.userId],
      done_for: [req.params.userId],
    };
    var activity_id = await trackActivity(activityData, db);
    db.Employees.findOne({
      where: {
        id: req.params.userId,
      },
    })
      .then(async (user) => {
        if (!user) {
          console.log("User does not exist");
          res.status(404).json({ message: "User does not exist" });
        } else if (bcrypt.compareSync(req.body.password, user.password)) {
          isValidPass = await validatePassword(req.body.newPassword, user.name);
          if (bcrypt.compareSync(req.body.newPassword, user.password)) {
            console.error("New password can't be same with previous password");
            res.status(401).json({
              message: "New password can't be same with previous password",
            });
          } else if (!isValidPass) {
            console.error(
              "New password can't contain your company name or your name"
            );
            res.status(401).json({
              message:
                "New password can't contain your company name or your name",
            });
          } else {
            const hash = bcrypt.hashSync(req.body.newPassword, 10); //Hashing the password
            req.body.newPassword = hash;
            console.log("ID", user.email);
            db.Employees.update(
              { password: req.body.newPassword, firstLogin: false },
              {
                where: {
                  id: req.params.userId,
                },
              }
            )
              .then(async ([nrows]) => {
                if (nrows > 0) {
                  console.log("Password changed successfully");
                  // Activity update
                  var activityData = { activityId: activity_id };
                  activity_id = await trackActivity(activityData, db);
                  res
                    .status(200)
                    .json({ mesage: "Password changed successfully" });
                } else {
                  console.error("Password change faild");
                  res.status(500).json({ message: "Password change faild" });
                }
              })
              .catch((err) => {
                console.error("Can not save update password", err);
                res.status(500).json({ message: "Database error:: " + err });
              });
          }
        } else {
          console.error("Invalid password");
          res.status(401).json({ message: "Invalid password" });
        }
      })
      .catch((err) => {
        console.error("User Fetch fail", err);
        res.status(400).json({ message: "Failed to change password:: " + err });
      });
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
    var fileStr = day + "/" + mon + "/" + fileDate.getFullYear();
    console.error("fileStr = ", fileStr);
    fileDate = await getDate(fileStr);
    return fileDate;
  }

  async function getPAN(emp_code) {
    try {
      let emp_pan;
      console.log("emp_code = ", emp_code);
      var employeeInfo = await db.Employees.findAll({
        where: {
          emp_code: emp_code,
          isManagement: false,
        },
        order: [["id", "DESC"]],
      });
      // console.log("employeeInfo = ",employeeInfo)
      emp_pan = employeeInfo[0].pan;
      console.log("emp_pan = ", emp_pan);
      return emp_pan;
    } catch (error) {
      console.error("getPAN:: error: ", error);
      throw error;
    }
  }

  async function getCompanyID() {
    try {
      var employeeInfo = await db.Company.findAll();
      return employeeInfo[0].id;
    } catch (error) {
      console.error("getCompanyID:: error: ", error);
      throw error;
    }
  }

  async function sentBulkInsiderJoinMail(insiderData) {
    try {
      // forming Mail
      var templateData = await db.Templates.findOne({
        where: {
          type: "New_cp_login_details",
        },
      });
      subject = templateData.subject;
      console.error("subject:: ", subject);
      // fetch data
      var admin = await db.Employees.findOne({
        include: [
          {
            model: db.Company,
          },
        ],
        where: {
          is_compliance: true,
        },
        required: false,
      });
      for (e = 0; e < insiderData.length; e++) {
        try {
          var variables = [
            insiderData[e].name,
            backendUrl,
            insiderData[e].email,
            insiderData[e].pan,
            admin.Company.name,
            admin.name,
          ];
          text = await getUpdatedText(templateData.body, variables);
          // console.error("subject = ")
          // console.error(subject)
          // var mailRes = await sentMail({
          //     to: insiderData[e].email,
          //     subject: subject,
          //     text: text
          // })
          // console.error("mailRes = ",mailRes)
        } catch (error) {
          console.error("sentBulkInsiderJoinMail:: mail sent error = ");
        }
      }
    } catch (error) {
      console.error("sentBulkInsiderJoinMail:: error: ", error);
      throw error;
    }
  }

  async function getNoPanMax() {
    try {
      var Max = 1;
      var noPanData = await db.Employees.findAll({
        where: {
          pan: {
            [Op.like]: "%NOPAN%",
          },
          isManagement: false,
        },
        order: [["pan", "DESC"]],
      });
      console.error("noPanData.length = ", noPanData.length);
      if (noPanData.length > 0) {
        var CountStr = noPanData[0].pan.replace("NOPAN", "");
        console.error("Max CountStr Pan = ", CountStr);
        Max = Number(CountStr);
        console.error("Max Pan count= ", Max);
      }
      var noPanData1 = await db.Relatives.findAll({
        where: {
          pan: {
            [Op.like]: "NOPAN%",
          },
        },
        order: [["pan", "DESC"]],
      });
      console.error("noPanData1.length = ", noPanData1.length);
      if (noPanData1.length > 0) {
        var CountStr = noPanData1[0].pan.replace("NOPAN", "");
        console.error("Max CountStr Pan = ", CountStr);
        rMax = Number(CountStr);
        console.error("rMax Pan count= ", rMax);
        console.error("Max Pan count= ", Max);
        if (rMax > Max) {
          Max = rMax;
        }
      }
      Max += 1;
      console.error("Max Pan count= ", Max);
      var pan = "";
      if (Max > 9999) {
        pan = "NOPAN" + Max.toString();
      } else if (Max > 999) {
        pan = "NOPAN0" + Max.toString();
      } else if (Max > 99) {
        pan = "NOPAN00" + Max.toString();
      } else if (Max > 9) {
        pan = "NOPAN000" + Max.toString();
      } else {
        pan = "NOPAN0000" + Max.toString();
      }
      console.error("pan = ", pan);
      return pan;
    } catch (error) {
      console.error("getNoPanMaxCount:: error:", error);
      throw error;
    }
  }

  app.post("/Employees/bulk", async (req, res) => {
    let weeklyData = {};
    try {
      // Activity add
      var actvtCat =
        req.query["type"] == "DP" ? "Designated Person" : "Connected Person";
      var activityData = {
        activity: "bulk " + actvtCat + " Add",
        description: "",
        done_by: [req.user.userId],
        done_for: [],
      };
      var activity_id = await trackActivity(activityData, db);
      //uploading master excel to local and reading it as list od object
      console.log("requestes params are", req.query);
      var out = await localUpload.fields([
        { name: "employeeData", maxCount: 1 },
      ])(req, res, async function (err) {
        // console.log("name", req.body.name);
        try {
          if (err) {
            console.log("Either no file selected or upload error", err);
            throw "NO employeeData Excel";
          }
          // console.log(req.files);
          if (req.files) {
            try {
              var errorList = [];
              var addedList = [];
              var insiderData = [];
              req.body["employeeData"] = localgetPublicUrl(
                req.files["employeeData"][0].filename
                  ? req.files["employeeData"][0].filename
                  : req.files["employeeData"][0].key
                  ? req.files["employeeData"][0].key
                  : req.files["employeeData"][0].originalname
              );
              const path = req.body["employeeData"];
              console.log("path>>>>>>>>", path);
              var workbook = XLSX.readFile(req.body["employeeData"]);
              var sheet_name_list = workbook.SheetNames;
              empData = XLSX.utils.sheet_to_json(
                workbook.Sheets[sheet_name_list[0]]
              );
              var nopanCount = 0;
              for (i = 0; i < empData.length; i++) {
                const result = await db.sequelize.transaction(async (t) => {
                  try {
                    var record = empData[i];
                    var name = record.InsiderName || "";
                    var Address = record.Address || "";
                    var phone = record.MobileNo || "";
                    var last_institute =
                      record.LastDegreeANDEducationalInstitution || "";
                    var last_employer = record.NameOfPastEmployer || "";
                    var other_identifier_type =
                      record.OtherIdentifierType || "";
                    var other_identifier_no = record.OtherIdentifierNo || "";
                    var email = record.Email || "";
                    var pan = record.HOLDERPAN || "";
                    if (pan == "") {
                      pan = await getNoPanMax();
                    }
                    if (record.Status.toLowerCase() == "self") {
                      // employee info
                      var Folio_info = [];
                      var Designation = record.Designation || "";
                      var code = record.HRCode || "";
                      var emp_category = record.Category || "";
                      var total_share = 0;
                      var DateOfAppointmentAsInsider =
                        record.DateOfAppointmentAsInsider || "";
                      let appointment_date;
                      if (DateOfAppointmentAsInsider != "") {
                        console.log(
                          "appointment_date = ",
                          DateOfAppointmentAsInsider
                        );
                        if (
                          DateOfAppointmentAsInsider.toString().includes("/")
                        ) {
                          console.log(
                            "appointment_date = ",
                            DateOfAppointmentAsInsider
                          );
                          appointment_date = await getDate(
                            DateOfAppointmentAsInsider
                          );
                        } else {
                          appointment_date = await ExcelDateToJSDate(
                            DateOfAppointmentAsInsider
                          );
                        }
                      } else {
                        appointment_date = new Date(2021, 02, 31);
                      }
                      var LastBenposDate = record.LastBenposDate || "";
                      let last_benpos_date;
                      if (LastBenposDate != "") {
                        if (LastBenposDate.toString().includes("/")) {
                          last_benpos_date = await getDate(LastBenposDate);
                        } else {
                          last_benpos_date = await ExcelDateToJSDate(
                            LastBenposDate
                          );
                        }
                      } else {
                        last_benpos_date = new Date();
                      }
                      if ("FolioNo1" in record) {
                        if ("FShares1" in record) {
                          Folio_info.push({
                            emp_pan: pan,
                            folio: record.FolioNo1,
                            current_share: record.FShares1,
                          });
                          total_share = total_share + record.FShares1;
                        } else {
                          Folio_info.push({
                            emp_pan: pan,
                            folio: record.FolioNo1,
                            current_share: 0,
                          });
                          total_share = total_share + 0;
                        }
                      }
                      if ("FolioNo2" in record) {
                        if ("FShares2" in record) {
                          Folio_info.push({
                            emp_pan: pan,
                            folio: record.FolioNo2,
                            current_share: record.FShares2,
                          });
                          total_share = total_share + record.FShares2;
                        } else {
                          Folio_info.push({
                            emp_pan: pan,
                            folio: record.FolioNo2,
                            current_share: 0,
                          });
                          total_share = total_share + 0;
                        }
                      }
                      if ("FolioNo3" in record) {
                        if ("FShares3" in record) {
                          Folio_info.push({
                            emp_pan: pan,
                            folio: record.FolioNo3,
                            current_share: record.FShares3,
                          });
                          total_share = total_share + record.FShares3;
                        } else {
                          Folio_info.push({
                            emp_pan: pan,
                            folio: record.FolioNo3,
                            current_share: 0,
                          });
                          total_share = total_share + 0;
                        }
                      }
                      if ("FolioNo4" in record) {
                        if ("FShares4" in record) {
                          Folio_info.push({
                            emp_pan: pan,
                            folio: record.FolioNo4,
                            current_share: record.FShares4,
                          });
                          total_share = total_share + record.FShares4;
                        } else {
                          Folio_info.push({
                            emp_pan: pan,
                            folio: record.FolioNo4,
                            current_share: 0,
                          });
                          total_share = total_share + 0;
                        }
                      }
                      if ("FolioNo5" in record) {
                        if ("FShares5" in record) {
                          Folio_info.push({
                            emp_pan: pan,
                            folio: record.FolioNo5,
                            current_share: record.FShares5,
                          });
                          total_share = total_share + record.FShares5;
                        } else {
                          Folio_info.push({
                            emp_pan: pan,
                            folio: record.FolioNo5,
                            current_share: 0,
                          });
                          total_share = total_share + 0;
                        }
                      }
                      var companyId = await getCompanyID();
                      console.log("last_benpos_date = ", last_benpos_date);
                      console.log(
                        "date_of_appointment_as_insider = ",
                        appointment_date
                      );
                      var EmployeeData = {
                        pan: pan,
                        emp_code: code,
                        name: name,
                        email: email.toLowerCase(),
                        password: bcrypt.hashSync(pan, 10),
                        company_id: companyId,
                        designation: Designation,
                        phone: phone,
                        address: Address,
                        total_share: total_share,
                        last_benpos_date: last_benpos_date,
                        date_of_appointment_as_insider: appointment_date,
                        last_institute: last_institute,
                        last_employer: last_employer,
                        other_identifier_type: other_identifier_type,
                        other_identifier_no: other_identifier_no,
                        category: emp_category,
                        type: req.query["type"],
                        firstLogin: true,
                      };

                      console.error("EmployeeData:: ", EmployeeData);
                      var newEmployeeInfo = await db.Employees.create(
                        EmployeeData,
                        { transaction: t }
                      );

                      console.error("Employee created:: ", newEmployeeInfo);
                      addedList.push({ name: name, type: "Employee" });
                      for (k = 0; k < Folio_info.length; k++) {
                        var newFolio = await db.Folios.create(Folio_info[k], {
                          transaction: t,
                        });
                      }
                      insiderData.push({ email: email, pan: pan, name: name });
                    } else {
                      // relative info
                      var Folio_info = [];
                      var code = record.HRSubCode || "";
                      var relation = record.RelationWithInsider || "";
                      var RelationType = record.RelationType || "";
                      var LastBenposDate = record.LastBenposDate || "";
                      let last_benpos_date;
                      if (LastBenposDate != "") {
                        if (LastBenposDate.toString().includes("/")) {
                          last_benpos_date = await getDate(LastBenposDate);
                        } else {
                          last_benpos_date = await ExcelDateToJSDate(
                            LastBenposDate
                          );
                        }
                      } else {
                        last_benpos_date = new Date();
                      }
                      console.error("name = ", name);
                      console.error("code = ", code);
                      console.error(
                        'code.split("/")[0] = ',
                        code.split("/")[0]
                      );
                      var emp_pan = await getPAN(code.split("/")[0]);
                      var total_share = 0;
                      if ("FolioNo1" in record) {
                        if ("FShares1" in record) {
                          Folio_info.push({
                            emp_pan: emp_pan,
                            emp_relative_pan: pan,
                            folio: record.FolioNo1,
                            current_share: record.FShares1,
                          });
                          total_share = total_share + record.FShares1;
                        } else {
                          Folio_info.push({
                            emp_pan: emp_pan,
                            emp_relative_pan: pan,
                            folio: record.FolioNo1,
                            current_share: 0,
                          });
                          total_share = total_share + 0;
                        }
                      }
                      if ("FolioNo2" in record) {
                        if ("FShares2" in record) {
                          Folio_info.push({
                            emp_pan: emp_pan,
                            emp_relative_pan: pan,
                            folio: record.FolioNo2,
                            current_share: record.FShares2,
                          });
                          total_share = total_share + record.FShares2;
                        } else {
                          Folio_info.push({
                            emp_pan: emp_pan,
                            emp_relative_pan: pan,
                            folio: record.FolioNo2,
                            current_share: 0,
                          });
                          total_share = total_share + 0;
                        }
                      }
                      if ("FolioNo3" in record) {
                        if ("FShares3" in record) {
                          Folio_info.push({
                            emp_pan: emp_pan,
                            emp_relative_pan: pan,
                            folio: record.FolioNo3,
                            current_share: record.FShares3,
                          });
                          total_share = total_share + record.FShares3;
                        } else {
                          Folio_info.push({
                            emp_pan: emp_pan,
                            emp_relative_pan: pan,
                            folio: record.FolioNo3,
                            current_share: 0,
                          });
                          total_share = total_share + 0;
                        }
                      }
                      if ("FolioNo4" in record) {
                        if ("FShares4" in record) {
                          Folio_info.push({
                            emp_pan: emp_pan,
                            emp_relative_pan: pan,
                            folio: record.FolioNo4,
                            current_share: record.FShares4,
                          });
                          total_share = total_share + record.FShares4;
                        } else {
                          Folio_info.push({
                            emp_pan: emp_pan,
                            emp_relative_pan: pan,
                            folio: record.FolioNo4,
                            current_share: 0,
                          });
                          total_share = total_share + 0;
                        }
                      }
                      if ("FolioNo5" in record) {
                        if ("FShares5" in record) {
                          Folio_info.push({
                            emp_pan: emp_pan,
                            emp_relative_pan: pan,
                            folio: record.FolioNo5,
                            current_share: record.FShares5,
                          });
                          total_share = total_share + record.FShares5;
                        } else {
                          Folio_info.push({
                            emp_pan: emp_pan,
                            emp_relative_pan: pan,
                            folio: record.FolioNo5,
                            current_share: 0,
                          });
                          total_share = total_share + 0;
                        }
                      }

                      console.log("last_benpos_date = ", last_benpos_date);
                      var RelativeData = {
                        emp_pan: emp_pan,
                        pan: pan,
                        emp_sub_code: code,
                        name: name,
                        email: email,
                        phone: phone,
                        address: Address,
                        relation: relation,
                        type: RelationType,
                        total_share: total_share,
                        last_benpos_date: last_benpos_date,
                        last_institute: last_institute,
                        last_employer: last_employer,
                        other_identifier_type: other_identifier_type,
                        other_identifier_no: other_identifier_no,
                      };
                      var newRelativeInfo = await db.Relatives.create(
                        RelativeData,
                        { transaction: t }
                      );
                      console.error("Relative created");
                      addedList.push({ name: name, type: "Relative" });
                      for (k = 0; k < Folio_info.length; k++) {
                        var newFolio = await db.Folios.create(Folio_info[k], {
                          transaction: t,
                        });
                      }
                    }
                  } catch (error) {
                    console.error("error in employeeData insert", error);
                    errorList.push({
                      name: name,
                      message: "error while employee add:: " + error,
                    });
                    // throw error
                  }
                });
              }
              // Activity update
              var activityData = { activityId: activity_id };
              activity_id = await trackActivity(activityData, db);
              var fileObs = req.files.employeeData;
              // delete temp created files
              for (f = 0; f < fileObs.length; f++) {
                var temp = fileObs[f];
                try {
                  fs.unlinkSync(temp.path);
                  console.log("File is deleted.");
                } catch (error) {
                  console.log(error);
                }
              }
              x = sentBulkInsiderJoinMail(insiderData);
              res.status(200).json({
                message: "employee Data uploaded",
                addedList: addedList,
                errorList: errorList,
              });
            } catch (error) {
              console.error("Error in employeeData upload and read", error);
              throw error;
            }
          } else {
            console.error("NO employeeData Excel");
          }
        } catch (error) {
          console.error("Error in employeeData processing");
          res
            .status(500)
            .json({ message: "cann't upload employeeData:: " + error });
        }
      });
    } catch (error) {
      console.error("Error in employeeData addition");
      res.status(500).json({ message: "cann't add employeeData:: " + error });
    }
  });

  app.post("/user", async (req, res) => {
    try {
      // Activity add
      var activityData = {
        activity: "Connected Person Add",
        description: "",
        done_by: [req.user.userId],
        done_for: [],
      };
      var activity_id = await trackActivity(activityData, db);
      console.error(" activity_id = ", activity_id);
      if (req.user && req.user.is_compliance) {
        req.body.email;
        var empData = await db.Employees.findAll({
          where: {
            email: req.body.email,
          },
        });
        if (empData.length > 0) {
          res.status(400).json({
            message:
              "This email Id already exist in dataBase try with another email Id",
            empData,
          });
        } else {
          var tempPan = await getNoPanMax();
          // if (!req.body.hasOwnProperty("pan")) {
          //   req.body["pan"] = tempPan;
          // }

          req.body["date_of_appointment_as_insider"] = new Date();
          tempPass = await getRandomPass();
          console.error("tempPass = ", tempPass);

          // send mail
          var coData = await db.Employees.findOne({
            where: {
              is_compliance: true,
              isManagement: false,
            },
          });
          var CompanyData = await db.Company.findOne();
          var subject = "";
          var text = "";
          var templateData = await db.Templates.findOne({
            where: {
              type: "New_CP_Join",
            },
          });
          var variables = [
            CompanyData.name,
            CompanyData.website,
            backendUrl,
            req.body.email,
            tempPass,
            CompanyData.name,
            coData.name,
          ];
          subject = templateData.subject;
          text = await getUpdatedText(templateData.body, variables);
          text = await getCredentialsText(text, [backendUrl, req.body.email]);
          console.error("text = ", text);
          var mailRes = await sentMail({
            to: req.body.email,
            subject: subject,
            text: text,
          });
          console.error("mailRes = ", mailRes);

          if (mailRes.status == 200) {
            type = "DP";
            if ("type" in req.query) {
              type = req.query.type;
            }
            var pan = req.body.pan;
            if (!pan || pan.trim() == "") {
              var pan = await getDummyPan(db);
            }
            var data = {
              ...req.body,
              pan: pan,
              email: req.body.email?.toLowerCase(),
            };
            var newEmp = await db.Employees.create({
              ...data,
              password: bcrypt.hashSync(tempPass, 10),
              status: "Temp",
              type: type,
            });
            console.log("Employee created", newEmp.id);
            activityData = { activityId: activity_id, done_for: [newEmp.id] };
            console.error(" activityData = ", activityData);
            console.error(" activity_id = ", activity_id);
            activity_id = await trackActivity(activityData, db);
            res
              .status(200)
              .json({ message: "Employee created", id: newEmp.id, mailRes });
          } else {
            res.status(500).json({ message: "Mail sent Error", mailRes });
          }
        }
      } else {
        console.error("Not a admin", req.user);
        res.status(403).json({ message: "Not a admin" });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Error : " + err });
    }
  });

  app.get("/company", (req, res) => {
    // company fetch
    db.Company.findAll({
      attributes: [
        "id",
        "code",
        "isin",
        "cin",
        "name",
        "email",
        "address",
        "window_close_from",
        "window_close_to",
        "purpose",
      ],
    })
      .then((data) => {
        console.error("Company fetched ");
        res.status(200).json({ message: "Company fetched", data: data });
      })
      .catch((err) => {
        console.error("Company fetch error", err);
        res.status(500).json({ message: "Company fetch error:: " + err });
      });
  });

  app.put("/user/:id", async (req, res) => {
    decryptedData = await decryptData(req.body.data);
    req.body = JSON.parse(decryptedData);
    var updateData = {};
    let activity_id;
    db.Employees.findOne({
      include: [
        {
          model: db.Relatives,
          where: {
            is_active: true,
          },
          required: false,
        },
      ],
      where: {
        id: req.params.id,
      },
    })
      .then((data) => {
        db.Employees.findOne({
          include: [
            {
              model: db.Company,
            },
          ],
          where: {
            company_id: data.company_id,
            is_compliance: true,
            isManagement: false,
          },
          required: false,
        })
          .then(async (admin) => {
            //Update type data
            // Defining data depending on the current status and user
            req.body["admin"] = admin;
            req.body["emp"] = data;
            var mailOb = { flag: false, type: "NONE" };
            reqType = "";
            mailTo = "";
            if (data.status == "Temp") {
              console.error("Temp");
              console.error("pan = ", req.body.pan);
              if (req.body.pan == "") {
                req.body["pan"] = data.pan;
              }
              console.error("pan = ", req.body.pan);
              req.body["password"] = bcrypt.hashSync(req.body.pan, 10);
              var activityData = {
                activity: "Personal Details Add",
                description: "",
                done_by: [req.params.id],
                done_for: [req.params.id],
              };
              activity_id = await trackActivity(activityData, db);
              // if(req.body.status == 'Active'){
              updateData = {
                ...req.body,
                status: "Active",
              };
              mailOb.flag = true;
              mailOb.type = "FIRST_ACTIVE";
              // }
            } else if (data.status == "Active") {
              console.error("Active");
              var activityData = {
                activity: "Personal Details Correction Request",
                description: "",
                done_by: [req.params.id],
                done_for: [req.params.id],
              };
              activity_id = await trackActivity(activityData, db);
              if (!req.user.is_compliance) {
                updateData = {
                  temp_info: req.body,
                  // temp_info: JSON.stringify(req.body),
                  status: "Update",
                };
                mailOb.flag = true;
                mailOb.type = "REQUEST_UPDATE";
              }
            } else if (data.status == "Update" && req.user.is_compliance) {
              console.error("Update");
              if (req.body.status == "Approved") {
                var activityData = {
                  activity: "Personal Details Correction Request Approved",
                  description: "",
                  done_by: [req.user.userId],
                  done_for: [req.params.id],
                };
                activity_id = await trackActivity(activityData, db);
                updateData = {
                  ...data.temp_info,
                  // ...JSON.parse(data.temp_info),
                  status: "Active",
                };
                mailOb.flag = true;
                mailOb.type = "RE_ACTIVE";
              } else {
                var activityData = {
                  activity: "Personal Details Correction Request Rejected",
                  description: "",
                  done_by: [req.user.userId],
                  done_for: [req.params.id],
                };
                activity_id = await trackActivity(activityData, db);
                updateData = {
                  temp_info: {},
                  // temp_info: JSON.stringify({}),
                  reason: req.body.reason,
                  status: "Active",
                };
                mailOb.flag = true;
                mailOb.type = "RE_ACTIVE_REJ";
              }
            }

            //update mail data depending on type
            var allFiles = [];
            var relData = [];
            var mailRes = {};
            var masterDoc = new PDFDocument();
            console.log("mail ob", mailOb);
            if (mailOb.flag) {
              if (
                mailOb.type == "FIRST_ACTIVE" ||
                mailOb.type == "REQUEST_UPDATE"
              ) {
                var anex6 = await getAnnexure6(req.body);
                allFiles.push({
                  filename: "annexure-6-primary.pdf",
                  content: anex6,
                });

                var anex5 = await getAnnexure5(req.body);
                allFiles.push({
                  filename: "annexure-5-primary.pdf",
                  content: anex5,
                });

                if (req.body.relatives) {
                  for (var i = 0; i < req.body.relatives.length; i++) {
                    var rel = req.body.relatives[i];
                    rel["admin"] = admin;
                    rel["emp"] = [];
                    rel["category"] = rel.type;
                    var anex = await getAnnexure6(rel);
                    relData.push({
                      filename: "annexure-6-rel-" + i + "-.pdf",
                      content: anex,
                    });
                  }
                }

                allFiles = allFiles.concat(relData);
              } else if (mailOb.type == "REQUEST_UPDATE") {
                allFiles = [];
              }

              var newText =
                mailOb.type == "FIRST_ACTIVE"
                  ? "New_cp_added"
                  : mailOb.type == "REQUEST_UPDATE"
                  ? "Cp_update_request"
                  : mailOb.type == "RE_ACTIVE"
                  ? "Cp_update_approved"
                  : mailOb.type == "RE_ACTIVE_REJ"
                  ? "Cp_update_rejected"
                  : "";

              var mailIds =
                mailOb.type == "FIRST_ACTIVE"
                  ? admin.email
                  : mailOb.type == "REQUEST_UPDATE"
                  ? admin.email
                  : mailOb.type == "RE_ACTIVE" || mailOb.type == "RE_ACTIVE_REJ"
                  ? data.email
                  : admin.email;

              reqType = newText;
              mailTo = mailIds;
            }

            //update on database
            if (mailOb.type == "RE_ACTIVE") {
              var tempdtStr = updateData.last_benpos_date;
              console.error(">>>>>>>> tempdtStr(1) = ", tempdtStr);
              if (tempdtStr == "") {
                console.error("last benpos date is empty");
                var nw = new Date();
                tempdtStr =
                  nw.getMonth() +
                  1 +
                  "-" +
                  nw.getDate() +
                  "-" +
                  nw.getFullYear();
                console.error(">>>>>>>> tempdtStr(2) = ", tempdtStr);
                updateData.last_benpos_date = tempdtStr;
                console.error(
                  ">>>>>>>> updateData.last_benpos_date(1) = ",
                  updateData.last_benpos_date
                );
              } else if (tempdtStr.includes("Z")) {
                updateData.last_benpos_date = new Date(tempdtStr);
                console.error(
                  ">>>>>>>> updateData.last_benpos_date(2) = ",
                  updateData.last_benpos_date
                );
              } else {
                console.error(">>>>>>>> tempdtStr(3) = ", tempdtStr);
                var listStr = tempdtStr.split("-");
                tempdtStr = listStr[0] + "-" + listStr[1] + "-" + listStr[2];
                console.error(">>>>>>>> tempdtStr(4) = ", tempdtStr);
                updateData.last_benpos_date = new Date(tempdtStr);
                console.error(
                  ">>>>>>>> updateData.last_benpos_date(3) = ",
                  updateData.last_benpos_date
                );
              }
            }
            // console.error("updateData:: ", updateData);
            // console.error("updateData::last_benpose_date ", updateData.last_benpos_date);
            // if (updateData.last_benpos_date == 'updateData.last_benpos_date')
            //   delete updateData.last_benpos_date
            db.Employees.update(updateData, {
              where: {
                id: req.params.id,
              },
            })
              .then(async ([nrows, rows]) => {
                console.log("Employee data", data);
                console.log("Employee updated", nrows);
                var d = await db.Employees.findAll({
                  where: {
                    id: req.params.id,
                  },
                });
                console.log("Employee updated", d);
                var upRel = [];
                var upFol = [];

                /*
                    
                        update employee folios

                    */

                if (updateData.folios) {
                  for (var i = 0; i < updateData.folios.length; i++) {
                    var fol = updateData.folios[i];
                    console.log("Employee fol", fol);
                    try {
                      var finFol = await db.Folios.findOne({
                        where: {
                          folio: fol.folio,
                        },
                      });

                      if (finFol) {
                        try {
                          var [nrows, rows] = await db.Folios.update(fol, {
                            where: {
                              id: finFol.id,
                            },
                          });

                          upFol.push({
                            folio: fol.folio,
                            update: true,
                            create: false,
                          });
                        } catch (error) {
                          console.error("Error for folio", fol.folio, error);
                          upFol.push({
                            folio: fol.folio,
                            update: false,
                            create: false,
                          });
                        }
                      } else {
                        if (fol.id) {
                          try {
                            var [nrows, rows] = await db.Folios.update(fol, {
                              where: {
                                id: fol.id,
                              },
                            });

                            upFol.push({
                              folio: fol.folio,
                              update: true,
                              create: false,
                            });
                          } catch (error) {
                            console.error("Error for folio", fol.folio, error);
                            upFol.push({
                              folio: fol.folio,
                              update: false,
                              create: false,
                            });
                          }
                        } else if (fol.folio && fol.folio != "") {
                          try {
                            console.log("new Employee fol", fol);
                            var newRel = await db.Folios.create({
                              ...fol,
                              emp_pan: req.body.pan,
                            });
                            upFol.push({
                              folio: fol.folio,
                              update: false,
                              create: true,
                            });
                          } catch (error) {
                            console.error("Error for folio", fol.folio, error);
                            upFol.push({
                              folio: fol.folio,
                              update: false,
                              create: true,
                            });
                          }
                        }
                      }
                    } catch (error) {
                      console.error("Error for folio:", fol.folio, error);
                      upFol.push({
                        folio: fol.folio,
                        update: false,
                        create: false,
                      });
                    }
                  }
                }

                /*
                    
                        update employee relatives

                    */

                if (updateData.relatives) {
                  for (var i = 0; i < updateData.relatives.length; i++) {
                    var rel = updateData.relatives[i];
                    if (rel.pan == "") {
                      rel.pan = await getNoPanMax();
                    }
                    if (data.status == "Temp") {
                      var tempdtStr = rel.last_benpos_date;
                      if (tempdtStr == "") {
                        console.error("last benpos date is empty");
                        var nw = new Date();
                        tempdtStr =
                          nw.getMonth() +
                          1 +
                          "-" +
                          nw.getDate() +
                          "-" +
                          nw.getFullYear();
                        console.error(">>>>>>>> tempdtStr = ", tempdtStr);
                        rel.last_benpos_date = tempdtStr;
                      }
                    }
                    if (mailOb.type == "RE_ACTIVE") {
                      var tempdtStr = rel.last_benpos_date;
                      if (tempdtStr == "") {
                        console.error("last benpos date is empty");
                        var nw = new Date();
                        tempdtStr =
                          nw.getMonth() +
                          1 +
                          "-" +
                          nw.getDate() +
                          "-" +
                          nw.getFullYear();
                        console.error(">>>>>>>> tempdtStr = ", tempdtStr);
                        rel.last_benpos_date = tempdtStr;
                      } else if (tempdtStr.includes("Z")) {
                        rel.last_benpos_date = new Date(tempdtStr);
                      } else {
                        console.error(">>>>>>>> tempdtStr = ", tempdtStr);
                        var listStr = tempdtStr.split("-");
                        tempdtStr =
                          listStr[1] + "-" + listStr[2] + "-" + listStr[0];
                        console.error(">>>>>>>> tempdtStr = ", tempdtStr);
                        rel.last_benpos_date = tempdtStr;
                      }
                    }
                    console.error(">>>>>>>> rel = ", rel);
                    rel["emp_pan"] = data.pan;
                    try {
                      var finRel = await db.Relatives.findOne({
                        where: {
                          pan: rel.pan,
                        },
                      });

                      if (finRel) {
                        try {
                          console.error("update relative");
                          var [nrows, rows] = await db.Relatives.update(rel, {
                            where: {
                              pan: rel.pan,
                            },
                          });

                          upRel.push({
                            pan: rel.pan,
                            update: true,
                            create: false,
                          });
                        } catch (error) {
                          console.error(
                            "Error for rel with pan:",
                            rel.pan,
                            error
                          );
                          upRel.push({
                            pan: newRel.pan,
                            update: false,
                            create: false,
                          });
                        }
                      } else {
                        try {
                          console.error("create relative");
                          rel["emp_pan"] = req.body.pan;
                          var newRel = await db.Relatives.create(rel);
                          upRel.push({
                            pan: newRel.pan,
                            update: false,
                            create: true,
                          });
                        } catch (error) {
                          console.error(
                            "Error for rel with pan:",
                            rel.pan,
                            error
                          );
                          upRel.push({
                            pan: newRel.pan,
                            update: false,
                            create: false,
                          });
                        }
                      }

                      /*
                                
                                    update employee relatives folios

                                */
                      var upRelFolios = [];
                      if (rel.folios) {
                        for (var k = 0; k < rel.folios.length; k++) {
                          var fol = rel.folios[k];
                          console.error("fol info = ", fol);
                          // fol['emp_pan'] = data.pan
                          // fol['emp_relative_pan'] = rel.pan
                          console.error("fol info = ", fol);
                          try {
                            var finFol = await db.Folios.findOne({
                              where: {
                                folio: fol.folio,
                              },
                            });

                            if (finFol) {
                              try {
                                var [nrows, rows] = await db.Folios.update(
                                  fol,
                                  {
                                    where: {
                                      id: finFol.id,
                                    },
                                  }
                                );

                                upRelFolios.push({
                                  folio: fol.folio,
                                  update: true,
                                  create: false,
                                });
                              } catch (error) {
                                console.error(
                                  "Error for folio",
                                  fol.folio,
                                  error
                                );
                                upRelFolios.push({
                                  folio: fol.folio,
                                  update: false,
                                  create: false,
                                });
                              }
                            } else {
                              if (fol.id) {
                                try {
                                  var [nrows, rows] = await db.Folios.update(
                                    fol,
                                    {
                                      where: {
                                        id: folio.id,
                                      },
                                    }
                                  );

                                  upRelFolios.push({
                                    folio: fol.folio,
                                    update: true,
                                    create: false,
                                  });
                                } catch (error) {
                                  console.error(
                                    "Error for folio",
                                    fol.folio,
                                    error
                                  );
                                  upRelFolios.push({
                                    folio: fol.folio,
                                    update: false,
                                    create: false,
                                  });
                                }
                              } else if (fol.folio && fol.folio != "") {
                                try {
                                  var newRel = await db.Folios.create({
                                    ...fol,
                                    emp_pan: req.body.pan,
                                    emp_relative_pan: rel.pan,
                                  });
                                  upRelFolios.push({
                                    folio: fol.folio,
                                    update: false,
                                    create: true,
                                  });
                                } catch (error) {
                                  console.error(
                                    "Error for folio",
                                    fol.folio,
                                    error
                                  );
                                  upFol.push({
                                    folio: fol.folio,
                                    update: false,
                                    create: true,
                                  });
                                }
                              }
                            }
                          } catch (error) {
                            console.error("Error for folio:", fol.folio, error);
                            upRelFolios.push({
                              folio: fol.folio,
                              update: false,
                              create: false,
                            });
                          }
                        }
                        upRel[i]["Folios"] = upRelFolios;
                      }
                    } catch (error) {
                      console.error("Error for rel with pan:", rel.pan, error);
                      upRel.push({
                        pan: rel.pan,
                        update: false,
                        create: false,
                      });
                    }
                  }
                }

                console.error("Update log");
                var activityData = { activityId: activity_id };
                activity_id = trackActivity(activityData, db);
                res.setHeader("Content-type", "application/pdf");
                res.set({ id: req.params.id });
                res.header("Access-Control-Expose-Headers", "id");
                res.status(200).json({ message: "Update employee done" });
              })
              .catch((err) => {
                console.error("Update employee error", err);
                res
                  .status(500)
                  .json({ message: "Update employee error:: " + err });
              });
          })
          .catch((err) => {
            console.error("Update employee error", err);
            res.status(500).json({ message: "Update employee error:: " + err });
          });
      })
      .catch((err) => {
        console.error("Update employee error", err);
        res.status(500).json({ message: "Update employee error:: " + err });
      });
  });

  app.get("/user/:id/relatives", (req, res) => {
    db.Employees.findOne({
      include: [
        {
          model: db.Relatives,
          where: {
            is_active: true,
            status: "Active",
          },
          required: false,
        },
      ],
      where: { id: req.params.id },
    })
      .then(async (data) => {
        console.log("relatives fetched");
        res.status(200).json({
          data: await encryptData(
            JSON.stringify({
              message: "relatives fetched",
              data: data,
            })
          ),
        });
        // res.status(200).json({message:"relatives fetched", "data": data})
      })
      .catch((err) => {
        console.error("Fetch relatives error", err);
        res.status(500).json({ message: "Fetch relatives error:: " + err });
      });
  });

  app.get("/user/:id", (req, res) => {
    db.Employees.findOne({
      include: [
        {
          model: db.Relatives,
          include: [
            {
              model: db.Folios,
              required: false,
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
      where: {
        id: req.params.id,
      },
    })
      .then(async (data) => {
        console.log("Employee fetched");
        res.status(200).json({
          data: await encryptData(
            JSON.stringify({
              message: "Employee fetched",
              data: data,
            })
          ),
        });
        // res.status(200).json({message:"Employee fetched", data})
      })
      .catch((err) => {
        console.error("Fetch employee error", err);
        res.status(500).json({ message: "Fetch employee error:: " + err });
      });
  });

  app.put("/user/:id/release", async (req, res) => {
    try {
      var activityData = {
        activity: "Release Connected Person",
        description: "",
        done_by: [req.user.userId],
        done_for: [req.params.id],
      };
      var activity_id = await trackActivity(activityData, db);
      var nowDate = new Date();
      var newEmployyeData = await db.Employees.update(
        { status: "Deactive", is_active: false, release_date: nowDate },
        {
          where: {
            id: req.params.id,
          },
        }
      );
      if (newEmployyeData[0] > 0) {
        var employyeData = await db.Employees.findOne({
          where: {
            id: req.params.id,
          },
        });
        var newRelativeData = await db.Relatives.update(
          { status: "Deactive", is_active: false, release_date: nowDate },
          {
            where: {
              emp_pan: employyeData.pan,
            },
          }
        );
        var newFolioData = await db.Folios.update(
          { status: "Deactive", is_active: false, release_date: nowDate },
          {
            where: {
              emp_pan: employyeData.pan,
            },
          }
        );
        console.error("newRelativeData = ", newRelativeData);
        console.error("newFolioData = ", newFolioData);
        var activityData = { activityId: activity_id };
        activity_id = await trackActivity(activityData, db);
        res.status(200).json({ message: "Employee released successfullly" });
      } else {
        res
          .status(200)
          .json({ message: "No Employee with ID: " + req.params.id });
      }
    } catch (error) {
      console.error("release employee error", error);
      res.status(500).json({ message: "release employee error:: " + error });
    }
  });

  app.put("/relative/:id/release", async (req, res) => {
    try {
      var activityData = {
        activity: "Release Relative",
        description: "",
        done_by: [req.user.userId],
        done_for_relative: true,
        done_for: [req.params.id],
      };
      var activity_id = await trackActivity(activityData, db);
      var nowDate = new Date();
      var newRelativeData = await db.Relatives.update(
        { status: "Deactive", is_active: false, release_date: nowDate },
        {
          where: {
            id: req.params.id,
          },
        }
      );
      if (newRelativeData[0] > 0) {
        var relativeData = await db.Relatives.findOne({
          where: {
            id: req.params.id,
          },
        });
        var newFolioData = await db.Folios.update(
          { status: "Deactive", is_active: false, release_date: nowDate },
          {
            where: {
              emp_relative_pan: relativeData.pan,
            },
          }
        );
        console.error("newFolioData = ", newFolioData);
        var activityData = { activityId: activity_id };
        activity_id = await trackActivity(activityData, db);
        res.status(200).json({ message: "Relative released successfullly" });
      } else {
        res
          .status(200)
          .json({ message: "No Relative with ID: " + req.params.id });
      }
    } catch (error) {
      console.error("release Relative error", error);
      res.status(500).json({ message: "release Relative error:: " + error });
    }
  });

  app.put("/users/canEdit", async (req, res) => {
    try {
      data = req.body;
      for (var i = 0; i < data.length; i++) {
        try {
          var newEmpData = await db.Employees.update(
            { canEdit: data[i].canEdit },
            {
              where: {
                id: data[i].id,
              },
            }
          );
        } catch (error) {
          console.error("canEdit:: ", data[i].id, " :: ", error);
        }
      }
      res
        .status(200)
        .json({ message: "Employee can Edit update successfullly" });
    } catch (error) {
      console.error("Employee can Edit update error", error);
      res
        .status(500)
        .json({ message: "Employee can Edit update error:: " + error });
    }
  });

  app.put("/users/haveUPSI", async (req, res) => {
    try {
      data = req.body;
      for (var i = 0; i < data.length; i++) {
        try {
          var newEmpData = await db.Employees.update(
            { upsi: data[i].upsi },
            {
              where: {
                id: data[i].id,
              },
            }
          );
        } catch (error) {
          console.error("upsi:: ", data[i].id, " :: ", error);
        }
      }
      res
        .status(200)
        .json({ message: "Employee have upsi update successfullly" });
    } catch (error) {
      console.error("Employee have upsi update error", error);
      res
        .status(500)
        .json({ message: "Employee have upsi update error:: " + error });
    }
  });

  async function subDays(baseDate, days) {
    try {
      return new Date(baseDate.setDate(baseDate.getDate() - days));
    } catch (error) {
      console.error("subDays:: error: ", error);
    }
  }

  // // this api will be used for scedule for deactivate released insider
  // app.put('/deactivate', async (req,res) => {
  //     try{
  //         var nowDate = new Date()
  //         var past_date = await subDays(nowDate,180)
  //         var past_date = new Date(past_date.setHours(0,0,0))

  //         // Deactiavte Employees
  //         var EmployeeData = await db.Employees.findAll()
  //         for(e=0;e<EmployeeData.length;e++){
  //             emp = EmployeeData[e]
  //             if(emp.status == 'Release'){
  //                 var release_date = emp.release_date
  //                 release_date = new Date(release_date.setHours(0,0,0))
  //                 console.error("release_date = ", release_date);
  //                 console.error("past_date = ", past_date);
  //                 if(release_date.getTime() < past_date.getTime()){
  //                     empId = emp.id
  //                     var newEmployyeData = await db.Employees.update({status: 'Deactive',is_active: false},{
  //                         where:{
  //                             id: empId
  //                         }
  //                     })
  //                     console.error("Employee Deavtivated with ID: ",empId," - status:: ",newEmployyeData[0])
  //                 }
  //             }
  //         }

  //         // Deactiavte Relatives
  //         var RelativeData = await db.Relatives.findAll()
  //         for(r=0;r<RelativeData.length;r++){
  //             rel = RelativeData[r]
  //             if(rel.status == 'Release'){
  //                 var release_date = rel.release_date
  //                 release_date = new Date(release_date.setHours(0,0,0))
  //                 console.error("release_date = ", release_date);
  //                 console.error("past_date = ", past_date);
  //                 if(release_date.getTime() < past_date.getTime()){
  //                     relId = rel.id
  //                     var newRelativeData = await db.Relatives.update({status: 'Deactive',is_active: false},{
  //                         where:{
  //                             id: relId
  //                         }
  //                     })
  //                     console.error("Relative Deavtivated with ID: ",relId," - status:: ",newRelativeData[0])
  //                 }
  //             }
  //         }
  //         res.status(200).json({message:"Deactivation Successfull"})

  //     }
  //     catch(error){
  //         console.error("deactivate Employee and Relative error", error);
  //         res.status(500).json({message:"release Employee and Relative error"})
  //     }
  // })
};
