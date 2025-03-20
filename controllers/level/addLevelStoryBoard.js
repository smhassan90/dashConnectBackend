import { INTERNALERROR, OK, BADREQUEST, NOTFOUND } from "../../constant/httpStatus.js";
import levelStoryBoardModel from "../../models/levelStoryBoard.js";
import levelModel from "../../models/level.js";
import storyBoardModel from "../../models/storyBoard.js";
import { responseMessages } from "../../constant/responseMessages.js";
import userModel from "../../models/User.js";
import companyModal from "../../models/Company.js";

export const addLevelStoryBoard = async (req, res) => {
    try {
        const { levelId, storyBoardId } = req.body;
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
        if (!levelId || !storyBoardId) {
            return res.status(BADREQUEST).send({
                success: false,
                error: true,
                message: responseMessages.MISSING_FIELDS,
            });
        }
        const levelExists = await levelModel.findOne({ companyId, _id: levelId });
        if (!levelExists) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.LEVEL_NOT_FOUND,
            });
        }
        const existingRelation = await levelStoryBoardModel.findOne({ levelId, storyBoardId });
        if (existingRelation) {
            return res.status(BADREQUEST).send({
                success: false,
                error: true,
                message: responseMessages.LEVEL_STORY_BOARD_EXISTS,
            });
        }

        const newLevelStoryBoard = new levelStoryBoardModel({ levelId, storyBoardId });
        const savedLevelStoryBoard = await newLevelStoryBoard.save();

        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.LEVEL_STORY_BOARD_SAVED,
            data: savedLevelStoryBoard,
        });
    } catch (error) {
        return res.status(INTERNALERROR).send({
            success: false,
            error: true,
            message: error.message,
        });
    }
};
