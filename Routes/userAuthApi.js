// // Routes/user.js
// const express = require("express");
// const multer = require("multer");
// const router = express.Router();
// const bcrypt = require("bcrypt");
// const User = require("../models/User");
// const jwt = require("jsonwebtoken");
// require("dotenv/config");
// const tokenVerification = require("../config/tokenVerification");
// const mongoose = require("mongoose");
// const Company = require("../models/Company");
// const randomstring = require("randomstring");
// const sendMail = require("../config/nodemailer");
// const axios = require("axios");
// const cron = require("node-cron");
// const path = require("path");
// const fs = require("fs");
// const csvParser = require("csv-parser");
// const { NOTFOUND, OK, INTERNALERROR, UNAUTHORIZED } = require("../constant/httpStatus");
// const { responseMessages } = require("../constant/responseMessages");
// const { generateToken } = require("../utils/generateToken");


// // create --> Forgot password and Reset password API
// router.post("/forgotPassword", async (req, res) => {
//   try {
//     const { email } = req.body;

//     const user = await User.findOne({ email: email });

//     if (user) {
//       const token = randomstring.generate(6);

//       const updateData = await User.updateOne(
//         { _id: user._id },
//         { $set: { token: token } }
//       );

//       await sendMail(user.email, token);

//       res.status(200).send({
//         success: true,
//         message: "Check your email for reset password link",
//       });
//     } else {
//       res.status(200).send({ success: false, message: "Invalid email id" });
//     }
//   } catch (error) {
//     res.status(400).send(error.message);
//   }
// });

// // create --> reset password API
// router.post("/resetPassword", async (req, res) => {
//   try {
//     const { password, token } = req.body;

//     const hashedPassword = bcrypt.hashSync(password, 10);

//     const user = await User.findOne({ token: token });

//     if (user) {
//       const updateData = await User.findByIdAndUpdate(
//         { _id: user._id },
//         { $set: { password: hashedPassword, token: "" } },
//         { new: true }
//       );
//       res
//         .status(200)
//         .send({ success: true, message: "Password has been updated" });
//     } else {
//       res.status(200).send({ success: false, message: "Token has expired" });
//     }
//   } catch (error) {
//     res.status(400).send(error.message);
//   }
// });

// // create --> csv file upload API
// router.get("/createSchema", async (req, res) => {
//   try {
//     const filePath = path.join(__dirname, "data", "sheet1.csv");
//     const rows = [];
//     // Read and parse CSV
//     fs.createReadStream(filePath)
//       .pipe(csvParser())
//       .on("data", (row) => rows.push(row))
//       .on("end", async () => {
//         if (rows.length === 0) {
//           return res.status(400).json({ message: "CSV file is empty!" });
//         }

//         // Create schema dynamically from the first row's keys
//         const columns = Object.keys(rows[0]);
//         const schemaDefinition = {};

//         columns.forEach((col) => {
//           // Dynamically determine the type based on the data
//           const firstValue = rows[0][col];
//           if (!isNaN(firstValue)) {
//             schemaDefinition[col] = { type: Number }; // For numeric columns
//           } else if (
//             new Date(firstValue) !== "Invalid Date" &&
//             !isNaN(new Date(firstValue))
//           ) {
//             schemaDefinition[col] = { type: Date }; // For date columns
//           } else {
//             schemaDefinition[col] = { type: String }; // Default to string
//           }
//         });

//         // Create the dynamic schema
//         const dynamicSchema = new mongoose.Schema(schemaDefinition);
//         const SheetModel = mongoose.model("sheet1", dynamicSchema);

//         // Insert data into MongoDB
//         await SheetModel.insertMany(rows);

//         res
//           .status(200)
//           .json({ message: "Schema created and data inserted successfully!" });
//       });
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ message: "Something went wrong", error });
//   }
// });

// //  create --> Nuke Users API. It will delete all users from users collection
// router.delete("/nukeUsers", async (req, res) => {
//   try {
//     await User.deleteMany({});

//     res.status(200).json({ message: "All users have been deleted." });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // create --> Nuke Companies API. It will delete all companies from companies collection
// router.delete("/nukeCompanies", async (req, res) => {
//   try {
//     await Company.deleteMany({});

//     res.status(200).json({ message: "All companies have been deleted." });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// module.exports = router;





import {Router} from 'express'
import { signUp } from "../controllers/auth/signup.js";
import { login } from '../controllers/auth/login.js';
import { uploadImage } from '../controllers/user/uploadImage.js';
import { auth } from '../config/tokenVerification.js';
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
authRouter.put("/deleteUsers",auth, deleteUsers);

// Delete Companies
// route (/api/user/v1/deleteCompanies)
authRouter.put("/deleteCompanies",auth, deleteCompanies);

// CSV file Upload
// route (/api/user/v1/createSchema)
authRouter.put("/deleteCompanies",auth, createSchema);

export default authRouter
