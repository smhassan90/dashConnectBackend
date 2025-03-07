
import express from "express";
// import TableStructure from "../models/TableStructure.js";
// import IntegrationCredentials from "../models/IntegrationCredentials.js";
// import MetaIntegrationDetail from "../models/MetaIntegrationDetails.js";
import User from "../models/User.js";
import {auth} from "../config/tokenVerification.js";
import OpenAI from "openai";
import axios from "axios";
import dotenv from "dotenv";
import { suggestionGraph } from "../controllers/integration/suggestionGraph.js";
import { testConnection } from "../controllers/integration/testConnection.js";
import { saveIntegration } from "../controllers/integration/saveIntegration.js";
import { MetaIntegrationDetails } from "../controllers/integration/metaIntegrationDetails.js";
dotenv.config();

const integrationRouter = express.Router();

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

integrationRouter.post('/sugestionOfGraph',auth,suggestionGraph)
integrationRouter.post('/testConnectionIntegration',auth,testConnection)
integrationRouter.post('/saveIntegration',auth,saveIntegration)
integrationRouter.post('/metaIntegrationDetails',auth,MetaIntegrationDetails)


export default integrationRouter;