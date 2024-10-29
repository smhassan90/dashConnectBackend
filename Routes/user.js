// Routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv/config");
const tokenVerification = require("../config/tokenVerification");
const Story = require("../models/story");
const mongoose = require("mongoose");

// Register route
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, companyName, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      email,
      companyName,
      password: hashedPassword,
    });

    const data = user.toObject();
    delete data.password;

    res
      .status(201)
      .send({ status: 201, data, message: "User Created Successfully" });
  } catch (err) {
    console.error("postApiError", err);
    res.status(500).send({ status: 500, error: err });
  }
});

// Login route
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
        ); // Storing user ID in token
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

// Story creation route
router.post("/stories", tokenVerification, async (req, res) => {
  try {
    const { storyName, description, integrations, complementaryDatasets } = req.body;
    const userIdFromToken = req.userIdFromToken; // Use user ID from token

    // Fetch the user to include in the story
    const user = await User.findById(userIdFromToken).select('firstName lastName email companyName');

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const newStory = new Story({
      storyBoardName,
      description,
      integrations,
      complementaryDatasets,
      storyCreatedBy: userIdFromToken, // Store user ID
      userDetails: { // Store user details as an object
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        companyName: user.companyName,
      }
    });

    await newStory.save();
    res.status(201).send({ message: "Story created successfully", story: newStory });
  } catch (err) {
    console.error("Error creating story", err);
    res.status(500).send({ message: "Error creating story", error: err });
  }
});



// Get all stories route
router.get("/stories", async (req, res) => {
  try {
    const stories = await Story.find().populate(
      "storyCreatedBy",
      "firstName lastName email companyName"
    ); // Populate user details
    res.status(200).send({ message: "Stories fetched successfully", stories });
  } catch (err) {
    console.error("Error fetching stories", err);
    res.status(500).send({ message: "Error fetching stories", error: err });
  }
});

// Story update route
router.put("/stories/:id", tokenVerification, async (req, res) => {
  try {
    const storyId = req.params.id; // Get the story ID from the request parameters
    const { storyName, description, integrations, complementaryDatasets } =
      req.body;

    // Validate the story ID
    if (!mongoose.isValidObjectId(storyId)) {
      return res.status(400).send({ status: 400, message: "Invalid story ID" });
    }

    const updatedStory = await Story.findByIdAndUpdate(
      storyId,
      { storyName, description, integrations, complementaryDatasets },
      { new: true, runValidators: true } // Return the updated document and run validators
    );

    if (!updatedStory) {
      return res.status(404).send({ status: 404, message: "Story not found" });
    }

    res
      .status(200)
      .send({ message: "Story updated successfully", story: updatedStory });
  } catch (err) {
    console.error("Error updating story", err);
    res.status(500).send({ message: "Error updating story", error: err });
  }
});

// Story delete route
router.delete("/stories/:id", tokenVerification, async (req, res) => {
  try {
    const storyId = req.params.id;

    if (!mongoose.isValidObjectId(storyId)) {
      return res.status(400).send({ status: 400, message: "Invalid story ID" });
    }

    const deletedStory = await Story.findByIdAndDelete(storyId);

    if (!deletedStory) {
      return res.status(404).send({ status: 404, message: "Story not found" });
    }

    res
      .status(200)
      .send({ message: "Story deleted successfully", story: deletedStory });
  } catch (err) {
    console.error("Error deleting story", err);
    res.status(500).send({ message: "Error deleting story", error: err });
  }
});

module.exports = router;