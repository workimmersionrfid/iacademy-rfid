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

// Define what a "Fuel Log" looks like in our database
const logSchema = new mongoose.Schema({
    vehicle: String,
    date: String,
    fuelType: String,
    price: Number,
    liters: Number,
    total: Number,
    odo: Number,
    station: String,
    notes: String
});

const FuelLog = mongoose.model('FuelLog', logSchema);

// --- API ROUTES ---

// 1. Get all logs from the database
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await FuelLog.find().sort({ _id: -1 }); // Get newest logs first
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. Save a new log to the database
app.post('/api/logs', async (req, res) => {
    const log = new FuelLog(req.body);
    try {
        const newLog = await log.save();
        res.status(201).json(newLog);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});