import { INTERNALERROR, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import storyModel from "../../models/Story.js";
import userModel from "../../models/User.js";
import integrationModel from "../../models/IntegrationCredentials.js";
import mysql from "mysql2";
import dotenv from "dotenv";
import storyBoardModel from "../../models/storyBoard.js";
import { checkIntegration } from "../../utils/checkInteration.js";
dotenv.config();

export const getAllStories = async (req, res) => {
    try {
        const userId = req.userId;
        const { storyBoardId } = req.params
        const user = await userModel.findById(userId).select("company");
        if (!user) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.USER_NOT_FOUND,
            });
        }
        const storyBoard = await storyBoardModel.findById(storyBoardId);
        if (!storyBoard) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.STORY_NOT_FOUND,
            });
        }
        const findIntegration = await integrationModel.findById(storyBoard.integrationId)
        const { pool } = await checkIntegration(findIntegration)
        const findStories = await storyModel.find({ storyBoardId })
        const result = await Promise.all(
            findStories.map((story) => {
                return new Promise((resolve, reject) => {
                    pool.query(story.query, (error, results) => {
                        if (error) {
                            console.error("Database query error:", error);
                            reject(error);
                        } else {
                            resolve({
                                ...story._doc,
                                data: results
                            });
                        }
                    });
                });
            })
        );
        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.GET_ALL_STORY,
            data: result
        });
    } catch (error) {
        return res.status(INTERNALERROR).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}