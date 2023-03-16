var mongoose = require("./mogoose.js");
var schema = require("./schema");
var nodemailer = require("nodemailer");
var emailTemp = require("./emailTemplate");
const jwt = require("jsonwebtoken");
var ObjectID = require("mongodb").ObjectID;
const configs = require("../configs");
const aws = require("../utils/aws");
var API = require("../utils/api");
var Utils = require("../utils/utils");

const checkConnection = () => {
  if (mongoose.mongoose.connection.readyState !== 1) {
    mongoose.open();
  }
};
var sendMail = (email, code) => {
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "hello@iicoteck.com",
      pass: "pjdizwfzhjxzwcvv",
    },
  });

  var mailOptions = {
    from: "`iiCO TECK",
    to: email,
    subject: `${configs.appName} verify`,
    html: emailTemp.e(code),
  };

  transporter.sendMail(mailOptions);
};
const login = ({ user, password }) => {
  checkConnection();
  return new Promise((resolve, reject) => {
    if (!user || !password) {
      resolve({
        error: true,
        msg: "Param is not corrected",
      });
    }
    var Users = schema.UserSchemaV2();
    // find each person with a last name matching 'Ghost', selecting the `name` and `occupation` fields
    Users.findOne(
      {
        $or: [
          { 'email': user, password: password },
          { 'phone': user, password: password },
          { 'username': user, password: password }
        ]
      },
      "fullName email phone birthDay username role active timeCreate referalFrom",
      async function (err, data) {
        if (err) reject(false);
        if (data && data.email) {
          if (data.active) {
            const tokenUser = await Utils.createToken(data);
            resolve(tokenUser);
          } else {
            resolve({
              error: true,
              code: 102,
              msg: "Tài khoản chưa kích hoạt",
            });
          }
        } else {
          resolve({
            error: true,
            msg: "Tài khoản hoặc mật khẩu không đúng",
          });
        }
      }
    );
  }).catch((error) => {
    return error;
  });
};
const loginSocial = async (req) => {
  const userSocial = await API.getUserSocial(req);
  if (!userSocial) return null;
  checkConnection();
  var Users = schema.UserSchemaV2();
  const res = await Users.findOne(
    { email: userSocial.users[0].email },
    "fullName email phone birthDay username role active timeCreate referalFrom"
  );
  console.log(res);
  if (res) {
    const tokenUser = await Utils.createToken(res);
    return tokenUser;
  } else {
    var objectId = new ObjectID(); // generate id object
    var NewUser = new Users({
      id: objectId,
      fullName: userSocial.users[0].displayName,
      phone: null,
      username:null,
      email: userSocial.users[0].email,
      avatar: userSocial.users[0].photoUrl,
      birthDay: null,
      password: null,
      role: "user",
      active: true,
      activeCode: null,
      timeCreate: new Date().getTime().toString(),
      detailLogin: {},
    });
    // save to db
    const createUserSocial = await NewUser.save();
    if (!createUserSocial) {
      return {
        error: true,
        msg: "Xảy ra lỗi trong quá trình thực hiện. Vui lòng thử lại sau",
      };
    }
    const tokenUser = await Utils.createToken(NewUser);
    return tokenUser;
  }
};
const updatePassword = async ({ email, oldPassword, newPassword }) => {
  checkConnection();
  var Users = schema.UserSchemaV2();
  if (!email || !oldPassword || !newPassword)
    return {
      error: true,
      msg: "Param is not correct",
    };
  if (oldPassword == newPassword)
    return {
      error: true,
      msg: "Old pass and NewPass is same",
    };
  const data = await Users.updateOne(
    { email: email, password: oldPassword },
    { $set: { password: newPassword } }
  );

  if (data && data.nModified > 0) {
    return true;
  }

  return {
    error: true,
    msg: "Old pass is incorrected",
  };
};

const updateInfomation = async ({ email,...arg }) => {
  checkConnection();
  console.log("{ email,...arg }:",{ email,arg })
  var Users = schema.UserSchemaV2();
  if (!email )
    return {
      error: true,
      msg: "Param is not correct",
    };

  const data = await Users.updateOne(
    { email: email },
    { $set: { ...arg } }
  );
  if (data && data.nModified > 0) {
    return true;
  }

  return {
    error: true,
    msg: "Something went wrong!!",
  };
};
const verifyCode = async ({ email, activeCode }) => {
  checkConnection();
  var Users = schema.UserSchema();
  if (!email || !activeCode)
    return {
      error: true,
      msg: "Param is not correct",
    };
  const data = await Users.updateOne(
    { email: email, activeCode: activeCode },
    { $set: { active: true } }
  );
  console.log("data:", data)
  if (data && data.n > 0) {
    if (data && data.nModified > 0) {
      return true;
    }
    return {
      error: true,
      code: 122,
      msg: "Account is activated",
    };
  }
  return {
    error: true,
    msg: "Account is activate not found",
  };
};
const getNewCode = async ({ email }) => {
  checkConnection();
  var Users = schema.UserSchema();
  if (!email)
    return {
      error: true,
      msg: "Param Email is required",
    };
  const verifycode = Math.floor(100000 + Math.random() * 900000);
  const data = await Users.updateOne(
    { email: email },
    { $set: { activeCode: verifycode } }
  );

  if (data && data.n > 0) {
    if (data && data.nModified > 0) {
      sendMail(email, verifycode);
      return true;
    }
    return {
      error: true,
      msg: "Account is activate not found",
    };
  }
  return false;
};
const register = async ({ fullName, username, phone, email, birthDay, password }) => {
  checkConnection();
  if (!fullName || !username || !email || !password) {
    return {
      error: true,
      msg: "Param is not corrected",
    };
  }

  return new Promise((resolve, reject) => {
    var Register = schema.UserSchemaV2();
    //check user exist
    Register.findOne({ $or: [{ email: email }, { 'username': username }] }, "fullName email role", (err, person) => {
      if (err) {
        reject(false);
      } else if (person) {
        reject({
          error: true,
          msg: "Email or Username is exist",
        });
      } else {
        const verifycode = Math.floor(100000 + Math.random() * 900000); //generate code send email
        var objectId = new ObjectID(); // generate id object
        var NewUser = new Register({
          id: objectId,
          fullName: fullName,
          username,
          phone: phone,
          email: email,
          birthDay: birthDay,
          password: password,
          role: "user",
          active: false,
          activeCode: verifycode,
          timeCreate: new Date().getTime().toString(),
          detailLogin: {},
        });
        // save to db
        NewUser.save(function (err, users) {
          if (err)
            reject({
              error: true,
              msg: "Xảy ra lỗi trong quá trình thực hiện. Vui lòng thử lại sau",
            });
          sendMail(email, verifycode);
          resolve(NewUser);
        });
      }
    });
  }).catch((error) => {
    return error;
  });

};





module.exports = {
  //user
  login,
  loginSocial,
  updatePassword,
  verifyCode,
  getNewCode,
  register,
  updateInfomation
};
