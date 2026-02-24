const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// Temporary storage for OTPs (Key: Phone, Value: {otp, expiresAt, userName})
const otpStore = {}; 

// --- CONFIGURATION ---
// NeoDove API Details
const API_URL = 'https://backend.api-wa.co/campaign/neodove/api/v2';
// Best Practice: This reads from your Render Environment Variables
const API_KEY = process.env.NEODOVE_API_KEY; 

// 📊 Your Specific Google Apps Script URL
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzZAObdi3Y4g_-p3D8DGEWzXWkLwzgIN6JiZmdFQql5VV8yvQECRHJKbMNeKZn7wYpF/exec';

// --- ROUTE 1: SEND OTP ---
app.post('/send-otp', async (req, res) => {
    const { phoneNumber, userName } = req.body;
    
    if (!phoneNumber) return res.status(400).json({ success: false, message: "Phone required" });

    // Generate a 4-digit OTP
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Store OTP and Name for 5 minutes
    otpStore[phoneNumber] = { 
        otp: otpCode, 
        userName: userName || "Student",
        expiresAt: Date.now() + 5 * 60 * 1000 
    };

    console.log(`🚀 Sending OTP ${otpCode} to ${phoneNumber}`);

    const payload = {
        apiKey: API_KEY, 
        campaignName: "OTP5", // Ensure this is LIVE in NeoDove
        destination: phoneNumber,
        userName: userName || "Student",
        templateParams: [otpCode], 
        source: "Wix_Website",
        buttons: [{
            type: "button",
            sub_type: "url",
            index: 0,
            parameters: [{ type: "text", text: otpCode }] 
        }]
    };

    try {
        await axios.post(API_URL, payload, {
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}` // ✅ FIX: Added Bearer to stop 401 error
            }
        });
        res.json({ success: true, message: "OTP Sent" });
    } catch (error) {
        console.error("❌ NeoDove Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false });
    }
});

// --- ROUTE 2: VERIFY OTP & SAVE TO GOOGLE SHEETS ---
app.post('/verify-otp', async (req, res) => {
    const { phoneNumber, otpCode } = req.body;
    const record = otpStore[phoneNumber];

    // Check if OTP is valid and not expired
    if (record && record.otp === String(otpCode) && Date.now() < record.expiresAt) {
        
        // 🟢 SUCCESS: SAVE TO GOOGLE SHEETS
        try {
            await axios.post(GOOGLE_SHEET_URL, {
                userName: record.userName,
                phoneNumber: phoneNumber
            });
            console.log(`📊 Lead saved to Google Sheets for ${phoneNumber}`);
        } catch (sheetError) {
            console.error("❌ Google Sheets Error:", sheetError.message);
            // We still allow the verification to succeed even if the sheet fails
        }

        delete otpStore[phoneNumber]; // Clear OTP after success
        return res.json({ success: true });
    }
    
    console.log(`❌ Verification failed for ${phoneNumber}`);
    res.json({ success: false, message: "Invalid or expired OTP" });
});

// Health check for Render
app.get('/', (req, res) => res.send("Hundred Learning OTP Backend is Live 🚀"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
