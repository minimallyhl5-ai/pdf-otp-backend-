const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// Temporary storage for OTPs
const otpStore = {}; 

// --- CONFIGURATION ---
const API_URL = 'https://backend.api-wa.co/campaign/neodove/api/v2';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTcxNjE0OGQyZDk2MGQzZmVhZjNmMSIsIm5hbWUiOiJCWFEgPD4gTWlnaHR5IEh1bmRyZWQgVGVjaG5vbG9naWVzIFB2dCBMdGQiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjkxNzE2MTQ4ZDJkOTYwZDNmZWFmM2VhIiwiYWN0aXZlUGxhbiI6Ik5PTkUiLCJpYXQiOjE3NjMxMjA2NjB9.8jOtIkz5c455LWioAa7WNzvjXlqCN564TzM12yQQ5Cw'; 

// 📊 Google Apps Script Web App URL
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzZAObdi3Y4g_-p3D8DGEWzXWkLwzgIN6JiZmdFQql5VV8yvQECRHJKbMNeKZn7wYpF/exec';

// --- ROUTE 1: SEND OTP ---
app.post('/send-otp', async (req, res) => {
    const { phoneNumber, userName } = req.body;
    
    if (!phoneNumber) return res.status(400).json({ success: false, message: "Phone required" });

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
        campaignName: "OTP5", 
        destination: phoneNumber,
        userName: userName || "Student",
        templateParams: [otpCode], 
        source: "Wix_Syllabus_Form",
        buttons: [{
            type: "button",
            sub_type: "url",
            index: 0,
            parameters: [{ type: "text", text: otpCode }] 
        }]
    };

    try {
        const response = await axios.post(API_URL, payload, {
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}` // Fixes 401 errors
            }
        });
        res.json({ success: true, message: "OTP Sent" });
    } catch (error) {
        console.error("❌ NeoDove Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false });
    }
});

// --- ROUTE 2: VERIFY OTP & SAVE DATA ---
app.post('/verify-otp', async (req, res) => {
    const { phoneNumber, otpCode } = req.body;
    const record = otpStore[phoneNumber];

    if (record && record.otp === String(otpCode) && Date.now() < record.expiresAt) {
        
        // 🟢 SAVE TO GOOGLE SHEETS UPON SUCCESS
        try {
            await axios.post(GOOGLE_SHEET_URL, {
                userName: record.userName,
                phoneNumber: phoneNumber
            });
            console.log(`📊 Lead saved to Google Sheets for ${phoneNumber}`);
        } catch (sheetError) {
            console.error("❌ Google Sheets Error:", sheetError.message);
        }

        delete otpStore[phoneNumber]; 
        console.log(`✅ ${phoneNumber} verified!`);
        return res.json({ success: true });
    }
    
    res.json({ success: false, message: "Invalid or expired OTP" });
});

app.get('/', (req, res) => res.send("OTP Backend is running 🚀"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Backend live on port ${PORT}`));
