const mongoose = require('mongoose');

// Company Schema
const companySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    unique: true,
  },
  updateDate: {
    type: Date,
    default: Date.now,
  },
  Status: {
    type: Number,
    default: 1,
  },
});

module.exports = mongoose.model("Company", companySchema);
