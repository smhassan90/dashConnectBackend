import { INTERNALERROR, OK, BADREQUEST } from "../../constant/httpStatus.js";
import levelModel from "../../models/level.js";
import { responseMessages } from "../../constant/responseMessages.js";
import companyModal from "../../models/Company.js";
import userModel from "../../models/User.js";

export const getLevel = async (req, res) => {
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
        const companyExists = await companyModal.findById(companyId);
        if (!companyExists) {
            return res.status(FORBIDDEN).send({
                success: false,
                error: true,
                message: responseMessages.COMPANY_NOT_FOUND,
            });
        }
        const findLevel = await levelModel.find({ companyId });
        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.GET_LEVEL_SUCCESS,
            data: findLevel,
        });
    } catch (error) {
        return res.status(INTERNALERROR).send({
            success: false,
            error: true,
            message: error.message,
        });
    }
};
