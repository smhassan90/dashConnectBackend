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
const Company = require("../models/Company"); 

// Register route
// router.post("/register", async (req, res) => {
//   try {
//     const { firstName, lastName, email, companyName, password } = req.body;
//     const hashedPassword = bcrypt.hashSync(password, 10);

//     const user = await User.create({
//       firstName,
//       lastName,
//       email,
//       companyName,
//       password: hashedPassword,
//     });

//     const data = user.toObject();
//     delete data.password;

//     res
//       .status(201)
//       .send({ status: 201, data, message: "User Created Successfully" });
//   } catch (err) {
//     console.error("postApiError", err);
//     res.status(500).send({ status: 500, error: err });
//   }
// });

router.post("/create", async (req, res) => {
  try {
      const { companyName, updateDate, Status, firstName, lastName, email, password } = req.body;

      const company = await Company.create({
          companyName,
          updateDate,
          Status,
      });

      const hashedPassword = bcrypt.hashSync(password, 10); // Hash the password

      const user = await User.create({
          firstName,
          lastName,
          email,
          password: hashedPassword, // Store the hashed password
          company: {  
              _id: company._id, 
              companyName: company.companyName,
              updateDate: company.updateDate,
              Status: company.Status,
          },
      });

      const userWithCompany = await User.findById(user._id);

      res.status(201).json({ user: userWithCompany });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});




// Add employee route
router.post("/addEmployee", tokenVerification, async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    
    // Token se user ID nikalna
    const userIdFromToken = req.userIdFromToken;

    // User ko fetch karna
    const user = await User.findById(userIdFromToken);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Company ka data nikalna
    const company = user.company;

    // Input validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check for existing email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use." });
    }

    // Password hashing
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Create user with company details
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || "employee", // Default role to 'employee'
      company: {
        _id: company._id, 
        companyName: company.companyName,
        updateDate: company.updateDate,
        Status: company.Status,
      },
    });

    res.status(201).json({ user: newUser });
  } catch (error) {
    console.error("Error adding employee:", error);
    res.status(500).json({ message: error.message });
  }
});




// Login route
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });

//     if (user) {
//       const checkPassword = bcrypt.compareSync(password, user.password);

//       if (checkPassword) {
//         const token = jwt.sign(
//           { id: user._id, email: user.email },
//           process.env.JWT_SECRET
//         ); // Storing user ID in token
//         res.status(200).send({
//           status: 200,
//           user: {
//             id: user._id,
//             email: user.email,
//             firstName: user.firstName,
//             lastName: user.lastName,
//             companyName: user.companyName,
//           },
//           message: "Login successful",
//           token,
//         });
//       } else {
//         res.status(401).send({ status: 401, message: "Incorrect Password" });
//       }
//     } else {
//       res.status(404).send({ status: 404, message: "User not found" });
//     }
//   } catch (error) {
//     console.error("loginError", error);
//     res.status(500).send({ status: 500, error: "Internal Server Error" });
//   }
// });


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      const checkPassword = bcrypt.compareSync(password, user.password); // Compare plaintext with hashed

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





// Update employee
router.put("/updateEmployee/:id", tokenVerification, async (req, res) => {
  try {
      const employeeId = req.params.id; // Get the employee ID from the request parameters
      const { firstName, lastName, email, password, role } = req.body; // Destructure the request body

      // Validate the employee ID
      if (!mongoose.isValidObjectId(employeeId)) {
          return res.status(400).send({ status: 400, message: "Invalid employee ID" });
      }

      // Fetch the logged-in user's company details
      const userIdFromToken = req.userIdFromToken; // Get user ID from token
      const user = await User.findById(userIdFromToken).select('company');

      if (!user) {
          return res.status(404).send({ message: "User not found" });
      }

      // Check if employee belongs to the logged-in user's company
      const employee = await User.findById(employeeId);
      if (!employee || employee.company._id.toString() !== user.company._id.toString()) {
          return res.status(403).send({ message: "You are not authorized to update this employee." });
      }

      // Update the employee details
      const updatedEmployee = await User.findByIdAndUpdate(
          employeeId,
          {
              firstName,
              lastName,
              email,
              password: password ? bcrypt.hashSync(password, 10) : employee.password, // Hash password only if it's provided
              role,
          },
          { new: true, runValidators: true } // Return the updated document and run validators
      );

      if (!updatedEmployee) {
          return res.status(404).send({ status: 404, message: "Employee not found" });
      }

      res.status(200).send({ message: "Employee updated successfully", employee: updatedEmployee });
  } catch (err) {
      console.error("Error updating employee", err);
      res.status(500).send({ message: "Error updating employee", error: err });
  }
});





// Delete employee
router.delete("/deleteEmployee/:id", tokenVerification, async (req, res) => {
  try {
      const employeeId = req.params.id;

      // Validate the employee ID
      if (!mongoose.isValidObjectId(employeeId)) {
          return res.status(400).send({ status: 400, message: "Invalid employee ID" });
      }

      // Fetch the logged-in user's company details
      const userIdFromToken = req.userIdFromToken; // Get user ID from token
      const user = await User.findById(userIdFromToken).select('company');

      if (!user) {
          return res.status(404).send({ message: "User not found" });
      }

      // Check if employee belongs to the logged-in user's company
      const employee = await User.findById(employeeId);
      if (!employee || employee.company._id.toString() !== user.company._id.toString()) {
          return res.status(403).send({ message: "You are not authorized to delete this employee." });
      }

      const deletedEmployee = await User.findByIdAndDelete(employeeId);

      if (!deletedEmployee) {
          return res.status(404).send({ status: 404, message: "Employee not found" });
      }

      res.status(200).send({ message: "Employee deleted successfully", employee: deletedEmployee });
  } catch (err) {
      console.error("Error deleting employee", err);
      res.status(500).send({ message: "Error deleting employee", error: err });
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
      storyName,
      description,
      integrations,
      complementaryDatasets,
      storyCreatedBy: userIdFromToken, // Use user's ID here
      userDetails: { // Store user details in the story
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        companyName: user.companyName,
      },
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