const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// Temporary storage for OTPs (Key: Phone, Value: OTP)
const otpStore = {}; 

const API_URL = 'https://backend.api-wa.co/campaign/neodove/api/v2';
const API_KEY = process.env.NEODOVE_API_KEY; 

// --- ROUTE 1: SEND OTP ---
app.post('/send-otp', async (req, res) => {
    const { phoneNumber, userName } = req.body;
    
    // Generate a fresh 4-digit code
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Save it in memory for 5 minutes
    otpStore[phoneNumber] = { 
        otp: otpCode, 
        expiresAt: Date.now() + 5 * 60 * 1000 
    };

    console.log(`🚀 Sending OTP ${otpCode} to ${phoneNumber}`);

    const payload = {
        apiKey: API_KEY,
        campaignName: "OTP5",
        destination: phoneNumber,
        userName: userName,
        templateParams: [otpCode], // Replaces {{1}}
        source: "Wix_Form",
        buttons: [{
            type: "button", sub_type: "url", index: 0,
            parameters: [{ type: "text", text: otpCode }]
        }]
    };

    try {
        await axios.post(API_URL, payload);
        res.json({ success: true, message: "OTP Sent" });
    } catch (error) {
        console.error("NeoDove Error:", error.message);
        res.status(500).json({ success: false });
    }
});

// --- ROUTE 2: VERIFY OTP (NEW!) ---
app.post('/verify-otp', (req, res) => {
    const { phoneNumber, otpCode } = req.body;
    const record = otpStore[phoneNumber];

    // Check if OTP exists, matches, and isn't expired
    if (record && record.otp === String(otpCode) && Date.now() < record.expiresAt) {
        delete otpStore[phoneNumber]; // Clear OTP after success
        console.log(`✅ ${phoneNumber} verified successfully!`);
        return res.json({ success: true });
    }
    
    console.log(`❌ Verification failed for ${phoneNumber}`);
    res.json({ success: false, message: "Invalid or expired OTP" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend live on port ${PORT}`));
