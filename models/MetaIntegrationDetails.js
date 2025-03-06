import mongoose from "mongoose";

const metaIntegrationDetail = new mongoose.Schema({
    integration_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Integration",
        required: true,
    },
    table_name:{
        type: String,
        required: true
    },
    columns: { type: Map, of: String }, // Use Map to store key-value pairs
    description: String,
},
{
    timestamps: true,
});


// module.exports = mongoose.model("metaIntegrationDetail", metaIntegrationDetail);
