const express = require('express');
const mongoose = require('mongoose');
const app = express();
const dotenv = require('dotenv/config');
const cors = require('cors');

// Routes
const authRoute = require('./Routes/user');
const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@honeycluster.xggo8.mongodb.net/?retryWrites=true&w=majority&appName=Honeycluster`

app.use(cors());
app.use(express.json());

mongoose.connect(url)
    .then(() => {
        console.log("MongoDB Connected");
    })
    .catch(err => {
        console.log("Error in MongoDB connection --->", err);
    });



app.use('/api/user', authRoute);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
