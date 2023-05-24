var multer = require("multer");
var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./uploads");
  },
  filename: function (req, file, callback) {
    var name = file.originalname.split(".");
    name.splice(file.originalname.split(".").length - 1, 1);
    name = name.join(".");
    var ext =
      file.originalname.split(".")[file.originalname.split(".").length - 1];
    callback(null, name + "-" + Date.now() + "." + ext);
  },
});

module.exports.upload = multer({
  storage: storage,
});
module.exports.getPublicUrl = (originalName) => {
  const originalPath = "./uploads/" + originalName;
  // console.log(">>>>>>>>>>>>>>>>>>>> originalPath = ",originalPath)
  return originalPath;
};
