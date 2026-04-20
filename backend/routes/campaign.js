const express = require("express");
const router = express.Router();
const Campaign = require("../models/Campaign");
const Donation = require("../models/Donation");
const Settings = require("../models/Settings");
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
    res.status(500).json({ error: "Something went wrong." });
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
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Get campaign by ID
router.get("/campaign/:id", async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Create a new campaign (admin only)
router.post("/campaign", async (req, res) => {
  try {
    const { title, description, image, images, targetAmount, adminPassword } = req.body;

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Wrong admin password." });
    }

    const campaign = await Campaign.create({ title, description, image, images: images || [], targetAmount, shareMessage: req.body.shareMessage || "" });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong." });
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
    res.status(500).json({ error: "Something went wrong." });
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
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Edit campaign (admin only)
router.put("/campaign/:id", async (req, res) => {
  try {
    const { adminPassword, title, description, image, images, targetAmount } = req.body;
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Wrong admin password." });
    }

    const updates = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (image) updates.image = image;
    if (images) updates.images = images;
    if (targetAmount) updates.targetAmount = Number(targetAmount);
    if (req.body.shareMessage !== undefined) updates.shareMessage = req.body.shareMessage;

    const campaign = await Campaign.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong." });
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
    res.status(500).json({ error: "Something went wrong." });
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
    res.status(500).json({ error: "Something went wrong." });
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
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Get payment settings (public)
router.get("/settings/payment-mode", async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: "paymentMode" });
    const upiSetting = await Settings.findOne({ key: "upiDetails" });
    const formSetting = await Settings.findOne({ key: "form80gUrl" });
    res.json({
      mode: setting?.value || "cashfree",
      upiId: upiSetting?.value?.upiId || "",
      qrImage: upiSetting?.value?.qrImage || "",
      whatsappNo: upiSetting?.value?.whatsappNo || "",
      form80gUrl: formSetting?.value || "",
    });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Update payment settings (admin)
router.post("/admin/settings/payment-mode", async (req, res) => {
  try {
    if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    const { mode, upiId, qrImage, whatsappNo, form80gUrl } = req.body;
    await Settings.findOneAndUpdate({ key: "paymentMode" }, { value: mode }, { upsert: true });
    if (upiId || qrImage || whatsappNo) {
      await Settings.findOneAndUpdate({ key: "upiDetails" }, { value: { upiId, qrImage, whatsappNo } }, { upsert: true });
    }
    if (form80gUrl !== undefined) {
      await Settings.findOneAndUpdate({ key: "form80gUrl" }, { value: form80gUrl }, { upsert: true });
    }
    res.json({ message: "Settings updated." });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Get tier perks (admin)
router.get("/admin/tier-perks", async (req, res) => {
  try {
    if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    const setting = await Settings.findOne({ key: "tierPerks" });
    res.json(setting?.value || { platinum: [], gold: [], silver: [], bronze: [] });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Update tier perks (admin)
router.post("/admin/tier-perks", async (req, res) => {
  try {
    if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    const { perks } = req.body;
    await Settings.findOneAndUpdate({ key: "tierPerks" }, { value: perks }, { upsert: true });
    res.json({ message: "Tier perks updated." });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Record manual donation (admin — for UPI/QR payments)
router.post("/admin/manual-donation", async (req, res) => {
  try {
    if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    const { campaignId, donorName, donorEmail, amount, transactionId } = req.body;
    if (!campaignId || !donorName || !amount) return res.status(400).json({ error: "Campaign, name, and amount are required." });

    await Donation.create({
      campaignId,
      donorName: donorName.replace(/<[^>]*>/g, "").trim(),
      donorEmail: donorEmail || "",
      amount: Number(amount),
      orderId: transactionId || `manual_${Date.now()}`,
      paymentId: "manual",
      status: "paid",
    });

    await Campaign.findByIdAndUpdate(campaignId, { $inc: { collectedAmount: Number(amount) } });

    res.json({ message: "Donation recorded." });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Get pending UPI donations (admin)
router.get("/admin/pending-donations", async (req, res) => {
  try {
    if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    const donations = await Donation.find({ status: "created", paymentId: "upi_pending" })
      .sort({ createdAt: -1 })
      .populate("campaignId", "title");
    res.json(donations);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Approve pending UPI donation (admin)
router.post("/admin/approve-donation/:id", async (req, res) => {
  try {
    if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    const donation = await Donation.findOneAndUpdate(
      { _id: req.params.id, status: "created", paymentId: "upi_pending" },
      { status: "paid", paymentId: "upi_approved" },
      { new: true }
    );
    if (!donation) return res.status(404).json({ error: "Donation not found or already approved." });

    await Campaign.findByIdAndUpdate(donation.campaignId, { $inc: { collectedAmount: donation.amount } });

    if (donation.donorEmail) {
      const { sendDonationReceipt } = require("../utils/mailer");
      const campaign = await Campaign.findById(donation.campaignId);
      sendDonationReceipt({
        donorName: donation.donorName,
        donorEmail: donation.donorEmail,
        amount: donation.amount,
        campaignTitle: campaign?.title || "Campaign",
        paymentId: "UPI Payment",
      });
    }

    res.json({ message: "Donation approved." });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Reject/delete pending UPI donation (admin)
router.delete("/admin/reject-donation/:id", async (req, res) => {
  try {
    if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    const donation = await Donation.findOneAndDelete({ _id: req.params.id, status: "created", paymentId: "upi_pending" });
    if (!donation) return res.status(404).json({ error: "Donation not found." });
    res.json({ message: "Donation rejected." });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Delete any paid donation and deduct from campaign (admin)
router.delete("/admin/donation/:id", async (req, res) => {
  try {
    if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    const donation = await Donation.findByIdAndDelete(req.params.id);
    if (!donation) return res.status(404).json({ error: "Donation not found." });

    if (donation.status === "paid") {
      await Campaign.findByIdAndUpdate(donation.campaignId, { $inc: { collectedAmount: -donation.amount } });
    }
    res.json({ message: "Donation deleted." });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Update campaign collected amount manually (admin)
router.patch("/admin/campaign/:id/amount", async (req, res) => {
  try {
    if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    const { collectedAmount } = req.body;
    if (collectedAmount === undefined || collectedAmount < 0) return res.status(400).json({ error: "Invalid amount." });

    const campaign = await Campaign.findByIdAndUpdate(req.params.id, { collectedAmount: Number(collectedAmount) }, { new: true });
    if (!campaign) return res.status(404).json({ error: "Campaign not found." });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong." });
  }
});

module.exports = router;
