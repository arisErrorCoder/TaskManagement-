require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const teamRoutes = require("./routes/teamRoutes");
const taskRoutes = require("./routes/taskRoutes");
const nodemailer = require("nodemailer");


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect Database
connectDB();

// Routes
app.use("/api/team-members", teamRoutes);
app.use("/api/tasks", taskRoutes);


const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  
  // API to send an email
  app.post("/api/send-email", async (req, res) => {
    const { to, subject, htmlContent } = req.body;
  
    try {
      await transporter.sendMail({
        from: `"Task Manager" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlContent, // ✅ Ensure this is "html", NOT "text"
    });
  
      res.status(200).json({ message: "Email sent successfully" });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  
// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
