import { INTERNALERROR, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import storyModel from "../../models/Story.js";
import userModel from "../../models/User.js";
import mysql from "mysql2";
import dotenv from "dotenv";
import storyBoardModel from "../../models/storyBoard.js";
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT),
    queueLimit: 0,
    connectTimeout: parseInt(process.env.DB_TIMEOUT),
});
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