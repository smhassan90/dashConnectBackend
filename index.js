const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
const path = require('path');



// Routes
const authRoute = require('./Routes/userAuthApi');
const intgrationRoute = require('./Routes/integrationApi')
const employeeRoute = require('./Routes/employeeApi')



// const url = `mongodb://localhost:27017/`; // for local testing
// const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@hunainbaig.xggo8.mongodb.net/?retryWrites=true&w=majority&appName=HunainBaig`
// const url = `mongodb+srv://bilal:dashconnect123@cluster0.t9ett.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const url = `mongodb+srv://${process.env.DB_user}:${process.env.DB_PASSWORD}@cluster0.t9ett.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    app.get('/', (req, res) => {
        res.send("🎉 Deployment Successful! Your backend is live on Vercel. 🚀");
    });

//TOOD: add /v1/
app.use('/api/employee/v1',employeeRoute)
app.use('/api/integration/v1',intgrationRoute)
app.use('/api/user/v1', authRoute);
 


app.listen(3000, () => {
    console.log("Server is running on port 3000");
});



