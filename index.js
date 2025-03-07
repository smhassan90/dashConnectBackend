import express from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import authRoute from './Routes/userAuthApi.js';
import intgrationRoute from './Routes/integrationApi.js';
import { dbConnect } from './utils/dbConnect.js';
import { fileURLToPath } from 'url'

const app = express();
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corsOptions = {
    origin: 'https://datawise-six.vercel.app',
    credentials:true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect DataBase
dbConnect()

// Routes Setup
// app.use('/api/employee/v1', employeeRoute);
app.use('/api/integration/v1', intgrationRoute);
app.use('/api/user/v1', authRoute);

// Default Route
app.get('/', (req, res) => {
    res.send("🎉 Deployment Successful! Your backend is live on Vercel. 🚀");
});

// Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
