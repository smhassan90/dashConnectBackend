import { INTERNALERROR, OK } from "../../constant/httpStatus.js";
import employeeModel from "../../models/Employee.js";
import { responseMessages } from "../../constant/responseMessages.js";
import storyBoardModel from "../../models/storyBoard.js";
import companyModal from "../../models/Company.js";
import userModel from "../../models/User.js";
import integrationModel from "../../models/IntegrationCredentials.js";

export const addStoryBoard = async (req, res) => {
    try {
        const { storyBoardName, integrationId } = req.body;
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
        const integrationExists = await integrationModel.findById(integrationId);
        if (!integrationExists) {
            return res.status(FORBIDDEN).send({
                success: false,
                error: true,
                message: responseMessages.INTEGRATION_NOT_FOUND,
            });
        }
        const storyPayload = {
            storyBoardName,
            integrationId,
            companyId
        }
        const newStory = new storyBoardModel(storyPayload);
        const savedStoryBoard = await newStory.save();

        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.STORY_BOARD_SAVED,
            data: savedStoryBoard,
        });
    } catch (error) {
        return res.status(INTERNALERROR).send({
            success: false,
            error: true,
            message: error.message,
        });
    }
};