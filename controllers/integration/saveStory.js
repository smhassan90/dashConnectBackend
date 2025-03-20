import { INTERNALERROR, NOTALLOWED, NOTFOUND, OK } from "../../constant/httpStatus.js";
import userModel from "../../models/User.js";
import { responseMessages } from "../../constant/responseMessages.js";
import storyModel from "../../models/Story.js";
import storyBoardModel from "../../models/storyBoard.js";

export const saveStory = async (req, res) => {
    try {
        const { storyBoardId } = req.params
        const { storyName, query, resultType } = req.body;
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
        if (!companyId) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.COMPANY_NOT_FOUND,
            });
        }

        if (!query || !resultType) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.MISSING_FIELDS,
            });
        }
        const findStoryBoard = await storyBoardModel.findById(storyBoardId)
        const checkGraphsLimit = await storyModel.countDocuments({ storyBoardId })
        if (checkGraphsLimit < findStoryBoard.graphLimit) {
            return res.status(NOTALLOWED).send({
                success: false,
                error: false,
                message: responseMessages.STORY_LIMIT_FULL,
            });
        }

        const newStory = new storyModel({
            storyBoardId,
            storyName,
            companyId,
            query,
            resultType,
        });

        await newStory.save();

        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.STORY_SAVED_SUCCESS,
            data: newStory,
        });
    } catch (error) {
        return res.status(INTERNALERROR).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}