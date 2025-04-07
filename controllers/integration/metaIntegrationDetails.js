import { FORBIDDEN, INTERNALERROR, NOTALLOWED, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import integrationModel from "../../models/IntegrationCredentials.js";
import metaIntegrationModel from "../../models/MetaIntegrationDetails.js";
import userModel from "../../models/User.js";
import mysql from "mysql2";
import dotenv from "dotenv";
import { checkIntegration, checkIntegrationWithPromise } from "../../utils/checkInteration.js";
dotenv.config();

export const MetaIntegrationDetails = async (req, res) => {
    try {
        const { tables } = req.body;
        const { integrationId } = req.params;
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

        if (!tables || !Array.isArray(tables)) {
            return res.status(FORBIDDEN).send({
                success: false,
                error: true,
                message: responseMessages.PROVIDE_TABLES,
            });
        }
        let responseData = [];
        let errors = [];
        const { pool } = await checkIntegrationWithPromise(findIntegration);
        for (const table of tables) {
            try {
                const { tableName, description } = table;
                if (!tableName || !description) {
                    errors.push({
                        tableName: tableName || "Unknown",
                        success: false,
                        error: true,
                        message: responseMessages.PROVIDE_NAME_DESC,
                    });
                    continue;
                }

                const [tableExists] = await pool.query("SHOW TABLES LIKE ?", [tableName]);
                if (tableExists.length === 0) {
                    errors.push({
                        tableName,
                        success: false,
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
                    success: true,
                    error: false,
                    message: `Metadata for ${tableName} saved successfully`,
                });

            } catch (error) {
                errors.push({
                    tableName: table.tableName || "Unknown",
                    success: false,
                    error: true,
                    message: responseMessages.FAILED_SAVED_META_INTEGRATION,
                });
            }
        }
        res.status(OK).json({
            message: responseMessages.ALL_INTEGRATIONS_PROCESSED,
            success: true,
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