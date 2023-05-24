var express = require("express");
var bodyParser = require("body-parser");
var db = require("./models");
var cors = require("cors");

var jwtAuthenticate = require("./util/auth").authenticateJWT;
const config = require("./config/config");
const dbInit = require("./config/createTable.js");

var transactionManagement = require("./api/transactionManagement");
var requestManagement = require("./api/requestManagement");
var upsiManagement = require("./api/upsiManagement");
var folioManagement = require("./api/folioManagement");
var activityManagement = require("./api/activityManagement");
var userManagement = require("./api/userManagement");
var mailManagement = require("./api/mailManagement");
var templateManagement = require("./api/templateManagement");
const downloadManagement = require("./api/downloadManagement");
const dataUploadManagement = require("./api/dataUploadManagement");
const resetDB = require("./api/resetDB");
const { createDB, init } = require("./dbInit");

const env = process.env.NODE_ENV || "development";
var options = {
  inflate: true,
  limit: "50mb",
  type: "application/octet-stream",
};

const app = express();
app.use(express.static("uploads"));
app.use(express.static("build"));
app.use(cors());
app.use(jwtAuthenticate);
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.raw(options));

requestManagement(app, db);
upsiManagement(app, db);
folioManagement(app, db);
activityManagement(app, db);
transactionManagement(app, db);
userManagement(app, db);
mailManagement(app, db);
templateManagement(app, db);
downloadManagement(app, db);
dataUploadManagement(app, db);
resetDB(app, db);

dbInit.createTables(db).then((data) => {
  console.log("\nTables creation complete");
});

// createDB()
//   .then((d) => {
//     console.log("DB created");
//     dbInit.createTables(db).then((data) => {
//       console.log("\nTables creation complete");
//     });
//   })
//   .catch((err) => {
//     console.error("Error");
//   });

console.log("Host : ", config[env].backendUrl);
console.log("DB : ", config[env].database);
app.listen(8080, () => console.log("App listening on port 8080!"));
