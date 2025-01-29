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
const Integration = require("../models/Integration");
const MasterIntegration = require("../models/MasterIntegration");
const MetaIntegration = require("../models/Meta_Integration");
const path = require("path");
const fs = require("fs");
const csvParser = require("csv-parser");
const mysql = require("mysql2");
const TableStructure = require("../models/TableStructure");
const IntegrationCredentials = require("../models/IntegrationCredentials");
const MetaIntegrationDetail = require("../models/MetaIntegrationDetails");



router.get("/fetchAllTables", async (req, res) => {
  const tables = await TableStructure.find({}, "tableName")
  res.json({
    data : tables.map((table)=>{
      return table.tableName
    })
  })
})



router.post("/metaIntegration", async (req, res) => {
  try {
    const { integration_id, apiName, apiStructure } = req.body;

    const apiStructureString =
      typeof apiStructure === "string"
        ? apiStructure
        : JSON.stringify(apiStructure);
    const newMeta = new MetaIntegration({
      integration_id,
      apiName,
      apiStructure: apiStructureString,
    });

    await newMeta.save();
    res.status(201).send("MetaIntegration saved successfully!");
  } catch (error) {
    res.status(500).send("Server Error: " + error.message);
  }
});

router.post("/masterIntegration", async (req, res) => {
  const { name } = req.body;
  const newIntegration = new MasterIntegration({ masterintegration: { name } });
  await newIntegration.save();
  res
    .status(201)
    .json({ message: "Created successfully", data: newIntegration });
});


// ------------------------------------------------------------------------------ //

// create --> user API
router.post("/create", async (req, res) => {
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
router.put(
  "/updateEmployee/:employeeId",
  tokenVerification,
  async (req, res) => {
    try {
      const { firstName, lastName, email, role } = req.body;
      const { employeeId } = req.params;

      // Validate the employee ID
      if (!mongoose.isValidObjectId(employeeId)) {
        return res
          .status(400)
          .send({ status: 400, message: "Invalid employee ID" });
      }

      const userIdFromToken = req.userIdFromToken; // Get user id from token
      const user = await User.findById(userIdFromToken).select("company");

      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }

      // Check employee belongs to the logged-in user's company
      const employee = await User.findById(employeeId);
      if (
        !employee ||
        employee.company._id.toString() !== user.company._id.toString()
      ) {
        return res
          .status(403)
          .send({ message: "You are not authorized to update this employee." });
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
        return res
          .status(404)
          .send({ status: 404, message: "Employee not found" });
      }

      res
        .status(200)
        .send({
          message: "Employee updated successfully",
          employee: updatedEmployee,
        });
    } catch (err) {
      console.error("Error updating employee", err);
      res.status(500).send({ message: "Error updating employee", error: err });
    }
  }
);

// create --> Delete Employee API
router.delete(
  "/deleteEmployee/:employeeId",
  tokenVerification,
  async (req, res) => {
    try {
      const { employeeId } = req.params;

      if (!mongoose.isValidObjectId(employeeId)) {
        return res
          .status(400)
          .send({ status: 400, message: "Invalid employee ID" });
      }

      // add validateion user belong to the same comapny

      const userIdFromToken = req.userIdFromToken;
      const user = await User.findById(userIdFromToken).select("company");

      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }

      const employee = await User.findById(employeeId);
      if (
        !employee ||
        employee.company._id.toString() !== user.company._id.toString()
      ) {
        return res
          .status(403)
          .send({ message: "You are not authorized to delete this employee." });
      }

      const deletedEmployee = await User.findByIdAndDelete(employeeId);

      if (!deletedEmployee) {
        return res
          .status(404)
          .send({ status: 404, message: "Employee not found" });
      }

      res
        .status(200)
        .send({
          message: "Employee deleted successfully",
          employee: deletedEmployee,
        });
    } catch (err) {
      console.error("Error deleting employee", err);
      res.status(500).send({ message: "Error deleting employee", error: err });
    }
  }
);

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

      res
        .status(200)
        .json({
          message: "Profile picture uploaded successfully.",
          path: imagePath,
        });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      res
        .status(500)
        .json({
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

// create --> testConnection API
//   router.post("/testConnection", tokenVerification ,async (req, res) => {
//     const { userId, apiKey } = req.body;

//   if (!userId || !apiKey) {
//     return res.status(400).json({ error: "API key and user ID are required" });
//   }

//   try {
//     const response = await axios.get(
//       "https://acuityscheduling.com/api/v1/appointments?max=30",
//       {
//         auth : {
//           username: userId,
//           password: apiKey,
//         }
//       }
//     );
//     console.log(response);

//     res.json({
//       message: "Appointment data fetched successfully",
//       data: response.data,
//     });
//   } catch (error) {
//     console.error("Error fetching appointments:", error.message);
//     res
//       .status(500)
//       .json({ error: "Failed to fetch appointments from Acuity API" });
//   }
// });

router.get("/getIntegration", tokenVerification, async (req, res) => {
  try {
    const userIdFromToken = req.userIdFromToken;
    const user = await User.findById(userIdFromToken).select("company");
    res.send(user.company);
    console.log("Fetched User:", user);
  } catch (error) {
    console.log(error);
  }
});

// create --> Acuity API
const fetchData = async (userId, apiKey, companyName) => {
  if (!apiKey || !userId) {
    console.log(
      `Skipping company '${companyName}' due to missing integration details.`
    );
    return;
  }

  try {
    const company = await Company.findOne({ companyName });
    const metaIntegrations = await MetaIntegration.find({});
    const apiEndpoints = metaIntegrations.map(
      (integration) => integration.apiName
    );
    console.log("Endpoints of api-->", apiEndpoints);

    if (!company) {
      console.log(`Company with name '${companyName}' not found.`);
      return;
    }

    for (const endpoint of apiEndpoints) {
      console.log(
        `Fetching data for endpoint '${endpoint}' for company '${companyName}'...`
      );

      // Check the last sync time for the company and endpoint
      const lastSync = await Integration.findOne({
        companyId: company._id,
        apiName: endpoint,
      }).sort({ lastSyncTime: -1 });

      const lastSyncTime = lastSync ? lastSync.lastSyncTime : null; // If no sync, consider it as null

      const response = await axios.get(
        `https://acuityscheduling.com/api/v1${endpoint}`,
        {
          auth: {
            username: userId,
            password: apiKey,
          },
        }
      );

      console.log(
        `Data received for '${endpoint}' from company '${companyName}':`,
        response.data
      );

      // Compare last sync time with the data received and only save if there's new or updated data
      const updatedData = response.data.filter((data) => {
        return (
          !lastSyncTime || new Date(data.updatedAt) > new Date(lastSyncTime)
        );
      });

      // If there is updated data, save it; if not, save an empty array with a "no updated data" message
      const dataToSave = updatedData.length > 0 ? updatedData : [];
      const message = updatedData.length > 0 ? "" : "No updated data fetch";

      try {
        const newRecord = new Integration({
          companyId: company._id,
          apiName: endpoint,
          data: dataToSave,
          date: new Date(),
          lastSyncTime: new Date(), // Update last sync time after saving
          message: message, // Save message when no data is updated
        });
        await newRecord.save();
        console.log(
          `Data from '${endpoint}' for company '${companyName}' saved successfully!`
        );
      } catch (saveError) {
        console.error(
          `Failed to save data for endpoint '${endpoint}' of company '${companyName}':`,
          saveError.message
        );
      }
    }
  } catch (apiError) {
    console.error(
      `Error during API calls for company '${companyName}':`,
      apiError.message
    );
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
        console.log(
          `Skipping company '${companyName}' due to missing integration details.`
        );
        continue;
      }

      await fetchData(username, password, companyName);
    }

    console.log("Scheduled task completed successfully.");
  } catch (error) {
    console.error("Error during scheduled task:", error.message);
  }
});

// create --> update integration api  ...iska ub koi kaam nai filhal
router.put("/updateIntegration", tokenVerification, async (req, res) => {
  const { username, password, url, type } = req.body;

  // Validate input
  if (!username && !password && !url && !type) {
    return res
      .status(400)
      .json({ error: "Username, password , url and type are required." });
  }

  try {
    // Get user ID from token
    const userIdFromToken = req.userIdFromToken;

    // Fetch user to get the associated company ID
    const user = await User.findById(userIdFromToken).select("company");
    if (!user || !user.company) {
      return res
        .status(404)
        .json({ error: "User or associated company not found." });
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
    company.integration.type = type;
    company.integration.url = url;
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

// create --> disconect integration API
router.put("/disconnectIntegration", tokenVerification, async (req, res) => {
  try {
    // Get user ID from token
    const userIdFromToken = req.userIdFromToken;

    // Fetch user to get the associated company ID
    const user = await User.findById(userIdFromToken).select("company");
    if (!user || !user.company) {
      return res
        .status(404)
        .json({ error: "User or associated company not found." });
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
      return res
        .status(400)
        .json({ error: "Integration data not found for the company." });
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

// create
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

// create -> append question API
router.post("/appendQuestion", tokenVerification, async (req, res) => {
  const { question } = req.body;

  // empty validation
  if (!question || typeof question !== "string") {
    return res
      .status(400)
      .json({ error: "Invalid or missing question string." });
  }

  try {
    const metaIntegrations = await MetaIntegration.find({});

    let combinedString = question;
    metaIntegrations.forEach((integration) => {
      combinedString += `\nAPI Name: ${integration.apiName}\nAPI Structure: ${integration.apiStructure}\n`;
    });

    console.log("Combined String:\n", combinedString);

    res
      .status(200)
      .json({ message: "String appended successfully", combinedString });
  } catch (error) {
    console.error("Error while appending question:", error.message);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

// Function to test the MySQL database connection
async function testDbConnection(username, password, url) {
  const match = url.match(/jdbc:mysql:\/\/(.*):(\d+)\/(.*)/);
  if (!match) {
    throw new Error("Invalid MySQL URL format");
  }

  const [_, host, port, dbname] = match;
  return new Promise((resolve, reject) => {
    console.log("host", host);
    console.log("username", username);
    console.log("port", port);
    console.log("password", password);
    console.log("dbname", dbname);
    const connection = mysql.createConnection({
      host: host,
      user: username,
      password: password,
      database: dbname,
      port: parseInt(port, 10),
    });

    connection.connect((err) => {
      if (err) {
        console.error("Connection error:", err.message);
        resolve(false); // Resolve with false on failure
      } else {
        console.log("MySQL connection successful");
        resolve(true); // Resolve with true on success
      }
      connection.end(); // Always close the connection
    });
  });
}

// API endpoint to test the connection
router.post("/testConnectionIntegration", async (req, res) => {
  const { username, password, url, type } = req.body;

  if (!type) {
    return res.status(400).json({ error: "Connection type is required" });
  }

  if (!username || !password || !url) {
    return res
      .status(400)
      .json({ error: "Missing required fields: username, password, or url" });
  }

  if (type === "mySQL") {
    try {
      const isConnected = await testDbConnection(username, password, url);

      if (isConnected) {
        return res
          .status(200)
          .json({ status: "success", message: "MySQL connection successful" });
      } else {
        return res
          .status(500)
          .json({ status: "failure", message: "MySQL connection failed" });
      }
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  } else if (type === "acuity") {
    try {
      const response = await axios.get(`${url}/appointments?max=30`, {
        auth: {
          username: username,
          password: password,
        },
      });

      return res.json({
        message: "Acuity connection successful, appointment data fetched",
        data: response.data,
      });
    } catch (error) {
      console.error("Error fetching Acuity appointments:", error.message);
      return res
        .status(500)
        .json({ error: "Failed to fetch appointments from Acuity API" });
    }
  } else {
    return res.status(400).json({ error: "Invalid connection type" });
  }
});

// create table-structure api
const poolOne = mysql.createPool({
  host: "66.135.60.203",
  port: 3308,
  user: "kamran",
  password: "Pma_109c",
  database: "dbtabib",
});

router.get("/tables-structure", (req, res) => {
  poolOne.query("SHOW TABLES", (err, results) => {
    if (err) {
      console.error("Error fetching tables:", err);
      res.status(500).send("Error retrieving tables");
      return;
    }

    const tableNames = results.map((row) => row["Tables_in_dbtabib"]);
    const tableStructurePromises = tableNames.map((table) => {
      return new Promise((resolve, reject) => {
        poolOne.query(`DESCRIBE ${table}`, (err, columns) => {
          if (err) {
            reject(`Error describing table ${table}: ${err}`);
          } else {
            const columnStructure = {};
            columns.forEach((column) => {
              columnStructure[column.Field] = column.Type;
            });
            resolve({
              tableName: table,
              columns: columnStructure,
            });
          }
        });
      });
    });

    Promise.all(tableStructurePromises)
      .then(async (tableStructures) => {
        try {
          // Save data to MongoDB
          await TableStructure.insertMany(tableStructures);
          res.json({ message: "Data saved to MongoDB", data: tableStructures });
        } catch (mongoError) {
          console.error("Error saving to MongoDB:", mongoError);
          res.status(500).send("Error saving data to MongoDB");
        }
      })
      .catch((err) => {
        console.error("Error:", err);
        res.status(500).send("Error retrieving table structure");
      });
  });
});

// create integration credentials api
router.post("/integrationCredntial", tokenVerification, async (req, res) => {
  try {
    const { platformName, integrationName, url, username, password } = req.body;
    if (!platformName || !integrationName || !url || !username || !password) {
      res.status(500).json({ message: "All fileds are required" });
    }

    const urlRegex = /^jdbc:mysql:\/\/([^:/]+):(\d+)\/(.+)$/;
    const match = url.match(urlRegex);

    if (!match) {
      return res.status(400).json({ message: "Invalid URL format" });
    }

    const host = match[1];
    const port = match[2];
    const database = match[3];

    console.log("Parsed MySQL Details:", { host, port, database });

    const existingCredential = await integrationCredentials.findOne({
      url,
      username,
      password,
    });

    if (existingCredential) {
      console.log("Existing credentials found, attempting MySQL connection...");

      const pool = mysql.createPool({
        host,
        port: parseInt(port),
        user: username,
        password,
        database,
      });

      pool.query("SHOW TABLES", (err, results) => {
        if (err) {
          console.error("Error fetching tables:", err);
          return res
            .status(500)
            .json({ message: "Failed to fetch tables", error: err.message });
        }

        const tableNames = results.map((row) => Object.values(row)[0]);
        return res
          .status(200)
          .json({ message: "Existing credentials found", tables: tableNames });
      });
      return;
    }

    const userIdFromToken = req.userIdFromToken;

    const user = await User.findById(userIdFromToken);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const company = user.company;

    const inteCredentials = await integrationCredentials.create({
      companyId: company._id,
      platformName,
      integrationName,
      url,
      username,
      password,
    });

    res.status(200).json({
      message: "Credentials saved successfully",
      inteCredentials,
    });
  } catch (error) {
    console.log("Error in /integrationCredential API:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// create Meta integration detalis API
const pool = mysql
  .createPool({
    host: "66.135.60.203",
    port: 3308,
    user: "kamran",
    password: "Pma_109c",
    database: "dbtabib",
  })
  .promise();

router.post("/MetaIntegrationDetails", tokenVerification, async (req, res) => {
  const { tables } = req.body;

  const userIdFromToken = req.userIdFromToken;

  if (!userIdFromToken) {
    return res.status(401).json({ message: "User not authenticated." });
  }

  try {
    // Fetch the user data using userId
    const userData = await User.findById(userIdFromToken).select("company");
    if (!userData) {
      return res.status(404).json({ message: "User not found." });
    }

    const companyId = userData.company;

    // Fetch the integration credential by companyId
    const integrationCredential = await integrationCredentials.findOne({
      companyId,
    });
    if (!integrationCredential) {
      return res
        .status(404)
        .json({
          message: "No integration credentials found for this company.",
        });
    }

    const integration_id = integrationCredential._id; //  MongoDB ID for the integrationCredential

    if (!tables || !Array.isArray(tables)) {
      return res.status(400).json({ message: "Tables array is required." });
    }

    let responseData = [];

    // Process each table and save metadata
    for (const table of tables) {
      const { tableName, description } = table;

      if (!tableName || !description) {
        responseData.push({
          tableName: tableName || "N/A",
          message: "Table name or description is missing.",
        });
        continue;
      }

      // Check if table exists
      const [tableExists] = await pool.query("SHOW TABLES LIKE ?", [tableName]);
      if (tableExists.length === 0) {
        responseData.push({
          tableName,
          message: `Table ${tableName} does not exist.`,
        });
        continue;
      }

      // Fetch column details of the table
      const [columns] = await pool.query("DESCRIBE ??", [tableName]);
      const columnDetails = {};
      columns.forEach((col) => {
        columnDetails[col.Field] = col.Type;
      });

      // Save metadata into MongoDB
      const metaDetails = new MetaIntegrationDetail({
        integration_id,
        table_name: tableName,
        columns: columnDetails, // Save columns as an object
        description,
      });

      try {
        await metaDetails.save();
        responseData.push({
          tableName,
          message: `Metadata for ${tableName} saved successfully.`,
        });
      } catch (err) {
        responseData.push({
          tableName,
          message: `Failed to save metadata for ${tableName}.`,
          error: err.message,
        });
      }
    }

    // Final Response
    res.status(200).json({
      message: "Processing completed",
      data: responseData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "An error occurred while processing.",
      error: err.message,
    });
  }
});





router.post("/fetchMetaIntegrationDetails",tokenVerification,async(req,res)=>{
  const userId = req.userIdFromToken
  console.log("userId-->",userId);

  try {
    const userData = await User.findById(userId).select("company");
    const companyId = userData.company;
    console.log("companyId-->",companyId);

    const integrationCredential = await integrationCredentials.findOne({
      companyId,
    });
    
    const integrationId = integrationCredential._id;
    console.log("integrationId-->",integrationId);
    
    const metaIntegrationDetails = await MetaIntegrationDetail.find({ integration_id: integrationId });

    res.status(200).json({
      message: "Meta Integration fetched successfully.",
      data: metaIntegrationDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message,
    });
  }
  
})




//
router.post("/appendQuestionWithMeta", tokenVerification,async (req, res) => {
  const { userText } = req.body; 
  const userId = req.userIdFromToken; 

  try {
  
    const user = await User.findById(userId).select("company"); 
    if (!user) {
      return res.status(404).send("User not found.");
    }

    const companyId = user.company; 
    
    if (!companyId) {
      return res.status(400).send("Company ID not found.");
    }


    // Step 2: Find the integration credentials using companyId
    const integrationCredentials = await IntegrationCredentials.findOne({ companyId });

    if (!integrationCredentials) {
      return res.status(404).send("Integration credentials not found.");
    }

    // Step 3: Fetch Meta Integration details using integration ID
    const metaIntegrationData = await MetaIntegrationDetail.find({ integration_id: integrationCredentials._id });

    if (!metaIntegrationData.length) {
      return res.status(404).send("Meta integration data not found.");
    }

    // Step 4: Create the final result message
    let resultMessage = `User Text: ${userText}`;

    metaIntegrationData.forEach((table) => {
      let responseMessage = `Here is all the data of Table: ${table.table_name}`;
      resultMessage += `${responseMessage}| Integration ID: ${table.integration_id} | Columns: ${JSON.stringify(table.columns)} | Description: ${table.description} | Update Date: ${table.updateDate}`;
    });

 
    console.log(resultMessage);

  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Server Error");
  }
});





// 

const poolTwo = mysql.createPool({
  host: "66.135.60.203",
  port: 3308,
  user: "kamran",
  password: "Pma_109c",
  database: "dbtabib",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// API endpoint for Revenue Trends per Clinic
router.get('/revenuetrends', (req, res) => {
  // SQL query to get the revenue trends per clinic (monthly)
  const query = `
    SELECT
        c.NAME AS Clinic_Name,
        DATE_FORMAT(a.VISIT_DATE, '%Y-%m') AS Month,
        SUM(a.charges) AS Total_Revenue
    FROM
        t_appointment a
    JOIN
        t_doctor_clinic dc ON a.DOCTOR_ID = dc.DOCTOR_ID
    JOIN
        t_clinic c ON dc.CLINIC_ID = c.ID
    WHERE
        a.status = 1  -- Assuming 1 means completed/confirmed appointments
    GROUP BY
        c.NAME,
        DATE_FORMAT(a.VISIT_DATE, '%Y-%m')
    ORDER BY
        Month DESC,
        c.NAME;
  `;

  // Execute the query
  poolTwo.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching data:', error);
      return res.status(500).json({ error: 'Database query failed' });
    }
    // Return the results as JSON
    return res.json(results);
  });
});



router.get('/doctorPerformance', (req, res) => {
  // SQL query to get the doctor performance (appointments vs. feedback ratings)
  const query = `
    SELECT
        d.NAME AS Doctor_Name,
        COUNT(a.id) AS Total_Appointments,
        AVG(f.RATING) AS Average_Feedback_Rating
    FROM
        t_appointment a
    JOIN
        t_doctor d ON a.DOCTOR_ID = d.ID
    LEFT JOIN
        t_feedback f ON a.PATIENT_ID = f.PATIENT_ID AND a.DOCTOR_ID = f.DOCTOR_ID
    WHERE
        a.status = 1  -- Assuming 1 means completed/confirmed appointments
    GROUP BY
        d.NAME
    ORDER BY
        Total_Appointments DESC;
  `;

  // Execute the query
  poolTwo.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching data:', error);
      return res.status(500).json({ error: 'Database query failed' });
    }
    // Return the results as JSON
    return res.json(results);
  });
});



router.get('/patientDemographics', (req, res) => {
  // SQL query to get patient demographics and growth (age and gender groups)
  const query = `
    SELECT
        DATE_FORMAT(a.VISIT_DATE, '%Y-%m') AS Month,
        p.GENDER AS Gender,
        CASE
            WHEN TIMESTAMPDIFF(YEAR, STR_TO_DATE(p.DOB, '%Y-%m-%d'), CURDATE()) BETWEEN 0 AND 18 THEN '0-18'
            WHEN TIMESTAMPDIFF(YEAR, STR_TO_DATE(p.DOB, '%Y-%m-%d'), CURDATE()) BETWEEN 19 AND 30 THEN '19-30'
            WHEN TIMESTAMPDIFF(YEAR, STR_TO_DATE(p.DOB, '%Y-%m-%d'), CURDATE()) BETWEEN 31 AND 45 THEN '31-45'
            WHEN TIMESTAMPDIFF(YEAR, STR_TO_DATE(p.DOB, '%Y-%m-%d'), CURDATE()) BETWEEN 46 AND 60 THEN '46-60'
            WHEN TIMESTAMPDIFF(YEAR, STR_TO_DATE(p.DOB, '%Y-%m-%d'), CURDATE()) > 60 THEN '60+'
        END AS Age_Group,
        COUNT(DISTINCT p.id) AS Total_Patients
    FROM
        t_appointment a
    JOIN
        t_patient p ON a.PATIENT_ID = p.id
    WHERE
        a.status = 1  -- Assuming 1 means completed/confirmed appointments
    GROUP BY
        Month, p.GENDER, Age_Group
    ORDER BY
        Month DESC, Age_Group;
  `;

  // Execute the query
  poolTwo.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching data:', error);
      return res.status(500).json({ error: 'Database query failed' });
    }
    // Return the results as JSON
    return res.json(results);
  });
});





router.post("/appendQuestion",(req,res)=>{

})





module.exports = router;
