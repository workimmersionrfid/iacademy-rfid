const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For hashing passwords
const jwt = require('jsonwebtoken'); // For login tokens
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

// --- AUTHENTICATION ROUTES ---

// 1. Register a new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, role, department } = req.body;
        
        // Hash the password so it's secure in the database
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({ 
            username, 
            password: hashedPassword, 
            role, 
            department 
        });
        
        await newUser.save();
        res.status(201).json({ message: 'Account created successfully!' });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        res.status(500).json({ message: err.message });
    }
});

// 2. Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

        const token = jwt.sign(
            { id: user._id, role: user.role, department: user.department }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        res.json({ 
            message: 'Login successful', 
            token, 
            role: user.role,
            department: user.department
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- HIDDEN ADMIN SETUP ROUTE ---
app.post('/api/auth/setup-admin', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            return res.status(403).json({ message: 'An admin account already exists!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const adminUser = new User({
            username: username,
            password: hashedPassword,
            role: 'admin',
            department: 'ADMIN' 
        });

        await adminUser.save();
        res.status(201).json({ message: 'Master Admin created successfully!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- VEHICLE ROUTES (ADMIN DASHBOARD) ---

// 1. Get all vehicles
app.get('/api/vehicles', async (req, res) => {
    try {
        const vehicles = await Vehicle.find();
        res.json(vehicles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. Add a new vehicle
app.post('/api/vehicles', async (req, res) => {
    try {
        const newVehicle = new Vehicle(req.body);
        await newVehicle.save();
        res.status(201).json(newVehicle);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 3. Delete a vehicle
app.delete('/api/vehicles/:id', async (req, res) => {
    try {
        await Vehicle.findByIdAndDelete(req.params.id);
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// --- FUEL LOG ROUTES ---

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