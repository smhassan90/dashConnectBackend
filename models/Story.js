import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
    storyName: {
        type: String,
        required: true,
        unique:true
    },
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
        enum: ["Line Chart", "Bar Chart", "Report"],
        required: true
    }
},
    {
        timestamps: true,
    },
);

const storyModel = mongoose.model("Story", storySchema);
export default storyModel;
