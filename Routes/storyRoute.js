import express from "express";

import { auth } from "../config/tokenVerification.js";
import { addStoryBoard } from "../controllers/Story/addStory.js";
import { addStoryForEmployee } from "../controllers/Story/userStory.js";
const storyRouter = express.Router();

storyRouter.post('/addStoryBoard',auth,addStoryBoard)
storyRouter.post('/addStoryForEmployee',auth,addStoryForEmployee)
// storyRouter.get('/addStoryForEmployee',auth,addStoryForEmployee)

export default storyRouter;
