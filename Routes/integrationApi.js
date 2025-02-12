const express = require("express");
const router = express.Router();
const User = require("../models/User");
require("dotenv/config");
const tokenVerification = require("../config/tokenVerification");
const axios = require("axios");
const mysql = require("mysql2");
const TableStructure = require("../models/TableStructure");
const IntegrationCredentials = require("../models/IntegrationCredentials");
const MetaIntegrationDetail = require("../models/MetaIntegrationDetails");
const OpenAI = require("openai");


const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY, 
    baseURL: "https://api.groq.com/openai/v1", 
  });
  
  router.get("/fetchAllTables", async (req, res) => {
    const tables = await TableStructure.find({}, "tableName");
    res.json({
      data: tables.map((table) => {
        return table.tableName;
      }),
    });
  });
  

// create fetchMetaIntegrationDetails API
router.post(
    "/fetchMetaIntegrationDetails",
    tokenVerification,
    async (req, res) => {
      const userId = req.userIdFromToken;
      console.log("userId-->", userId);
  
      try {
        const userData = await User.findById(userId).select("company");
        const companyId = userData.company;
        console.log("companyId-->", companyId);
  
        const integrationCredential = await IntegrationCredentials.findOne({
          companyId,
        });
  
        const integrationId = integrationCredential._id;
        console.log("integrationId-->", integrationId);
  
        const metaIntegrationDetails = await MetaIntegrationDetail.find({
          integration_id: integrationId,
        });
  
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
    }
  );





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
        connectTimeout:10000
      });
  
      connection.connect((err) => {
        if (err) {
          console.error("Connection error:", err.message);
          resolve(false); 
        } else {
          console.log("MySQL connection successful");
          resolve(true); 
        }
        connection.end(); // Always close the connection
      });
    });
  }
  
  // API endpoint to test the connection
  router.post("/testConnectionIntegration", async (req, res) => {
    const { platform,username, password, url } = req.body;
  
    if (!platform) {
      return res.status(400).json({ error: "Connection type is required" });
    }
  
    if (!username || !password || !url) {
      return res
        .status(400)
        .json({ error: "Missing required fields: username, password, or url" });
    }
   
    if (platform.toLowerCase() === "mysql") {
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
    } else if (platform === "acuity") {
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
  
      const existingCredential = await IntegrationCredentials.findOne({
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
  
      const inteCredentials = await IntegrationCredentials.create({
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




//  create Meta integration detalis API
const pool = mysql
.createPool({
  host: "66.135.60.203",
  port: 3308,
  user: "kamran",
  password: "Pma_109c",
  database: "dbtabib",
  connectTimeout:100000
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
  const integrationCredential = await IntegrationCredentials.findOne({
    companyId,
  });
  if (!integrationCredential) {
    return res.status(404).json({
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




// create graph suggestion API
router.post("/sugestionOfGraph", tokenVerification, async (req, res) => {
    const { requiredGraph } = req.body;
    const customText = `I have given you the structure format of my database. You need to identify the required graph and return and provide 4-5 Analytical Graph and its description only`
  
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
      const integrationCredentials = await IntegrationCredentials.findOne({
        companyId,
      });
  
      if (!integrationCredentials) {
        return res.status(404).send("Integration credentials not found.");
      }
  
      // Step 3: Fetch Meta Integration details using integration ID
      const metaIntegrationData = await MetaIntegrationDetail.find({
        integration_id: integrationCredentials._id,
      });
  
      if (!metaIntegrationData.length) {
        return res.status(404).send("Meta integration data not found.");
      }
  
      // Step 4: Create the final result message
      let resultMessage = customText;
  
      metaIntegrationData.forEach((table) => {
        let responseMessage = ` + ${requiredGraph} Here is all the data of Table: ${table.table_name}`;
        resultMessage += `${responseMessage}| Integration ID: ${
          table.integration_id
        } | Columns: ${JSON.stringify(table.columns)} | Description: ${
          table.description
        } | Update Date: ${table.updateDate}`;
      });
  
      const aiResponse = await openai.chat.completions.create({
        model: "llama-3.3-70b-versatile", // Use Groq-supported model
        messages: [{ role: "user", content: resultMessage }],
      });
      
      res.json({
        ai_response: aiResponse.choices[0].message.content
      });
  
  
      const result = aiResponse.choices[0].message.content
      console.log(result);
  
      // console.log(resultMessage);
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).send("Server Error");
    }
  });




// create -> generateGraphQuery

const poolTwo = mysql.createPool({
    host: "66.135.60.203",
    port: 3308,
    user: "kamran",
    password: "Pma_109c",
    database: "dbtabib",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout:100000
  });


router.post("/generateGraphQuery", tokenVerification, async (req, res) => {
    const { requiredGraph, customText } = req.body;
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
  
      const integrationCredentials = await IntegrationCredentials.findOne({
        companyId,
      });
  
      if (!integrationCredentials) {
        return res.status(404).send("Integration credentials not found.");
      }
  
      const metaIntegrationData = await MetaIntegrationDetail.find({
        integration_id: integrationCredentials._id,
      });
  
      if (!metaIntegrationData.length) {
        return res.status(404).send("Meta integration data not found.");
      }
  
      // Create the message for Groq AI
      let resultMessage = `I have given you the structure format of my database. You need to identify the required graph it may be asking for report and graph and return only the query in response based on the custom text. "Required Graph": ${requiredGraph} + "Custom Text": ${customText}`;
  
      metaIntegrationData.forEach((table) => {
        resultMessage += `| Table: ${table.table_name} | Columns: ${JSON.stringify(table.columns)} | Description: ${table.description} | Update Date: ${table.updateDate}`;
      });
  
      // console.log("Sending to Groq Cloud AI:", resultMessage);
  
      // Call Groq API 
      /*
      const aiResponse = await openai.chat.completions.create({
        model: "llama-3.3-70b-versatile", // Use Groq-supported model
        messages: [{ role: "user", content: resultMessage }],
      });
  */
      function cleanSQLQuery(inputString) {
        const cleanedQuery = inputString
          .replace(/```sql\n?/i, '') 
          .replace(/```$/, '') 
          .replace(/\n/g, ' ') 
          .replace(/\s+/g, ' ') 
          .trim();
        return cleanedQuery;
      }
        
      // res.json({
      //   ai_response: cleanSQLQuery(aiResponse.choices[0].message.content),
      // });
  
      //const result = cleanSQLQuery(aiResponse.choices[0].message.content)
      const result = "SELECT t_doctor.ID, t_doctor.NAME, SUM(t_appointment.charges) AS total_income FROM t_doctor JOIN t_appointment ON t_doctor.ID = t_appointment.DOCTOR_ID GROUP BY t_doctor.ID, t_doctor.NAME";
      console.log(result);
      
    //   const query = result
     
       // Execute the query
       poolTwo.query(result, (error, results) => {
         if (error) {
           console.error("Error fetching data:", error);
           return res.status(500).json({ error: "Database query failed" });
         }
         // Return the results as JSON
         if (requiredGraph === 'graph') {
          return res.json(transformToLineGraphData(results));
        } else if (requiredGraph === 'report') {
          const output = JSON.stringify(results)
          console.log("output-->",output);
          return res.status(200).json({ output });
        }
         
       });
    
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).send("Server Error");
    }
  });
  
  function transformToLineGraphData(data) {
    console.log("Before:", JSON.stringify(data, null, 2));

    if (!Array.isArray(data) || data.length === 0) {
        console.error("Error: Invalid or empty data.");
        return { labels: [], datasets: [] };
    }

    // Identify potential label and numeric fields dynamically
    const sampleEntry = data[0];
    const numericFields = Object.keys(sampleEntry).filter(key => typeof sampleEntry[key] === "number");
    const categoricalFields = Object.keys(sampleEntry).filter(key => typeof sampleEntry[key] === "string");

    if (numericFields.length === 0) {
        console.error("Error: No numeric data found.");
        return { labels: [], datasets: [] };
    }

    const labelField = categoricalFields.length > 0 ? categoricalFields[0] : "Label";
    const numericField = numericFields[0];

    // Extract unique labels and sort them
    const uniqueLabels = [...new Set(data.map(entry => entry[labelField] || "Unknown"))].sort();

    // Group numeric values by labels
    const groupedData = {};
    data.forEach(entry => {
        const label = entry[labelField] || "Unknown";
        if (!groupedData[label]) {
            groupedData[label] = {};
        }
        groupedData[label] = entry[numericField] || 0;
    });

    // Prepare datasets
    const datasets = [{
        label: numericField,
        data: uniqueLabels.map(label => groupedData[label] || 0) // Fill missing values with 0
    }];

    const response = {
        labels: uniqueLabels,
        datasets
    };

    console.log("After:", JSON.stringify(response, null, 2));
    return response;
}

// function generateReportFromQuery(results) {
//   if (!Array.isArray(results) || results.length === 0) {
//     console.error("Error: Invalid or empty data.");
//     return "No data found.";
//   }

//   // Extract all unique column names
//   const columns = Object.keys(results[0]);

//   // Create table header
//   let tableReport = columns.join(" | ") + "\n";
//   tableReport += "-".repeat(tableReport.length) + "\n";

//   // Create table rows
//   results.forEach(row => {
//     let rowData = columns.map(col => row[col]).join(" | ");
//     tableReport += rowData + "\n";
//   });

//   // Summary of report
//   const summary = `Total rows: ${results.length}`;

//   console.log(tableReport + "\n" + summary);
//   return {
//     summary,
//     tableReport
//   };
// }




  // this api fetch columns of sql databse , fileds and its data type
  const poolOne = mysql.createPool({
    host: "66.135.60.203",
    port: 3308,
    user: "kamran",
    password: "Pma_109c",
    database: "dbtabib",
    connectTimeout:100000 
  });
  
  router.get("/tableStructure", (req, res) => {
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
  
  



  
  
  
  module.exports = router;



  // create --> disconect integration API
//   router.put("/disconnectIntegration", tokenVerification, async (req, res) => {
//     try {
//       // Get user ID from token
//       const userIdFromToken = req.userIdFromToken;
  
//       // Fetch user to get the associated company ID
//       const user = await User.findById(userIdFromToken).select("company");
//       if (!user || !user.company) {
//         return res
//           .status(404)
//           .json({ error: "User or associated company not found." });
//       }
  
//       const companyId = user.company; // Directly using companyId
  
//       const company = await Company.findById(companyId);
//       if (!company) {
//         return res.status(404).json({ error: "Company not found." });
//       }
  
//       // Nullify only username and password from integrtion object
//       if (company.integration) {
//         company.integration.username = null;
//         company.integration.password = null;
//       } else {
//         return res
//           .status(400)
//           .json({ error: "Integration data not found for the company." });
//       }
  
//       await company.save();
  
//       res.status(200).json({
//         message: "Disconnect successfully.",
//       });
//     } catch (err) {
//       console.error("Error Occurred:", err.message);
//       res.status(500).json({ error: "Server error.", details: err.message });
//     }
//   });














