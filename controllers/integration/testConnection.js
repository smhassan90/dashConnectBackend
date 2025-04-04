import { FORBIDDEN, INTERNALERROR, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import integrationModel from "../../models/IntegrationCredentials.js";
import mysql from "mysql2";
import oracledb from "oracledb";
import userModel from "../../models/User.js";

async function testDbConnection(username, password, url, platformName) {
    if (platformName.toLowerCase() === "mysql") {
        const match = url.match(/jdbc:mysql:\/\/(.*):(\d+)\/(.*)/);
        if (!match) {
            throw new Error("Invalid MySQL URL format");
        }

        const [_, host, port, dbname] = match;
        return new Promise((resolve, reject) => {
            const connection = mysql.createConnection({
                host: host,
                user: username,
                password: password,
                database: dbname,
                port: parseInt(port, 10),
                connectTimeout: 10000
            });

            connection.connect((err) => {
                if (err) {
                    console.error("Connection error:", err.message);
                    resolve(false);
                } else {
                    console.log("MySQL connection successful");
                    resolve(true);
                }
                connection.end();
            });
        });
    } else if (platformName.toLowerCase() === "oracle") {
        const match = url.match(/jdbc:oracle:thin:@(.*):(\d+)\/(.*)/);
        if (!match) {
            throw new Error("Invalid Oracle URL format");
        }

        const [_, host, port, dbname] = match;
        console.log(`${host}:${port}/${dbname}`)
        try {
            const connection = await oracledb.getConnection({
                user: username,
                password: password,
                // connectString: `${host}:${port}/${dbname}`,
                connectString: `${host}:${port}/${dbname}`,
            });

            console.log("Oracle connection successful");
            await connection.close();
            return true;
        } catch (err) {
            console.error("Oracle Connection error:", err.message);
            return false;
        }
    }
}
export const testConnection = async (req, res) => {
    try {
        // oracledb.initOracleClient({ libDir: "C:\Program Files (x86)\oracle\instantclient_23_7" });
        const { integrationName, platformName, username, password, url } = req.body;
        if (!platformName || !integrationName || !username || !password || !url) {
            return res.status(FORBIDDEN).json({
                message: responseMessages.INVALID_FIELD,
                error: true,
                success: false,
            });
        }

        if (platformName.toLowerCase() === "mysql") {
            const isConnected = await testDbConnection(username, password, url, platformName);
            if (isConnected) {
                const existingCredential = await integrationModel.findOne({
                    url,
                    username,
                    password,
                });
                if (existingCredential) {
                    return res.status(FORBIDDEN).json({
                        message: responseMessages.CREDENTIAL_EXISTS,
                        error: true,
                        success: false,
                    });
                }
                const userId = req.userId;
                const user = await userModel.findById(userId);
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
                    data:newIntegrationCredentials
                });
            } else {
                return res.status(FORBIDDEN).json({
                    message: responseMessages.MYSQL_CONNECTION_FAILED,
                    error: true,
                    success: false,
                });
            }
        } else if (platformName.toLowerCase() === "oracle") {
            const isConnected = await testDbConnection(username, password, url, platformName);
            if (isConnected) {
                const existingCredential = await integrationModel.findOne({
                    url,
                    username,
                    password,
                });
                if (existingCredential) {
                    return res.status(FORBIDDEN).json({
                        message: responseMessages.CREDENTIAL_EXISTS,
                        error: true,
                        success: false,
                    });
                }
                const userId = req.userId;
                const user = await userModel.findById(userId);
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
                    data:newIntegrationCredentials
                });
            } else {
                return res.status(FORBIDDEN).json({
                    message: responseMessages.MYSQL_CONNECTION_FAILED,
                    error: true,
                    success: false,
                });
            }
        } else if (platformName.toLowerCase() === "acuity") {
            try {
                const response = await axios.get(`${url}/appointments?max=30`, {
                    auth: {
                        username: username,
                        password: password,
                    },
                });
                return res.status(OK).json({
                    message: responseMessages.ACUITY_CONNECTION_SUCCESS,
                    error: false,
                    success: true,
                    data: response.data,
                });
            } catch (error) {
                console.error("Error fetching Acuity appointments:", error.message);
                return res.status(FORBIDDEN).json({
                    message: responseMessages.ACUITY_CONNECTION_FAILED,
                    error: true,
                    success: false,
                });
            }
        } else {
            return res.status(NOTFOUND).json({
                message: responseMessages.INVALID_CONNECTION_TYPE,
                error: true,
                success: false,
            });
        }
    } catch (error) {
        return res.status(INTERNALERROR).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}