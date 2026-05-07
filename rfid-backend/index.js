const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer'); 
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
// --- NODEMAILER TRANSPORTER SETUP ---
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

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
    role: { type: String, enum: ['admin', 'driver'], default: 'driver' },
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
    hiddenBy: { type: [String], default: [] } // NEW: Tracks who "deleted" the message from their screen
});

const User = mongoose.model('User', userSchema);
const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const FuelLog = mongoose.model('FuelLog', logSchema);
const TollLog = mongoose.model('TollLog', tollSchema); 
const Task = mongoose.model('Task', taskSchema);
const ActionLog = mongoose.model('ActionLog', actionLogSchema);
const Message = mongoose.model('Message', messageSchema);

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

// --- AUTHENTICATION & EMAIL ROUTES ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, firstName, lastName, middleName, email, password, role, department } = req.body;
        
        const normalizedEmail = email.toLowerCase().trim();
        const normalizedUsername = username.toLowerCase().trim();

        const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passRegex.test(password)) {
            return res.status(400).json({ message: 'Password does not meet standard format requirements.' });
        }

        const existingUser = await User.findOne({ 
            $or: [
                { email: { $regex: new RegExp('^' + normalizedEmail + '$', 'i') } }, 
                { username: { $regex: new RegExp('^' + normalizedUsername + '$', 'i') } }
            ] 
        });
        
        if (existingUser) {
            if (existingUser.email.toLowerCase() === normalizedEmail) {
                return res.status(400).json({ message: "An account with this Email Address already exists." });
            } else {
                return res.status(400).json({ message: "This Username is already taken." });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        const newUser = new User({ 
            username: normalizedUsername, 
            firstName, 
            lastName, 
            middleName, 
            email: normalizedEmail, 
            password: hashedPassword, 
            role, 
            department, 
            verificationToken 
        });
        
        await newUser.save();

        const backendUrl = `${req.protocol}://${req.get('host')}`;
        const verifyLink = `${backendUrl}/api/auth/verify/${verificationToken}`;

        const mailOptions = {
            from: `"iACADEMY RFID System" <${process.env.EMAIL_USER}>`,
            to: normalizedEmail,
            subject: 'Verify Your Driver Account',
            html: `
                <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #1e3a8a;">Welcome to iACADEMY Fleet Management!</h2>
                    <p>Hello <b>${username}</b>,</p>
                    <p>Your driver account has been successfully registered. To activate your account and allow administrators to assign your department, please verify your email address by clicking the button below:</p>
                    <a href="${verifyLink}" style="display: inline-block; background-color: #1e3a8a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px; margin-bottom: 15px;">Verify Email Address</a>
                    <p style="font-size: 12px; color: #64748b;">If the button doesn't work, copy and paste this link into your browser:<br>${verifyLink}</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(201).json({ message: 'Account created successfully! Please check your email to verify.' });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: 'Database constraint: Username or Email already exists' });
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/auth/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({ verificationToken: token });
        
        if (!user) {
            return res.status(400).send("Invalid or expired verification link. Please contact your administrator.");
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
        res.redirect(`${frontendUrl}/login.html?verified=success`);
    } catch (err) {
        res.status(500).send("Server Error during verification.");
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const normalizedUsername = username.toLowerCase().trim();
        const user = await User.findOne({ username: { $regex: new RegExp('^' + normalizedUsername + '$', 'i') } });
        
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

        if (!user.isVerified) {
            return res.status(403).json({ message: 'Email not verified. Please check your inbox.', isVerified: false });
        }

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

app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'No account with that email address exists.' });

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; 
        await user.save();

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
        const resetLink = `${frontendUrl}/reset-password.html?token=${token}`;

        const mailOptions = {
            from: `"iACADEMY RFID System" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #1e3a8a;">Password Reset Request</h2>
                    <p>Hello <b>${user.username}</b>,</p>
                    <p>You are receiving this because you (or someone else) have requested the reset of the password for your account. Please click on the button below to complete the process:</p>
                    <a href="${resetLink}" style="display: inline-block; background-color: #1e3a8a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px; margin-bottom: 15px;">Reset Password</a>
                    <p>This link will expire in 1 hour.</p>
                    <p style="font-size: 12px; color: #64748b;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'An e-mail has been sent to ' + user.email + ' with further instructions.' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await User.findOne({ 
            resetPasswordToken: token, 
            resetPasswordExpires: { $gt: Date.now() } 
        });

        if (!user) return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Success! Your password has been changed.' });
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
        const response = await fetch('https://apis.tollguru.com/toll/v2/origin-destination-waypoints', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.TOLLGURU_API_KEY
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

// Get messages for a specific user (filters out soft-deleted ones!)
app.get('/api/messages/:username', async (req, res) => {
    try {
        const username = req.params.username;
        if (username === 'Admin') {
            // Send to Admin only if Admin hasn't hidden it
            const messages = await Message.find({ hiddenBy: { $ne: 'Admin' } }).sort({ timestamp: 1 });
            res.json(messages);
        } else {
            // Send to Driver only if Driver hasn't hidden it
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

// NEW: Clear/Soft-Delete Chat Messages Route
app.put('/api/messages/clear', async (req, res) => {
    try {
        const { driverUsername, clearedBy } = req.body; 
        
        // Find all messages between Admin and this specific driver, 
        // and add the person clicking the "Clear" button to the hiddenBy list
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

        if (!image) {
            return res.status(400).json({ error: "No image provided" });
        }

        const { data: { text } } = await Tesseract.recognize(image, 'eng');
        
        let detectedAmount = null;
        let detectedExpressway = null;

        const amountMatch = text.match(/\d+\.\d{2}/);
        if (amountMatch) {
            detectedAmount = parseFloat(amountMatch[0]);
        }

        const upperText = text.toUpperCase();
        if (upperText.includes('NLEX')) detectedExpressway = 'NLEX';
        else if (upperText.includes('SLEX')) detectedExpressway = 'SLEX';
        else if (upperText.includes('CAVITEX')) detectedExpressway = 'CAVITEX';
        else if (upperText.includes('SCTEX')) detectedExpressway = 'SCTEX';
        else if (upperText.includes('SKYWAY')) detectedExpressway = 'Skyway';
        else if (upperText.includes('MCX')) detectedExpressway = 'MCX';
        else if (upperText.includes('CALAX')) detectedExpressway = 'CALAX';

        res.json({
            amount: detectedAmount,
            expressway: detectedExpressway
        });

    } catch (error) {
        console.error("OCR Processing Error:", error);
        res.status(500).json({ error: "Failed to scan receipt" });
    }
});

// ==========================================
// --- START SERVER ---
// ==========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});