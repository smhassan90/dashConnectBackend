import {Router} from 'express'
import { signUp } from "../controllers/auth/signup.js";
import { login } from '../controllers/auth/login.js';
import { uploadImage } from '../controllers/user/uploadImage.js';
import { auth, ownerAuth } from '../config/tokenVerification.js';
import upload from '../middleware/multer.js';
import { changePassword } from '../controllers/auth/changePassword.js';
import { forgotPassword } from '../controllers/auth/forgotPassword.js';
import { resetPassword } from '../controllers/auth/resetPassword.js';
import { forgotPasswordTokenVerify } from '../controllers/auth/forgotPasswordTokenVerify.js';
import { deleteUsers } from '../controllers/user/deleteUsers.js';
import { deleteCompanies } from '../controllers/company/deleteCompanies.js';
import { createSchema } from '../controllers/table/createSchema.js';

const authRouter = Router()
// Create User 
// route (/api/user/v1/register)
authRouter.post("/register", signUp);

// Login User 
// route (/api/user/v1/login)
authRouter.post("/login", login);

// Upload Image
// route (/api/user/v1/uploadImage)
authRouter.post("/uploadImage",auth,upload.single('profilePicture'), uploadImage);

// Change Password
// route (/api/user/v1/changePassword)
authRouter.put("/changePassword", auth, changePassword);

// Forgot Password
// route (/api/user/v1/forgotPassword_token_verification)
authRouter.put("/forgotPassword_token_verification", forgotPasswordTokenVerify);

// Forgot Password
// route (/api/user/v1/forgotPassword)
authRouter.put("/forgotPassword", forgotPassword);

// Reset Password
// route (/api/user/v1/resetPassword)
authRouter.put("/resetPassword", resetPassword);

// Delete Users
// route (/api/user/v1/deleteUsers)
authRouter.put("/deleteUsers",ownerAuth, deleteUsers);

// Delete Companies
// route (/api/user/v1/deleteCompanies)
authRouter.put("/deleteCompanies",ownerAuth, deleteCompanies);

// CSV file Upload
// route (/api/user/v1/createSchema)
authRouter.get("/createSchema", createSchema);

export default authRouter
