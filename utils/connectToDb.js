const mongoose = require("mongoose");
const { mongoURI } = require("../config");

function connectToDb() {
  if (mongoose.connection.readyState == 0) {
    mongoose
      .connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
      })
      .then(() => console.log("Mongo Connected"))
      .catch(err => console.log("Error Connecting to mongo: " + err));
  }
}

module.exports = connectToDb;
