
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
dotenv.config();

const integrationRouter = express.Router();

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

integrationRouter.post('/sugestionOfGraph',auth,suggestionGraph)


export default integrationRouter;