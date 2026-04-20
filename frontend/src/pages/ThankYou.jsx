import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api";

export default function ThankYou() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const campaignId = searchParams.get("campaign_id");
  const [status, setStatus] = useState("verifying");
  const [emailSent, setEmailSent] = useState(false);
  const [form80gUrl, setForm80gUrl] = useState("");

  useEffect(() => {
    api.get("/settings/payment-mode").then(({ data }) => setForm80gUrl(data.form80gUrl || "")).catch(() => {});

    // UPI flow — no order_id, already recorded
    if (!orderId) {
      if (campaignId) { setStatus("success"); return; }
      setStatus("error");
      return;
    }

    // Cashfree flow — verify with backend
    api.post("/verify-payment", { orderId })
      .then(({ data }) => {
        setStatus("success");
        setEmailSent(data.emailSent);
      })
      .catch(() => setStatus("failed"));
  }, [orderId]);

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-5 animate-fade-up">
        <div className="w-16 h-16 border-4 border-[#FDF2E9] border-t-[#D35400] rounded-full animate-spin" />
        <p className="text-[#5D6D7E] font-medium">Verifying your payment...</p>
      </div>
    );
  }

  if (status === "failed" || status === "error") {
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-fade-up">
        <div className="text-6xl mb-4">😔</div>
        <h1 className="text-2xl font-serif font-bold text-[#7B241C] mb-2">Payment Issue</h1>
        <p className="text-[#5D6D7E] mb-6">
          {status === "error" ? "Invalid payment link." : "We couldn't verify your payment. If money was deducted, it will be refunded automatically."}
        </p>
        <button onClick={() => navigate("/")}
          className="px-6 py-3 text-white font-semibold rounded-xl transition-all glow-btn"
          style={{ background: "linear-gradient(135deg, #D35400, #E67E22)" }}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center py-16 animate-fade-up">
      <div className="text-7xl mb-4 animate-float">🙏</div>
      <h1 className="text-3xl font-serif font-bold text-[#7B241C] mb-3">Hare Krishna!</h1>
      <p className="text-xl text-[#D35400] font-semibold mb-2">Thank you for your generous contribution</p>
      <p className="text-[#5D6D7E] mb-2">
        Your contribution makes a real difference. May Lord Krishna bless you abundantly.
      </p>
      {!orderId && (
        <p className="text-[#D35400] text-sm bg-[#FDF2E9] rounded-xl px-4 py-2 mb-2 border border-[#E8DCCF]">
          ⏳ Your donation will be visible on the website after verification.
        </p>
      )}
      {emailSent && (
        <p className="text-[#5D6D7E] text-sm mb-6">📧 A receipt has been sent to your email.</p>
      )}

      <div className="bg-[#FDF2E9] rounded-2xl p-5 border border-[#E8DCCF] mb-8 text-left">
        <p className="text-[#7B241C] font-serif italic text-sm leading-relaxed text-center">
          "If you simply give some contribution to spreading this Krishna consciousness movement,
          you get a permanent credit. It will never be lost."
        </p>
        <p className="text-[#D35400]/60 text-xs text-center mt-2 font-semibold">— Srila Prabhupada</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {campaignId && (
          <button onClick={() => navigate(`/campaign/${campaignId}`)}
            className="px-6 py-3 text-white font-semibold rounded-xl transition-all glow-btn"
            style={{ background: "linear-gradient(135deg, #D35400, #E67E22)" }}>
            Help Again
          </button>
        )}
        <button onClick={() => navigate("/")}
          className="px-6 py-3 text-[#D35400] font-semibold rounded-xl border-2 border-[#E8DCCF] hover:bg-[#FDF2E9] transition-all">
          Explore Campaigns
        </button>
      </div>

      {/* 80G Tax Receipt */}
      {form80gUrl && (
        <div className="mt-6 bg-white rounded-2xl p-4 border border-[#E8DCCF]">
          <p className="text-sm text-[#5D6D7E] mb-2">Want a tax exemption receipt under 80G?</p>
          <a href={form80gUrl}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[#7B241C] bg-[#FDF2E9] hover:bg-[#FADBD8] rounded-full border border-[#E8DCCF] transition-all">
            🏛️ Get 80G Tax Receipt
          </a>
        </div>
      )}
    </div>
  );
}
