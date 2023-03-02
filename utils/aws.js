var AWS = require("aws-sdk");
var Utils = require("./utils");
const fs = require("fs");
var path = require("path");

const BUCKET = "niceappbucket";
const REGION = "ap-southeast-1";
const ACCESS_KEY = "AKIAVSFS6VMCCIJGSTFV";
const SECRET_KEY = "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";

AWS.config.update({
  accessKeyId: ACCESS_KEY,
  secretAccessKey: SECRET_KEY,
  region: REGION,
});
const uploadImage = async (files) => {
  try {
    const ImageData = files.image;
    if (Array.isArray(ImageData)) {
      const res = await Promise.all(
        ImageData.map(async (e) => {
          const data = await UploadToS3(e);
          return data;
        })
      );

      return res;
    } else {
      const data = await UploadToS3(ImageData);
      return data;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};
const UploadToS3 = (file) => {
  const FileName =
    new Date().getTime() +
    Utils.removeAccent(file && file.name ? file.name : "-");
  return new Promise((res, rej) => {
    fs.readFile(file.tempFilePath, (err, uploadedData) => {
      if (err) res(null);
      const fileContent = fs.readFileSync(file.tempFilePath);
      var s3 = new AWS.S3();
      s3.upload({
        Bucket: BUCKET,
        Body: fileContent,
        ACL: "public-read",
        Key: FileName,
      })
        .promise()
        .then((response) => {
          fs.unlink(file.tempFilePath, function (err) {
            if (err) {
              console.error(err);
            }
            console.log("Temp File Delete:", file.tempFilePath);
          });
          console.log(`done! - `, response);
          res(response.Location);
        })
        .catch((err) => {
          console.log("failed:", err);
          res(null);
        });
    });
  });
};
module.exports = {
  uploadImage,
};
