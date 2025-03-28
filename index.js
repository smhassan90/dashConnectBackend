import express from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import authRoute from './Routes/userAuthApi.js';
import intgrationRoute from './Routes/integrationApi.js';
import { dbConnect } from './utils/dbConnect.js';
import { fileURLToPath } from 'url'
import employeeRoute from './Routes/employeeApi.js';
import storyRoute from './Routes/storyRoute.js';
import levelRoute from './Routes/levelApi.js';

const app = express();
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corsOptions = {
    origin: 'https://datawise-six.vercel.app',
    // origin: 'http://localhost:3000',
    credentials:true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect DataBase
dbConnect()

// Routes Setup
app.use('/api/employee/v1', employeeRoute);
app.use('/api/story/v1', storyRoute);
app.use('/api/integration/v1', intgrationRoute);
app.use('/api/user/v1', authRoute);
app.use('/api/level/v1', levelRoute);

// Default Route
app.get('/', (req, res) => {
    res.send("🎉 Deployment Successful! Your backend is live on Vercel. 🚀");
});

// Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
