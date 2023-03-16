const DBV2 = require('../db/dbV2');
var schema = require("../db/schema");
var utils = require("../utils/utils")


module.exports = {
  getMining: (email, account) => {
    if (!account || !email) return null;
    return new Promise(async (resolve, reject) => {
      var Mining = schema.MineSchemaV2();
      var Users = schema.UserSchemaV2();
      const numberReffer = await Users.find({ referalFrom: account?.username,active:true }).count()
      let defaultOBJ = new Mining({
        email: email,
        coin: 0,
        timemining: null,
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
            let caculatetime = utils.caculateTime(mineInfoJSON, numberReffer)
            resolve({
              ...mineInfoJSON,
              ...caculatetime,
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
      var Users = schema.UserSchemaV2();
      const numberReffer = await Users.find({ referalFrom: account?.username,active:true }).count();
      Mining.findOne(
        { email: email },
        "email coin timemining caculatetime timemineCaculate timemineBonus coinCaculate",
        async (err, mineInfo) => {
          console.log("err", err)
          console.log("mineInfo", mineInfo)

          if (mineInfo?.timemining) {
            const mineInfoJSON = JSON.parse(JSON.stringify(mineInfo))
            let caculatetime = utils.caculateTime(mineInfoJSON, numberReffer);

            const newTime = new Date().getTime()
            if (!caculatetime.isMining) {
               await Mining.updateOne(
                { email: email },
                { $set: { coin: caculatetime.totalCoin, timemining: newTime } }
              );
              resolve({
                data: {
                  ...mineInfoJSON,
                  timemining: newTime
                },
                msg: "mining success"
              });
            }

            reject({
              error: true,
              msg: "Still Mining!!",
            });
          } else {
            reject({
              error: true,
              msg: "Somthing went wrong!",
            });
          }
        })
    }).catch((error) => {
      return error;
    });
  }
}

