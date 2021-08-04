const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DetailsSchema = new Schema({}, { strict: false });

DetailsSchema.set("autoIndex", true);
DetailsSchema.index({ url: 1 });

module.exports = ResponseStore = mongoose.model("turo_daily", DetailsSchema);
