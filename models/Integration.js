const mongoose = require("mongoose");

const integrationSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  apiName: String, 
  data: mongoose.Schema.Types.Mixed,
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Integration", integrationSchema);
