const mongoose = require('mongoose');


const companySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    unique: true,
  },
  abcd:{
    type: String
  },
  updateDate: {
    type: Date,
    default: Date.now,
  },
  Status: {
    type: Number,
    default: 1,
  },
  integrations: [{
    name: {type: String, default: "Acuity"},
    username: { type: String, default: null }, 
    password: { type: String, default: null }, 
    //type? //basic? oath1, oath2
  }],
});

module.exports = mongoose.model("Company", companySchema);
