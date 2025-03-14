import express from "express";

import { auth } from "../config/tokenVerification.js";
import { addStoryBoard } from "../controllers/Story/addStory.js";
const storyRouter = express.Router();

storyRouter.post('/addStoryBoard',auth,addStoryBoard)

export default storyRouter;
