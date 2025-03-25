import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
    storyBoardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StoryBoard",
        required: true,
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
    storyName: {
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
