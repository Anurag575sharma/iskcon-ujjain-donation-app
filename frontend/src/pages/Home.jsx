import { useState, useEffect } from "react";
import api from "../api";
import Loader from "../components/Loader";

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function Home({ onSelect }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalAmount: 0, totalDonors: 0 });
  const [recentDonations, setRecentDonations] = useState([]);

  useEffect(() => {
    Promise.all([api.get("/campaigns"), api.get("/recent-donations")]).then(([campRes, recentRes]) => {
      const camps = campRes.data;
      setCampaigns(camps);
      setRecentDonations(recentRes.data);
      const active = camps.filter((c) => c.collectedAmount < c.targetAmount);
      api.get(`/stats${active.length > 0 ? "?active=true" : ""}`).then(({ data }) => setStats(data));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const activeCampaigns = campaigns.filter((c) => c.collectedAmount < c.targetAmount);
  if (loading) return <Loader message="Loading campaigns..." />;

  return (
    <div className="animate-fade-up">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden mb-10 shadow-xl" style={{ background: "linear-gradient(135deg, #D35400, #E67E22, #D35400)" }}>
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.5'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col md:flex-row items-center gap-4 sm:gap-6 px-5 sm:px-8 py-6 sm:py-10">
          <div className="animate-float flex-shrink-0">
            <img src="https://www.lokanathswamiofferings.com/wp-content/uploads/2022/08/2-917x1024.png" alt="Srila Prabhupada" className="w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-2xl" />
          </div>
          <div className="text-center md:text-left">
            <p className="text-white/70 text-xs font-semibold tracking-[0.3em] uppercase mb-3">✦ Founder Acharya ✦</p>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white leading-tight tracking-wide">Offer Your Seva</h1>
            <p className="text-white/70 mt-3 text-[15px] italic leading-relaxed max-w-lg font-serif">
              "If you simply give some contribution to spreading this Krishna consciousness movement, you get a permanent credit. It will never be lost."
            </p>
            <p className="text-white/50 text-xs mt-3 font-semibold tracking-wider">— His Divine Grace A.C. Bhaktivedanta Swami Prabhupada</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats.totalDonors > 0 && (
        <div className="grid grid-cols-2 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E8DCCF] text-center shadow-sm">
            <p className="text-2xl sm:text-3xl font-serif font-bold text-[#D35400]">₹{stats.totalAmount.toLocaleString("en-IN")}</p>
            <p className="text-[10px] sm:text-xs text-[#5D6D7E] mt-1.5 uppercase tracking-[0.15em] font-semibold">Total Raised</p>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E8DCCF] text-center shadow-sm">
            <p className="text-2xl sm:text-3xl font-serif font-bold text-[#D35400]">{stats.totalDonors.toLocaleString("en-IN")}</p>
            <p className="text-[10px] sm:text-xs text-[#5D6D7E] mt-1.5 uppercase tracking-[0.15em] font-semibold">Generous Donors</p>
          </div>
        </div>
      )}

      {/* Recent Donations */}
      {recentDonations.length > 0 && activeCampaigns.length > 0 && (
        <div className="bg-white/70 rounded-2xl border border-[#E8DCCF] p-4 mb-10 shadow-sm">
          <p className="text-xs text-[#D35400] uppercase tracking-[0.15em] font-semibold mb-3">🔔 Recent Donations</p>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {recentDonations.map((d) => (
              <div key={d._id} className="flex-shrink-0 bg-[#FDF2E9] rounded-xl px-4 py-3 border border-[#E8DCCF]">
                <p className="text-sm font-medium text-[#17202A]">
                  {d.donorName} <span className="text-[#5D6D7E] font-normal">donated</span>
                </p>
                <p className="text-[11px] text-[#5D6D7E] mt-0.5">{d.campaignId?.title || "Campaign"} · {timeAgo(d.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Title */}
      {activeCampaigns.length > 0 && (
        <div className="text-center mb-8">
          <p className="text-[#D35400] text-xs font-semibold tracking-[0.25em] uppercase">🙏 Active Campaigns</p>
          <h2 className="text-2xl font-serif font-bold text-[#17202A] mt-2 tracking-wide">Choose a Cause, Make a Difference</h2>
        </div>
      )}

      {/* Campaigns */}
      {!activeCampaigns.length ? (
        <div className="text-center mt-16 space-y-3 animate-fade-up">
          <div className="text-6xl animate-float">🙏</div>
          <p className="text-[#7B241C] text-xl font-serif font-bold">No active campaigns</p>
          <p className="text-[#5D6D7E]">All campaigns are fully funded. Hare Krishna!</p>
        </div>
      ) : (
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {activeCampaigns.map((c) => {
            const progress = Math.min((c.collectedAmount / c.targetAmount) * 100, 100);
            return (
              <button key={c._id} onClick={() => onSelect(c._id)}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 text-left overflow-hidden group border border-[#E8DCCF] hover:-translate-y-1">
                <div className="relative overflow-hidden">
                  <img src={c.image} alt={c.title} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => { e.target.src = "https://placehold.co/800x400/FDF2E9/D35400?text=🙏"; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                    <span className="text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg" style={{ background: "#D35400" }}>{progress.toFixed(0)}% funded</span>
                    <span className="bg-white/25 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full font-medium">₹{c.targetAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <h3 className="font-serif font-bold text-[#17202A] text-lg leading-tight line-clamp-2 group-hover:text-[#D35400] transition-colors tracking-wide">{c.title}</h3>
                  <div className="space-y-2">
                    <div className="w-full bg-[#FDF2E9] rounded-full h-2.5 overflow-hidden">
                      <div className="h-2.5 rounded-full transition-all duration-1000" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #D35400, #E67E22)" }} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-[#D35400]">₹{c.collectedAmount.toLocaleString("en-IN")}</span>
                      <span className="text-[#5D6D7E]">{c.donorCount} {c.donorCount === 1 ? "donor" : "donors"}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#E8DCCF]">
                    <span className="text-[#D35400] font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                      Help Now
                      <span className="bg-[#FDF2E9] group-hover:bg-[#D35400] group-hover:text-white w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all">→</span>
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
