const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Successfully connected to MongoDB!'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// --- DATABASE MODELS ---

// 1. User Model (Admin vs Driver)
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'driver'], default: 'driver' },
    department: String // Assigned to drivers
});

// 2. Vehicle Model (Admin manages this)
const vehicleSchema = new mongoose.Schema({
    model: String,
    plateNumber: String,
    year: String,
    efficiency: Number, // km/L
    fuelType: String
});

// 3. Updated Fuel Log (Added Department & Driver fields)
const logSchema = new mongoose.Schema({
    vehicle: String,
    driver: String,
    date: String,
    department: { 
        type: String, 
        enum: ['ELPD', 'OSAS', 'IT', 'REGISTRAR', 'FINANCE', 'ADMISSIONS', 'ADCOM', 'CLINIC', 'PURCHASING', 'ADMIN', 'SHS', 'COLLEGE', 'LIBRARY'],
        required: true 
    },
    fuelType: String,
    price: Number,
    liters: Number,
    total: Number,
    odo: Number,
    station: String,
    notes: String
});

const User = mongoose.model('User', userSchema);
const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const FuelLog = mongoose.model('FuelLog', logSchema);


// --- API ROUTES ---

// Get all logs from the database
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await FuelLog.find().sort({ _id: -1 }); // Get newest logs first
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Save a new log to the database
app.post('/api/logs', async (req, res) => {
    const log = new FuelLog(req.body);
    try {
        const newLog = await log.save();
        res.status(201).json(newLog);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Securely send the Google Maps API Key to the frontend
app.get('/api/config/maps', (req, res) => {
    res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});