import express from "express";
import { auth, ownerAuth, topLevelAuth } from "../config/tokenVerification.js";
import { addLevel } from "../controllers/level/addLevel.js";
import { getLevel } from "../controllers/level/getLevel.js";
import { addLevelStoryBoard } from "../controllers/level/addLevelStoryBoard.js";
import { deleteLevelForStory } from "../controllers/level/deleteLevelForStoryBoard.js";
const levelRouter = express.Router();

levelRouter.post('/addLevel',ownerAuth,addLevel)
levelRouter.get('/getLevel',ownerAuth,getLevel)
levelRouter.post('/addStoryBoardLevel',topLevelAuth,addLevelStoryBoard)
levelRouter.delete('/deleteLevelForStory',topLevelAuth,deleteLevelForStory)

export default levelRouter;
