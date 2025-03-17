import { INTERNALERROR, OK } from "../../constant/httpStatus.js";
import employeeModel from "../../models/Employee.js";
import { responseMessages } from "../../constant/responseMessages.js";
import userStoryBoardModel from "../../models/userStoryBoard.js";
import userModel from "../../models/User.js";
import storyBoardModel from "../../models/storyBoard.js";

export const addStoryForEmployee = async (req, res) => {
    try {
        const { employeeId,StoryBoardId } = req.body;
        const userId = req.userId;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.USER_NOT_FOUND,
            });
        }
        const employee = await employeeModel.findById(employeeId);
        if (!employee) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.EMPLOYEE_NOT_FOUND,
            });
        }
        const storyBoard = await storyBoardModel.findById(StoryBoardId);
        if (!storyBoard) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.STORY_NOT_FOUND,
            });
        }
        const Payload = {
            employeeId,
            StoryBoardId
        }
        const addUserStory = new userStoryBoardModel(Payload);
        const savedUserStory = await addUserStory.save();

        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.ADD_STORYBORD_USER,
            data: savedUserStory,
        });
    } catch (error) {
        return res.status(INTERNALERROR).send({
            success: false,
            error: true,
            message: error.message,
        });
    }
};