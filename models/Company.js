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
    type: {type: String, default:null},
    url:{type:String, default:null},
    username: { type: String, default: null }, 
    password: { type: String, default: null },
    
  },
});

module.exports = mongoose.model("Company", companySchema);


