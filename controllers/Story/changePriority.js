import { INTERNALERROR, NOTALLOWED, NOTFOUND, OK } from "../../constant/httpStatus.js";
import employeeModel from "../../models/Employee.js";
import { responseMessages } from "../../constant/responseMessages.js";
import userStoryBoardModel from "../../models/userStoryBoard.js";
import userModel from "../../models/User.js";
import storyBoardModel from "../../models/storyBoard.js";

export const changePriority = async (req, res) => {
    try {
        const { userId, storyBoardId } = req.body;
        const userIdd = req.userId;
        if (userIdd !== userId) {
            return res.status(NOTALLOWED).send({
                success: false,
                error: true,
                message: responseMessages.NOT_AUTHORIZED,
            });
        }
        const user = await userModel.findById(userIdd);
        if (!user) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.USER_NOT_FOUND,
            });
        }
        const employee = await userModel.findById(userId);
        if (!employee) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.EMPLOYEE_NOT_FOUND,
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
        // const findUserStoryBoard = await userStoryBoardModel.find({ userId, priority: 1 })
        const updatePreviousPriority = await userStoryBoardModel.findOneAndUpdate({ userId,priority: 1 },{priority: 2})
        const updateLatestPriority = await userStoryBoardModel.findOneAndUpdate({ userId,storyBoardId },{priority: 1})

        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.PRIORITY_CHANGE,
        });
    } catch (error) {
        return res.status(INTERNALERROR).send({
            success: false,
            error: true,
            message: error.message,
        });
    }
};