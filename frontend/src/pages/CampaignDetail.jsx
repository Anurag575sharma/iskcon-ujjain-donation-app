import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Loader from "../components/Loader";
import { useToast } from "../components/Toast";

export default function CampaignDetail({ id, onBack }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [donors, setDonors] = useState([]);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [paymentMode, setPaymentMode] = useState("cashfree");
  const [upiDetails, setUpiDetails] = useState({ upiId: "", qrImage: "", whatsappNo: "" });
  const [showQr, setShowQr] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const touchStart = { current: 0 };
  const mouseStart = { current: 0, dragging: false };

  const fetchCampaign = () => api.get(`/campaign/${id}`)
    .then(({ data }) => setCampaign(data))
    .catch(() => setCampaign("not_found"));
  const fetchDonors = () => api.get(`/donors/${id}`).then(({ data }) => setDonors(data));
  const fetchPaymentMode = () => api.get("/settings/payment-mode").then(({ data }) => {
    setPaymentMode(data.mode);
    setUpiDetails({ upiId: data.upiId, qrImage: data.qrImage, whatsappNo: data.whatsappNo });
  });
  useEffect(() => { fetchCampaign(); fetchDonors(); fetchPaymentMode(); }, [id]);

  // Auto-rotate slideshow every 4 seconds
  useEffect(() => {
    if (!campaign || !campaign.images?.length || campaign.images.length <= 1) return;
    const timer = setInterval(() => {
      setSlideIndex((i) => (i + 1) % campaign.images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [campaign]);

  const handleDonate = async () => {
    if (!isAnonymous && !donorName.trim()) { setMessage("Please enter your name or check Anonymous."); return; }
    const val = Number(amount);
    if (!val || val < 1) { setMessage("Enter a valid amount (min ₹1)."); return; }

    const finalName = isAnonymous ? "Anonymous" : donorName.trim();

    if (paymentMode === "upi") {
      // Just show QR — record only when user confirms payment
      setShowQr(true);
      return;
    }

    setLoading(true); setMessage("");
    try {
      const { data: order } = await api.post("/create-order", {
        amount: val, campaignId: id, donorName: finalName, donorEmail: donorEmail.trim(),
      });

      const cashfree = window.Cashfree({
        mode: import.meta.env.VITE_CASHFREE_ENV === "production" ? "production" : "sandbox",
      });

      await cashfree.checkout({
        paymentSessionId: order.paymentSessionId,
        redirectTarget: "_self",
      });
    } catch (err) {
      setMessage(err?.response?.data?.error || "Something went wrong. Please try again.");
    }
    finally { setLoading(false); }
  };



  if (!campaign) return <Loader message="Loading campaign details..." />;

  if (campaign === "not_found") {
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-fade-up">
        <div className="text-6xl mb-4">🙏</div>
        <h1 className="text-2xl font-serif font-bold text-[#7B241C] mb-2">Campaign Not Found</h1>
        <p className="text-[#5D6D7E] mb-6">This campaign may have been removed or doesn't exist.</p>
        <button onClick={onBack} className="px-6 py-3 text-white font-semibold rounded-xl glow-btn" style={{ background: "linear-gradient(135deg, #D35400, #E67E22)" }}>
          Back to Home
        </button>
      </div>
    );
  }

  const progress = Math.min((campaign.collectedAmount / campaign.targetAmount) * 100, 100);
  const isCompleted = campaign.collectedAmount >= campaign.targetAmount;

  return (
    <>
    <div className="animate-fade-up">
      <button onClick={onBack} className="text-[#D35400] mb-5 hover:text-[#7B241C] flex items-center gap-2 transition-colors group">
        <span className="bg-[#FDF2E9] group-hover:bg-[#FADBD8] w-7 h-7 rounded-full flex items-center justify-center transition-colors">←</span>
        <span className="text-sm font-medium">All Campaigns</span>
      </button>

      <div className="max-w-xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#E8DCCF]">
          {(() => {
            const allImages = campaign.images?.length ? campaign.images : [campaign.image];
            return (
              <div className="relative h-64 sm:h-72 bg-black cursor-grab active:cursor-grabbing select-none"
                onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
                onTouchEnd={(e) => {
                  const diff = touchStart.current - e.changedTouches[0].clientX;
                  if (Math.abs(diff) > 50) {
                    setSlideIndex((i) => diff > 0 ? (i + 1) % allImages.length : (i - 1 + allImages.length) % allImages.length);
                  }
                }}
                onMouseDown={(e) => { mouseStart.current = e.clientX; mouseStart.dragging = true; }}
                onMouseUp={(e) => {
                  if (!mouseStart.dragging) return;
                  mouseStart.dragging = false;
                  const diff = mouseStart.current - e.clientX;
                  if (Math.abs(diff) > 50) {
                    setSlideIndex((i) => diff > 0 ? (i + 1) % allImages.length : (i - 1 + allImages.length) % allImages.length);
                  }
                }}
                onMouseLeave={() => { mouseStart.dragging = false; }}>
                <img src={allImages[slideIndex] || campaign.image} alt={campaign.title} className="w-full h-full object-contain transition-opacity duration-700"
                  onError={(e) => { e.target.src = "https://placehold.co/800x400/FDF2E9/D35400?text=🙏"; }} />
                {allImages.length > 1 && (
                  <span className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
                    {slideIndex + 1} / {allImages.length}
                  </span>
                )}
              </div>
            );
          })()}

          <div className="px-4 sm:px-6 pt-5 pb-1">
            <div className="flex items-start gap-3">
              <div className="w-1 self-stretch bg-gradient-to-b from-[#D35400] to-[#E67E22] rounded-full flex-shrink-0" />
              <h1 className="text-2xl font-serif font-bold text-[#7B241C] leading-tight tracking-wide">{campaign.title}</h1>
            </div>
          </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            <p className="text-[#5D6D7E] leading-relaxed whitespace-pre-line"
              dangerouslySetInnerHTML={{
                __html: campaign.description
                  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                  .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#7B241C;">$1</strong>')
                  .replace(/\*(.+?)\*/g, '<em>$1</em>')
                  .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#D35400;text-decoration:underline;word-break:break-all;">$1</a>')
              }}
            />

            {/* Progress */}
            <div className="bg-[#FDF2E9] rounded-2xl p-4 sm:p-5 border border-[#E8DCCF]">
              <div className="flex justify-between items-end mb-3 gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] text-[#5D6D7E] uppercase tracking-[0.15em] font-semibold">Raised</p>
                  <p className="text-xl sm:text-2xl font-serif font-bold text-[#D35400] truncate">₹{campaign.collectedAmount.toLocaleString("en-IN")}</p>
                </div>
                <div className="text-center min-w-0">
                  <p className="text-[10px] text-[#5D6D7E] uppercase tracking-[0.15em] font-semibold">Remaining</p>
                  <p className="text-base sm:text-lg font-serif font-semibold text-[#7B241C] truncate">₹{Math.max(campaign.targetAmount - campaign.collectedAmount, 0).toLocaleString("en-IN")}</p>
                </div>
                <div className="text-right min-w-0">
                  <p className="text-[10px] text-[#5D6D7E] uppercase tracking-[0.15em] font-semibold">Goal</p>
                  <p className="text-base sm:text-lg font-serif font-semibold text-[#5D6D7E] truncate">₹{campaign.targetAmount.toLocaleString("en-IN")}</p>
                </div>
              </div>
              <div className="w-full bg-[#E8DCCF]/50 rounded-full h-3 overflow-hidden">
                <div className="h-3 rounded-full transition-all duration-1000 relative" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #D35400, #E67E22)" }}>
                  <div className="absolute right-0 top-0 w-3 h-3 bg-white rounded-full shadow-md animate-pulse" />
                </div>
              </div>
              <p className="text-xs text-[#5D6D7E] mt-2 text-center font-medium">{progress.toFixed(1)}% funded</p>
            </div>

            {isCompleted ? (
              <div className="text-center py-6 bg-green-50 rounded-2xl border border-green-200/50">
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-green-700 font-bold text-lg">Campaign Fully Funded!</p>
                <p className="text-green-600/70 mt-1">Hare Krishna! Thank you to all donors.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isAnonymous} onChange={(e) => { setIsAnonymous(e.target.checked); if (e.target.checked) setDonorName(""); }}
                      className="w-4 h-4 rounded border-[#E8DCCF] text-[#D35400] focus:ring-[#D35400]" />
                    <span className="text-sm text-[#5D6D7E]">Donate Anonymously</span>
                  </label>
                  {!isAnonymous && (
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D35400]/50">👤</span>
                      <input type="text" placeholder="Your name" value={donorName} onChange={(e) => setDonorName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-[#E8DCCF] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#D35400] focus:border-transparent placeholder-[#BDC3C7] transition-all" />
                    </div>
                  )}
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D35400]/50">✉️</span>
                    <input type="email" placeholder="Email – optional (for receipt)" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-[#E8DCCF] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#D35400] focus:border-transparent placeholder-[#BDC3C7] transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(() => {
                    const t = campaign.targetAmount;
                    if (t <= 10000) return [101, 501, 1001, 2501];
                    if (t <= 50000) return [1001, 2501, 5001, 11001];
                    if (t <= 200000) return [5001, 11001, 21001, 51001];
                    if (t <= 400000) return [11001, 21001, 51001, 100001];
                    return [25001, 51001, 100001, 251001];
                  })().map((val) => (
                    <button key={val} onClick={() => setAmount(String(val))}
                      className={`py-2.5 text-xs sm:text-sm font-semibold rounded-xl border-2 transition-all duration-200 ${
                        amount === String(val)
                          ? "border-[#D35400] bg-[#D35400] text-white shadow-md scale-105"
                          : "border-[#E8DCCF] text-[#D35400] hover:border-[#D35400] hover:bg-[#FDF2E9]"
                      }`}>
                      ₹{val.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D35400] font-bold">₹</span>
                    <input type="number" min="1" placeholder="Custom amount" value={amount} onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 border border-[#E8DCCF] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#D35400] placeholder-[#BDC3C7] text-lg font-semibold text-[#17202A] transition-all" />
                  </div>
                  <button onClick={handleDonate} disabled={loading}
                    className="w-full sm:w-auto px-7 py-3.5 text-white font-bold rounded-xl disabled:opacity-50 transition-all glow-btn text-lg"
                    style={{ background: "linear-gradient(135deg, #D35400, #E67E22)" }}>
                    {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : "Help Now"}
                  </button>
                </div>

                <p className="text-center text-xs text-[#BDC3C7] flex items-center justify-center gap-2">🔒 Secured by Cashfree · 100% Safe</p>
              </div>
            )}

            {message && (
              <div className={`text-center py-3 px-4 rounded-xl ${message.includes("Hare") || message.includes("receipt") ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"}`}>
                <p className="font-medium text-sm">{message}</p>
              </div>
            )}

            {/* Share */}
            <div className="pt-2 border-t border-[#E8DCCF]">
              <p className="text-xs text-[#5D6D7E] text-center mb-2 font-medium">Share this campaign</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => {
                  const raised = campaign.collectedAmount.toLocaleString("en-IN");
                  const goal = campaign.targetAmount.toLocaleString("en-IN");
                  const pct = Math.min((campaign.collectedAmount / campaign.targetAmount) * 100, 100).toFixed(0);
                  const link = window.location.href;

                  let text;
                  if (campaign.shareMessage) {
                    text = campaign.shareMessage
                      .replace(/\{title\}/g, campaign.title)
                      .replace(/\{link\}/g, link)
                      .replace(/\{raised\}/g, `₹${raised}`)
                      .replace(/\{goal\}/g, `₹${goal}`)
                      .replace(/\{percent\}/g, `${pct}%`);
                  } else {
                    text = `🙏 *Hare Krishna!*\n\n` +
                      `I'd like to share a wonderful seva opportunity with you.\n\n` +
                      `*${campaign.title}*\n` +
                      `${campaign.description.slice(0, 150)}${campaign.description.length > 150 ? "..." : ""}\n\n` +
                      `📊 *₹${raised}* raised of ₹${goal} goal (${pct}%)\n\n` +
                      `Every contribution counts. Please support this cause:\n` +
                      `👉 ${link}\n\n` +
                      `_"If you simply give some contribution to spreading this Krishna consciousness movement, you get a permanent credit."_ — Srila Prabhupada`;
                  }
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-full hover:bg-green-600 transition-all shadow-sm">💬 WhatsApp</button>
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#FDF2E9] text-[#D35400] text-sm font-medium rounded-full hover:bg-[#FADBD8] transition-all border border-[#E8DCCF]">🔗 Copy Link</button>
              </div>
            </div>
          </div>
        </div>

        {/* Top Donors */}
        {donors.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-[#E8DCCF]">
            <h2 className="font-serif font-bold text-[#17202A] mb-4 flex items-center gap-2 text-lg tracking-wide">🏆 Top Donors</h2>
            <div className="flex flex-wrap gap-2">
              {donors.slice(0, 5).map((d, i) => (
                <span key={d.donorName} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                  i === 0 ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                  : i === 1 ? "bg-gray-50 text-gray-700 border border-gray-200"
                  : i === 2 ? "bg-orange-50 text-orange-700 border border-orange-200"
                  : "bg-[#FDF2E9] text-[#D35400] border border-[#E8DCCF]"
                }`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "⭐"} {d.donorName}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* UPI/QR Modal */}
      {showQr && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto" onClick={() => setShowQr(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 sm:p-6 space-y-3 animate-fade-up my-4 sm:my-8" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-serif font-bold text-[#7B241C]">Pay via UPI</h3>
              <p className="text-[#5D6D7E] text-xs sm:text-sm mt-1">Scan QR or use UPI ID to pay <span className="font-bold text-[#D35400]">₹{Number(amount).toLocaleString("en-IN")}</span></p>
            </div>

            {upiDetails.qrImage && (
              <img src={upiDetails.qrImage} alt="UPI QR Code" className="w-36 h-36 sm:w-48 sm:h-48 mx-auto rounded-xl border border-[#E8DCCF]" />
            )}

            {upiDetails.upiId && (
              <div className="text-center">
                <p className="text-xs text-[#5D6D7E] mb-1">UPI ID</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="bg-[#FDF2E9] px-3 py-1.5 rounded-lg text-[#D35400] font-semibold text-sm">{upiDetails.upiId}</code>
                  <button onClick={() => { navigator.clipboard.writeText(upiDetails.upiId); toast.success("UPI ID copied!"); }}
                    className="text-xs text-[#D35400] hover:underline">Copy</button>
                </div>
              </div>
            )}

            <div className="bg-[#FDF2E9] rounded-xl p-3 text-center">
              <p className="text-sm text-green-700 font-medium">✅ Your donation of ₹{Number(amount).toLocaleString("en-IN")} has been recorded</p>
              <p className="text-xs text-[#5D6D7E] mt-1">After payment, send screenshot on WhatsApp for confirmation</p>
            </div>

            <a href={`https://wa.me/${upiDetails.whatsappNo || "917692932955"}?text=${encodeURIComponent(`🙏 Hare Krishna!\n\nI just donated ₹${Number(amount).toLocaleString("en-IN")} for "${campaign?.title}".\n\nName: ${isAnonymous ? "Anonymous" : donorName}\n\nAttaching payment screenshot.`)}`}
              target="_blank" rel="noopener noreferrer"
              className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all">
              💬 Send Screenshot on WhatsApp
            </a>

            <button onClick={async () => {
              try {
                const finalName = isAnonymous ? "Anonymous" : donorName.trim();
                await api.post("/record-upi-donation", {
                  campaignId: id, donorName: finalName, donorEmail: donorEmail.trim(), amount: Number(amount),
                });
                setShowQr(false);
                navigate(`/thank-you?campaign_id=${id}`);
              } catch { toast.error("Failed to record donation."); }
            }}
              className="w-full py-3 text-white font-bold rounded-xl transition-all glow-btn text-base"
              style={{ background: "linear-gradient(135deg, #D35400, #E67E22)" }}>
              ✅ Payment Done
            </button>

            <button onClick={() => setShowQr(false)}
              className="w-full py-2 text-[#5D6D7E] text-sm hover:underline transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
