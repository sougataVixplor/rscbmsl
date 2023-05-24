const dbInit = require("../config/createTable.js");
const { getBackup } = require("../util/backup-database");
const { setRestore } = require("../util/backup-database");
const { getFileName } = require("../util/backup-database");
const trackActivity = require("../util/activityTrack").trackActivity;
var nrc = require("node-run-cmd");
const env = process.env.NODE_ENV || "development";
const config = require("../config/config")[env];
const username = config["username"];
const password = config["password"];
const port = config["port"];
const database = config["database"];
const host = config["host"];
const path = require("path");
const fs = require("fs");
const localUpload = require("../util/storageLocal").upload;
const localgetPublicUrl = require("../util/storageLocal").getPublicUrl;

module.exports = (app, db) => {
  // app.post("/initiateDb", async (req, res) => {
  //   console.error("req user", req.user);
  //   try {
  //     console.log("initiating DB");
  //     var activityData = {
  //       activity: "Database Reset",
  //       description: "Database Reset Done",
  //       done_by: [req.user.userId],
  //       done_for: [],
  //     };
  //     var activity_id = await trackActivity(activityData, db);
  //     var resp = await dbInit.createTables(db);
  //     await new Promise((resolve) => setTimeout(resolve, 10000));
  //     console.log("DB initiated");
  //     var activityData = {
  //       activity: "Database Reset",
  //       description: "Database Reset Done",
  //       done_by: [req.user.userId],
  //       done_for: [],
  //     };
  //     var activity_id = await trackActivity(activityData, db);
  //     var activityData = { activityId: activity_id };
  //     activity_id = await trackActivity(activityData, db);
  //     res.status(200).json({ message: "database initiation successful" });
  //   } catch (error) {
  //     console.error("activity info add error", error);
  //     res.status(500).json({ message: "activity info add error:: " + error });
  //   }
  // });

  // app.post("/backup", async (req, res) => {
  //   console.error("req user", req.user);
  //   try {
  //     console.log("initiating backup");
  //     var activityData = {
  //       activity: "Database Backup",
  //       description: "Database Backup Done",
  //       done_by: [req.user.userId],
  //       done_for: [],
  //     };
  //     var activity_id = await trackActivity(activityData, db);
  //     var fileName = await getFileName("backup");
  //     console.log("backup fileName = ", fileName);
  //     var resp = await getBackup(fileName);
  //     console.log("backup Done");
  //     if (resp[0] == 1) {
  //       var activityData = { activityId: activity_id };
  //       activity_id = await trackActivity(activityData, db);
  //       res.status(200).json({ message: "database backup successful" });
  //     } else {
  //       res.status(500).json({ error: "backup error" });
  //     }
  //   } catch (error) {
  //     console.error("backup error", error);
  //     res.status(500).json({ message: "backup error:: " + error });
  //   }
  // });

  app.post("/backup", async (req, res) => {
    try {
      var fileName = "database-backup.tar";
      var parentPath = process.cwd();
      var pgPath = path.join(process.cwd(), "backup");
      await process.chdir(pgPath);
      console.log("current directory = ", process.cwd());
      var dbLink = `postgresql://${username}:${password}@${host}:${port}/${database}`;
      var cmd = `pg_dump --dbname=${dbLink} -f ${fileName} -F t`;
      console.log(cmd);
      var resp = await nrc.run(cmd);
      await process.chdir(parentPath);
      if (resp[0] == 0) {
        console.log("Backup created successfully");
        var file = await fs.createReadStream("./backup/database-backup.tar");
        file.pipe(res);
      } else {
        throw "Error to create backup";
      }
    } catch (err) {
      console.log("Error to create backup", err);
      res.status(500).json({ message: "Error to create backup" });
    }
  });

  app.post("/restore", async (req, res) => {
    try {
      var fileName = "database-backup.tar";
      var parentPath = process.cwd();
      var pgPath = path.join(process.cwd(), "backup");
      await process.chdir(pgPath);
      console.log("current directory = ", process.cwd());
      dbLink = `postgresql://${username}:${password}@${host}:${port}/${database}`;
      cmd = `pg_restore --verbose --clean --no-acl --no-owner  -d ${dbLink}  ${fileName}`;
      console.log(cmd);
      var resp = await nrc.run(cmd);
      await process.chdir(parentPath);
      console.log(resp);
    } catch (err) {
      console.log("Error to restore backup", err);
      res.status(500).json({ message: "Error to restore backup" });
    }
  });

  // app.post("/restore", async (req, res) => {
  //   console.error("req user", req.user);
  //   try {
  //     console.log("initiating restore");
  //     var activityData = {
  //       activity: "Database Restore",
  //       description: "Database Restore Done",
  //       done_by: [req.user.userId],
  //       done_for: [],
  //     };
  //     var activity_id = await trackActivity(activityData, db);
  //     var fileName = await getFileName("restore");
  //     console.log("restore fileName = ", fileName);
  //     var resp = await setRestore(fileName);
  //     await new Promise((resolve) => setTimeout(resolve, 10000));
  //     console.log("restore Done");
  //     if (resp[0] == 0) {
  //       var activityData = {
  //         activity: "Database Restore",
  //         description: "Database Restore Done",
  //         done_by: [req.user.userId],
  //         done_for: [],
  //       };
  //       var activity_id = await trackActivity(activityData, db);
  //       var activityData = { activityId: activity_id };
  //       activity_id = await trackActivity(activityData, db);
  //       res.status(200).json({ message: "database restore successful" });
  //     } else {
  //       res.status(500).json({ message: "restore error" });
  //     }
  //   } catch (error) {
  //     console.error("restore error", error);
  //     res.status(500).json({ message: "restore error:: " + error });
  //   }
  // });
};
