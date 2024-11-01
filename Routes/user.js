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

// create --> user route
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




// create --> Add employee route
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




// create --> Login route
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





// create --> Update employee
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





// create --> Delete employee
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
 

module.exports = router;