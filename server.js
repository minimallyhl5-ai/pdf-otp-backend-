const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const otpStore = {};

// 🔑 PASTE YOUR API KEY HERE
const WHATSAPP_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTcxNjE0OGQyZDk2MGQzZmVhZjNmMSIsIm5hbWUiOiJCWFEgPD4gTWlnaHR5IEh1bmRyZWQgVGVjaG5vbG9naWVzIFB2dCBMdGQiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjkxNzE2MTQ4ZDJkOTYwZDNmZWFmM2VhIiwiYWN0aXZlUGxhbiI6Ik5PTkUiLCJpYXQiOjE3NjMxMjA2NjB9.8jOtIkz5c455LWioAa7WNzvjXlqCN564TzM12yQQ5Cw"; 

app.post("/send-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: "Phone required" });

  // Generate 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  otpStore[phone] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  console.log(`📲 OTP for ${phone}: ${otp}`);

  try {
    // This is a generic example. The URL and data structure depend on your provider.
    // Replace 'https://api.yourprovider.com/send' with your actual API endpoint.
    await axios.post("https://api.yourprovider.com/send", {
      token: WHATSAPP_API_KEY,
      to: phone,
      body: `Your Hundred Learning verification code is: ${otp}`
    });

    res.json({ success: true, message: "OTP sent to WhatsApp" });
  } catch (error) {
    console.error("WhatsApp API Error:", error.response ? error.response.data : error.message);
    // Returning success true here allows you to manually verify via Render logs if the API fails
    res.json({ success: true, message: "OTP generated (check logs if message not received)" });
  }
});

app.post("/verify-otp", (req, res) => {
  const { phone, otp } = req.body;
  const record = otpStore[phone];

  if (record && record.otp === otp && Date.now() < record.expiresAt) {
    delete otpStore[phone];
    return res.json({ success: true, message: "Verified" });
  }
  res.json({ success: false, message: "Invalid or expired OTP" });
});

app.get("/", (req, res) => res.send("OTP Backend is running 🚀"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
