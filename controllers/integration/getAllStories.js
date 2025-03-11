import { INTERNALERROR, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import storyModel from "../../models/Story.js";
import userModel from "../../models/User.js";

export const getAllStories = async (req, res) => {
    try {
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

        const findStories = await storyModel.find({ companyId })
        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.GET_ALL_STORY,
            data:findStories
        });
    } catch (error) {
        return res.status(INTERNALERROR).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}