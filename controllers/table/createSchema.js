import path from "path";
import fs from "fs";
import csvParser from "csv-parser";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
export const createSchema = async (req, res) => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
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
};
