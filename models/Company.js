const mongoose = require('mongoose');


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
  integration: {
    username: { type: String, default: null }, 
    password: { type: String, default: null }, 
  },
});

module.exports = mongoose.model("Company", companySchema);
