
import express from "express";
// import TableStructure from "../models/TableStructure.js";
// import IntegrationCredentials from "../models/IntegrationCredentials.js";
// import MetaIntegrationDetail from "../models/MetaIntegrationDetails.js";
import User from "../models/User.js";
import {auth} from "../config/tokenVerification.js";
import OpenAI from "openai";
import dotenv from "dotenv";
import { testConnection } from "../controllers/integration/testConnection.js";
import { MetaIntegrationDetails } from "../controllers/integration/metaIntegrationDetails.js";
import { suggestQuestion } from "../controllers/integration/suggestQuestion.js";
import { FetchTables } from "../controllers/integration/fetchTables.js";
dotenv.config();

const integrationRouter = express.Router();

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

integrationRouter.post('/testConnectionIntegration',auth,testConnection)
integrationRouter.post('/fetchTables',auth,FetchTables)
integrationRouter.post('/metaIntegrationDetails',auth,MetaIntegrationDetails)
integrationRouter.post('/sugestionQuestion',auth,suggestQuestion)


export default integrationRouter;