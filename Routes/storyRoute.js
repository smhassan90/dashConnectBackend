import express from "express";

import { auth } from "../config/tokenVerification.js";
import { addStoryBoard } from "../controllers/Story/addStory.js";
import { addStoryForEmployee } from "../controllers/Story/userStory.js";
import { getAllStoryBoard } from "../controllers/Story/getAllStoryBoard.js";
import { deleteStoryForEmployee } from "../controllers/Story/deleteStory.js";
const storyRouter = express.Router();

storyRouter.post('/addStoryBoard',auth,addStoryBoard)
storyRouter.post('/addStoryForEmployee',auth,addStoryForEmployee)
storyRouter.delete('/deleteStoryForEmployee',auth,deleteStoryForEmployee)
storyRouter.get('/getStoryBoard',auth,getAllStoryBoard)

export default storyRouter;
