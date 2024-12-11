const mongoose = require("mongoose");

const integrationSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  apiName: String,
  data: mongoose.Schema.Types.Mixed,
  date: { type: Date, default: Date.now },
  lastSyncTime: { type: Date, default: null },  // This field stores the timestamp of the last sync
  message: { type: String, default: null },  // New field to store message like "No updated data fetch"
});

module.exports = mongoose.model("Integration", integrationSchema);
