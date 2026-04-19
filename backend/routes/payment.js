const express = require("express");
const https = require("https");
const router = express.Router();
const Donation = require("../models/Donation");
const Campaign = require("../models/Campaign");
const { sendDonationReceipt } = require("../utils/mailer");

const CF_BASE = process.env.CASHFREE_ENV === "production"
  ? "https://api.cashfree.com/pg"
  : "https://sandbox.cashfree.com/pg";

function cashfreeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : "";
    const url = new URL(CF_BASE + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method,
      headers: {
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let result = "";
      res.on("data", (c) => (result += c));
      res.on("end", () => {
        try { resolve(JSON.parse(result)); }
        catch { reject(new Error(result)); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

// Create Cashfree order
router.post("/create-order", async (req, res) => {
  try {
    const { amount, campaignId, donorName, donorEmail } = req.body;

    if (!donorName || !campaignId) return res.status(400).json({ error: "Name and campaign are required." });
    if (!amount || amount < 1 || amount > 10000000) return res.status(400).json({ error: "Invalid amount." });
    if (typeof donorName !== "string" || donorName.length > 100) return res.status(400).json({ error: "Invalid name." });
    if (donorEmail && (typeof donorEmail !== "string" || !donorEmail.includes("@"))) return res.status(400).json({ error: "Invalid email." });

    const safeName = donorName.replace(/<[^>]*>/g, "").trim();

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ error: "Campaign not found." });

    const oid = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const cfOrder = await cashfreeRequest("POST", "/orders", {
      order_id: oid,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: `donor_${Date.now()}`,
        customer_name: safeName,
        customer_email: donorEmail || "donor@example.com",
        customer_phone: "9999999999",
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/thank-you?order_id=${oid}&campaign_id=${campaignId}`,
      },
    });

    if (!cfOrder.payment_session_id) {
      return res.status(500).json({ error: cfOrder.message || "Failed to create order." });
    }

    await Donation.create({
      campaignId,
      donorName: safeName,
      donorEmail: donorEmail || "",
      amount,
      orderId: oid,
      status: "created",
    });

    res.json({ orderId: oid, paymentSessionId: cfOrder.payment_session_id, amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify payment status
router.post("/verify-payment", async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "Missing order ID." });
    if (!/^[a-zA-Z0-9_-]+$/.test(orderId)) return res.status(400).json({ error: "Invalid order ID format." });

    const cfOrder = await cashfreeRequest("GET", `/orders/${orderId}`, null);
    if (!cfOrder || cfOrder.order_status !== "PAID") return res.status(400).json({ error: "Payment not completed." });

    const existing = await Donation.findOne({ orderId, status: "paid" });
    if (existing) return res.json({ message: "Payment already verified.", emailSent: !!existing.donorEmail });

    // Atomic update — only one request can change status from "created" to "paid"
    const donation = await Donation.findOneAndUpdate(
      { orderId, status: "created" },
      { paymentId: cfOrder.cf_order_id?.toString() || orderId, status: "paid" },
      { new: true }
    );
    if (!donation) return res.json({ message: "Payment already verified." });

    if (Number(cfOrder.order_amount) !== donation.amount) {
      await Donation.findByIdAndUpdate(donation._id, { status: "created", paymentId: null });
      console.error("Payment amount mismatch detected");
      return res.status(400).json({ error: "Amount mismatch detected." });
    }

    const campaign = await Campaign.findByIdAndUpdate(donation.campaignId, {
      $inc: { collectedAmount: donation.amount },
    }, { new: true });

    if (donation.donorEmail) {
      sendDonationReceipt({
        donorName: donation.donorName,
        donorEmail: donation.donorEmail,
        amount: donation.amount,
        campaignTitle: campaign.title,
        paymentId: orderId,
      });
    }

    res.json({ message: "Payment verified successfully", emailSent: !!donation.donorEmail });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Top donors for a campaign
router.get("/donors/:campaignId", async (req, res) => {
  try {
    const donors = await Donation.aggregate([
      { $match: { campaignId: new (require("mongoose").Types.ObjectId)(req.params.campaignId), status: "paid" } },
      { $group: { _id: "$donorName", totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, donorName: "$_id", amount: "$totalAmount", count: 1 } },
    ]);
    res.json(donors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Recent donations from active campaigns
router.get("/recent-donations", async (req, res) => {
  try {
    const activeCampaigns = await Campaign.find({
      hidden: { $ne: true },
      $expr: { $lt: ["$collectedAmount", "$targetAmount"] },
    }).select("_id");
    const activeIds = activeCampaigns.map((c) => c._id);
    const donations = await Donation.find({ status: "paid", campaignId: { $in: activeIds } })
      .sort({ createdAt: -1 }).limit(10)
      .select("donorName amount createdAt campaignId")
      .populate("campaignId", "title");
    res.json(donations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Donation stats
router.get("/stats", async (req, res) => {
  try {
    let match = { status: "paid" };
    if (req.query.active === "true") {
      const activeCampaigns = await Campaign.find({
        hidden: { $ne: true },
        $expr: { $lt: ["$collectedAmount", "$targetAmount"] },
      }).select("_id");
      match.campaignId = { $in: activeCampaigns.map((c) => c._id) };
    }
    const result = await Donation.aggregate([
      { $match: match },
      { $group: { _id: null, totalAmount: { $sum: "$amount" }, totalDonors: { $sum: 1 } } },
    ]);
    const stats = result[0] || { totalAmount: 0, totalDonors: 0 };
    res.json({ totalAmount: stats.totalAmount, totalDonors: stats.totalDonors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
