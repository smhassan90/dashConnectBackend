const mongoose = require('mongoose')

const metaIntegationSchema = new mongoose.Schema({
    integration_id : {
        type: mongoose.Schema.Types.ObjectId,
        ref : "MasterIntegration",
        required : true,
    },
    apiName : {
        type : String,
    },
    apiStructure: {
        type:String,
      },
})

module.exports = mongoose.model("MetaIntegration" , metaIntegationSchema )