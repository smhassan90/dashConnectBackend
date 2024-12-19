const mongoose = require("mongoose");

const csvSchema = new mongoose.Schema({
  id: { type: String },
  Name: { type: String },
  CellNo: { type: String },
  gender: { type: String }
});

module.exports = mongoose.model("CSV", csvSchema);