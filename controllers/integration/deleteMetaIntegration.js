import { INTERNALERROR, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import userModel from "../../models/User.js";
import metaIntegrationModel from "../../models/MetaIntegrationDetails.js";
export const deleteMetaIntegration = async (req, res) => {
    try {
        const { metaIntegrationId } = req.params
        const userId = req.userId;
        const user = await userModel.findById(userId).select("company");
        if (!user) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.USER_NOT_FOUND,
            });
        }
        const deleteMetaIntegration = await metaIntegrationModel.findByIdAndDelete(metaIntegrationId);
        if (!deleteMetaIntegration) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.META_INTEGRATION_NOT_FOUND,
            });
        }
        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.DELETE_INTEGRATION_FOUND,
        });
    } catch (error) {
        return res.status(INTERNALERROR).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}