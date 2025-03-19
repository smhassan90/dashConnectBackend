import { INTERNALERROR, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import employeeModel from "../../models/Employee.js";
import storyBoardModel from "../../models/storyBoard.js";
import userModel from "../../models/User.js";
import userStoryBoardModel from "../../models/userStoryBoard.js";

export const getSingleEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params
        const userId = req.userId;
        const user = await userModel.findById(userId).select("company");
        if (!user) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.USER_NOT_FOUND,
            });
        }
        const companyId = user.company
        const employee = await userModel.findById(employeeId)

        const userStoryBoards = await userStoryBoardModel.find({ userId: employee._id })
        const storyBoardIds = userStoryBoards.map(story => story.storyBoardId)
        const storyBoards = await storyBoardModel.find({ _id: { $in: storyBoardIds } });
        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.GET_EMPLOYEES,
            data: {
                ...employee._doc,
                storyBoards: storyBoards.map(sb => ({
                    ...sb._doc
                }))
            }
        });
    } catch (error) {
        return res.status(INTERNALERROR).send({
            success: false,
            error: true,
            message: error.message,
        });
    }
};