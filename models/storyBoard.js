import mongoose from "mongoose";

const storyBoardSchema = new mongoose.Schema({
    storyBoardName: {
        type: String,
        required: true,
    },
    graphLimit: {
        type: Number,
        default: 10
    },
    graphAvail: {
        type: Number,
        default: 0
    },
    status: {
        type: Number,
        enum: [1, 2],
        default: 1
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

const storyBoardModel = mongoose.model("StoryBoard", storyBoardSchema);
export default storyBoardModel;