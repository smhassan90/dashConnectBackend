// Routes/user.js
const express = require("express");
const multer = require("multer");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv/config");
const tokenVerification = require("../config/tokenVerification");
const mongoose = require("mongoose");
const Company = require("../models/Company");
const randomstring = require("randomstring");
const sendMail = require("../config/nodemailer");
const axios = require("axios");
const cron = require("node-cron");
const path = require("path");
const fs = require("fs");
const csvParser = require("csv-parser");




// create --> user API
router.post("/register", async (req, res) => {
  try {
    const {
      companyName,
      updateDate,
      Status,
      firstName,
      lastName,
      email,
      password,
    } = req.body;

    const company = await Company.create({
      companyName,
      updateDate,
      Status,
    });

    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      company: company,
    });

    res.status(201).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// create --> Login API
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      const checkPassword = bcrypt.compareSync(password, user.password);

      if (checkPassword) {
        const token = jwt.sign(
          { id: user._id, email: user.email },
          process.env.JWT_SECRET
        );
        res.status(200).send({
          status: 200,
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            companyName: user.companyName,
          },
          message: "Login successful",
          token,
        });
      } else {
        res.status(401).send({ status: 401, message: "Incorrect Password" });
      }
    } else {
      res.status(404).send({ status: 404, message: "User not found" });
    }
  } catch (error) {
    console.error("loginError", error);
    res.status(500).send({ status: 500, error: "Internal Server Error" });
  }
});



// create --> Change Password API
router.put("/changePassword", tokenVerification, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.userIdFromToken;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const checkPassword = bcrypt.compareSync(oldPassword, user.password);

    if (!checkPassword) {
      return res.status(400).send({ message: "Incorrect old password" });
    }

    user.password = bcrypt.hashSync(newPassword, 10);
    await user.save();
    res.status(200).send({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});



// Upload image API
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.post(
  "/uploadImage",
  tokenVerification,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const userId = req.userIdFromToken;

      if (!userId) {
        return res.status(400).json({ message: "User ID is missing." });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      const imagePath = req.file.path;

      user.profilePicture = imagePath;
      await user.save();

      res.status(200).json({
        message: "Profile picture uploaded successfully.",
        path: imagePath,
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      res.status(500).json({
        message: "Error uploading profile picture.",
        error: error.message,
      });
    }
  }
);



// create --> Forgot password and Reset password API
router.post("/forgotPassword", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email });

    if (user) {
      const token = randomstring.generate(6);

      const updateData = await User.updateOne(
        { _id: user._id },
        { $set: { token: token } }
      );

      await sendMail(user.email, token);

      res.status(200).send({
        success: true,
        message: "Check your email for reset password link",
      });
    } else {
      res.status(200).send({ success: false, message: "Invalid email id" });
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// create --> reset password API
router.post("/resetPassword", async (req, res) => {
  try {
    const { password, token } = req.body;

    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = await User.findOne({ token: token });

    if (user) {
      const updateData = await User.findByIdAndUpdate(
        { _id: user._id },
        { $set: { password: hashedPassword, token: "" } },
        { new: true }
      );
      res
        .status(200)
        .send({ success: true, message: "Password has been updated" });
    } else {
      res.status(200).send({ success: false, message: "Token has expired" });
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
});




// create --> csv file upload API
router.get("/createSchema", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "data", "sheet1.csv");
    const rows = [];
    // Read and parse CSV
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => rows.push(row))
      .on("end", async () => {
        if (rows.length === 0) {
          return res.status(400).json({ message: "CSV file is empty!" });
        }

        // Create schema dynamically from the first row's keys
        const columns = Object.keys(rows[0]);
        const schemaDefinition = {};

        columns.forEach((col) => {
          // Dynamically determine the type based on the data
          const firstValue = rows[0][col];
          if (!isNaN(firstValue)) {
            schemaDefinition[col] = { type: Number }; // For numeric columns
          } else if (
            new Date(firstValue) !== "Invalid Date" &&
            !isNaN(new Date(firstValue))
          ) {
            schemaDefinition[col] = { type: Date }; // For date columns
          } else {
            schemaDefinition[col] = { type: String }; // Default to string
          }
        });

        // Create the dynamic schema
        const dynamicSchema = new mongoose.Schema(schemaDefinition);
        const SheetModel = mongoose.model("sheet1", dynamicSchema);

        // Insert data into MongoDB
        await SheetModel.insertMany(rows);

        res
          .status(200)
          .json({ message: "Schema created and data inserted successfully!" });
      });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Something went wrong", error });
  }
});




//  create --> Nuke Users API. It will delete all users from users collection
router.delete("/nukeUsers", async (req, res) => {
  try {
    await User.deleteMany({});

    res.status(200).json({ message: "All users have been deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// create --> Nuke Companies API. It will delete all companies from companies collection
router.delete("/nukeCompanies", async (req, res) => {
  try {
    await Company.deleteMany({});

    res.status(200).json({ message: "All companies have been deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});






module.exports = router;
