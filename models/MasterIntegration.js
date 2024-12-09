const mongoose = require('mongoose')

const masterintegrationSchema = new mongoose.Schema({
    masterintegration:{
        name : String,
    }
})


module.exports = mongoose.model("MasterIntegration" , masterintegrationSchema)