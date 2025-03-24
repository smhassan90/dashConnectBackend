import { INTERNALERROR, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import userModel from "../../models/User.js";
import metaIntegrationModel from "../../models/MetaIntegrationDetails.js";
export const getMetaIntegration = async (req, res) => {
    try {
        const { integrationId } = req.params
        const userId = req.userId;
        const user = await userModel.findById(userId).select("company");
        if (!user) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.USER_NOT_FOUND,
            });
        }
        const findMetaIntegration = await metaIntegrationModel.find({ integrationId});
        if (!findMetaIntegration) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.META_INTEGRATION_NOT_FOUND,
            });
        }
        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.META_INTEGRATION_FOUND,
            data: findMetaIntegration
        });
    } catch (error) {
        return res.status(INTERNALERROR).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}