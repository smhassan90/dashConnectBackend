import { BADREQUEST, INTERNALERROR, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import integrationModel from "../../models/IntegrationCredentials.js";
import metaIntegrationModel from "../../models/MetaIntegrationDetails.js";
import userModel from "../../models/User.js";
import OpenAI from "openai";
import mysql from "mysql2";
import dotenv from "dotenv";
import { checkIntegration } from "../../utils/checkInteration.js";
import storyBoardModel from "../../models/storyBoard.js";
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

export const reRunGraphQuery = async (req, res) => {
    try {
        const { newQuery, requiredGraph, storyBoardId } = req.body;
        const userId = req.userId;
        const user = await userModel.findById(userId).select("company");
        if (!user) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.USER_NOT_FOUND,
            });
        }
        const companyId = user.company;
        if (!companyId) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.COMPANY_NOT_FOUND,
            });
        }
        const findStoryBoard = await storyBoardModel.findById(storyBoardId)
        if (!findStoryBoard) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.STORY_BOARD_NOT_FOUND,
            });
        }
        const findIntegration = await integrationModel.findOne(findStoryBoard.integrationId);
        if (!findIntegration) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.INTEGRATION_NOT_FOUND,
            });
        }

        const findMetaIntegration = await metaIntegrationModel.find({
            integrationId: findIntegration._id,
        });

        if (!findMetaIntegration.length) {
            return res.status(NOTFOUND).send({
                success: false,
                error: true,
                message: responseMessages.INTEGRATION_DATA_NOT_FOUND,
            });
        }
        function cleanSQLQuery(inputString) {
            const cleanedQuery = inputString
                .replace(/```sql\n?/i, '')
                .replace(/```$/, '')
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            return cleanedQuery;
        }
        let tableStructure = "";
        findMetaIntegration.forEach((table) => {
            tableStructure += `| Table: ${table.tableName} | Columns: ${JSON.stringify(table.columns)} | Description: ${table.description}`;
        });
        let resultMessage = `My Database structure ${tableStructure} I have given you the structure format of my database. I have given this query, ${newQuery} but it has a syntax error. please, rewrite this query correctly.`;
        const aiResponse = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: resultMessage }],
        });
        const aiGeneratedQuery = aiResponse.choices[0].message.content
        const query = cleanSQLQuery(aiGeneratedQuery);
        const { pool } = await checkIntegration(findIntegration);
        if (findIntegration.platformName === "mysql") {
            pool.query(`EXPLAIN ${newQuery} LIMIT 0`, (error) => {
                if (error) {
                    return res.status(BADREQUEST).json({
                        success: false,
                        error: true,
                        message: "SQL Syntax Error: " + error.sqlMessage,
                    });
                }
                pool.query(newQuery, (error, results, fields) => {
                    if (error) {
                        console.error("Database query error:", error);
                        return;
                    }
                    if (requiredGraph !== "Report") {
                        if (fields.length > 3) {
                            return res.status(BADREQUEST).json({
                                success: false,
                                error: true,
                                message: responseMessages.ONLY_3_COLUMNS,
                            });
                        }
                    }
                    return res.status(OK).json({
                        error: false,
                        success: true,
                        message: responseMessages.QUERY_DATA,
                        data: {
                            query: newQuery,
                            resultType: requiredGraph,
                            data: results
                        }
                    });
                });
            });
        } else if (findIntegration.platformName === "oracle") {
            const connection = await pool.getConnection();
            const result = await connection.execute(query);
            connection.close();
            return res.status(OK).json({
                error: false,
                success: true,
                message: responseMessages.QUERY_DATA,
                data: {
                    query: query,
                    resultType: requiredGraph,
                    data: result.rows
                }
            });
        } else if (findIntegration.platformName === "sqlserver") {
            const result = await pool.request().query(query);
            return res.status(OK).json({
                error: false,
                success: true,
                message: responseMessages.QUERY_DATA,
                data: {
                    query: query,
                    resultType: requiredGraph,
                    data: result.recordset
                }
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