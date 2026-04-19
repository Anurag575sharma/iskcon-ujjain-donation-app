require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

const campaignRoutes = require("./routes/campaign");
const paymentRoutes = require("./routes/payment");

const app = express();

// Security headers
app.use(helmet());

// CORS — supports comma-separated origins in FRONTEND_URL
const allowedOrigins = (process.env.FRONTEND_URL || "*").split(",").map((s) => s.trim());
app.use(cors({
  origin: allowedOrigins.length === 1 && allowedOrigins[0] === "*" ? "*" : allowedOrigins,
}));

// Rate limiting on payment routes
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: "Too many requests, please try again later." },
});
const orderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // max 3 orders per minute per IP
  message: { error: "Please wait before trying again." },
});
app.use("/api/create-order", orderLimiter);
app.use("/api/verify-payment", paymentLimiter);

app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(() => console.error("MongoDB connection failed"));

app.use("/api", campaignRoutes);
app.use("/api", paymentRoutes);

// Global error handler — hide internal details in production
app.use((err, req, res, next) => {
  console.error("Server error occurred");
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
