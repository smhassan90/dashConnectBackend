// const express = require("express");
// const router = express.Router();
// const bcrypt = require("bcrypt");
// const User = require("../models/User");
// require("dotenv/config");
// const tokenVerification = require("../config/tokenVerification");
// const mongoose = require("mongoose");

// // create --> Add employee API
// router.post("/addEmployee", tokenVerification, async (req, res) => {
//   try {
//     const { firstName, lastName, email, password, role } = req.body;

//     // Extract ID from token
//     const userIdFromToken = req.userIdFromToken;

//     // Fetch user
//     const user = await User.findById(userIdFromToken);
//     if (!user) {
//       return res.status(404).json({ message: "User not found." });
//     }

//     // Extract company data
//     const company = user.company;

//     if (!firstName || !lastName || !email || !password) {
//       return res.status(400).json({ message: "All fields are required." });
//     }

//     // Check for existing email
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(409).json({ message: "Email already in use." });
//     }

//     const hashedPassword = bcrypt.hashSync(password, 10);

//     const newUser = await User.create({
//       firstName,
//       lastName,
//       email,
//       password: hashedPassword,
//       role: role || "employee",
//       company: {
//         _id: company._id, // only company id send into the database
//         companyName: company.companyName,
//         updateDate: company.updateDate,
//         status: company.status,
//       },
//     });

//     res.status(201).json({ user: newUser });
//   } catch (error) {
//     console.error("Error adding employee:", error);
//     res.status(500).json({ message: error.message });
//   }
// });

// // create --> Update Employee API
// router.put(
//   "/updateEmployee/:employeeId",
//   tokenVerification,
//   async (req, res) => {
//     try {
//       const { firstName, lastName, email, role } = req.body;
//       const { employeeId } = req.params;

//       // Validate the employee ID
//       if (!mongoose.isValidObjectId(employeeId)) {
//         return res
//           .status(400)
//           .send({ status: 400, message: "Invalid employee ID" });
//       }

//       const userIdFromToken = req.userIdFromToken; // Get user id from token
//       const user = await User.findById(userIdFromToken).select("company");

//       if (!user) {
//         return res.status(404).send({ message: "User not found" });
//       }

//       // Check employee belongs to the logged-in user's company
//       const employee = await User.findById(employeeId);
//       if (
//         !employee ||
//         employee.company._id.toString() !== user.company._id.toString()
//       ) {
//         return res
//           .status(403)
//           .send({ message: "You are not authorized to update this employee." });
//       }

//       // Update the employee details
//       const updatedEmployee = await User.findByIdAndUpdate(
//         employeeId,
//         {
//           firstName,
//           lastName,
//           email,
//           role,
//         },
//         { new: true, runValidators: true }, // Return the updated document and run validators
//       );

//       if (!updatedEmployee) {
//         return res
//           .status(404)
//           .send({ status: 404, message: "Employee not found" });
//       }

//       res.status(200).send({
//         message: "Employee updated successfully",
//         employee: updatedEmployee,
//       });
//     } catch (err) {
//       console.error("Error updating employee", err);
//       res.status(500).send({ message: "Error updating employee", error: err });
//     }
//   },
// );

// // create --> Delete Employee API
// router.delete(
//   "/deleteEmployee/:employeeId",
//   tokenVerification,
//   async (req, res) => {
//     try {
//       const { employeeId } = req.params;

//       if (!mongoose.isValidObjectId(employeeId)) {
//         return res
//           .status(400)
//           .send({ status: 400, message: "Invalid employee ID" });
//       }

//       // add validateion user belong to the same comapny

//       const userIdFromToken = req.userIdFromToken;
//       const user = await User.findById(userIdFromToken).select("company");

//       if (!user) {
//         return res.status(404).send({ message: "User not found" });
//       }

//       const employee = await User.findById(employeeId);
//       if (
//         !employee ||
//         employee.company._id.toString() !== user.company._id.toString()
//       ) {
//         return res
//           .status(403)
//           .send({ message: "You are not authorized to delete this employee." });
//       }

//       const deletedEmployee = await User.findByIdAndDelete(employeeId);

//       if (!deletedEmployee) {
//         return res
//           .status(404)
//           .send({ status: 404, message: "Employee not found" });
//       }

//       res.status(200).send({
//         message: "Employee deleted successfully",
//         employee: deletedEmployee,
//       });
//     } catch (err) {
//       console.error("Error deleting employee", err);
//       res.status(500).send({ message: "Error deleting employee", error: err });
//     }
//   },
// );

// // create --> API for fetch all users in the same company
// router.get("/getEmployees", tokenVerification, async (req, res) => {
//   try {
//     const userIdFromToken = req.userIdFromToken;

//     // Find the user to get their company ID
//     const user = await User.findById(userIdFromToken);
//     if (!user) {
//       return res.status(404).json({ message: "User not found." });
//     }

//     const companyId = user.company; // Directly using the companyId from user

//     // Find all employees belonging to the same company ID
//     const employees = await User.find({ company: companyId });

//     res.status(200).json({ employees });
//   } catch (error) {
//     console.error("Error fetching employees:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// });

// module.exports = router;
