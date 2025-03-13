import { NOTFOUND } from "../../constant/httpStatus";
import { responseMessages } from "../../constant/responseMessages";
import storyModel from "../../models/Story";
import userModel from "../../models/User";

export const getStoryData = async (req, res) => {
    try {
        const { data } = req.body
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
            data: findStories
        });
    } catch (error) {

    }
}