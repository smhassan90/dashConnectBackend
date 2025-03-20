import { INTERNALERROR, OK } from "../../constant/httpStatus.js";
import employeeModel from "../../models/Employee.js";
import { responseMessages } from "../../constant/responseMessages.js";
import storyBoardModel from "../../models/storyBoard.js";
import companyModal from "../../models/Company.js";
import userModel from "../../models/User.js";
import levelStoryBoardModel from "../../models/levelStoryBoard.js";
import levelModal from "../../models/level.js";

export const getSingleStoryBoard = async (req, res) => {
    try {
        const { storyBoardId } = req.params
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

        const storyBoard = await storyBoardModel.findById(storyBoardId)
        const levelStoryBoards = await levelStoryBoardModel.find({ storyBoardId: storyBoard._id })
        const levelIds = levelStoryBoards.map(level => level.levelId)
        const levels = await levelModal.find({ _id: { $in: levelIds } })

        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.GET_STORY_BOARDS,
            data: {
                ...storyBoard._doc,
                levels: levels.map(lv => ({
                    ...lv._doc
                }))
            },
        });
    } catch (error) {
        return res.status(INTERNALERROR).send({
            success: false,
            error: true,
            message: error.message,
        });
    }
};