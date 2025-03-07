import mongoose from "mongoose";

const metaIntegrationDetail = new mongoose.Schema(
    {
        integrationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Integration",
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        tableName: {
            type: String,
            required: true,
        },
        columns: { type: Map, of: String },
    },
    {
        timestamps: true,
    }
);

const metaIntegrationModel = mongoose.model("MetaIntegrationDetail", metaIntegrationDetail);
export default metaIntegrationModel;