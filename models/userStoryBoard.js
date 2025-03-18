import mongoose from "mongoose";

const userStoryBoardSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: true,
    },
    storyBoardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StoryBoard",
        required: true,
    },
},
    {
        timestamps: true,
    },
);

const userStoryBoardModel = mongoose.model("userStoryBoard", userStoryBoardSchema);
export default userStoryBoardModel;
