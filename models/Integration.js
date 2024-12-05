const mongoose = require("mongoose");

const integrationSchema = new mongoose.Schema({
  apiName: String,
  data: mongoose.Schema.Types.Mixed,
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Integration", integrationSchema);