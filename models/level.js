import mongoose from "mongoose";

const levelSchema = new mongoose.Schema({
    displayName: {
        type: String,
        required: true,
    },
    levelNumber: {
        type: Number,
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
    },
},
    {
        timestamps: true,
    },
);

const levelModel = mongoose.model("Level", levelSchema);
export default levelModel;
