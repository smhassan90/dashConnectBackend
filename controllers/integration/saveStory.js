import { INTERNALERROR, NOTALLOWED, NOTFOUND, OK } from "../../constant/httpStatus.js";
import userModel from "../../models/User.js";
import { responseMessages } from "../../constant/responseMessages.js";
import storyModel from "../../models/Story.js";
import storyBoardModel from "../../models/storyBoard.js";
import mysql from "mysql2";
import dotenv from "dotenv";

export const saveStory = async (req, res) => {
    try {
        const { storyBoardId } = req.params
        const { storyName, query, resultType } = req.body;
        const userId = req.userId;

        const user = await userModel.findById(userId).select("company");
        if (!user) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.USER_NOT_FOUND,
            });
        }
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
        const companyId = user.company;
        if (!companyId) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.COMPANY_NOT_FOUND,
            });
        }

        if (!query || !resultType) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.MISSING_FIELDS,
            });
        }
        const findStoryBoard = await storyBoardModel.findById(storyBoardId)
        const checkGraphsLimit = await storyModel.countDocuments({ storyBoardId })
        if (checkGraphsLimit > findStoryBoard.graphLimit) {
            return res.status(NOTALLOWED).send({
                success: false,
                error: false,
                message: responseMessages.STORY_LIMIT_FULL,
            });
        }

        const newStory = new storyModel({
            storyBoardId,
            storyName,
            companyId,
            query,
            resultType,
        });

        await newStory.save();
        const result = await new Promise((resolve, reject) => {
            pool.query(query, (error, results) => {
                if (error) {
                    console.error("Database query error:", error);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
        await storyBoardModel.findByIdAndUpdate(storyBoardId, { $inc: { graphAvail: 1 } })
        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.STORY_SAVED_SUCCESS,
            data: {
                ...newStory._doc,
                data:result
            },
        });
    } catch (error) {
        return res.status(INTERNALERROR).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}