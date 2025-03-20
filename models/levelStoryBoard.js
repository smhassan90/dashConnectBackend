import mongoose from "mongoose";

const levelStoryBoardSchema = new mongoose.Schema({
    levelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Level",
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

const levelStoryBoardModel = mongoose.model("LevelStoryBoard", levelStoryBoardSchema);
export default levelStoryBoardModel;
