import { useState } from "react";
import api from "../api";
import { useToast } from "../components/Toast";

export default function CreateCampaign() {
  const toast = useToast();
  const [form, setForm] = useState({ title: "", description: "", image: "", targetAmount: "" });
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
  const [tab, setTab] = useState("campaigns"); // campaigns | analytics

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const headers = { "x-admin-password": adminPw };

  const fetchCampaigns = () => {
    api.get("/admin/campaigns", { headers }).then(({ data }) => setCampaigns(data));
  };

  const fetchAnalytics = () => {
    api.get("/admin/analytics", { headers }).then(({ data }) => setAnalytics(data));
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
      });
    } catch { setAuthError("Wrong admin password."); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await api.post("/admin/upload", formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      update("image", data.url);
    } catch { toast.error("Image upload failed."); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.image || !form.targetAmount) {
      setError("All fields are required."); return;
    }
    setLoading(true); setError("");
    try {
      await api.post("/campaign", { ...form, adminPassword: adminPw, targetAmount: Number(form.targetAmount) });
      setForm({ title: "", description: "", image: "", targetAmount: "" });
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
      <div className="flex gap-2">
        {["campaigns", "analytics"].map((t) => (
          <button key={t} onClick={() => { setTab(t); if (t === "analytics") fetchAnalytics(); }}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              tab === t ? "bg-amber-700 text-white shadow-md" : "bg-white text-amber-700 border border-amber-200 hover:bg-amber-50"
            }`}>
            {t === "campaigns" ? "📋 Campaigns" : "📊 Analytics"}
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
                <label className="block text-sm font-medium text-amber-800 mb-1">Campaign Image</label>
                <div className="flex gap-2 items-center">
                  <label className={`px-4 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-all ${
                    uploading ? "bg-amber-100 text-amber-400 border-amber-200" : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  }`}>
                    {uploading ? "Uploading..." : "📷 Upload Image"}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                  <span className="text-amber-400 text-xs">or</span>
                  <input type="url" value={form.image} onChange={(e) => update("image", e.target.value)} placeholder="Paste image URL"
                    className="flex-1 px-3 py-2 border border-amber-200 rounded-lg bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-amber-300 text-sm" />
                </div>
                {form.image && <img src={form.image} alt="Preview" className="mt-2 h-24 rounded-lg object-cover" />}
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">Target Amount (₹)</label>
                <input type="number" min="1" value={form.targetAmount} onChange={(e) => update("targetAmount", e.target.value)} placeholder="e.g. 500000"
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-amber-300" />
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
              ).map((d, i) => (
                <div key={d.name} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-amber-50 transition">
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-amber-50 text-amber-500"
                    }`}>{i + 1}</span>
                    <div>
                      <span className="text-amber-900 font-medium">{d.name}</span>
                      {d.count > 1 && <span className="text-amber-400 text-xs ml-1.5">({d.count} donations)</span>}
                    </div>
                  </div>
                  <span className="text-amber-700 font-bold">₹{d.amount.toLocaleString("en-IN")}</span>
                </div>
              ))}
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
