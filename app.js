var express = require("express");
var bodyparser = require("body-parser");
var routes = require("./Model/routes");
var Utils = require("./utils/utils");
var fileupload = require("express-fileupload");

var app = express();
app.use(
  fileupload({
    useTempFiles: true,
    tempFileDir: "./tmp/"
  })
);

app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());
routes.configure(app);
Utils.cleanTMP();
var server = app.listen(process.env.PORT || 3000, function() {
  console.log("Server listening on port " + server.address().port);
});
