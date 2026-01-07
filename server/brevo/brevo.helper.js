// helpers/brevoEmail.js
const axios = require("axios");

// Load API key from environment variables for security
const BREVO_API_KEY = process.env.BREVO_API_KEY || ""

// Generic sendEmail helper using Brevo API
const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "Sangtosha Enterprise", email: "kiplangatsang08@gmail.com" },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Email sent successfully:", response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("❌ Error sending email:", error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

module.exports = sendEmail;
