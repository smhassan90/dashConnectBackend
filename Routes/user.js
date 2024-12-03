// Routes/user.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv/config");
const tokenVerification = require("../config/tokenVerification");
const mongoose = require("mongoose");
const Company = require("../models/Company"); 
const multer = require('multer');
const randomstring = require('randomstring')
const sendMail = require('../config/nodemailer')
const axios = require('axios')
const Integration = require('../models/Integration');
const cron = require('node-cron')

// create --> user API
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



// create --> Add employee API
router.post("/addEmployee", tokenVerification, async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    
    // Extract ID from token
    const userIdFromToken = req.userIdFromToken;

    // Fetch user
    const user = await User.findById(userIdFromToken);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Extract company data
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

   
    const hashedPassword = bcrypt.hashSync(password, 10);

    
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || "employee", 
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
 


// create --> Login API
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    const company = user.company;

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
            company: {
              _id: company._id, 
              companyName: company.companyName,
              updateDate: company.updateDate,
              Status: company.Status,
            },
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



// create --> Update Employee API
router.put("/updateEmployee", tokenVerification, async (req, res) => {
  try {
      const { employeeId, firstName, lastName, email, password, role } = req.body; // Get employeeId from the request body

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



// create --> Delete Employee API
router.delete("/deleteEmployee", tokenVerification, async (req, res) => {
  try {
      const { employeeId } = req.body; // Get employeeId from the request body

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
 


//  create --> Nuke Users API. It will delete all users from users collection
router.delete("/nukeUsers", async (req, res) => {
  try {
    await User.deleteMany({}); // This command delete all users

    res.status(200).json({ message: "All users have been deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// create --> Nuke Companies API. It will delete all companies from companies collection
router.delete("/nukeCompanies", async (req, res) => {
  try {
    await Company.deleteMany({}); // This command delete all companies

    res.status(200).json({ message: "All companies have been deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// create --> API for fetch all users in the same company
router.get("/selectAllUsers", tokenVerification, async (req, res) => {
  try {
    // Retrieve user ID from token
    const userIdFromToken = req.userIdFromToken;

    // Find the user and get their company ID
    const user = await User.findById(userIdFromToken);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const companyId = user.company._id;

    // Find all users associated with the same company ID
    const usersInCompany = await User.find({ "company._id": companyId });

    // Return the list of users in the same company
    res.status(200).json({ users: usersInCompany });
  } catch (error) {
    console.error("Error fetching users in company:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



// create --> Change Password API
router.put("/changePassword", tokenVerification, async (req, res) => {
  try {
    const {oldPassword, newPassword } = req.body; 
    const userId = req.userIdFromToken;
  
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const checkPassword = bcrypt.compareSync(oldPassword, user.password);

    if(!checkPassword) {
      return res.status(400).send({ message: "Incorrect old password" });
    } 

      user.password = bcrypt.hashSync(newPassword, 10); ;
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
    return cb(null,"./uploads");  
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}-${file.originalname}`);  
  }
});

const upload = multer({ storage });

router.post("/uploadImage", tokenVerification, upload.single("profileImage"), async (req, res) => {
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

    res.status(200).json({ message: "Profile picture uploaded successfully.", path: imagePath });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ message: "Error uploading profile picture.", error: error.message });
  }
});



// create --> Forgot password and Reset password API
router.post("/forgotPassword", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email });

    if (user) {
      const token = randomstring.generate();

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



router.post("/resetPassword", async (req, res) => {
  try {
    const { password , token } = req.body;  

    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = await User.findOne({ token: token });

    if (user) { 

      const updateData = await User.findByIdAndUpdate(
        { _id: user._id },
        { $set: { password: hashedPassword, token: ""} },
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



// create --> testConnection API
router.get("/testConnection", tokenVerification ,async (req, res) => {
  const { apiKey, userId } = req.body;

  if (!apiKey || !userId) {
    return res.status(400).json({ error: "API key and user ID are required" });
  }

  try {
    const response = await axios.get(
      "https://acuityscheduling.com/api/v1/appointments?max=30",
      {
        auth : {
          username: userId,
          password: apiKey,
        }
      }
    );
    console.log(response);
    
    res.json({
      message: "Appointment data fetched successfully",
      data: response.data,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error.message);
    res
      .status(500)
      .json({ error: "Failed to fetch appointments from Acuity API" });
  }
});



// create --> Acuity API
const fetchData = async (apiKey, userId) => {
  if (!apiKey || !userId) {
    console.error("API key or user ID is missing");
    return;
  }

  const apiEndpoints = [
    '/appointments',
    '/clients',
    // '/availability/dates',
    // '/availability/times',
    '/availability/classes',
    '/calendars',
    '/blocks',
  ];

  try {
    for (const endpoint of apiEndpoints) {
      const response = await axios.get(`https://acuityscheduling.com/api/v1${endpoint}`, {
        auth: {
          username: userId,
          password: apiKey,
        }
      });

      const newRecord = new Integration({
        apiName: endpoint,
        data: response.data,
        date: new Date(),
      });
      await newRecord.save();
      console.log(`${endpoint} data saved successfully!`);
    }
  } catch (error) {
    console.error("Error during API calls:", error.message);
  }
};


router.post("/integration", tokenVerification, async (req, res) => {
  const { apiKey, userId } = req.body;

  if (!apiKey || !userId) {
    return res.status(400).json({ error: "API key and user ID are required" });
  }

  try {
    await fetchData(apiKey, userId);
    res.json({
      message: "Data fetched and saved successfully",
    });
  } catch (error) {
    console.error("Error during API calls:", error.message);
    res.status(500).json({ error: "Failed to fetch data from Acuity API..." });
  }
});


cron.schedule('0 0 * * *', async () => {
  console.log("Running scheduled task at: ", new Date().toString());


  const apiKey = process.env.API_KEY;  
  const userId = process.env.USER_ID;  

  if (!apiKey || !userId) {
    console.log("API key or user ID is missing for the scheduled task");
    return;
  }

  await fetchData(apiKey, userId);
});



// create --> Integration API
router.put("/updateIntegration", tokenVerification, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  }

  try {
    // Step 1: Get user from token
    const userIdFromToken = req.userIdFromToken;
    const user = await User.findById(userIdFromToken).select("company");
    console.log("Fetched User:", user);

    // Step 2: Check if user and company exist
    if (!user || !user.company || !user.company.companyName) {
      return res.status(404).json({ error: "Company not associated with user." });
    }

    const { companyName } = user.company;

    // Step 3: Fetch company by companyName
    const company = await Company.findOne({ companyName });
    console.log("Fetched Company:", company);

    if (!company) {
      return res.status(404).json({ error: "Company not found." });
    }

    // Step 4: Update only the username and password fields of the integration object
    company.integration.username = username;
    company.integration.password = password;

    res.status(200).json({
      message: "Integration updated successfully.",
      company,
    });
  } catch (err) {
    console.error("Error Occurred:", err.message);
    res.status(500).json({ error: "Server error.", details: err.message });
  }
});


module.exports = router;