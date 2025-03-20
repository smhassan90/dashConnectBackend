import { FORBIDDEN, INTERNALERROR, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import companyModal from "../../models/Company.js";
import userModel from "../../models/User.js";
import levelStoryBoardModel from "../../models/levelStoryBoard.js";

export const deleteLevelForStory = async (req, res) => {
    try {
        const { storyBoardId, levelId } = req.query
        const userIdd = req.userId;
        const user = await userModel.findById(userIdd).select("company");
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
        const deleteStory = await levelStoryBoardModel.findOneAndDelete({ storyBoardId, levelId })

        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.DELETE_STORY_LEVEL,
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