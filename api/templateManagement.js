const jwt = require("jsonwebtoken");
const sequelize = require("sequelize");
const trackActivity = require("../util/activityTrack").trackActivity;
const env = process.env.NODE_ENV || "development";
var config = require("../config/config")[env];

module.exports = (app, db) => {


  app.get("/tmplates", async (req, res) => {
    console.error("req user", req.user);
    try {
        data = await db.Templates.findAll({
            order:[['id', 'ASC']]
        });
        res.status(200).json({ message: "Templates fetched successfully", data: data });
    }
    catch(error){
      console.error("Templates info fetch error", error);
      res.status(500).json({ message: "Templates info fetch error:: "+error });
    }
  });


  app.put("/tmplates/:id", async (req, res) => {
    console.error("req user", req.user);
    try {
        var tempData = await db.Templates.findOne({
            where: {
                id: req.params.id,
            }
        });
        var activityData = {"activity": "update template of '"+tempData.name+"'","description": "",
                                "done_by": [req.user.userId],
                                "done_for": []}
        var activity_id = await trackActivity(activityData, db)
        data = await db.Templates.update(req.body, {
            where: {
            id: req.params.id,
            },
        });
        if (data[0] > 0) {
            activityData = {"activityId": activity_id}
            activity_id = await trackActivity(activityData, db)
            res.status(200).json({ message: "Templates updated successfully", data: data });
        }
        else{
            res.status(500).json({ message: "Templates info not update" });
        }
    }
    catch(error){
      console.error("Templates info update error", error);
      res.status(500).json({ message: "Templates info update error::"+error });
    }
  });
  
};
