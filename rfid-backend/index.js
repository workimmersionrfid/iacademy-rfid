const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const crypto = require('crypto'); 
const Tesseract = require('tesseract.js');
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
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    middleName: { type: String, default: "" },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['superadmin', 'admin', 'driver'], default: 'driver' },
    department: { type: [String], default: ['Pending Assignment'] },
    workDays: { type: [String], default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
});

const vehicleSchema = new mongoose.Schema({
    model: String,
    plateNumber: String,
    year: String,
    efficiency: Number,
    fuelType: String
});

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
    notes: String,
    latitude: String,  
    longitude: String  
});

const tollSchema = new mongoose.Schema({
    vehicle: String,
    driver: String,
    department: { type: String, required: true },
    date: String,
    expressway: String,
    amount: Number,
    notes: String,
    latitude: String,  
    longitude: String  
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

// Chat Message Schema with SOFT DELETE capability
const messageSchema = new mongoose.Schema({
    sender: String, 
    receiver: String, 
    text: String,
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
    hiddenBy: { type: [String], default: [] } 
});

// Build the models first so the routes can use them!
const User = mongoose.model('User', userSchema);
const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const FuelLog = mongoose.model('FuelLog', logSchema);
const TollLog = mongoose.model('TollLog', tollSchema); 
const Task = mongoose.model('Task', taskSchema);
const ActionLog = mongoose.model('ActionLog', actionLogSchema);
const Message = mongoose.model('Message', messageSchema);

// ==========================================
// --- IMPORT FRAGMENTED ROUTES ---
// ==========================================

// Tell Express to route all /api/auth requests to your new auth.js file
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);


// ==========================================
// --- GOOGLE SHEETS LIVE SYNC HELPER ---
// ==========================================
const pushToGoogleSheet = async (data) => {
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK;
    if (!webhookUrl) return; 

    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.error("Google Sheets Sync Failed:", error);
    }
};


// ==========================================
// --- API ROUTES ---
// ==========================================

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

        pushToGoogleSheet({
            date: new Date().toLocaleString(),
            driver: newLog.driver,
            department: newLog.department,
            vehicle: newLog.vehicle,
            type: "Fuel Expense",
            details: `${newLog.liters}L ${newLog.fuelType} @ ${newLog.station}`,
            cost: newLog.total
        });

        res.status(201).json(newLog);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

// --- TOLL LOG ROUTES ---
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

        pushToGoogleSheet({
            date: new Date().toLocaleString(),
            driver: newToll.driver,
            department: newToll.department,
            vehicle: newToll.vehicle,
            type: "Toll Expense",
            details: `Route: ${newToll.expressway}`,
            cost: newToll.amount
        });

        res.status(201).json(newToll);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

// --- SECURE TOLL ESTIMATION PROXY ---
app.post('/api/toll-estimate', async (req, res) => {
    try {
        console.log("🛣️ Sending Request to TollGuru...");
        
        const response = await fetch('https://apis.tollguru.com/toll/v2/origin-destination-waypoints', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.TOLLGURU_API_KEY
            },
            body: JSON.stringify(req.body)
        });

        // We grab the data FIRST, even if it's an error, so we can read it!
        const data = await response.json(); 

        if (!response.ok) {
            console.error("🚨 TollGuru API Rejected the Request:", data);
            return res.status(response.status).json({ error: "Toll API Failed", details: data });
        }
        
        console.log("✅ TollGuru API Success!");
        res.json(data);
    } catch (err) {
        console.error("🚨 Backend Proxy Crash:", err.message);
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
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        res.json(updatedTask);
    } catch (err) { 
        res.status(400).json({ error: err.message }); 
    }
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

        let detailedNotes = `Status: ${newLog.delivery_status}`;
        
        if (newLog.incomplete_reasons && newLog.incomplete_reasons !== "None") {
            detailedNotes += ` | Reasons: ${newLog.incomplete_reasons}`;
        }
        if (newLog.comments && newLog.comments !== "None") {
            detailedNotes += ` | Notes: ${newLog.comments}`;
        }

        pushToGoogleSheet({
            date: new Date().toLocaleString(),
            driver: newLog.driver_name || "N/A",
            department: newLog.department || "N/A",
            vehicle: newLog.plate_number || "N/A",
            type: newLog.action,
            details: detailedNotes,
            cost: 0 
        });

        res.status(201).json({ message: 'Log saved successfully!', log: newLog });
    } catch (err) { 
        res.status(400).json({ error: err.message }); 
    }
});

// ==========================================
// --- MESSAGING / CHAT ROUTES ---
// ==========================================

// Get messages for a specific user
app.get('/api/messages/:username', async (req, res) => {
    try {
        const username = req.params.username;
        if (username === 'Admin') {
            const messages = await Message.find({ hiddenBy: { $ne: 'Admin' } }).sort({ timestamp: 1 });
            res.json(messages);
        } else {
            const messages = await Message.find({
                $or: [{ sender: username }, { receiver: username }],
                hiddenBy: { $ne: username }
            }).sort({ timestamp: 1 });
            res.json(messages);
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/messages', async (req, res) => {
    try {
        const newMsg = new Message(req.body);
        await newMsg.save();
        res.status(201).json(newMsg);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/messages/mark-read', async (req, res) => {
    try {
        const { username, role } = req.body;
        if (role === 'admin') {
            await Message.updateMany({ sender: username, receiver: 'Admin', isRead: false }, { isRead: true });
        } else {
            await Message.updateMany({ sender: 'Admin', receiver: username, isRead: false }, { isRead: true });
        }
        res.json({ success: true });
    } catch(err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/messages/clear', async (req, res) => {
    try {
        const { driverUsername, clearedBy } = req.body; 
        await Message.updateMany(
            {
                $or: [
                    { sender: 'Admin', receiver: driverUsername },
                    { sender: driverUsername, receiver: 'Admin' }
                ]
            },
            { $addToSet: { hiddenBy: clearedBy } }
        );
        res.json({ success: true });
    } catch(err) { res.status(500).json({ error: err.message }); }
});

// --- CONFIG ROUTE ---
app.get('/api/config/maps', (req, res) => {
    res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY });
});

// --- OCR RECEIPT SCANNER ROUTE ---
app.post('/api/scan-receipt', async (req, res) => {
    try {
        const { image } = req.body; 

        if (!image) return res.status(400).json({ error: "No image provided" });

        const { data: { text } } = await Tesseract.recognize(image, 'eng');
        
        let detectedAmount = null;
        let detectedExpressway = null;

        const amountMatch = text.match(/\d+\.\d{2}/);
        if (amountMatch) detectedAmount = parseFloat(amountMatch[0]);

        const upperText = text.toUpperCase();
        if (upperText.includes('NLEX')) detectedExpressway = 'NLEX';
        else if (upperText.includes('SLEX')) detectedExpressway = 'SLEX';
        else if (upperText.includes('CAVITEX')) detectedExpressway = 'CAVITEX';
        else if (upperText.includes('SCTEX')) detectedExpressway = 'SCTEX';
        else if (upperText.includes('SKYWAY')) detectedExpressway = 'Skyway';
        else if (upperText.includes('MCX')) detectedExpressway = 'MCX';
        else if (upperText.includes('CALAX')) detectedExpressway = 'CALAX';

        res.json({ amount: detectedAmount, expressway: detectedExpressway });
    } catch (error) {
        console.error("OCR Processing Error:", error);
        res.status(500).json({ error: "Failed to scan receipt" });
    }
});

// ==========================================
// --- SUPER ADMIN "GOD MODE" ROUTES ---
// ==========================================

// 1. Get all Admins
app.get('/api/admins', async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' }, '-password');
        res.json(admins);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// 2. Delete ANY User (Admin or Driver)
app.delete('/api/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User permanently deleted.' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// 3. Force Reset ANY User's Password (Bypass email)
app.put('/api/users/:id/force-password', async (req, res) => {
    try {
        const { newPassword } = req.body;
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(req.params.id, { password: hashedPassword });
        res.json({ message: 'Password forcefully updated!' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// 4. Force Verify ALL Unverified Accounts
app.put('/api/users/force-verify-all', async (req, res) => {
    try {
        const result = await User.updateMany({ isVerified: false }, { isVerified: true, verificationToken: undefined });
        res.json({ message: `${result.modifiedCount} accounts were instantly verified!` });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==========================================
// --- START SERVER ---
// ==========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});