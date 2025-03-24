import { FORBIDDEN, NOTALLOWED, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import integrationModel from "../../models/IntegrationCredentials.js";
import metaIntegrationModel from "../../models/MetaIntegrationDetails.js";
import userModel from "../../models/User.js";
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
}).promise();

export const updateMetaIntegrationDetails = async (req, res) => {
    try {
        const { integrationId } = req.params
        const { tableName, description } = req.body;
        const userId = req.userId;

        // Fetch the user data using userId
        const user = await userModel.findById(userId).select("company");
        if (!user) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.USER_NOT_FOUND,
            });
        }

        const companyId = user.company;
        const findIntegration = await integrationModel.findById(integrationId);
        if (!findIntegration) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.INTEGRATION_NOT_FOUND,
            });
        }
        const findTables = await metaIntegrationModel.find({ integrationId })
        const checkTableExist = findTables.some((tab) => tab.tableName === tableName)
        if (checkTableExist) {
            return res.status(FORBIDDEN).send({
                success: false,
                error: true,
                message: `Table ${tableName} is Already Exist`,
            });
        }
        const [tableExists] = await pool.query("SHOW TABLES LIKE ?", [tableName]);
        if (tableExists.length === 0) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: `Table ${tableName} Not Found`,
            });
        }
        const [columns] = await pool.query("DESCRIBE ??", [tableName]);
        const columnDetails = {};
        columns.forEach((col) => {
            columnDetails[col.Field] = col.Type;
        });

        // Save metadata
        const metaDetails = new metaIntegrationModel({
            integrationId,
            tableName,
            columns: columnDetails,
            description,
        });

        await metaDetails.save();
        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.TABLE_ADD,
        });
    } catch (error) {
        return res.status(INTERNALERROR).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}