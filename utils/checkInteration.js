import mysql from "mysql2";
import oracledb from "oracledb";
import sql from "mssql";

export const checkIntegration = async (findIntegration) => {
    let pool;

    if (findIntegration.platformName === "mysql") {
        const urlRegex = /jdbc:mysql:\/\/(.*):(\d+)\/(.*)/;
        const match = findIntegration.url.match(urlRegex);
        const [, host, port, database] = match;

        pool = mysql.createPool({
            host,
            port: parseInt(port),
            user: findIntegration.username,
            password: findIntegration.password,
            database: database,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            connectTimeout: 100000,
        }).promise();
    } else if (findIntegration.platformName === "oracle") {
        pool = await oracledb.createPool({
            user: findIntegration.username,
            password: findIntegration.password,
            connectString: findIntegration.url,
            poolMin: 1,
            poolMax: 10,
            poolIncrement: 1,
        });
    } else if (findIntegration.platformName === "sqlserver") {
        pool = await sql.connect({
            user: findIntegration.username,
            password: findIntegration.password,
            server: findIntegration.url.split("//")[1].split(":")[0],
            port: parseInt(findIntegration.url.split(":")[2]),
            database: findIntegration.url.split("/")[3],
            options: {
                encrypt: true,
                enableArithAbort: true,
            },
        });
    } else {
        throw new Error("Unsupported database platform");
    }

    return { pool };
};
