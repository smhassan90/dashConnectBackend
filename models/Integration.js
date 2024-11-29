// models/Integration.js
const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
  apiName: { type: String, required: true },
  data: { type: Object, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Integration', integrationSchema);
