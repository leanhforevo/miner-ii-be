var mongoose = require("mongoose");
const configs = require("../configs.json")
var dbURI = 'mongodb+srv://nokeynoway:ANOjTSskXVQrX6N1@cluster0.u59h2.mongodb.net/?retryWrites=true&w=majority';
mongoose.connect(dbURI, { useNewUrlParser: true, useFindAndModify: false });
const open = () => {
    mongoose.connect(dbURI, { useNewUrlParser: true, useFindAndModify: false });
}
const close = () => {
    mongoose.connection.close()
}
module.exports = {
    open, close, mongoose
}