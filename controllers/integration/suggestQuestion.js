import userModel from "../../models/User.js";

export const suggestQuestion = async (req, res) => {
    try {
        const customText = `I have given you the structure format of my database. You need to identify the required graph and return and provide 3 Analytical Graph and its description only`;

        const userId = req.userId;
        const user = await userModel.findById(userId).select("company");
        if (!user) {
            return res.status(404).send("User not found.");
        }

        const companyId = user.company;

        if (!companyId) {
            return res.status(400).send("Company ID not found.");
        }

        // Step 2: Find the integration credentials using companyId
        const integrationCredentials = await IntegrationCredentials.findOne({
            companyId,
        });

        if (!integrationCredentials) {
            return res.status(404).send("Integration credentials not found.");
        }

        // Step 3: Fetch Meta Integration details using integration ID
        const metaIntegrationData = await MetaIntegrationDetail.find({
            integration_id: integrationCredentials._id,
        });

        if (!metaIntegrationData.length) {
            return res.status(404).send("Meta integration data not found.");
        }

        // Step 4: Create the final result message
        let resultMessage = customText;

        metaIntegrationData.forEach((table) => {
            let responseMessage = ` + ${requiredGraph} Here is all the data of Table: ${table.table_name}`;
            resultMessage += `${responseMessage}| Integration ID: ${table.integration_id
                } | Columns: ${JSON.stringify(table.columns)} | Description: ${table.description
                } | Update Date: ${table.updateDate}`;
        });

        const aiResponse = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile", // Use Groq-supported model
            messages: [{ role: "user", content: resultMessage }],
        });

        res.json({
            ai_response: aiResponse.choices[0].message.content,
        });

        const result = aiResponse.choices[0].message.content;
        console.log(result);

        // console.log(resultMessage);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Server Error");
    }
}