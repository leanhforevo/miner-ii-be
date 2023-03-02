const DBStore = require("../db");
var jwt = require("jsonwebtoken");

const returnData = (res, data) => {
   console.log("returnData:", data);
  try {
    if (data == true || (typeof data == "object" && !data.error)) {
      res.send({
        data: data,
        isError: false,
        errorMessage: null,
      });
    } else {
      res.send({
        data: false,
        isError: data.error || true,
        errorMessage: data.msg || data || "Something is wrong!",
      });
    }
  } catch (error) {
    res.send({
      data: false,
      isError: true,
      errorMessage: "Something is wrong!",
    });
  }
};
const checkToken = (req, res) => {
  // console.log("checkToken:", req)
  try {
    const indexAuth = req.headers.authorization;
    let token = null;
    if (indexAuth) {
      token = indexAuth.replace("Bearer ", "");
    }
    console.log("TOKEN:", token);
    var decoded = jwt.verify(token, "secretSignature");
    return decoded;
  } catch (error) {
    console.log("ERRTOKEN:", error);
    res.status(403);
    returnData(res, "Token invalid");
  }
};
var d = new Date();
module.exports = {
  configure: function (app) {
    app.get("/", async function (req, res) {
      res.send("server is running at: " + d);
    });

    //register Account
    app.post("/register", async function (req, res) {
      const data = await DBStore.register(req.body);
      returnData(res, data);
    });

    //login Account
    app.post("/login", async function (req, res) {
      //email,password
      const data = await DBStore.login(req.body);
      returnData(res, data);
    });
    //login Account
    app.post("/loginSocial", async function (req, res) {
      //email,password
      const data = await DBStore.loginSocial(req.body);
      returnData(res, data);
    });

    //ChangePassword
    app.post("/changePassword", async function (req, res) {
      //email,password
      const dataAuth = await checkToken(req, res);
      const data = await DBStore.updatePassword({
        email: dataAuth.data.email,
        ...req.body,
      });
      returnData(res, data);
    });
    //upload Avatar
    app.post("/account/avatar", async function (req, res) {
      const dataAuth = await checkToken(req, res);
      const data = await DBStore.updateAvatar(dataAuth, req);
      returnData(res, data);
    });

    //active
    app.post("/activeByCode", async function (req, res) {
      //email,activeCode
      const data = await DBStore.verifyCode(req.body);
      returnData(res, data);
    });

    //active
    app.get("/email", async function (req, res) {
      //email,activeCode
      const dataAuth = await checkToken(req, res);
      const data = await DBStore.getListEmail({
        ...dataAuth.data,
        ...req.query,
      });
      returnData(res, data);
    });
    //active
    app.post("/register/email", async function (req, res) {
      const data = await DBStore.sendMailRegister({
        ...req.body,
      });
      returnData(res, data);
    });
    app.post("/email/read", async function (req, res) {
      //const dataAuth = await checkToken(req, res);
      const data = await DBStore.markReadEmail({
        ...req.body,
      });
      returnData(res, data);
    });

    // collection
    app.post("/collection", async (req, res) => {
      const dataAuth = await checkToken(req, res);
      const data = await DBStore.createCollection({
        ...dataAuth.data,
        ...req,
      });
      returnData(res, data);
    });
    app.get("/collection/all", async (req, res) => {
      const data = await DBStore.getAllCollection();
      returnData(res, data);
    });
    app.get("/collection", async (req, res) => {
      const data = await DBStore.getCollection();
      returnData(res, data);
    });
    app.post("/collection/status", async (req, res) => {
      const dataAuth = await checkToken(req, res);
      const data = await DBStore.statusCollection({
        ...dataAuth.data,
        ...req.body,
      });
      returnData(res, data);
    });

    app.post("/collection/image", async (req, res) => {
      await checkToken(req, res);
      const data = await DBStore.uploadImageCollection(req);
      returnData(res, data);
    });

    //news
    app.get("/new", async (req, res) => {
      const data = await DBStore.getNew({
        ...req.query,
      });
      returnData(res, data);
    });

    app.get("/mynew", async (req, res) => {
      const dataAuth = await checkToken(req, res);
      const data = await DBStore.getNew({
        userId: dataAuth.data._id,
      });
      returnData(res, data);
    });

    app.post("/new", async (req, res) => {
      const dataAuth = await checkToken(req, res);
      const data = await DBStore.createNew({
        ...dataAuth.data,
        ...req.body,
      });
      returnData(res, data);
    });

    app.post("/new/image", async (req, res) => {
      if (req.files && req.body && req.body.id) {
        const data2 = await DBStore.addImageNew(req);
        returnData(res, data2);
      } else {
        returnData(res, null);
      }
    });

    app.delete("/new/image", async (req, res) => {
      if (req.body && req.body.idImg && req.body.idNew) {
        const data2 = await DBStore.removeImageNew({
          idImg: req.body.idImg,
          idNew: req.body.idNew,
        });
        returnData(res, data2);
      } else {
        returnData(res, false);
      }
    });

    app.post("/notification/settoken", async (req, res) => {
      const dataAuth = await checkToken(req, res);
      const data = await DBStore.setTokenUser({
        ...dataAuth.data,
        ...req.body,
      });
      returnData(res, data);
    });

  },
};
