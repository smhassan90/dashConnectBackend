import mongoose from "mongoose";

const integrationSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
    },
    platformName: {
        type: String,
        required: true
    },
    integrationName: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
},
    {
        timestamps: true,
    });

const integrationModel = mongoose.model("Integration", integrationSchema);
export default integrationModel;