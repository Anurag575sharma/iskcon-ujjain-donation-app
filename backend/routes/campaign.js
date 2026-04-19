const express = require("express");
const router = express.Router();
const Campaign = require("../models/Campaign");
const Donation = require("../models/Donation");
const { upload, uploadToCloudinary } = require("../utils/cloudinary");

// Get all visible campaigns (public) with donor counts
router.get("/campaigns", async (req, res) => {
  try {
    const campaigns = await Campaign.find({ hidden: { $ne: true } }).sort({ createdAt: -1 }).lean();

    // Get donor counts for each campaign
    const donorCounts = await Donation.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: "$campaignId", donorCount: { $sum: 1 } } },
    ]);
    const countMap = {};
    donorCounts.forEach((d) => { countMap[d._id.toString()] = d.donorCount; });

    const result = campaigns.map((c) => ({ ...c, donorCount: countMap[c._id.toString()] || 0 }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get ALL campaigns including hidden (admin — requires password in header)
router.get("/admin/campaigns", async (req, res) => {
  try {
    if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get campaign by ID
router.get("/campaign/:id", async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new campaign (admin only)
router.post("/campaign", async (req, res) => {
  try {
    const { title, description, image, targetAmount, adminPassword } = req.body;

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Wrong admin password." });
    }

    const campaign = await Campaign.create({ title, description, image, targetAmount });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle campaign visibility (admin only)
router.patch("/campaign/:id/toggle-hide", async (req, res) => {
  try {
    const { adminPassword } = req.body;
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Wrong admin password." });
    }

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    campaign.hidden = !campaign.hidden;
    await campaign.save();
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete campaign (admin only)
router.delete("/campaign/:id", async (req, res) => {
  try {
    const { adminPassword } = req.body;
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Wrong admin password." });
    }

    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    res.json({ message: "Campaign deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit campaign (admin only)
router.put("/campaign/:id", async (req, res) => {
  try {
    const { adminPassword, title, description, image, targetAmount } = req.body;
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Wrong admin password." });
    }

    const updates = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (image) updates.image = image;
    if (targetAmount) updates.targetAmount = Number(targetAmount);

    const campaign = await Campaign.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all donors for a campaign (admin - for export, requires password)
router.get("/admin/donors/:campaignId", async (req, res) => {
  try {
    if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    const donors = await Donation.find({
      campaignId: req.params.campaignId,
      status: "paid",
    }).sort({ createdAt: -1 });

    const campaign = await Campaign.findById(req.params.campaignId);
    res.json({ campaign: campaign?.title || "Unknown", donors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload image to Cloudinary (admin only)
router.post("/admin/upload", upload.single("image"), async (req, res) => {
  try {
    if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    if (!req.file) return res.status(400).json({ error: "No image provided." });
    const url = await uploadToCloudinary(req.file.buffer);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analytics dashboard (admin only)
router.get("/admin/analytics", async (req, res) => {
  try {
    if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    // Total stats
    const totalStats = await Donation.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, totalAmount: { $sum: "$amount" }, totalDonors: { $sum: 1 } } },
    ]);

    // Daily donations (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyDonations = await Donation.aggregate([
      { $match: { status: "paid", createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top campaigns by collection
    const topCampaigns = await Campaign.find().sort({ collectedAmount: -1 }).limit(5)
      .select("title collectedAmount targetAmount");

    // Top donors (aggregated across all)
    const topDonors = await Donation.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: "$donorName", totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
    ]);

    // Top donors per campaign
    const allCampaigns = await Campaign.find().select("title");
    const donorsByCampaign = [];
    for (const camp of allCampaigns) {
      const donors = await Donation.aggregate([
        { $match: { status: "paid", campaignId: camp._id } },
        { $group: { _id: "$donorName", totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { totalAmount: -1 } },
        { $limit: 5 },
      ]);
      if (donors.length) {
        donorsByCampaign.push({ campaignId: camp._id, campaignTitle: camp.title, donors });
      }
    }

    res.json({
      total: totalStats[0] || { totalAmount: 0, totalDonors: 0 },
      dailyDonations,
      topCampaigns,
      topDonors,
      donorsByCampaign,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
