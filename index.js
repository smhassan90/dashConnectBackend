const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
const path = require('path');


// Routes
const authRoute = require('./Routes/user');
// const url = `mongodb://localhost:27017`; // for local testing
const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@honeycluster.xggo8.mongodb.net/`

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
