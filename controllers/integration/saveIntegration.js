import { FORBIDDEN, INTERNALERROR, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import mysql from "mysql2";
import integrationModel from "../../models/IntegrationCredentials.js";
import userModel from "../../models/User.js";

export const saveIntegration = async (req, res) => {
    try {
        const { platformName, integrationName, url, username, password } = req.body;
        if (!platformName || !integrationName || !url || !username || !password) {
            return res.status(FORBIDDEN).json({
                message: responseMessages.INVALID_FIELD,
                error: true,
                success: false,
            });
        }
        // const urlRegex = /^jdbc:mysql:\/\/([^:/]+):(\d+)\/(.+)$/;
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

            pool.query("SHOW TABLES", (err, results) => {
                if (err) {
                    return res.status(INTERNALERROR).json({
                        message: responseMessages.FAILED_FETCHING_TABLES,
                        error: true,
                        success: false,
                    });
                }
                const tableNames = results.map((row) => Object.values(row)[0]);
                return res.status(OK).json({
                    message: responseMessages.FETCH_TABLES_SUCCESS,
                    error: true,
                    success: false,
                    data: tableNames
                });
            });
            return
        }
        const userId = req.userId;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(NOTFOUND).send({
                status: false,
                error: true,
                message: responseMessages.USER_NOT_FOUND,
            });
        }
        const companyId = user.company;

        const newIntegrationCredentials = new integrationModel({
            companyId,
            platformName,
            integrationName,
            url,
            username,
            password,
        });
        await newIntegrationCredentials.save();

        return res.status(OK).json({
            message: responseMessages.CREDENTIAL_SAVED,
            error: false,
            success: true,
        });
    } catch (error) {
        console.log("Error in /integrationCredential API:", error.message);
        return res.status(INTERNALERROR).json({
            message: error.message || error,
            error: false,
            success: true,
        });
    }
}