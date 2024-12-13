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
const cron = require('node-cron')
const Integration = require('../models/Integration')
const MasterIntegration = require('../models/MasterIntegration')
const MetaIntegration = require('../models/Meta_Integration')



router.post('/metaIntegration', async (req, res) => {
  try {
    const { integration_id, apiName, apiStructure } = req.body;

    const apiStructureString = typeof apiStructure === 'string'? apiStructure: JSON.stringify(apiStructure);
    const newMeta = new MetaIntegration({
      integration_id,
      apiName,
      apiStructure: apiStructureString,
    });

    await newMeta.save();
    res.status(201).send('MetaIntegration saved successfully!');
  } catch (error) {
    res.status(500).send('Server Error: ' + error.message);
  }
});



router.post('/masterIntegration', async (req, res) => {
  const { name } = req.body
  const newIntegration = new MasterIntegration({ masterintegration: { name } });
  await newIntegration.save();
  res.status(201).json({ message: 'Created successfully', data: newIntegration });
});

// --------------------------------       ------------------------------------- //

// create --> user API
router.post("/create", async (req, res) => {
  try {
    const { companyName,updateDate, Status, firstName, lastName, email, password } = req.body;

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
        _id: company._id, // only company id send into the database
        companyName: company.companyName,
        updateDate: company.updateDate,
        status: company.status,
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





// create --> Update Employee API
router.put("/updateEmployee/:employeeId", tokenVerification, async (req, res) => {
  try {
      const { firstName, lastName, email, role } = req.body;
      const { employeeId } = req.params

      // Validate the employee ID
      if (!mongoose.isValidObjectId(employeeId)) {
          return res.status(400).send({ status: 400, message: "Invalid employee ID" });
      }

      const userIdFromToken = req.userIdFromToken; // Get user id from token
      const user = await User.findById(userIdFromToken).select('company');

      if (!user) {
          return res.status(404).send({ message: "User not found" });
      }

      // Check employee belongs to the logged-in user's company
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
router.delete("/deleteEmployee/:employeeId", tokenVerification, async (req, res) => {
  try {
      const { employeeId } = req.params; 

      if (!mongoose.isValidObjectId(employeeId)) {
          return res.status(400).send({ status: 400, message: "Invalid employee ID" });
      }

      // add validateion user belong to the same comapny

      const userIdFromToken = req.userIdFromToken; 
      const user = await User.findById(userIdFromToken).select('company');

      if (!user) {
          return res.status(404).send({ message: "User not found" });
      }

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





// create --> API for fetch all users in the same company
router.get("/getEmployees", tokenVerification, async (req, res) => {
  try {
    const userIdFromToken = req.userIdFromToken;

    // Find the user to get their company ID
    const user = await User.findById(userIdFromToken);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const companyId = user.company; // Directly using the companyId from user

    // Find all employees belonging to the same company ID
    const employees = await User.find({ company: companyId });

    res.status(200).json({ employees });
  } catch (error) {
    console.error("Error fetching employees:", error);
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
router.post("/testConnection", tokenVerification ,async (req, res) => {
  const { userId, apiKey } = req.body;

  if (!userId || !apiKey) {
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


router.get("/getIntegration",tokenVerification ,async(req,res)=>{
 try {
  const userIdFromToken = req.userIdFromToken;
  const user = await User.findById(userIdFromToken).select("company");
  res.send(user.company)
  console.log("Fetched User:", user);
 } catch (error) {
  console.log(error); 
 }
})



// create --> Acuity API
const fetchData = async (userId, apiKey, companyName) => {
  if (!apiKey || !userId) {
    console.log(`Skipping company '${companyName}' due to missing integration details.`);
    return;
  }

  try {
    const company = await Company.findOne({ companyName });
    const metaIntegrations = await MetaIntegration.find({});
    const apiEndpoints = metaIntegrations.map((integration) => integration.apiName);
    console.log("Endpoints of api-->", apiEndpoints);

    if (!company) {
      console.log(`Company with name '${companyName}' not found.`);
      return;
    }

    for (const endpoint of apiEndpoints) {
      console.log(`Fetching data for endpoint '${endpoint}' for company '${companyName}'...`);

      // Check the last sync time for the company and endpoint
      const lastSync = await Integration.findOne({
        companyId: company._id,
        apiName: endpoint,
      }).sort({ lastSyncTime: -1 });

      const lastSyncTime = lastSync ? lastSync.lastSyncTime : null; // If no sync, consider it as null

      const response = await axios.get(`https://acuityscheduling.com/api/v1${endpoint}`, {
        auth: {
          username: userId,
          password: apiKey,
        },
      });

      console.log(`Data received for '${endpoint}' from company '${companyName}':`, response.data);

      // Compare last sync time with the data received and only save if there's new or updated data
      const updatedData = response.data.filter((data) => {
        return !lastSyncTime || new Date(data.updatedAt) > new Date(lastSyncTime);
      });

      // If there is updated data, save it; if not, save an empty array with a "no updated data" message
      const dataToSave = updatedData.length > 0 ? updatedData : [];
      const message = updatedData.length > 0 ? '' : 'No updated data fetch';

      try {
        const newRecord = new Integration({
          companyId: company._id,
          apiName: endpoint,
          data: dataToSave,
          date: new Date(),
          lastSyncTime: new Date(), // Update last sync time after saving
          message: message,  // Save message when no data is updated
        });
        await newRecord.save();
        console.log(`Data from '${endpoint}' for company '${companyName}' saved successfully!`);
      } catch (saveError) {
        console.error(`Failed to save data for endpoint '${endpoint}' of company '${companyName}':`, saveError.message);
      }
    }
  } catch (apiError) {
    console.error(`Error during API calls for company '${companyName}':`, apiError.message);
  }
};



cron.schedule("0 0 * * *", async () => {
  console.log("Running scheduled task at:", new Date().toString());

  try {
    const companies = await Company.find();
    console.log(`Fetched ${companies.length} companies.`);

    for (const company of companies) {
      const { companyName, integration } = company;
      const { username, password } = integration || {};

      if (!username || !password) {
        console.log(`Skipping company '${companyName}' due to missing integration details.`);
        continue;
      }

      await fetchData(username, password, companyName);
    }

    console.log("Scheduled task completed successfully.");
  } catch (error) {
    console.error("Error during scheduled task:", error.message);
  }
});





// create --> update integration api
router.put("/updateIntegration", tokenVerification, async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    // Get user ID from token
    const userIdFromToken = req.userIdFromToken;

    // Fetch user to get the associated company ID
    const user = await User.findById(userIdFromToken).select("company");
    if (!user || !user.company) {
      return res.status(404).json({ error: "User or associated company not found." });
    }

    const companyId = user.company; // Directly using companyId

    // Fetch company using the companyId
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: "Company not found." });
    }

    // Ensure integration object exists
    if (!company.integration) {
      company.integration = {}; // Initialize if missing
    }

    // Update integration credentials
    company.integration.username = username;
    company.integration.password = password;

    // Save updated company details
    await company.save();

    res.status(200).json({
      message: "Integration updated successfully.",
      company,
    });
  } catch (err) {
    console.error("Error Occurred:", err.message);
    res.status(500).json({ error: "Server error.", details: err.message });
  }
});




// create --> disconect integration api
router.put("/disconnectIntegration", tokenVerification, async (req, res) => {
  try {
    // Get user ID from token
    const userIdFromToken = req.userIdFromToken;

    // Fetch user to get the associated company ID
    const user = await User.findById(userIdFromToken).select("company");
    if (!user || !user.company) {
      return res.status(404).json({ error: "User or associated company not found." });
    }

    const companyId = user.company; // Directly using companyId

    
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: "Company not found." });
    }

    // Nullify only username and password from integrtion object
    if (company.integration) {
      company.integration.username = null;
      company.integration.password = null;
    } else {
      return res.status(400).json({ error: "Integration data not found for the company." });
    }

    await company.save();

    res.status(200).json({
      message: "Disconnect successfully.",
    });
  } catch (err) {
    console.error("Error Occurred:", err.message);
    res.status(500).json({ error: "Server error.", details: err.message });
  }
});






// router.post("/integration", tokenVerification, async (req, res) => {
//   const { apiKey, userId } = req.body;

//   if (!apiKey || !userId) {
//     return res.status(400).json({ error: "API key and user ID are required" });
//   }

//   try {
//     await fetchData(apiKey, userId);
//     res.json({
//       message: "Data fetched and saved successfully",
//     });
//   } catch (error) {
//     console.error("Error during API calls:", error.message);
//     res.status(500).json({ error: "Failed to fetch data from Acuity API..." });
//   }
// });



// create -> append question API
router.post("/appendQuestion", tokenVerification,async (req, res) => {
  const { question } = req.body;

  // empty validation
  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Invalid or missing question string." });
  }

  try {
    const metaIntegrations = await MetaIntegration.find({});

    let combinedString = question; 
    metaIntegrations.forEach((integration) => {
      combinedString += `\nAPI Name: ${integration.apiName}\nAPI Structure: ${integration.apiStructure}\n`;
    });

    console.log("Combined String:\n", combinedString);

    res.status(200).json({ message: "String appended successfully", combinedString });
  } catch (error) {
    console.error("Error while appending question:", error.message);
    res.status(500).json({ error: "An error occurred while processing your request." });
  }
});




// API route to handle dynamic requests based on frontend message
router.post('/summaryOfAppoinments', async (req, res) => {
  const { userQuestion } = req.body; // Get user question from the request body

  // Validate the user question
  if (!userQuestion || !userQuestion.toLowerCase().includes("summary of appointments")) {
    return res.status(400).json({ message: 'Invalid question format' });
  }

  try {
    // Fetch only data related to '/appointments' from Integration collection
    const appointmentsData = await Integration.find({ apiName: '/appointments' });

    if (appointmentsData.length === 0) {
      return res.status(404).json({ message: "No appointment data found" });
    }

    // Initialize the result structure
    const result = {
      labels: [], // Dates
      totalAppointments: [], // Count of total appointments per day
      totalPaidAppointments: [], // Count of paid appointments per day
      totalRevenue: [], // Sum of revenue per day
    };

    // Process each item in the appointmentsData array
    appointmentsData.forEach((appointmentData) => {
      const { data } = appointmentData; // Assuming 'data' is an array

      data.forEach((item) => {
        const date = item.date;

        // Check if the date exists and is a valid string
        if (date && typeof date === 'string') {
          const appointmentDate = date.split(' ')[0]; // Extract date in YYYY-MM-DD format

          // Check if the date already exists in the result
          if (!result.labels.includes(appointmentDate)) {
            result.labels.push(appointmentDate);
            result.totalAppointments.push(0);
            result.totalPaidAppointments.push(0);
            result.totalRevenue.push(0);
          }

          // Find the index of the current date in labels
          const index = result.labels.indexOf(appointmentDate);

          // Increment total appointments
          result.totalAppointments[index]++;

          // Increment paid appointments and total revenue if the appointment is paid
          if (item.paid === 'yes') {
            result.totalPaidAppointments[index]++;
            result.totalRevenue[index] += parseFloat(item.price || 0); // Ensure price is parsed as a number
          }
        }
      });
    });

    // Send the result as a JSON response
    return res.status(200).json(result);

  } catch (error) {
    console.error('Error fetching appointment summary:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});





router.post('/monthlyProgress', async (req, res) => {
  const { question } = req.body; // Get user question from the request body

  // Validate the user question (Check if the question includes "monthly progress")
  if (!question || !question.toLowerCase().includes("monthly progress")) {
    return res.status(400).json({ message: 'Invalid question format' });
  }

  try {
    // Fetch relevant data from the Integration collection
    const progressData = await Integration.find({ apiName: '/appointments' });

    if (!progressData.length) {
      return res.status(404).json({ message: 'No progress data found' });
    }

    // Structure for storing monthly progress summary
    const result = {
      labels: [], // List of months
      completedTasks: [], // Tasks completed each month
      pendingTasks: [], // Pending tasks for each month
      totalHours: [], // Total hours spent each month
    };

    // Process each progress data entry
    progressData.forEach((entry) => {
      const { data } = entry; // Assuming 'data' contains progress details as an array

      data.forEach((item) => {
        const date = item.date; // Example: '2024-12-11'
        if (date && typeof date === 'string') {
          const month = date.split('-').slice(0, 2).join('-'); // Extract YYYY-MM format

          // Check if this month is already processed
          if (!result.labels.includes(month)) {
            result.labels.push(month);
            result.completedTasks.push(0);
            result.pendingTasks.push(0);
            result.totalHours.push(0);
          }

          // Get the index of the month
          const index = result.labels.indexOf(month);

          // Update completed tasks, pending tasks, and hours
          result.completedTasks[index] += item.completed ? 1 : 0;
          result.pendingTasks[index] += item.pending ? 1 : 0;
          result.totalHours[index] += parseFloat(item.hours || 0); // Ensure hours is a number
        }
      });
    });

    // Return the processed result
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching monthly progress:', error.message);
    return res.status(500).json({ message: 'Internal server error', details: error.message });
  }
});



router.post('/monthlyTasks', async (req, res) => {
  const { question } = req.body; // Get user question from the request body
  
  // Remove validation logic (to handle more general queries)
  try {
    // Get the current month and year for filtering
    const currentMonth = new Date().getMonth(); // Current month (0-11)
    const currentYear = new Date().getFullYear(); // Current year

    // Get the user ID from the token (assuming user info is available)
    const userIdFromToken = req.userIdFromToken;

    // Fetch relevant data from the Integration collection (appointments data)
    const appointmentsData = await Integration.find({
      apiName: '/appointments',
      userId: userIdFromToken, // Assuming userId is part of the document
    });

    if (appointmentsData.length === 0) {
      return res.status(404).json({ message: 'No appointments data found for this user' });
    }

    // Structure for storing monthly progress summary
    const result = {
      month: `${currentYear}-${currentMonth + 1}`, // Format YYYY-MM
      tasksCompleted: 0, // Number of completed tasks
    };

    // Process each appointment data entry
    appointmentsData.forEach((appointmentData) => {
      const { data } = appointmentData; // Assuming 'data' contains the appointment details

      data.forEach((item) => {
        const date = item.date; // Example: '2024-12-11'
        
        if (date && typeof date === 'string') {
          const appointmentMonth = date.split('-').slice(0, 2).join('-'); // Extract YYYY-MM format

          // Check if this is the current month
          if (appointmentMonth === result.month) {
            // Count the completed tasks (appointments)
            if (item.completed) {
              result.tasksCompleted += 1;
            }
          }
        }
      });
    });

    // Return the processed result
    return res.status(200).json(result);

  } catch (error) {
    console.error('Error fetching monthly progress:', error.message);
    return res.status(500).json({ message: 'Internal server error', details: error.message });
  }
});




router.post('/taskSummary', async (req, res) => {
  const { question } = req.body; // Get user question from the request body
  
  // Check if the question contains keywords related to tasks summary
  if (!question || !(question.toLowerCase().includes("task") && question.toLowerCase().includes("summary"))) {
    return res.status(400).json({ message: 'Invalid question format' });
  }

  try {
    // Get the user ID from the token (assuming user info is available)
    const userIdFromToken = req.userIdFromToken;

    // Fetch relevant data from the Integration collection (appointments data)
    const appointmentsData = await Integration.find({
      apiName: '/appointments',
      userId: userIdFromToken, // Assuming userId is part of the document
    });

    if (appointmentsData.length === 0) {
      return res.status(404).json({ message: 'No appointment data found for this user' });
    }

    // Structure for storing the task summary
    const result = {
      labels: [], // List of months (e.g., '2024-12')
      completedTasks: [], // Completed tasks count for each month
    };

    // Process each appointment data entry
    appointmentsData.forEach((appointmentData) => {
      const { data } = appointmentData; // Assuming 'data' contains the task details

      data.forEach((item) => {
        const date = item.date; // Example: '2024-12-11'
        
        if (date && typeof date === 'string') {
          const taskMonth = date.split('-').slice(0, 2).join('-'); // Extract YYYY-MM format

          // Check if this month is already in the result
          if (!result.labels.includes(taskMonth)) {
            result.labels.push(taskMonth);
            result.completedTasks.push(0);
          }

          // Get the index of the month
          const index = result.labels.indexOf(taskMonth);

          // If the task is completed, increment the completed tasks count for that month
          if (item.completed) {
            result.completedTasks[index] += 1;
          }
        }
      });
    });

    // Send the task summary as a response
    return res.status(200).json({
      message: 'Task summary retrieved successfully.',
      totalCompletedTasks: result.completedTasks.reduce((acc, curr) => acc + curr, 0), // Sum up all completed tasks
      details: result,
    });

  } catch (error) {
    console.error('Error fetching task summary:', error.message);
    return res.status(500).json({ message: 'Internal server error', details: error.message });
  }
});







module.exports = router;