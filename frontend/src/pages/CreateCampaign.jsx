import { useState } from "react";
import api from "../api";
import { useToast } from "../components/Toast";

export default function CreateCampaign() {
  const toast = useToast();
  const [form, setForm] = useState({ title: "", description: "", image: "", images: [], targetAmount: "", shareMessage: "" });
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [adminPw, setAdminPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [donorFilter, setDonorFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", image: "", targetAmount: "" });
  const [editAmountId, setEditAmountId] = useState(null);
  const [editAmountVal, setEditAmountVal] = useState("");
  const [viewDonorsId, setViewDonorsId] = useState(null);
  const [viewDonorsList, setViewDonorsList] = useState([]);
  const [tab, setTab] = useState("campaigns");
  const [payMode, setPayMode] = useState("cashfree");
  const [upiId, setUpiId] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [whatsappNo, setWhatsappNo] = useState("");
  const [form80gUrl, setForm80gUrl] = useState("");
  const [saved80gUrl, setSaved80gUrl] = useState("");
  const [editing80g, setEditing80g] = useState(false);
  const [confirmDeleteUpi, setConfirmDeleteUpi] = useState(false);
  const [confirmDelete80g, setConfirmDelete80g] = useState(false);
  const [editingUpi, setEditingUpi] = useState(false);
  const [manualDonation, setManualDonation] = useState({ campaignId: "", donorName: "", donorEmail: "", amount: "", transactionId: "" });
  const [pendingDonations, setPendingDonations] = useState([]);
  const [tierPerks, setTierPerks] = useState({ platinum: [], gold: [], silver: [], bronze: [] });
  const [editingTierPerks, setEditingTierPerks] = useState(false);
  const [perkInput, setPerkInput] = useState({ platinum: "", gold: "", silver: "", bronze: "" });

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const headers = { "x-admin-password": adminPw };

  const fetchCampaigns = () => {
    api.get("/admin/campaigns", { headers }).then(({ data }) => setCampaigns(data));
  };

  const fetchAnalytics = () => {
    api.get("/admin/analytics", { headers }).then(({ data }) => setAnalytics(data));
  };

  const fetchSettings = () => {
    api.get("/settings/payment-mode").then(({ data }) => {
      setPayMode(data.mode);
      setUpiId(data.upiId);
      setQrImage(data.qrImage);
      setWhatsappNo(data.whatsappNo);
      setForm80gUrl(data.form80gUrl);
      setSaved80gUrl(data.form80gUrl);
    });
  };

  const switchPaymentMode = async (mode) => {
    try {
      await api.post("/admin/settings/payment-mode", { mode }, { headers });
      setPayMode(mode);
      toast.success(`Payment mode: ${mode === "upi" ? "UPI/QR" : "Cashfree"}`);
    } catch { toast.error("Failed to update."); }
  };

  const saveUpiDetails = async () => {
    try {
      await api.post("/admin/settings/payment-mode", { mode: payMode, upiId, qrImage, whatsappNo, form80gUrl }, { headers });
      toast.success("UPI details saved.");
    } catch { toast.error("Failed to save."); }
  };

  const save80gUrl = async () => {
    try {
      await api.post("/admin/settings/payment-mode", { mode: payMode, upiId, qrImage, whatsappNo, form80gUrl }, { headers });
      setSaved80gUrl(form80gUrl);
      toast.success("80G URL saved.");
    } catch { toast.error("Failed to save."); }
  };

  const deleteUpiDetails = async () => {
    try {
      await api.post("/admin/settings/payment-mode", { mode: payMode, upiId: "", qrImage: "", whatsappNo: "", form80gUrl }, { headers });
      setUpiId(""); setQrImage(""); setWhatsappNo(""); setConfirmDeleteUpi(false);
      toast.success("UPI details deleted.");
    } catch { toast.error("Failed to delete."); }
  };

  const delete80gUrl = async () => {
    try {
      await api.post("/admin/settings/payment-mode", { mode: payMode, upiId, qrImage, whatsappNo, form80gUrl: "" }, { headers });
      setForm80gUrl(""); setSaved80gUrl(""); setConfirmDelete80g(false);
      toast.success("80G form URL deleted.");
    } catch { toast.error("Failed to delete."); }
  };

  const recordManualDonation = async () => {
    const { campaignId, donorName, amount } = manualDonation;
    if (!campaignId || !donorName || !amount) { toast.error("Campaign, name, and amount are required."); return; }
    try {
      await api.post("/admin/manual-donation", manualDonation, { headers });
      setManualDonation({ campaignId: "", donorName: "", donorEmail: "", amount: "", transactionId: "" });
      fetchCampaigns();
      toast.success("Donation recorded!");
    } catch (err) { toast.error(err.response?.data?.error || "Failed."); }
  };

  const fetchPendingDonations = () => {
    api.get("/admin/pending-donations", { headers }).then(({ data }) => setPendingDonations(data)).catch(() => {});
  };

  const approveDonation = async (id) => {
    try {
      await api.post(`/admin/approve-donation/${id}`, {}, { headers });
      fetchPendingDonations(); fetchCampaigns();
      toast.success("Donation approved!");
    } catch { toast.error("Failed to approve."); }
  };

  const rejectDonation = async (id) => {
    try {
      await api.delete(`/admin/reject-donation/${id}`, { headers });
      fetchPendingDonations();
      toast.success("Donation rejected.");
    } catch { toast.error("Failed to reject."); }
  };

  const fetchTierPerks = () => {
    api.get("/admin/tier-perks", { headers }).then(({ data }) => setTierPerks(data)).catch(() => {});
  };

  const saveTierPerks = async () => {
    try {
      await api.post("/admin/tier-perks", { perks: tierPerks }, { headers });
      setEditingTierPerks(false);
      toast.success("Tier perks updated!");
    } catch { toast.error("Failed to save perks."); }
  };

  const addPerk = (tier) => {
    const val = perkInput[tier].trim();
    if (!val) return;
    setTierPerks((p) => ({ ...p, [tier]: [...p[tier], val] }));
    setPerkInput((p) => ({ ...p, [tier]: "" }));
  };

  const removePerk = (tier, idx) => {
    setTierPerks((p) => ({ ...p, [tier]: p[tier].filter((_, i) => i !== idx) }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!adminPw.trim()) { setAuthError("Enter admin password."); return; }
    try {
      await api.get("/admin/campaigns", { headers: { "x-admin-password": adminPw } }).then(({ data }) => {
        setCampaigns(data);
        setAuthed(true);
        setAuthError("");
        fetchAnalytics();
        fetchSettings();
      });
    } catch { setAuthError("Wrong admin password."); }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("image", file);
        const { data } = await api.post("/admin/upload", formData, {
          headers: { ...headers, "Content-Type": "multipart/form-data" },
        });
        urls.push(data.url);
      }
      // First image becomes the cover
      setForm((f) => {
        const newImages = [...f.images, ...urls];
        return { ...f, images: newImages, image: newImages[0] };
      });
    } catch { toast.error("Image upload failed."); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const removeImage = (idx) => {
    setForm((f) => {
      const newImages = f.images.filter((_, i) => i !== idx);
      return { ...f, images: newImages, image: newImages[0] || "" };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.image || !form.targetAmount) {
      setError("All fields are required."); return;
    }
    setLoading(true); setError("");
    try {
      await api.post("/campaign", { ...form, adminPassword: adminPw, targetAmount: Number(form.targetAmount) });
      setForm({ title: "", description: "", image: "", images: [], targetAmount: "", shareMessage: "" });
      setImageUrl("");
      fetchCampaigns();
      toast.success("Campaign created successfully!");
    } catch (err) { setError(err.response?.data?.error || "Failed."); }
    finally { setLoading(false); }
  };

  const toggleHide = async (id) => {
    try { await api.patch(`/campaign/${id}/toggle-hide`, { adminPassword: adminPw }); fetchCampaigns(); toast.success("Visibility updated."); }
    catch (err) { toast.error(err.response?.data?.error || "Failed."); }
  };

  const deleteCampaign = async (id) => {
    try { await api.delete(`/campaign/${id}`, { data: { adminPassword: adminPw } }); setConfirmDelete(null); fetchCampaigns(); toast.success("Campaign deleted."); }
    catch (err) { toast.error(err.response?.data?.error || "Failed."); }
  };

  const startEdit = (c) => {
    setEditingId(c._id);
    setEditForm({ title: c.title, description: c.description, image: c.image, targetAmount: String(c.targetAmount) });
  };

  const saveEdit = async () => {
    try {
      await api.put(`/campaign/${editingId}`, { ...editForm, adminPassword: adminPw, targetAmount: Number(editForm.targetAmount) });
      setEditingId(null);
      fetchCampaigns();
      toast.success("Campaign updated.");
    } catch (err) { toast.error(err.response?.data?.error || "Failed to update."); }
  };

  const updateCampaignAmount = async (id) => {
    try {
      await api.patch(`/admin/campaign/${id}/amount`, { collectedAmount: Number(editAmountVal) }, { headers });
      setEditAmountId(null); setEditAmountVal("");
      fetchCampaigns();
      toast.success("Amount updated.");
    } catch { toast.error("Failed to update amount."); }
  };

  const loadDonors = async (campaignId) => {
    if (viewDonorsId === campaignId) { setViewDonorsId(null); return; }
    try {
      const { data } = await api.get(`/admin/donors/${campaignId}`, { headers });
      setViewDonorsList(data.donors);
      setViewDonorsId(campaignId);
    } catch { toast.error("Failed to load donors."); }
  };

  const deleteDonation = async (donationId) => {
    try {
      await api.delete(`/admin/donation/${donationId}`, { headers });
      loadDonors(viewDonorsId);
      fetchCampaigns();
      toast.success("Donation deleted.");
    } catch { toast.error("Failed to delete."); }
  };

  const downloadDonors = async (campaignId) => {
    try {
      const { data } = await api.get(`/admin/donors/${campaignId}`, { headers });
      const { campaign, donors } = data;
      if (!donors.length) { toast.info("No donors for this campaign."); return; }
      const csvHeaders = ["S.No", "Donor Name", "Email", "Amount (₹)", "Payment ID", "Order ID", "Date"];
      const rows = donors.map((d, i) => [i + 1, d.donorName, d.donorEmail || "", d.amount, d.paymentId || "", d.orderId, new Date(d.createdAt).toLocaleDateString("en-IN")]);
      const csv = [csvHeaders, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${campaign.replace(/[^a-zA-Z0-9]/g, "_")}_donors.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Download failed."); }
  };

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto mt-10">
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-amber-100">
          <div className="bg-gradient-to-r from-amber-700 to-amber-800 px-6 py-4">
            <h1 className="text-lg font-serif font-bold text-white">🔒 Admin Login</h1>
          </div>
          <form onSubmit={handleLogin} className="p-5 space-y-3">
            <input type="password" value={adminPw} onChange={(e) => setAdminPw(e.target.value)} placeholder="Enter admin password"
              className="w-full px-3 py-2.5 border border-amber-200 rounded-lg bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-amber-300" />
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all shadow-md">
              Enter Admin Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["campaigns", "settings", "tiers", "analytics"].map((t) => (
          <button key={t} onClick={() => { setTab(t); if (t === "analytics" || t === "tiers") fetchAnalytics(); if (t === "tiers") fetchTierPerks(); if (t === "settings") { fetchSettings(); fetchPendingDonations(); } }}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              tab === t ? "bg-amber-700 text-white shadow-md" : "bg-white text-amber-700 border border-amber-200 hover:bg-amber-50"
            }`}>
            {t === "campaigns" ? "📋 Campaigns" : t === "settings" ? "⚙️ Settings" : t === "tiers" ? "🏅 Donor Tiers" : "📊 Analytics"}
          </button>
        ))}
      </div>

      {tab === "campaigns" && (
        <>
          {/* Create Campaign */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-amber-100">
            <div className="bg-gradient-to-r from-amber-700 to-amber-800 px-6 py-3">
              <h1 className="font-serif font-bold text-white">Create New Campaign</h1>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">Title</label>
                <input type="text" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Janmashtami Mahotsav 2026"
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-amber-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe the seva..."
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-amber-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">Campaign Images</label>
                <div className="flex gap-2 items-center">
                  <label className={`px-4 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-all ${
                    uploading ? "bg-amber-100 text-amber-400 border-amber-200" : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  }`}>
                    {uploading ? "Uploading..." : "📷 Upload Images"}
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                  <span className="text-amber-400 text-xs">or</span>
                  <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Paste image URL + press Enter"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const url = imageUrl.trim();
                        if (url && !form.images.includes(url)) {
                          setForm((f) => ({ ...f, images: [...f.images, url], image: f.images.length === 0 ? url : f.image }));
                          setImageUrl("");
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-amber-200 rounded-lg bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-amber-300 text-sm" />
                </div>
                {form.images.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {form.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={img} alt={`Image ${idx + 1}`} className="h-20 w-20 rounded-lg object-cover border border-amber-200" />
                        <button type="button" onClick={() => removeImage(idx)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                        {idx === 0 && <span className="absolute bottom-0.5 left-0.5 bg-[#D35400] text-white text-[8px] px-1 rounded">Cover</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">Target Amount (₹)</label>
                <input type="number" min="1" value={form.targetAmount} onChange={(e) => update("targetAmount", e.target.value)} placeholder="e.g. 500000"
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-amber-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">WhatsApp Share Message <span className="text-amber-400 font-normal">(optional)</span></label>
                <textarea rows={3} value={form.shareMessage} onChange={(e) => update("shareMessage", e.target.value)}
                  placeholder="Custom message for WhatsApp sharing. Use {title}, {link}, {raised}, {goal} as placeholders. Leave empty for default."
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-amber-300 text-sm" />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 transition-all shadow-md">
                {loading ? "Creating..." : "Create Campaign"}
              </button>
            </form>
          </div>

          {/* Manage Campaigns */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-amber-100">
            <div className="bg-gradient-to-r from-amber-700 to-amber-800 px-6 py-3 flex justify-between items-center">
              <h2 className="font-serif font-bold text-white">Manage Campaigns</h2>
              <span className="text-amber-200/70 text-sm">{campaigns.length} total</span>
            </div>
            <div className="divide-y divide-amber-50">
              {!campaigns.length && <p className="text-amber-400 text-center py-6">No campaigns yet.</p>}
              {campaigns.map((c) => {
                const progress = Math.min((c.collectedAmount / c.targetAmount) * 100, 100);
                const completed = c.collectedAmount >= c.targetAmount;
                return (
                  <div key={c._id} className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <img src={c.image} alt={c.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-amber-900 truncate">{c.title}</h3>
                          {c.hidden && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-medium">Hidden</span>}
                          {completed && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded font-medium">Completed</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-amber-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-xs text-amber-500">{progress.toFixed(0)}%</span>
                        </div>
                        <p className="text-xs text-amber-600/70 mt-0.5">₹{c.collectedAmount.toLocaleString("en-IN")} / ₹{c.targetAmount.toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 ml-20 flex-wrap">
                      <button onClick={() => downloadDonors(c._id)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 transition">📥 Donors CSV</button>
                      <button onClick={() => startEdit(c)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition">✏️ Edit</button>
                      <button onClick={() => toggleHide(c._id)} className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${c.hidden ? "border-green-300 text-green-700 hover:bg-green-50" : "border-amber-300 text-amber-700 hover:bg-amber-50"}`}>
                        {c.hidden ? "👁 Show" : "🙈 Hide"}
                      </button>
                      {confirmDelete === c._id ? (
                        <div className="flex gap-1.5 items-center">
                          <span className="text-xs text-red-600">Sure?</span>
                          <button onClick={() => deleteCampaign(c._id)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition">Yes</button>
                          <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(c._id)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition">🗑 Delete</button>
                      )}
                    </div>

                    {/* Inline Edit Form */}
                    {editingId === c._id && (
                      <div className="mt-3 ml-20 p-4 bg-indigo-50 rounded-xl border border-indigo-200 space-y-2">
                        <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          placeholder="Title" className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        <textarea rows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          placeholder="Description" className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        <input type="url" value={editForm.image} onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                          placeholder="Image URL" className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        <input type="number" min="1" value={editForm.targetAmount} onChange={(e) => setEditForm({ ...editForm, targetAmount: e.target.value })}
                          placeholder="Target Amount" className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="px-4 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition">Save</button>
                          <button onClick={() => setEditingId(null)} className="px-4 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {tab === "settings" && (
        <div className="space-y-6">
          {/* Payment Mode Toggle */}
          <div className="bg-white rounded-2xl shadow-md p-5 border border-amber-100">
            <h3 className="font-serif font-bold text-amber-900 mb-4">💳 Payment Mode</h3>
            <div className="flex gap-3">
              <button onClick={() => switchPaymentMode("cashfree")}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${payMode === "cashfree" ? "bg-[#D35400] text-white shadow-md" : "bg-[#FDF2E9] text-[#D35400] border border-[#E8DCCF]"}`}>
                💳 Cashfree
              </button>
              <button onClick={() => switchPaymentMode("upi")}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${payMode === "upi" ? "bg-[#D35400] text-white shadow-md" : "bg-[#FDF2E9] text-[#D35400] border border-[#E8DCCF]"}`}>
                📱 UPI / QR
              </button>
            </div>
          </div>

          {/* UPI Settings */}
          {payMode === "upi" && (
            <div className="bg-white rounded-2xl shadow-md p-5 border border-amber-100 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-serif font-bold text-amber-900">📱 UPI Details</h3>
                {upiId && !editingUpi && (
                  <div className="flex gap-2">
                    <button onClick={() => setEditingUpi(true)} className="text-xs text-[#D35400] font-medium hover:underline">✏️ Edit</button>
                    {confirmDeleteUpi ? (
                      <div className="flex gap-1.5 items-center">
                        <span className="text-xs text-red-500">Sure?</span>
                        <button onClick={deleteUpiDetails} className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">Yes</button>
                        <button onClick={() => setConfirmDeleteUpi(false)} className="text-xs border border-gray-300 text-gray-500 px-2 py-0.5 rounded">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteUpi(true)} className="text-xs text-red-500 font-medium hover:underline">🗑 Delete</button>
                    )}
                  </div>
                )}
              </div>

              {/* Preview Mode */}
              {upiId && !editingUpi ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-[#FDF2E9] rounded-xl p-3">
                    {qrImage && <img src={qrImage} alt="QR" className="w-20 h-20 rounded-lg border border-[#E8DCCF] object-contain" />}
                    <div className="space-y-1">
                      <div>
                        <p className="text-xs text-[#5D6D7E]">UPI ID</p>
                        <p className="font-semibold text-[#D35400]">{upiId}</p>
                      </div>
                      {whatsappNo && (
                        <div>
                          <p className="text-xs text-[#5D6D7E]">WhatsApp</p>
                          <p className="font-semibold text-[#D35400] text-sm">+{whatsappNo}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Edit Mode */
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-amber-800 mb-1">UPI ID</label>
                    <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="e.g. inspiremanit@upi"
                      className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-amber-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-800 mb-1">QR Code Image URL</label>
                    <input type="url" value={qrImage} onChange={(e) => setQrImage(e.target.value)} placeholder="Upload QR to Cloudinary and paste URL"
                      className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-amber-300" />
                    {qrImage && <img src={qrImage} alt="QR Preview" className="mt-2 h-32 rounded-lg border border-amber-200" />}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-800 mb-1">WhatsApp Number (with country code)</label>
                    <input type="text" value={whatsappNo} onChange={(e) => setWhatsappNo(e.target.value)} placeholder="e.g. 917692932955"
                      className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-amber-300" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { saveUpiDetails(); setEditingUpi(false); }}
                      className="flex-1 py-2.5 bg-[#D35400] text-white font-bold rounded-xl hover:bg-[#B94500] transition-all">
                      Save
                    </button>
                    {upiId && (
                      <button onClick={() => setEditingUpi(false)}
                        className="px-4 py-2.5 border border-[#E8DCCF] text-[#5D6D7E] font-medium rounded-xl hover:bg-[#FDF2E9] transition-all">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 80G Form URL */}
          <div className="bg-white rounded-2xl shadow-md p-5 border border-amber-100 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-serif font-bold text-amber-900">🏛️ 80G Tax Receipt Form</h3>
              {saved80gUrl && !editing80g && (
                <div className="flex gap-2">
                  <button onClick={() => setEditing80g(true)} className="text-xs text-[#D35400] font-medium hover:underline">✏️ Edit</button>
                  {confirmDelete80g ? (
                    <div className="flex gap-1.5 items-center">
                      <span className="text-xs text-red-500">Sure?</span>
                      <button onClick={delete80gUrl} className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">Yes</button>
                      <button onClick={() => setConfirmDelete80g(false)} className="text-xs border border-gray-300 text-gray-500 px-2 py-0.5 rounded">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete80g(true)} className="text-xs text-red-500 font-medium hover:underline">🗑 Delete</button>
                  )}
                </div>
              )}
            </div>

            {saved80gUrl && !editing80g ? (
              <div className="bg-[#FDF2E9] rounded-xl p-3">
                <p className="text-xs text-[#5D6D7E] mb-1">Form URL</p>
                <a href={saved80gUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#D35400] font-medium hover:underline break-all">{saved80gUrl}</a>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-[#5D6D7E]">Link shown to donors after payment for claiming tax exemption. Leave empty to hide.</p>
                <input type="url" value={form80gUrl} onChange={(e) => setForm80gUrl(e.target.value)}
                  placeholder="e.g. https://forms.google.com/..."
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-amber-300" />
                <div className="flex gap-2">
                  <button onClick={() => { save80gUrl(); setEditing80g(false); }}
                    className="flex-1 py-2.5 bg-[#D35400] text-white font-bold rounded-xl hover:bg-[#B94500] transition-all">
                    Save
                  </button>
                  {form80gUrl && (
                    <button onClick={() => { setEditing80g(false); fetchSettings(); }}
                      className="px-4 py-2.5 border border-[#E8DCCF] text-[#5D6D7E] font-medium rounded-xl hover:bg-[#FDF2E9] transition-all">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pending UPI Donations */}
          <div className="bg-white rounded-2xl shadow-md p-5 border border-amber-100 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-serif font-bold text-amber-900">⏳ Pending UPI Donations</h3>
              {pendingDonations.length > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">{pendingDonations.length}</span>
              )}
            </div>
            {!pendingDonations.length ? (
              <p className="text-[#5D6D7E] text-sm text-center py-3">No pending donations.</p>
            ) : (
              <div className="space-y-2">
                {pendingDonations.map((d) => (
                  <div key={d._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <div>
                      <p className="font-medium text-amber-900">{d.donorName} — <span className="text-[#D35400] font-bold">₹{d.amount.toLocaleString("en-IN")}</span></p>
                      <p className="text-xs text-[#5D6D7E]">{d.campaignId?.title || "Campaign"} · {new Date(d.createdAt).toLocaleString("en-IN")}</p>
                      {d.donorEmail && <p className="text-xs text-[#5D6D7E]">✉️ {d.donorEmail}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => approveDonation(d._id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500 text-white hover:bg-green-600 transition">✅ Approve</button>
                      <button onClick={() => rejectDonation(d._id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition">❌ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manual Donation Entry — for offline/cash donations */}
          <div className="bg-white rounded-2xl shadow-md p-5 border border-amber-100 space-y-3">
            <h3 className="font-serif font-bold text-amber-900 mb-2">✍️ Record Offline Donation</h3>
            <p className="text-xs text-[#5D6D7E]">For cash or other offline donations not captured automatically.</p>
            <select value={manualDonation.campaignId} onChange={(e) => setManualDonation({ ...manualDonation, campaignId: e.target.value })}
              className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="">Select Campaign</option>
              {campaigns.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
            <input type="text" value={manualDonation.donorName} onChange={(e) => setManualDonation({ ...manualDonation, donorName: e.target.value })}
              placeholder="Donor Name" className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-amber-300" />
            <input type="email" value={manualDonation.donorEmail} onChange={(e) => setManualDonation({ ...manualDonation, donorEmail: e.target.value })}
              placeholder="Donor Email (optional)" className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-amber-300" />
            <input type="number" min="1" value={manualDonation.amount} onChange={(e) => setManualDonation({ ...manualDonation, amount: e.target.value })}
              placeholder="Amount (₹)" className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-amber-300" />
            <input type="text" value={manualDonation.transactionId} onChange={(e) => setManualDonation({ ...manualDonation, transactionId: e.target.value })}
              placeholder="UPI Transaction ID (optional)" className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-amber-300" />
            <button onClick={recordManualDonation}
              className="w-full py-2.5 bg-[#D35400] text-white font-bold rounded-xl hover:bg-[#B94500] transition-all">
              Record Donation
            </button>
          </div>
        </div>
      )}

      {tab === "tiers" && analytics && (
        <div className="space-y-6">
          {(() => {
            const tiers = [
              { badge: "🏆", label: "Platinum", color: "border-purple-300 bg-purple-50", textColor: "text-purple-700", min: 100001 },
              { badge: "🥇", label: "Gold", color: "border-yellow-300 bg-yellow-50", textColor: "text-yellow-700", min: 51001 },
              { badge: "🥈", label: "Silver", color: "border-gray-300 bg-gray-50", textColor: "text-gray-700", min: 21001 },
              { badge: "🥉", label: "Bronze", color: "border-orange-300 bg-orange-50", textColor: "text-orange-700", min: 5001 },
            ];
            const allDonors = analytics.topDonors.map((d) => ({ name: d._id, amount: d.totalAmount, count: d.count }));

            return tiers.map((tier) => {
              const tierDonors = allDonors.filter((d) => {
                const nextTier = tiers[tiers.indexOf(tier) - 1];
                return d.amount >= tier.min && (!nextTier || d.amount < nextTier.min);
              });

              return (
                <div key={tier.label} className={`rounded-2xl shadow-md border p-5 ${tier.color}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className={`font-serif font-bold text-lg ${tier.textColor}`}>
                      {tier.badge} {tier.label} Donors
                    </h3>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${tier.color} ${tier.textColor}`}>
                      ₹{tier.min.toLocaleString("en-IN")}+
                    </span>
                  </div>
                  {tierDonors.length ? (
                    <div className="space-y-2">
                      {tierDonors.map((d) => (
                        <div key={d.name} className="flex items-center justify-between py-2 px-3 bg-white/70 rounded-xl">
                          <div>
                            <span className={`font-medium ${tier.textColor}`}>{d.name}</span>
                            <span className="text-gray-400 text-xs ml-2">({d.count} donation{d.count > 1 ? "s" : ""})</span>
                          </div>
                          <span className={`font-bold ${tier.textColor}`}>₹{d.amount.toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm text-center py-3">No donors in this tier yet.</p>
                  )}
                </div>
              );
            });
          })()}

          {/* Tier Perks */}
          <div className="bg-white rounded-2xl shadow-md p-5 border border-amber-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif font-bold text-amber-900">🎁 Tier Perks</h3>
              {!editingTierPerks ? (
                <button onClick={() => setEditingTierPerks(true)} className="text-xs text-[#D35400] font-medium hover:underline">✏️ Edit Perks</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={saveTierPerks} className="text-xs bg-[#D35400] text-white px-3 py-1 rounded-lg hover:bg-[#B94500]">Save</button>
                  <button onClick={() => { setEditingTierPerks(false); fetchTierPerks(); }} className="text-xs border border-gray-300 text-gray-500 px-3 py-1 rounded-lg hover:bg-gray-50">Cancel</button>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {[
                { key: "platinum", badge: "🏆", label: "Platinum", color: "border-purple-200 bg-purple-50", textColor: "text-purple-700" },
                { key: "gold", badge: "🥇", label: "Gold", color: "border-yellow-200 bg-yellow-50", textColor: "text-yellow-700" },
                { key: "silver", badge: "🥈", label: "Silver", color: "border-gray-200 bg-gray-50", textColor: "text-gray-600" },
                { key: "bronze", badge: "🥉", label: "Bronze", color: "border-orange-200 bg-orange-50", textColor: "text-orange-700" },
              ].map((t) => (
                <div key={t.key} className={`rounded-xl border p-3 ${t.color}`}>
                  <p className={`font-semibold text-sm mb-2 ${t.textColor}`}>{t.badge} {t.label} Perks</p>
                  {tierPerks[t.key]?.length > 0 ? (
                    <ul className="space-y-1">
                      {tierPerks[t.key].map((perk, idx) => (
                        <li key={idx} className="flex items-center justify-between text-sm text-gray-700">
                          <span>• {perk}</span>
                          {editingTierPerks && (
                            <button onClick={() => removePerk(t.key, idx)} className="text-red-400 hover:text-red-600 text-xs ml-2">✕</button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-xs">{editingTierPerks ? "Add perks below" : "No perks added yet"}</p>
                  )}
                  {editingTierPerks && (
                    <div className="flex gap-2 mt-2">
                      <input type="text" value={perkInput[t.key]} onChange={(e) => setPerkInput((p) => ({ ...p, [t.key]: e.target.value }))}
                        placeholder="e.g. Priority darshan"
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPerk(t.key); } }}
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400" />
                      <button onClick={() => addPerk(t.key)} className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Add</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl shadow-md p-5 border border-amber-100">
            <h3 className="font-serif font-bold text-amber-900 mb-3">📊 Tier Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { badge: "🏆", label: "Platinum", min: 100001, color: "text-purple-700" },
                { badge: "🥇", label: "Gold", min: 51001, color: "text-yellow-700" },
                { badge: "🥈", label: "Silver", min: 21001, color: "text-gray-600" },
                { badge: "🥉", label: "Bronze", min: 5001, color: "text-orange-700" },
              ].map((t) => {
                const count = analytics.topDonors.filter((d) => {
                  const tiers = [100001, 51001, 21001, 5001];
                  const idx = tiers.indexOf(t.min);
                  return d.totalAmount >= t.min && (idx === 0 || d.totalAmount < tiers[idx - 1]);
                }).length;
                return (
                  <div key={t.label} className="text-center p-3 bg-amber-50 rounded-xl">
                    <p className="text-2xl">{t.badge}</p>
                    <p className={`font-bold text-lg ${t.color}`}>{count}</p>
                    <p className="text-xs text-gray-500">{t.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "tiers" && !analytics && (
        <div className="text-center py-20 text-amber-400">Loading donor tiers...</div>
      )}

      {tab === "analytics" && analytics && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-amber-100 text-center shadow-sm">
              <p className="text-3xl font-bold text-amber-800">₹{analytics.total.totalAmount.toLocaleString("en-IN")}</p>
              <p className="text-xs text-amber-500 mt-1 uppercase tracking-wider">Total Collected</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-amber-100 text-center shadow-sm">
              <p className="text-3xl font-bold text-amber-800">{analytics.total.totalDonors}</p>
              <p className="text-xs text-amber-500 mt-1 uppercase tracking-wider">Total Donations</p>
            </div>
          </div>

          {/* Daily Trend */}
          <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
            <h3 className="font-serif font-bold text-amber-900 mb-4">📈 Daily Donations (Last 30 Days)</h3>
            {analytics.dailyDonations.length ? (
              <div className="space-y-2">
                {analytics.dailyDonations.map((d) => {
                  const maxAmt = Math.max(...analytics.dailyDonations.map((x) => x.amount));
                  const pct = (d.amount / maxAmt) * 100;
                  return (
                    <div key={d._id} className="flex items-center gap-3">
                      <span className="text-xs text-amber-500 w-20 flex-shrink-0">{d._id.slice(5)}</span>
                      <div className="flex-1 bg-amber-50 rounded-full h-5 overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-5 rounded-full flex items-center justify-end pr-2 transition-all" style={{ width: `${pct}%` }}>
                          <span className="text-[10px] text-white font-bold">{d.count}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-700 w-20 text-right">₹{d.amount.toLocaleString("en-IN")}</span>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-amber-400 text-sm">No donations in the last 30 days.</p>}
          </div>

          {/* Top Campaigns */}
          <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
            <h3 className="font-serif font-bold text-amber-900 mb-3">🏛️ Top Campaigns</h3>
            <div className="space-y-2">
              {analytics.topCampaigns.map((c, i) => (
                <div key={c._id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-amber-50 transition">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold text-sm">#{i + 1}</span>
                    <span className="text-amber-900 font-medium">{c.title}</span>
                  </div>
                  <span className="text-amber-700 font-bold text-sm">₹{c.collectedAmount.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Donors with Campaign Filter */}
          <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="font-serif font-bold text-amber-900">🏆 Top Donors</h3>
              <select
                value={donorFilter}
                onChange={(e) => setDonorFilter(e.target.value)}
                className="px-3 py-2 border border-amber-200 rounded-lg bg-amber-50/50 text-sm text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="all">All Campaigns</option>
                {(analytics.topCampaigns || []).map((c) => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              {(donorFilter === "all"
                ? analytics.topDonors.map((d) => ({ name: d._id, amount: d.totalAmount, count: d.count }))
                : (analytics.donorsByCampaign?.find((c) => c.campaignId === donorFilter)?.donors || []).map((d) => ({ name: d._id, amount: d.totalAmount, count: d.count }))
              ).map((d, i) => {
                const tier = d.amount >= 100001 ? { badge: "🏆", label: "Platinum", color: "bg-purple-100 text-purple-700 border-purple-200" }
                  : d.amount >= 51001 ? { badge: "🥇", label: "Gold", color: "bg-yellow-100 text-yellow-700 border-yellow-200" }
                  : d.amount >= 21001 ? { badge: "🥈", label: "Silver", color: "bg-gray-100 text-gray-600 border-gray-200" }
                  : d.amount >= 5001 ? { badge: "🥉", label: "Bronze", color: "bg-orange-100 text-orange-700 border-orange-200" }
                  : null;
                return (
                <div key={d.name} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-amber-50 transition">
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-amber-50 text-amber-500"
                    }`}>{i + 1}</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-amber-900 font-medium">{d.name}</span>
                      {tier && <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${tier.color}`}>{tier.badge} {tier.label}</span>}
                      {d.count > 1 && <span className="text-amber-400 text-xs">({d.count} donations)</span>}
                    </div>
                  </div>
                  <span className="text-amber-700 font-bold">₹{d.amount.toLocaleString("en-IN")}</span>
                </div>
                );
              })}
              {donorFilter !== "all" && !(analytics.donorsByCampaign?.find((c) => c.campaignId === donorFilter)?.donors?.length) && (
                <p className="text-amber-400 text-sm text-center py-3">No donors for this campaign.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "analytics" && !analytics && (
        <div className="text-center py-20 text-amber-400">Loading analytics...</div>
      )}
    </div>
  );
}
