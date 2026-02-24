const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// Temporary storage for OTPs
const otpStore = {}; 

// NeoDove Configuration
const API_URL = 'https://backend.api-wa.co/campaign/neodove/api/v2';
// 🔑 Best practice: Use process.env.NEODOVE_API_KEY in Render Environment Variables
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTcxNjE0OGQyZDk2MGQzZmVhZjNmMSIsIm5hbWUiOiJCWFEgPD4gTWlnaHR5IEh1bmRyZWQgVGVjaG5vbG9naWVzIFB2dCBMdGQiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjkxNzE2MTQ4ZDJkOTYwZDNmZWFmM2VhIiwiYWN0aXZlUGxhbiI6Ik5PTkUiLCJpYXQiOjE3NjMxMjA2NjB9.8jOtIkz5c455LWioAa7WNzvjXlqCN564TzM12yQQ5Cw'; 

// --- ROUTE 1: SEND OTP ---
app.post('/send-otp', async (req, res) => {
    const { phoneNumber, userName } = req.body;
    
    if (!phoneNumber) return res.status(400).json({ success: false, message: "Phone required" });

    // Generate 4-digit OTP
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Store OTP for 5 minutes
    otpStore[phoneNumber] = { 
        otp: otpCode, 
        expiresAt: Date.now() + 5 * 60 * 1000 
    };

    console.log(`🚀 Sending OTP ${otpCode} to ${phoneNumber}`);

    const payload = {
        apiKey: API_KEY, // NeoDove uses apiKey in the body for v2
        campaignName: "OTP5", // Must match your LIVE NeoDove API Campaign
        destination: phoneNumber,
        userName: userName || "Student",
        templateParams: [otpCode], // Replaces {{1}} in your approved template
        source: "Wix_Syllabus_Form",
        buttons: [{
            type: "button",
            sub_type: "url",
            index: 0,
            parameters: [{ type: "text", text: otpCode }] // For 'Copy Code' button
        }]
    };

    try {
        const response = await axios.post(API_URL, payload, {
            headers: { "Content-Type": "application/json" }
        });
        
        console.log("✅ NeoDove Response:", response.data);
        res.json({ success: true, message: "OTP Sent" });
    } catch (error) {
        // Detailed logging to debug the 401 error
        console.error("❌ NeoDove Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: "API failure" });
    }
});

// --- ROUTE 2: VERIFY OTP ---
app.post('/verify-otp', (req, res) => {
    const { phoneNumber, otpCode } = req.body;
    const record = otpStore[phoneNumber];

    if (record && record.otp === String(otpCode) && Date.now() < record.expiresAt) {
        delete otpStore[phoneNumber]; // Success, clear the code
        console.log(`✅ ${phoneNumber} verified!`);
        return res.json({ success: true });
    }
    
    console.log(`❌ Verification failed for ${phoneNumber}`);
    res.json({ success: false, message: "Invalid or expired OTP" });
});

// Health check for Render
app.get('/', (req, res) => res.send("OTP Backend is running 🚀"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Backend live on port ${PORT}`));
