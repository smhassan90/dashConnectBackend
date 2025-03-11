import { INTERNALERROR, NOTFOUND, OK } from "../../constant/httpStatus.js";
import userModel from "../../models/User.js";
import integrationModel from "../../models/IntegrationCredentials.js";
import metaIntegrationModel from "../../models/MetaIntegrationDetails.js";
import OpenAI from "openai";
import { SuggestQuestionData } from "../../data/suggestQuestionData.js";
import { responseMessages } from "../../constant/responseMessages.js";

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

export const suggestQuestion = async (req, res) => {
    try {
        const { requiredGraph } = req.body;
        const customText = `I have given you the structure format of my database. You need to identify the required graph and return and provide 3 Analytical Graph and its description only`;

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

        // Step 2: Find the integration credentials using companyId
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

        // Step 3: Fetch Meta Integration details using integration ID
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

        // Step 4: Create the final result message
        let resultMessage = customText;
        findMetaIntegration.forEach((table) => {
            // let responseMessage = ` + ${requiredGraph} Here is all the data of Table: ${table.tableName}`;
            resultMessage += `Integration ID: ${table.integrationId
                } | Columns: ${JSON.stringify(table.columns)} | Description: ${table.description
                }`;
        });
        // const aiResponse = await openai.chat.completions.create({
        //     model: "llama-3.3-70b-versatile", // Use Groq-supported model
        //     messages: [{ role: "user", content: resultMessage }],
        // });
        // const aiContent = aiResponse.choices[0].message.content;
        const aiContent = SuggestQuestionData;
        const pointsArray = aiContent
            .split("\n")
            .filter(point => point.trim() !== "") // Remove empty lines
            .map(point => {
                const parts = point.split(":"); // Split title and description
                return {
                    title: parts[0]?.trim() || "",
                    description: parts.slice(1).join(":").trim() || ""
                };
            });

        return res.status(OK).send({
            success: true,
            error: false,
            message: responseMessages.SUGGEST_QUESTION_SUCCESS,
            data: aiContent
        });
    } catch (error) {
        return res.status(INTERNALERROR).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}