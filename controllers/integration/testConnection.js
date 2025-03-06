import { FORBIDDEN, INTERNALERROR, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages";
import mysql from "mysql2";

function testDbConnection(username, password, url) {
    const match = url.match(/jdbc:mysql:\/\/(.*):(\d+)\/(.*)/);
    if (!match) {
        throw new Error("Invalid MySQL URL format");
    }

    const [_, host, port, dbname] = match;
    return new Promise((resolve, reject) => {
        // console.log("host", host);
        // console.log("username", username);
        // console.log("port", port);
        // console.log("password", password);
        // console.log("dbname", dbname);
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
            connection.end(); // Always close the connection
        });
    });
}
export const testConnection = async (req, res) => {
    try {
        const { platform, username, password, url } = req.body;
        if (!platform || !username || !password || !url) {
            return res.status(FORBIDDEN).json({
                message: responseMessages.INVALID_FIELD,
                error: true,
                success: false,
            });
        }

        if (platform.toLowerCase() === "mysql") {
            const isConnected = await testDbConnection(username, password, url);
            if (isConnected) {
                return res.status(OK).json({
                    message: responseMessages.MYSQL_CONNECTION_SUCCESS,
                    error: false,
                    success: true,
                });
            } else {
                return res.status(FORBIDDEN).json({
                    message: responseMessages.MYSQL_CONNECTION_FAILED,
                    error: true,
                    success: false,
                });
            }
        } else if (platform.toLowerCase() === "acuity") {
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