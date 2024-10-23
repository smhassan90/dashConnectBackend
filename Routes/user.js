// Routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const jwt = require('jsonwebtoken')
require('dotenv/config');
const tokenVerification = require('../config/tokenVerification');
const Story =  require('../models/story');

// Register route:
router.post('/register', async (req, res) => {
    try {
        // Destructure data from req.body
        const { firstName, lastName, email, companyName, password } = req.body;

        // Hash the password
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Create a new user object with hashed password
        const user = await User.create({
            firstName,
            lastName,
            email,
            companyName,
            password: hashedPassword, // Store hashed password
        });

        const data = user.toObject();
        delete data.password; // Remove password from the response

        // Send response
        res.status(201).send({ status: 201, data, message: "User Created Successfully" });
    } catch (err) {
        console.log("postApiError", err);
        res.status(500).send({ status: 500, error: err });
    }
});

// Login route:
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });

        if (user) {
            // Compare the provided password with the stored hashed password
            const checkPassword = bcrypt.compareSync(password, user.password);

            if (checkPassword) {
                const token = jwt.sign(
                    { email: user.email },
                    process.env.JWT_SECRET,  
                );

                // Send a response with user info and the token, excluding the password
                res.status(200).send({
                    status: 200,
                    user: { id: user._id, email: user.email, name: user.name , companyName : user.companyName , password : user.password },  // Send selective user details
                    message: "Login successful",
                    token
                });
            } else {
                res.status(401).send({ status: 401, message: "Incorrect Password" });
            }
        } else {
            res.status(404).send({ status: 404, message: "User not found" });
        }
    } catch (error) {
        console.log("loginError", error);
        res.status(500).send({ status: 500, error: "Internal Server Error" });
    }
});

 

// Story route:
router.post('/stories', tokenVerification, async (req, res) => {
    try {
        const { name, description, integrations, complementaryDatasets } = req.body;
        const emailFromToken = req.emailFromToken; // Token se email nikaalna

        // Create a new story instance
        const newStory = new Story({
            name,
            description,
            integrations,
            complementaryDatasets,
            createdBy: emailFromToken // User ka email store karna
        });

        // Save the new story to the database
        await newStory.save(); // Timestamps automatically save honge

        // Send success response
        res.status(201).send({ message: "Story created successfully", story: newStory });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Error creating story", error: err });
    }
});




module.exports = router; 
