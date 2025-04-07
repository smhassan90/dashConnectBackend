import { INTERNALERROR, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import integrationModel from "../../models/IntegrationCredentials.js";
import metaIntegrationModel from "../../models/MetaIntegrationDetails.js";
import userModel from "../../models/User.js";
import OpenAI from "openai";
import mysql from "mysql2";
import dotenv from "dotenv";
import storyBoardModel from "../../models/storyBoard.js";
import { checkIntegration } from "../../utils/checkInteration.js";
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

export const genrateGraphQuery = async (req, res) => {
    try {
        const { customText, requiredGraph, storyBoardId } = req.body;
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
        let tableStructure = "";
        findMetaIntegration.forEach((table) => {
            tableStructure += `| Table: ${table.tableName} | Columns: ${JSON.stringify(table.columns)} | Description: ${table.description}`;
        });

        // Create the message for Groq AI
        let resultMessage = `My Database structure ${tableStructure} I have given you the structure format of my database. You need to identify the required graph it may be asking for report and graph and return only the query in response based on the following question: ${customText}`; 
        function cleanSQLQuery(inputString) {
            const cleanedQuery = inputString
                .replace(/```sql\n?/i, '')
                .replace(/```$/, '')
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            return cleanedQuery;
        }


        const aiResponse = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: resultMessage }],
        });
        const query = cleanSQLQuery(aiResponse.choices[0].message.content)


        // const aiGeneratedQuery = aiResponse.choices[0].message.content
        // console.log(aiGeneratedQuery, "aiGeneratedQuery")
        // const query = cleanSQLQuery(aiGeneratedQuery);
        // const query = "SELECT t_doctor.NAME, t_doctor.AGE, SUM(t_appointment.charges) AS total_income FROM t_doctor JOIN t_appointment ON t_doctor.ID = t_appointment.DOCTOR_ID GROUP BY t_doctor.ID, t_doctor.NAME";
        const { pool } = await checkIntegration(findIntegration);
        if (findIntegration.platformName === "mysql") {
            pool.query(query, (error, results) => {
                if (error) {
                    console.log("Database query error:", error);
                    return res.status(INTERNALERROR).json({
                        message: "Database query failed",
                        error: true,
                        success: false,
                    });
                }
                return res.status(OK).json({
                    error: false,
                    success: true,
                    message: responseMessages.QUERY_DATA,
                    data: {
                        query: query,
                        resultType: requiredGraph,
                        data: results
                    }
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

        // Execute the query
        // poolTwo.query(query, (error, results) => {
        //     if (error) {
        //         console.error("Error fetching data:", error);
        //         return res.status(500).json({ error: "Database query failed" });
        //     }
        //     // Return the results as JSON
        //     if (requiredGraph === "graph") {
        //         return res.json(transformToLineGraphData(results));
        //     } else if (requiredGraph === "report") {
        //         const output = JSON.stringify(results);
        //         console.log("output-->", output);
        //         return res.status(200).json({ output });
        //     }
        // });
    } catch (error) {
        console.log(error)
        return res.status(INTERNALERROR).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}

function transformToLineGraphData(data) {
    console.log("Before:", JSON.stringify(data, null, 2));

    if (!Array.isArray(data) || data.length === 0) {
        console.error("Error: Invalid or empty data.");
        return { labels: [], datasets: [] };
    }

    // Identify potential label and numeric fields dynamically
    const sampleEntry = data[0];
    const numericFields = Object.keys(sampleEntry).filter(
        (key) => typeof sampleEntry[key] === "number",
    );
    const categoricalFields = Object.keys(sampleEntry).filter(
        (key) => typeof sampleEntry[key] === "string",
    );

    if (numericFields.length === 0) {
        console.error("Error: No numeric data found.");
        return { labels: [], datasets: [] };
    }

    const labelField =
        categoricalFields.length > 0 ? categoricalFields[0] : "Label";
    const numericField = numericFields[0];

    // Extract unique labels and sort them
    const uniqueLabels = [
        ...new Set(data.map((entry) => entry[labelField] || "Unknown")),
    ].sort();

    // Group numeric values by labels
    const groupedData = {};
    data.forEach((entry) => {
        const label = entry[labelField] || "Unknown";
        if (!groupedData[label]) {
            groupedData[label] = {};
        }
        groupedData[label] = entry[numericField] || 0;
    });

    // Prepare datasets
    const datasets = [
        {
            label: numericField,
            data: uniqueLabels.map((label) => groupedData[label] || 0), // Fill missing values with 0
        },
    ];

    const response = {
        labels: uniqueLabels,
        datasets, x
    };

    console.log("After:", JSON.stringify(response, null, 2));
    return response;
}