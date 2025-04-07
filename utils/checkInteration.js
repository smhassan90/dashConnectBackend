import mysql from "mysql2";
import oracledb from "oracledb";
import sql from "mssql";

export const checkIntegrationWithPromise = async (findIntegration) => {
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
    } else {
        throw new Error("Unsupported database platform");
    }

    return { pool };
};
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
        })
    } else if (findIntegration.platformName === "oracle") {
        pool = await oracledb.createPool({
            user: findIntegration.username,
            password: findIntegration.password,
            connectString: findIntegration.url,
            poolMin: 1,
            poolMax: 10,
            poolIncrement: 1,
        });
    } else {
        throw new Error("Unsupported database platform");
    }

    return { pool };
};
