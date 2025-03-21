import { FORBIDDEN, INTERNALERROR, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import mysql from "mysql2";
import integrationModel from "../../models/IntegrationCredentials.js";
import userModel from "../../models/User.js";
import metaIntegrationModel from "../../models/MetaIntegrationDetails.js";

export const filterFetchTables = async (req, res) => {
    try {
        const { integrationId } = req.params
        const { platformName, url, username, password } = req.body;
        if (!platformName || !url || !username || !password) {
            return res.status(FORBIDDEN).json({
                message: responseMessages.INVALID_FIELD,
                error: true,
                success: false,
            });
        }
        const urlRegex = /jdbc:mysql:\/\/(.*):(\d+)\/(.*)/
        const match = url.match(urlRegex);

        if (!match) {
            return res.status(FORBIDDEN).json({
                message: responseMessages.INVALID_URL,
                error: true,
                success: false,
            });
        }
        const [, host, port, database] = match;

        const existingCredential = await integrationModel.findOne({
            url,
            username,
            password,
        });

        if (existingCredential) {
            const pool = mysql.createPool({
                host,
                port: parseInt(port),
                user: username,
                password,
                database,
            });

            pool.query("SHOW TABLES", async (err, results) => {
                if (err) {
                    return res.status(INTERNALERROR).json({
                        message: responseMessages.FAILED_FETCHING_TABLES,
                        error: true,
                        success: false,
                    });
                }
                const tableNames = results.map((row) => Object.values(row)[0]);
                const findIntegrationTables = await metaIntegrationModel.find({ integrationId })
                const filterTablesName = tableNames.filter((table) =>
                    !findIntegrationTables.some((tab) => tab.tableName === table)
                );
                return res.status(OK).json({
                    message: responseMessages.FETCH_TABLES_SUCCESS,
                    error: false,
                    success: true,
                    data: filterTablesName
                });
            });
            return
        }
    } catch (error) {
        console.log("Error in /integrationCredential API:", error.message);
        return res.status(INTERNALERROR).json({
            message: error.message || error,
            error: false,
            success: true,
        });
    }
}