import { INTERNALERROR, OK } from "../../constant/httpStatus.js";
import employeeModel from "../../models/Employee.js";
import { responseMessages } from "../../constant/responseMessages.js";
import storyBoardModel from "../../models/storyBoard.js";
import companyModal from "../../models/Company.js";
import userModel from "../../models/User.js";
import userStoryBoardModel from "../../models/userStoryBoard.js";

export const deleteStoryForEmployee = async (req, res) => {
    try {
        const { storyBoardId, employeeId } = req.query
        const userId = req.userId;
        const user = await userModel.findById(userId).select("company");
        if (!user) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.USER_NOT_FOUND,
            });
        }
        const companyId = user.company;
        const companyExists = await companyModal.findById(companyId);
        if (!companyExists) {
            return res.status(FORBIDDEN).send({
                success: false,
                error: true,
                message: responseMessages.COMPANY_NOT_FOUND,
            });
        }
        const deleteStory = await userStoryBoardModel.findOneAndDelete({storyBoardId,employeeId})

        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.DELETE_STORY_BOARD,
            data: "",
        });
    } catch (error) {
        return res.status(INTERNALERROR).send({
            success: false,
            error: true,
            message: error.message,
        });
    }
};