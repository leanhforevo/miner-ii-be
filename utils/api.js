const axios = require("axios");
const urlNotificationPush = "https://exp.host/--/api/v2/push/send";
const getUserSocial = async ({ accessToken, apiKey }) => {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
  return axios
    .post(url, { idToken: accessToken })
    .then(function (response) {
      console.log(response.data);
      return response.data;
    })
    .catch(function (error) {
      console.log(error);
      return null;
    });
};
const sendNotification = async ({ token, title, body, data }) => {
  if (!token) return null;
  var bodyPOST = {
    to: token,
    sound: "default",
    title: title,
    body: body,
    data: data,
    _displayInForeground: true,
  };

  return axios
    .post(urlNotificationPush, bodyPOST)
    .then(function (response) {
      console.log(response.data);
      return response.data;
    })
    .catch(function (error) {
      console.log(error);
      return null;
    });
};
module.exports = {
  getUserSocial,
  sendNotification,
};
