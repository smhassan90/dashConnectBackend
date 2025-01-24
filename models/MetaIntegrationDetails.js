const mongoose = require("mongoose")

const metaIntegrationDetail = new mongoose.Schema({
    integration_id: String,
    table_name: String,
    columns: [String],
    updateDate: { type: Date, default: Date.now },
    description: String,
})


module.exports = mongoose.model("metaIntegrationDetail",metaIntegrationDetail)