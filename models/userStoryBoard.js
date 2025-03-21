import mongoose from "mongoose";

const userStoryBoardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    storyBoardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StoryBoard",
        required: true,
    },
    priority:{
        type:Number,
        required:true,
        enum:[1,2],
        default:1
    }
},
    {
        timestamps: true,
    },
);

const userStoryBoardModel = mongoose.model("userStoryBoard", userStoryBoardSchema);
export default userStoryBoardModel;
