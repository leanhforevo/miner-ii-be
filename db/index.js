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
      user: "leanhforevo@gmail.com",
      pass: "eqizmannsvpjidbf",
    },
  });

  var mailOptions = {
    from: "`${configs.appName}` <leanhforevo@gmail.com>",
    to: email,
    subject: `${configs.appName} verify`,
    html: emailTemp.e(code),
  };

  transporter.sendMail(mailOptions);
};
const login = ({ email, password }) => {
  checkConnection();
  return new Promise((resolve, reject) => {
    if (!email || !password) {
      resolve({
        error: true,
        msg: "Param is not corrected",
      });
    }
    var Users = schema.UserSchema();
    // find each person with a last name matching 'Ghost', selecting the `name` and `occupation` fields
    Users.findOne(
      { email: email, password: password },
      "fullName email role active avatar",
      async function (err, data) {
        if (err) reject(false);
        if (data && data.email) {
          if (data.active) {
            const tokenUser = await Utils.createToken(data);
            resolve(tokenUser);
          } else {
            resolve({
              error: true,
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
  var Users = schema.UserSchema();
  const res = await Users.findOne(
    { email: userSocial.users[0].email },
    "fullName email role active avatar"
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
  var Users = schema.UserSchema();
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

const updateAvatar = async (account, req) => {
  checkConnection();
  const imageUploaded = await aws.uploadImage(req.files);
  if (!imageUploaded) return;
  var Users = schema.UserSchema();

  const data = await Users.findOneAndUpdate(
    { _id: account.data._id },
    { $set: { avatar: imageUploaded } }
  );
  data.avatar = imageUploaded;
  if (data && data._id) {
    return data;
  }
  return false;
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

  if (data && data.n > 0) {
    if (data && data.nModified > 0) {
      createEMail({
        from: configs.appName,
        to: email,
        title: "Chào mừng bạn đến với " + configs.appName,
        description:
          "Hy vọng bạn sẽ có những trải nghiệm tuyệt vời khi sử dụng ứng dụng",
      });
      return true;
    }
    return {
      error: true,
      msg: "Account is activate not found",
    };
  }
  return false;
};
const register = async ({ fullName, phone, email, birthDay, password }) => {
  checkConnection();
  if (!fullName || !phone || !email || !birthDay || !password) {
    return {
      error: true,
      msg: "Param is not corrected",
    };
  }

  return new Promise((resolve, reject) => {
    var Register = schema.UserSchema();
    //check user exist
    Register.findOne({ email: email }, "fullName email role", (err, person) => {
      if (err) {
        reject(false);
      } else if (person) {
        reject({
          error: true,
          msg: "Email is exist",
        });
      } else {
        const verifycode = Math.floor(100000 + Math.random() * 900000); //generate code send email
        var objectId = new ObjectID(); // generate id object
        var NewUser = new Register({
          id: objectId,
          fullName: fullName,
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
          resolve(true);
        });
      }
    });
  }).catch((error) => {
    return error;
  });
};

const createEMail = async (data) => {
  checkConnection();
  var Mails = schema.MailSchema();
  var NewMail = new Mails({
    from: data.from || "",
    to: data.to,
    title: data.title,
    description: data.description,
    type: data.type || 1,
    isReaded: false,
    active: true,
  });
  // save to db
  NewMail.save(function (err, data) {
    if (err)
      return {
        error: true,
        msg: "Xảy ra lỗi trong quá trình thực hiện. Vui lòng thử lại sau",
      };
    return true;
  });
};
const getListEmail = async (data) => {
  checkConnection();
  var Mails = schema.MailSchema();
  const response = await Mails.find(
    { to: data.email },
    [],
    {
      skip:
        data.page && data.page > 0 && data.limit
          ? data.page * data.limit - data.limit
          : 0, // Starting Row
      limit: data.limit ? data.limit * 1 : 9999999, // Ending Row
      sort: {
        timeSend: -1, //Sort by Date Added DESC
      },
    },
    function (err, res) {
      if (err)
        return {
          error: true,
          msg: "Xảy ra lỗi trong quá trình thực hiện. Vui lòng thử lại sau",
        };
      return res;
    }
  );
  return response;
};

const markReadEmail = async (data) => {
  checkConnection();
  var Mails = schema.MailSchema();
  const res = await Mails.findOneAndUpdate(
    { _id: data._id },
    { $set: { isReaded: true } }
  );

  if (res && res._id && res.isReaded) {
    return true;
  }
  return false;
};

const createCollection = async (data) => {
  const imageUploaded = await aws.uploadImage(data.files);

  checkConnection();
  var Collection = schema.CollectionSchema();
  var NewCollection = new Collection({
    title: data.body.title || "",
    description: data.body.description || "",
    createdBy: data.email,
    active: true,
    img: imageUploaded,
  });
  // save to db
  return new Promise((reslove, reject) => {
    NewCollection.save((err, data) => {
      if (err) {
        reslove({
          error: true,
          msg: "Xảy ra lỗi trong quá trình thực hiện. Vui lòng thử lại sau",
        });
      }
      reslove(NewCollection);
    });
  });
};

const getCollection = async () => {
  checkConnection();
  var Collection = schema.CollectionSchema();
  const data = await Collection.find({ active: true });
  return data;
};

const getAllCollection = async () => {
  checkConnection();
  var Collection = schema.CollectionSchema();
  const data = await Collection.find();
  return data;
};

const statusCollection = async (data) => {
  checkConnection();
  var Collection = schema.CollectionSchema();
  const res = await Collection.findOneAndUpdate(
    { _id: data._id },
    { $set: { active: data.active ? true : false } }
  );

  if (res && res._id) {
    return true;
  }
  return false;
};
const uploadImageCollection = async (req) => {
  if (req.body && req.body.id) {
    checkConnection();
    const imageUploaded = await aws.uploadImage(req.files);
    var Collection = schema.CollectionSchema();
    const res = await Collection.findOneAndUpdate(
      { _id: req.body.id },
      { $set: { img: imageUploaded } }
    );
    res.img = imageUploaded;
    if (res && res._id) {
      return res;
    }
  }
  return false;
};

const getNew = async (data) => {
  checkConnection();
  var New = schema.NewSchema();
  const fillterCollection = data.collectionId
    ? { collectionId: data.collectionId }
    : {};
  const res = await New.find(
    {
      ...fillterCollection,
    },
    null,
    {
      skip:
        data.page && data.page > 0 && data.limit
          ? data.page * data.limit - data.limit
          : 0, // Starting Row
      limit: data.limit ? data.limit * 1 : 50, // Ending Row
      sort: {
        timeCreate: -1, //Sort by Date Added DESC
      },
    }
  );

  return res;
};

const createNew = async (data) => {
  checkConnection();
  var New = schema.NewSchema();
  var New = new New({
    image: data.image,
    arrImage: typeof data.arrImage == Object ? ata.arrImage : [],
    title: data.title,
    description: data.description,

    infoAddress: data.infoAddress,
    address: data.address,

    collectionId: data.collectionId,
    province: data.province,
    provinceId: data.provinceId ? data.provinceId.toString() : 0,
    distric: data.distric,
    districId: data.districId ? data.districId.toString() : 0,

    userId: data._id,

    isHidden: data.isHidden,
    isReview: 2,
    timeCreate: new Date().getTime(),
  });
  // save to db
  return new Promise((reslove, reject) => {
    New.save((err, data) => {
      // db.connection.close()
      if (err) {
        reslove({
          error: true,
          msg: "Xảy ra lỗi trong quá trình thực hiện. Vui lòng thử lại sau",
        });
      }

      reslove(data);
    });
  });
};

const addImageNew = async (req) => {
  checkConnection();
  // uploadImage to server s3
  const imageUploaded = await aws.uploadImage(req.files);
  const data = {
    _id: req.body.id,
    arrImage: [
      {
        id: new ObjectID(),
        url: imageUploaded,
        description: req.body.description || "",
        isPrimary:
          req.body.isPrimary && req.body.isPrimary == "true" ? true : false,
      },
    ],
  };

  var New = schema.NewSchema();
  const oldIMG = await New.findOne({ _id: data._id }, "arrImage");
  if (oldIMG && oldIMG._id) {
    let newArrImg = [];
    if (req.body.isPrimary && req.body.isPrimary == "true") {
      let arrNonPri = [];
      oldIMG.arrImage.map((e) => {
        e.isPrimary = false;
        arrNonPri.push(e);
      });
      newArrImg = [...data.arrImage, ...arrNonPri];
    } else {
      newArrImg = [...data.arrImage, ...oldIMG.arrImage];
    }

    const res = await New.findOneAndUpdate(
      { _id: data._id },
      { $set: { arrImage: newArrImg } }
    );
    res.arrImage = newArrImg;
    return res;
  }
  return false;
};
const removeImageNew = async ({ idImg, idNew }) => {
  checkConnection();

  var New = schema.NewSchema();
  let oldIMG = await New.findOne({ _id: idNew }, "arrImage");
  if (oldIMG && oldIMG.arrImage) {
    const indexRM = oldIMG.arrImage.findIndex((e) => e.id == idImg);
    if (indexRM > -1) {
      oldIMG.arrImage.splice(indexRM, 1);
    } else {
      return "Không tìm thấy hình trong bài viết";
    }

    const res = await New.findOneAndUpdate(
      { _id: idNew },
      { $set: { arrImage: oldIMG.arrImage } }
    );
    res.arrImage = oldIMG.arrImage;
    return res;
  }
  return "Bài viết không có hình ảnh";
};

var sendMailRegister = (data) => {
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "leanhforevo@gmail.com",
      pass: "eqizmannsvpjidbf",
    },
  });

  var mailOptions = {
    from: `${configs.appName} <leanhforevo@gmail.com>`,
    to: "leanhforevo@gmail.com",
    subject: `${configs.appName} verify`,
    html: emailTemp.e(JSON.stringify(data)),
  };

  transporter.sendMail(mailOptions);
  return true;
};

var setTokenUser = async (data) => {
  checkConnection();

  var Users = schema.UserSchema();
  const timeRegis = new Date().getTime();

  let res = await Users.findOneAndUpdate(
    { _id: data._id },
    {
      $set: {
        notify: {
          token: data.token,
          time: timeRegis,
        },
      },
    }
  );
  if (res && res._id) {
    return res;
  }

  return false;
};

module.exports = {
  //user
  login,
  loginSocial,
  updatePassword,
  verifyCode,
  register,
  updateAvatar,
  // email
  createEMail,
  getListEmail,
  markReadEmail,
  //Collection
  getCollection,getAllCollection,
  createCollection,
  statusCollection,
  uploadImageCollection,
  //Create news
  getNew,
  createNew,
  addImageNew,
  removeImageNew,
  sendMailRegister,
  setTokenUser,
};
