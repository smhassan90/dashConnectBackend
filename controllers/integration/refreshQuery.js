import { BADREQUEST, INTERNALERROR, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import integrationModel from "../../models/IntegrationCredentials.js";
import metaIntegrationModel from "../../models/MetaIntegrationDetails.js";
import userModel from "../../models/User.js";
import OpenAI from "openai";
import mysql from "mysql2";
import dotenv from "dotenv";
import storyBoardModel from "../../models/storyBoard.js";
import { checkIntegration } from "../../utils/checkInteration.js";
dotenv.config();

export const refreshQuery = async (req, res) => {
    try {
        const { Query } = req.body;
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
        if (!companyId) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.COMPANY_NOT_FOUND,
            });
        }
        const findStoryBoard = await storyBoardModel.findById(storyBoardId);
        if (!findStoryBoard) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.STORY_BOARD_NOT_FOUND,
            });
        }
        const findIntegration = await integrationModel.findById(
            findStoryBoard?.integrationId
        );
        if (!findIntegration) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.INTEGRATION_NOT_FOUND,
            });
        }
        const { pool } = await checkIntegration(findIntegration);
        const findMetaIntegration = await metaIntegrationModel.find({
            integrationId: findIntegration._id,
        });

        if (!findMetaIntegration.length) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.INTEGRATION_DATA_NOT_FOUND,
            });
        }
        pool.query(Query, (error, results, fields) => {
            if (error) {
                console.error("Database query error:", error);
                return;
            }
            return res.status(OK).json({
                error: false,
                success: true,
                message: responseMessages.REFRESH_DATA,
                data: results
            });
        });
    } catch (error) {
        return res.status(INTERNALERROR).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}