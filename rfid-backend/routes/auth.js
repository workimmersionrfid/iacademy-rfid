const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { google } = require('googleapis');

// Fetch the User model that is defined in your main index.js
const User = mongoose.model('User');

// ==========================================
// --- GMAIL REST API SETUP (BULLETPROOF) ---
// ==========================================
const sendEmail = async (options) => {
    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.GMAIL_REFRESH_TOKEN
        });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const utf8Subject = `=?utf-8?B?${Buffer.from(options.subject).toString('base64')}?=`;
        
        const messageParts = [
            `From: "iACADEMY Fleet Management" <${process.env.EMAIL_USER}>`,
            `To: ${options.to}`,
            `Subject: ${utf8Subject}`,
            `Content-Type: text/html; charset=utf-8`,
            `MIME-Version: 1.0`,
            ``,
            options.html
        ];

        const message = messageParts.join('\n');
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const result = await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw: encodedMessage }
        });

        console.log("✅ Email sent successfully via HTTP REST API to:", options.to);
        return result.data;
    } catch (error) {
        console.error("🚨 Detailed Gmail API Error:", error.message || error); 
        throw error;
    }
};

// ==========================================
// --- AUTHENTICATION ROUTES ---
// ==========================================

// 1. REGISTER USER
router.post('/register', async (req, res) => {
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
        
        // 🚨 FIX APPLIED HERE: We save `username.trim()` instead of `normalizedUsername`!
        const newUser = new User({ 
            username: username.trim(), 
            firstName, lastName, middleName, 
            email: normalizedEmail, password: hashedPassword, role, department, verificationToken 
        });
        
        await newUser.save();

        const backendUrl = `${req.protocol}://${req.get('host')}`;
        const verifyLink = `${backendUrl}/api/auth/verify/${verificationToken}`;

        const mailOptions = {
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

        await sendEmail(mailOptions);
        res.status(201).json({ message: 'Account created successfully! Please check your email to verify.' });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: 'Database constraint: Username or Email already exists' });
        res.status(500).json({ message: err.message });
    }
});

// 2. VERIFY EMAIL
router.get('/verify/:token', async (req, res) => {
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

// 3. LOGIN
router.post('/login', async (req, res) => {
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
        
        // 🚨 FIX APPLIED HERE: Sending `user.username` back to the frontend so it saves the correct casing!
        res.json({ 
            message: 'Login successful', 
            token, 
            role: user.role, 
            department: user.department, 
            isVerified: user.isVerified,
            username: user.username 
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// 4. FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
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

        await sendEmail(mailOptions);
        res.json({ message: 'An e-mail has been sent to ' + user.email + ' with further instructions.' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// 5. RESET PASSWORD
router.post('/reset-password', async (req, res) => {
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

module.exports = router;