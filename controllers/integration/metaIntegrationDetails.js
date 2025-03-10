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

export const MetaIntegrationDetails = async (req, res) => {
    try {
        const { tables } = req.body;
        const userId = req.userId;

        // Fetch the user data using userId
        const user = await userModel.findById(userId).select("company");
        if (!user) {
            return res.status(NOTFOUND).send({
                status: false,
                error: true,
                message: responseMessages.USER_NOT_FOUND,
            });
        }

        const companyId = user.company;
        const findIntegration = await integrationModel.findOne({
            companyId,
        });
        if (!findIntegration) {
            return res.status(NOTFOUND).send({
                status: false,
                error: true,
                message: responseMessages.INTEGRATION_NOT_FOUND,
            });
        }
        const integrationId = findIntegration._id;

        if (!tables || !Array.isArray(tables)) {
            return res.status(FORBIDDEN).send({
                status: false,
                error: true,
                message: responseMessages.PROVIDE_TABLES,
            });
        }
        let responseData = [];
        let errors = [];
        for (const table of tables) {
            try {
                const { tableName, description } = table;
                if (!tableName || !description) {
                    errors.push({
                        tableName: tableName || "Unknown",
                        status: false,
                        error: true,
                        message: responseMessages.PROVIDE_NAME_DESC,
                    });
                    continue;
                }

                const [tableExists] = await pool.query("SHOW TABLES LIKE ?", [tableName]);
                if (tableExists.length === 0) {
                    errors.push({
                        tableName,
                        status: false,
                        error: true,
                        message: `${tableName} ${responseMessages.TABLE_NOT_FOUND}`,
                    });
                    continue;
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
                responseData.push({
                    tableName,
                    status: true,
                    error: false,
                    message: `Metadata for ${tableName} saved successfully`,
                });

            } catch (error) {
                errors.push({
                    tableName: table.tableName || "Unknown",
                    status: false,
                    error: true,
                    message: responseMessages.FAILED_SAVED_META_INTEGRATION,
                });
            }
        }
        res.status(OK).json({
            message: responseMessages.ALL_INTEGRATIONS_PROCESSED,
            status: true,
            error: false,
            data: {
                responseData,
                errors
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