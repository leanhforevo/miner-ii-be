const DBV2 = require('../db/dbV2');
var schema = require("../db/schema");
var utils = require("../utils/utils")


module.exports = {
  getMining: (email, account) => {
    if (!account || !email) return null;
    return new Promise(async (resolve, reject) => {
      var Mining = schema.MineSchemaV2();
      var Users = schema.UserSchemaV2();
      console.log("account:", account)
      const checkUser = await Users.find({ email:email}).count();
      if(checkUser<=0){
        reject({
          error: true,
          msg: "Account not exist",
        });
      }
      console.log("checkUsercheckUser:",checkUser)
      const numberReffer = await Users.find({ referalFrom: account?.data?.username, active: true }).count();
      const beRerral = account.data.referalFrom ? true : false
      let defaultOBJ = new Mining({
        email: email,
        coin: 0,
        timemining: null,
        timeRemaining: null,
        caculatetime: null,
        timemineCaculate: null,
        timemineBonus: null,
        coinCaculate: null,
      })
      Mining.findOne(
        { email: email },
        "email coin timemining caculatetime timemineCaculate timemineBonus coinCaculate",
        (err, mineInfo) => {
          if (mineInfo?.timemining) {
            const mineInfoJSON = JSON.parse(JSON.stringify(mineInfo))
            let caculatetime = utils.caculateTime(mineInfoJSON, numberReffer, beRerral)
            resolve({
              ...mineInfoJSON,
              ...caculatetime,
              // timeRemaining: null,
              numberReffer
            });
          } else {
            defaultOBJ.isMining = false
            defaultOBJ.save(function (err, miner) {
              if (err)
                reject({
                  error: true,
                  msg: "Xảy ra lỗi trong quá trình thực hiện. Vui lòng thử lại sau",
                });
              resolve(defaultOBJ);
            });
          }
        })
    }).catch((error) => {
      return error;
    });
  },
  setMining: (email, account) => {
    if (!account || !email) return null;
    return new Promise(async (resolve, reject) => {
      var Mining = schema.MineSchemaV2();
      var MineHistory = schema.MineHistorySchemaV2();
      var Users = schema.UserSchemaV2();
      const numberReffer = await Users.find({ referalFrom: account?.username, active: true }).count();
      Mining.findOne(
        { email: email },
        "email coin timemining caculatetime timemineCaculate timemineBonus coinCaculate _id",
        async (err, mineInfo) => {
          console.log("err", err)
          console.log("mineInfo", mineInfo)

          if (mineInfo?.timemining) {
            const mineInfoJSON = JSON.parse(JSON.stringify(mineInfo))
            let caculatetime = utils.caculateTime(mineInfoJSON, numberReffer);
            const objData = {
              userid:mineInfo._id,
              email: email,
              timemining: mineInfoJSON.timemining,
              ...utils.objrate
            }
            if (!caculatetime.isMining) {
              await Mining.updateOne(
                { email: email },
                { $set: { coin: caculatetime.totalCoinNoReferral, timemining: objData.timemining } }
              );
              await MineHistory.collection.insertOne(objData);
              resolve({
                data: objData,
                msg: "set mining success"
              });
            }

            reject({
              data: objData,
              error: false,
              msg: "Still Mining!!",
            });
          } else {
            const mineInfoJSON = JSON.parse(JSON.stringify(mineInfo))
            const newTime = new Date().getTime()
            await Mining.updateOne(
              { email: email },
              { $set: { coin: 0, timemining: newTime } }
            );
            resolve({
              data: {
                ...mineInfoJSON,
                timemining: newTime
              },
              msg: "mining success for first"
            });
            // reject({
            //   error: true,
            //   msg: "Somthing went wrong!",
            // });
          }
        })
    }).catch((error) => {
      return error;
    });
  },
  getTopList: () => {

    return new Promise(async (resolve, reject) => {
      var Mining = schema.MineSchemaV2();
      var MineHistory = schema.MineHistorySchemaV2();
      // var Users = schema.UserSchemaV2();
      // const numberReffer = await Users.find({ referalFrom: account?.username,active:true }).count();
      const topList = await Mining.aggregate([
        {
          "$lookup": {
            "from": "users",
            "localField": "email",
            "foreignField": "email",
            "as": "userDoc"
          }
        },
        {
          "$set": {
            "username": {
              "$first": "$userDoc.username"
            },
            "userActive": {
              "$first": "$userDoc.active"
            },
          }
        },
        { "$unset": "userDoc" }
      ]).sort({ coin: -1 }).limit(2)

      console.log("topList:", topList)
      resolve(topList)
    }).catch((error) => {
      reject()
      return error;
    });
  },
}

