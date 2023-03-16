const schedule = require("node-schedule");
const fs = require("fs");
var path = require("path");
const jwt = require("jsonwebtoken");
const tmpDir = path.join(__dirname + "/../tmp/");
console.log("------------------------------------");
console.log(tmpDir);
console.log("------------------------------------");
const removeAccent = (str) => {
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/ |/g, "");

  return str;
};
const cleanTMP = () => {
  const cleanUpSchedule = "0 0 2 * * *"; // 2 h check remove tmp
  schedule.scheduleJob(cleanUpSchedule, function () {
    console.log("running job: clean up tmp files");
    fs.readdir(tmpDir, { withFileTypes: true }, (err, files) => {
      if (err) {
        console.warn("unable to read temp files directory");
        console.log(err);
        return;
      }
      if (Array.isArray(files)) {
        const time = new Date().getTime(); //get ms since epoch
        //because of withFileTypes option, files are fs.Dirent objects instead of just string filenames.
        files.forEach((file) => {
          //make sure its a file before proceeding
          if (file.isFile()) {
            fs.stat(tmpDir + file.name, (err, stats) => {
              if (err) {
                console.warn("unable to fs.stat() file %s", file.name);
                console.log(err);
                return;
              }
              //if the time the file created is greater than or equal to 1 hour, delete it
              if (stats.birthtimeMs - time >= 3.6e6) {
                console.log("removing temp file %s", file.name);
                fs.unlink(tmpDir + file.name, (err) => {
                  if (err) {
                    console.warn("unable to remove temp file %s", file.name);
                  } else {
                    console.log("temp file %s removed", file.name);
                  }
                });
              } else {
                console.log(
                  "the temp file %s will not be removed due to not being old enough.",
                  file.name
                );
              }
            });
          }
        });
      }
    });
  });
};
const createToken = (data) => {
  return new Promise((res, rej) => {
    jwt.sign(
      { data: data },
      "secretSignature",
      {
        algorithm: "HS256",
        expiresIn: 999999999,
      },
      (error, token) => {
        if (error) {
          res(error);
        }
        res({
          infor: data,
          token: token,
          expired: new Date().getTime() + 999999999,
        });
      }
    );
  });
};
const parseTime = 1000

const objrate = {
  timeRate: 43200 * parseTime, //12h
  rate: 0.00832 / parseTime,
  bonus: 100,
  bonusReferal: 20
}
const caculateTime=(mineInfo,numberReffer=0)=>{
  console.log("numberReffer:",numberReffer)
  const timeNow = new Date().getTime();
  let caculatetime = timeNow - parseInt(mineInfo.timemining)
  if (caculatetime > objrate.timeRate||caculatetime<=0) {
    caculatetime = objrate.timeRate
  }
  const coinCaculate = (caculatetime / 60 / 60 * objrate.rate)||0
  const coinBonus = (coinCaculate * objrate.bonus / 100)||0
  const coinReferBonus = (coinCaculate * (objrate.bonusReferal/100*numberReffer))||0
  const totalCoin = parseFloat(mineInfo.coin) + parseFloat(coinCaculate) + parseFloat(coinBonus)+parseFloat(coinReferBonus)
  return {
    caculatetime,
    coinCaculate,
    coinBonus,
    coinReferBonus,
    totalCoin,

    isMining:caculatetime>=objrate.timeRate?false:true
  }
}
module.exports = {
  removeAccent,
  cleanTMP,
  createToken,
  caculateTime,
  objrate
};
