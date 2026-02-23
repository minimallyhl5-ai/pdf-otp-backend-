const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Temporary in-memory OTP storage
// In production you would use database
const otpStore = {};

/*
==================================
1️⃣ SEND OTP
==================================
*/
app.post("/send-otp", (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      message: "Phone number is required"
    });
  }

  // Generate 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // Store OTP with 5 minute expiry
  otpStore[phone] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000
  };

  console.log(`📲 OTP for ${phone}: ${otp}`);

  // 🔴 TODO:
  // Here you can integrate WhatsApp API or SMS API
  // For now OTP is printed in Render logs

  return res.json({
    success: true,
    message: "OTP sent successfully"
  });
});


/*
==================================
2️⃣ VERIFY OTP
==================================
*/
app.post("/verify-otp", (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({
      success: false,
      message: "Phone and OTP required"
    });
  }

  const record = otpStore[phone];

  if (!record) {
    return res.json({
      success: false,
      message: "No OTP found for this number"
    });
  }

  if (Date.now() > record.expiresAt) {
    delete otpStore[phone];
    return res.json({
      success: false,
      message: "OTP expired"
    });
  }

  if (record.otp !== otp) {
    return res.json({
      success: false,
      message: "Invalid OTP"
    });
  }

  // OTP correct → remove it
  delete otpStore[phone];

  return res.json({
    success: true,
    message: "OTP verified successfully"
  });
});


/*
==================================
3️⃣ HEALTH CHECK ROUTE
==================================
*/
app.get("/", (req, res) => {
  res.send("OTP Backend is running 🚀");
});


/*
==================================
SERVER START
==================================
*/
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
