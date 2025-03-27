import express from "express";
import {auth, topLevelAuth} from "../config/tokenVerification.js";
import OpenAI from "openai";
import dotenv from "dotenv";
import { testConnection } from "../controllers/integration/testConnection.js";
import { MetaIntegrationDetails } from "../controllers/integration/metaIntegrationDetails.js";
import { suggestQuestion } from "../controllers/integration/suggestQuestion.js";
import { FetchTables } from "../controllers/integration/fetchTables.js";
import { genrateGraphQuery } from "../controllers/integration/generateGraphQuery.js";
import { saveStory } from "../controllers/integration/saveStory.js";
import { getAllStories } from "../controllers/integration/getAllStories.js";
import { reRunGraphQuery } from "../controllers/integration/reRunQuery.js";
import { refreshQuery } from "../controllers/integration/refreshQuery.js";
import { filterFetchTables } from "../controllers/integration/filterFetchTables.js";
import { updateMetaIntegrationDetails } from "../controllers/integration/updateMetaIntegration.js";
import { getIntegration } from "../controllers/integration/getIntegrations.js";
import { getMetaIntegration } from "../controllers/integration/getMetaIntegration.js";
import { deleteMetaIntegration } from "../controllers/integration/deleteMetaIntegration.js";
dotenv.config();

const integrationRouter = express.Router();

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

integrationRouter.post('/testConnectionIntegration',auth,testConnection)
integrationRouter.post('/fetchTables',auth,FetchTables)
integrationRouter.get('/filterFetchTables/:integrationId',auth,filterFetchTables)
integrationRouter.post('/metaIntegrationDetails',auth,MetaIntegrationDetails)
integrationRouter.post('/updateMetaIntegrationDetails/:integrationId',auth,updateMetaIntegrationDetails)
integrationRouter.get('/getMetaIntegration/:integrationId',auth,getMetaIntegration)
integrationRouter.delete('/deleteMetaIntegration/:metaIntegrationId',auth,deleteMetaIntegration)
integrationRouter.post('/sugestionQuestion',topLevelAuth,suggestQuestion)
integrationRouter.post('/genrateGraphQuery',topLevelAuth,genrateGraphQuery)
integrationRouter.post('/saveStory/:storyBoardId',topLevelAuth,saveStory)
integrationRouter.get('/getAllStories/:storyBoardId',auth,getAllStories)
integrationRouter.post('/reRunQuery',auth,reRunGraphQuery)
integrationRouter.post('/refreshQuery',auth,refreshQuery)
integrationRouter.get('/getIntegration',topLevelAuth,getIntegration)


export default integrationRouter;