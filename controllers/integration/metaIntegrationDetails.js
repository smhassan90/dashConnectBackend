import { NOTFOUND } from "../../constant/httpStatus.js";
import userModel from "../../models/User.js";

export const MetaIntegrationDetails = async (req, res) => {
    try {
        const { tables } = req.body;
        const userId = req.userId;


        // Fetch the user data using userId
        const user = await userModel.findById(userId).select("company");
        console.log(user)

        return
        if (!userData) {
            return res.status(NOTFOUND).send({
                status: false,
                error: true,
                message: responseMessages.USER_NOT_FOUND,
            });
        }

        const companyId = userData.company;

        // Fetch the integration credential by companyId
        const integrationCredential = await IntegrationCredentials.findOne({
            companyId,
        });
        if (!integrationCredential) {
            return res.status(404).json({
                message: "No integration credentials found for this company.",
            });
        }

        const integration_id = integrationCredential._id; //  MongoDB ID for the integrationCredential

        if (!tables || !Array.isArray(tables)) {
            return res.status(400).json({ message: "Tables array is required." });
        }

        let responseData = [];

        // Process each table and save metadata
        for (const table of tables) {
            const { tableName, description } = table;

            if (!tableName || !description) {
                responseData.push({
                    tableName: tableName || "N/A",
                    message: "Table name or description is missing.",
                });
                continue;
            }

            // Check if table exists
            const [tableExists] = await pool.query("SHOW TABLES LIKE ?", [tableName]);
            if (tableExists.length === 0) {
                responseData.push({
                    tableName,
                    message: `Table ${tableName} does not exist.`,
                });
                continue;
            }

            // Fetch column details of the table
            const [columns] = await pool.query("DESCRIBE ??", [tableName]);
            const columnDetails = {};
            columns.forEach((col) => {
                columnDetails[col.Field] = col.Type;
            });

            // Save metadata into MongoDB
            const metaDetails = new MetaIntegrationDetail({
                integration_id,
                table_name: tableName,
                columns: columnDetails, // Save columns as an object
                description,
            });

            try {
                await metaDetails.save();
                responseData.push({
                    tableName,
                    message: `Metadata for ${tableName} saved successfully.`,
                });
            } catch (err) {
                responseData.push({
                    tableName,
                    message: `Failed to save metadata for ${tableName}.`,
                    error: err.message,
                });
            }
        }

        // Final Response
        res.status(200).json({
            message: "Processing completed",
            data: responseData,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "An error occurred while processing.",
            error: err.message,
        });
    }
}