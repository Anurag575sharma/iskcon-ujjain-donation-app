const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
  donorName: { type: String, required: true },
  donorEmail: { type: String, default: "" },
  amount: { type: Number, required: true },
  orderId: { type: String, required: true },
  paymentId: { type: String },
  status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
}, { timestamps: true });

module.exports = mongoose.model("Donation", donationSchema);
