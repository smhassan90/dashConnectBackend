import { INTERNALERROR, NOTFOUND, OK } from "../../constant/httpStatus.js";
import { responseMessages } from "../../constant/responseMessages.js";
import integrationModel from "../../models/IntegrationCredentials.js";
import metaIntegrationModel from "../../models/MetaIntegrationDetails.js";
import userModel from "../../models/User.js";
import OpenAI from "openai";
import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT),
    queueLimit: 0,
    connectTimeout: parseInt(process.env.DB_TIMEOUT),
});

export const genrateGraphQuery = async (req, res) => {
    try {
        const { customText, requiredGraph } = req.body;
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
        const findIntegration = await integrationModel.findOne({
            companyId,
        });
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

        // Create the message for Groq AI
        let resultMessage = `I have given you the structure format of my database. You need to identify the required graph it may be asking for report and graph and return only the query in response based on the custom text. "Custom Text": ${customText}`;

        findMetaIntegration.forEach((table) => {
            resultMessage += `| Table: ${table.tableName} | Columns: ${JSON.stringify(table.columns)} | Description: ${table.description}`;
        });

        function cleanSQLQuery(inputString) {
            const cleanedQuery = inputString
                .replace(/```sql\n?/i, '')
                .replace(/```$/, '')
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            return cleanedQuery;
        }

        // const aiResponse = await openai.chat.completions.create({
        //     model: "llama-3.3-70b-versatile",
        //     messages: [{ role: "user", content: resultMessage }],
        // });
        // const query = cleanSQLQuery(aiResponse.choices[0].message.content)
        const query = "SELECT t_doctor.ID, t_doctor.NAME, t_doctor.AGE, t_doctor.USERNAME, SUM(t_appointment.charges) AS total_income FROM t_doctor JOIN t_appointment ON t_doctor.ID = t_appointment.DOCTOR_ID GROUP BY t_doctor.ID, t_doctor.NAME";

        pool.query(query, (error, results) => {
            if (error) {
                console.error("Database query error:", error);
                return;
            }
            return res.status(OK).json({
                error: false,
                success: true,
                message: responseMessages.QUERY_DATA,
                data: {
                    query: query,
                    data: results
                }
            });
        });

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