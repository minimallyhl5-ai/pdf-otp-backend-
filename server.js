const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

const API_URL = 'https://backend.api-wa.co/campaign/neodove/api/v2';
// 🔐 Securely pull from Render Environment Variables
const API_KEY = process.env.NEODOVE_API_KEY; 

app.post('/send-otp', async (req, res) => {
    // 1. Force values to Strings to prevent API rejection
    const phoneNumber = String(req.body.phoneNumber);
    const userName = req.body.userName || "Student";
    const otpCode = String(req.body.otpCode);

    console.log(`🚀 Triggering OTP ${otpCode} for ${phoneNumber}`);

    const payload = {
        apiKey: API_KEY,
        campaignName: "OTP5",
        destination: phoneNumber, 
        userName: userName,
        templateParams: [otpCode], // {{1}}
        source: "Website_Entrance_Form",
        buttons: [
            {
                type: "button",
                sub_type: "url",
                index: 0,
                parameters: [{ type: "text", text: otpCode }]
            }
        ]
    };

    try {
        const response = await axios.post(API_URL, payload);
        res.json({ success: true, message: "OTP Sent", data: response.data });
    } catch (error) {
        // Log the specific error from NeoDove to help you debug
        console.error("NeoDove API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: "WhatsApp API failed" });
    }
});

// 🌍 Use dynamic port for Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
