import { INTERNALERROR, NOTALLOWED, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import employeeModel from "../../models/Employee.js";
import storyBoardModel from "../../models/storyBoard.js";
import userModel from "../../models/User.js";

export const updateStoryBoard = async (req, res) => {
    try {
        const { storyBoardId } = req.params
        const { storyBoardName, status } = req.body;
        const userId = req.userId;
        const userLevel = req.level
        const user = await userModel.findById(userId).select("company");
        if (!user) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.USER_NOT_FOUND,
            });
        }

        const storyBoard = await storyBoardModel.findById(storyBoardId);
        if (!storyBoard) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.STORY_NOT_FOUND,
            });
        }
        const payload = {
            storyBoardName: storyBoardName || storyBoard.storyBoardName,
            status: status || storyBoard.status,
        }

        const updatedStoryBoard = await storyBoardModel.findByIdAndUpdate(
            storyBoardId,
            { $set: payload },
            { new: true }
        );

        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.STORY_UPDATED,
            data: updatedStoryBoard,
        });
    } catch (error) {
        return res.status(INTERNALERROR).send({
            success: false,
            error: true,
            message: error.message,
        });
    }
};