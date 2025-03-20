import { INTERNALERROR, OK, BADREQUEST } from "../../constant/httpStatus.js";
import levelModel from "../../models/level.js";
import { responseMessages } from "../../constant/responseMessages.js";
import userModel from "../../models/User.js";
import companyModal from "../../models/Company.js";

export const addLevel = async (req, res) => {
    try {
        const { displayName, levelNumber } = req.body;
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
        if (!displayName || !levelNumber) {
            return res.status(BADREQUEST).send({
                success: false,
                error: true,
                message: responseMessages.MISSING_FIELDS,
            });
        }
        const existingLevel = await levelModel.findOne({ companyId, levelNumber });
        if (existingLevel) {
            return res.status(BADREQUEST).send({
                success: false,
                error: true,
                message: responseMessages.LEVEL_ALREADY_EXISTS,
            });
        }

        const newLevel = new levelModel({
            displayName,
            levelNumber,
            companyId
        });
        const savedLevel = await newLevel.save();

        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.LEVEL_SAVED,
            data: savedLevel,
        });
    } catch (error) {
        return res.status(INTERNALERROR).send({
            success: false,
            error: true,
            message: error.message,
        });
    }
};
