const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
// Increased limit to 50mb to allow for Photo and Signature Base64 uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Successfully connected to MongoDB!'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// ==========================================
// --- DATABASE MODELS (SCHEMAS) ---
// ==========================================

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true }, // Added Email Field
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'driver'], default: 'driver' },
    department: { type: [String], default: ['Pending Assignment'] },
    workDays: { type: [String], default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
    isVerified: { type: Boolean, default: false } // Tracks if email is verified
});

const vehicleSchema = new mongoose.Schema({
    model: String,
    plateNumber: String,
    year: String,
    efficiency: Number,
    fuelType: String
});

// Original Fuel Log Schema
const logSchema = new mongoose.Schema({
    vehicle: String,
    driver: String,
    date: String,
    department: { type: String, required: true },
    fuelType: String,
    price: Number,
    liters: Number,
    total: Number,
    odo: Number,
    station: String,
    notes: String
});

// NEW: Toll Log Schema
const tollSchema = new mongoose.Schema({
    vehicle: String,
    driver: String,
    department: { type: String, required: true },
    date: String,
    expressway: String,
    amount: Number,
    notes: String
});

const taskSchema = new mongoose.Schema({
    driver: String,
    vehicle: String,
    department: String, 
    taskType: String,
    description: String,
    destination: String,
    date: String,
    status: { type: String, default: 'Pending' }
});

const actionLogSchema = new mongoose.Schema({
    driver_name: String,
    plate_number: String,
    department: String,
    action: String, 
    task: String,
    location: String,
    delivery_status: String,
    comments: String,
    document_attached: String, 
    latitude: String,
    longitude: String,
    completion_type: String,
    incomplete_reasons: String,
    reschedule_date: String,
    signature: String, 
    timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const FuelLog = mongoose.model('FuelLog', logSchema);
const TollLog = mongoose.model('TollLog', tollSchema); // <-- NEW MODEL REGISTERED
const Task = mongoose.model('Task', taskSchema);
const ActionLog = mongoose.model('ActionLog', actionLogSchema);

// ==========================================
// --- API ROUTES ---
// ==========================================

// --- AUTHENTICATION ROUTES ---
app.post('/api/auth/register', async (req, res) => {
    try {
        // Now extracting email
        const { username, email, password, role, department } = req.body;
        
        // Backend validation matching frontend standard
        const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passRegex.test(password)) {
            return res.status(400).json({ message: 'Password does not meet standard format requirements.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Creating user with email (isVerified defaults to false)
        const newUser = new User({ username, email, password: hashedPassword, role, department });
        await newUser.save();
        
        res.status(201).json({ message: 'Account created successfully! Please check your email to verify.' });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: 'Username or Email already exists' });
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

        // Passes the isVerified status back to the frontend for UI handling
        const token = jwt.sign({ id: user._id, role: user.role, department: user.department }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ 
            message: 'Login successful', 
            token, 
            role: user.role, 
            department: user.department,
            isVerified: user.isVerified 
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- DRIVER LIST & PROFILE ROUTES ---
app.get('/api/drivers', async (req, res) => {
    try {
        const drivers = await User.find({ role: 'driver' }, 'username department workDays');
        res.json(drivers);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/api/drivers/:id/profile', async (req, res) => {
    try {
        const { department, workDays } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            { department: department, workDays: workDays }, 
            { new: true }
        );
        res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
});

// --- VEHICLE ROUTES ---
app.get('/api/vehicles', async (req, res) => {
    try {
        const vehicles = await Vehicle.find();
        res.json(vehicles);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/vehicles', async (req, res) => {
    try {
        const newVehicle = new Vehicle(req.body);
        await newVehicle.save();
        res.status(201).json(newVehicle);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete('/api/vehicles/:id', async (req, res) => {
    try {
        await Vehicle.findByIdAndDelete(req.params.id);
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- FUEL LOG ROUTES ---
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await FuelLog.find().sort({ _id: -1 });
        res.json(logs);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/logs', async (req, res) => {
    try {
        const newLog = new FuelLog(req.body);
        await newLog.save();
        res.status(201).json(newLog);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

// --- NEW: TOLL LOG ROUTES ---
app.get('/api/tolls', async (req, res) => {
    try {
        const tolls = await TollLog.find().sort({ _id: -1 });
        res.json(tolls);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/tolls', async (req, res) => {
    try {
        const newToll = new TollLog(req.body);
        await newToll.save();
        res.status(201).json(newToll);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

// --- SECURE TOLL ESTIMATION PROXY ---
app.post('/api/toll-estimate', async (req, res) => {
    try {
        // We make the fetch call from the SERVER, so the API key never touches the browser!
        const response = await fetch('https://apis.tollguru.com/toll/v2/origin-destination-waypoints', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.TOLLGURU_API_KEY // Safely pulled from .env
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) throw new Error("Toll API Failed");
        
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- TASK & DISPATCH ROUTES ---
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find().sort({ _id: -1 });
        res.json(tasks);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const newTask = new Task(req.body);
        await newTask.save();
        res.status(201).json(newTask);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/tasks/:id', async (req, res) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedTask);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- ADVANCED ACTION & HANDOVER LOGS ---
app.get('/api/action-logs', async (req, res) => {
    try {
        const logs = await ActionLog.find().sort({ timestamp: -1 });
        res.json(logs);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/api/action-logs', async (req, res) => {
    try {
        const newLog = new ActionLog(req.body);
        await newLog.save();
        res.status(201).json({ message: 'Log saved successfully!', log: newLog });
    } catch (err) { 
        res.status(400).json({ error: err.message }); 
    }
});

// --- CONFIG ROUTE ---
app.get('/api/config/maps', (req, res) => {
    res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY });
});

// ==========================================
// --- START SERVER ---
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});