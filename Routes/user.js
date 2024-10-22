// Routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv/config');

// Register route:
router.post('/register', async (req, res) => {
    try {
        // Hash the password
        const password = bcrypt.hashSync(req.body.password, 10);
        // Create a new user
        const user = await User.create({ ...req.body, password });
        const data = user.toObject();
        delete data.password; // Remove password from the response
        res.status(201).send({ status: 201, data ,  message : "User Created Sucessfully" }); // Send user data
    } catch (err) {
        console.log("postApiError", err);
        res.status(500).send({ status: 500, user: err  });
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

 

module.exports = router; 
