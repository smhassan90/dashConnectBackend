import { BADREQUEST, INTERNALERROR, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import integrationModel from "../../models/IntegrationCredentials.js";
import metaIntegrationModel from "../../models/MetaIntegrationDetails.js";
import userModel from "../../models/User.js";
import OpenAI from "openai";
import mysql from "mysql2";
import dotenv from "dotenv";
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

export const refreshQuery = async (req, res) => {
    try {
        const { Query} = req.body;
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
        const findIntegration = await integrationModel.findOne({
            companyId,
        });
        if (!findIntegration) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.INTEGRATION_NOT_FOUND,
            });
        }

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