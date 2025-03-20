import express from "express";

import { auth, topLevelAuth } from "../config/tokenVerification.js";
import { addStoryBoard } from "../controllers/Story/addStory.js";
import { addStoryForEmployee } from "../controllers/Story/userStory.js";
import { getAllStoryBoard } from "../controllers/Story/getAllStoryBoard.js";
import { deleteStoryForEmployee } from "../controllers/Story/deleteStory.js";
import { getSingleStoryBoard } from "../controllers/Story/getSingleStoryBoard.js";
import { updateStoryBoard } from "../controllers/Story/updateStoryBoard.js";
const storyRouter = express.Router();

storyRouter.post('/addStoryBoard',topLevelAuth,addStoryBoard)
storyRouter.post('/addStoryForEmployee',topLevelAuth,addStoryForEmployee)
storyRouter.delete('/deleteStoryForEmployee',topLevelAuth,deleteStoryForEmployee)
storyRouter.get('/getStoryBoard',topLevelAuth,getAllStoryBoard)
storyRouter.get('/getStoryBoard/:storyBoardId',topLevelAuth,getSingleStoryBoard)
storyRouter.put('/updateStoryBoard/:storyBoardId',topLevelAuth,updateStoryBoard)
// storyRouter.get('/getStoryBoard',auth,getEmployeeStoryBoard)

export default storyRouter;
