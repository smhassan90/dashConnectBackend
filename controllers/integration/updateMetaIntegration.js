import { FORBIDDEN, INTERNALERROR, NOTALLOWED, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import integrationModel from "../../models/IntegrationCredentials.js";
import metaIntegrationModel from "../../models/MetaIntegrationDetails.js";
import userModel from "../../models/User.js";
import mysql from "mysql2";
import dotenv from "dotenv";
import { checkIntegrationWithPromise } from "../../utils/checkInteration.js";
dotenv.config();

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
        const { pool } = await checkIntegrationWithPromise(findIntegration);
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
            data:metaDetails
        });
    } catch (error) {
        return res.status(INTERNALERROR).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}