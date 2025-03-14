import { INTERNALERROR, OK } from "../../constant/httpStatus.js";
import employeeModel from "../../models/Employee.js";
import { responseMessages } from "../../constant/responseMessages.js";
import storyBoardModel from "../../models/storyBoard.js";

export const userStory = async (req, res) => {
    try {
        const { employeeId,StoryBoardId } = req.body;
        const userId = req.userId;
        const employee = await employeeModel.findById(userId);
        if (!employee) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.EMPLOYEE_NOT_FOUND,
            });
        }
        const storyPayload = {
            storyBoardName
        }
        const newStory = new storyBoardModel(storyPayload);
        const savedStoryBoard = await newStory.save();

        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.STORY_BOARD_SAVED,
            data: savedStoryBoard,
        });
    } catch (error) {
        return res.status(INTERNALERROR).send({
            success: false,
            error: true,
            message: error.message,
        });
    }
};