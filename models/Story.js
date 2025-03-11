import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
    },
    query: {
        type: String,
        required: true
    },
    resultType: {
        type: String,
        enum: ["lineGraph", "barChart", "report"],
        required: true
    }
},
    {
        timestamps: true,
    },
);

const storyModel = mongoose.model("Story", storySchema);
export default storyModel;
