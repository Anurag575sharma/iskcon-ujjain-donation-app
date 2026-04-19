import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import CampaignDetail from "./pages/CampaignDetail";
import CreateCampaign from "./pages/CreateCampaign";
import ThankYou from "./pages/ThankYou";

const LOGO = "https://res.cloudinary.com/dqomft1xi/image/upload/v1776576409/iskcon-campaigns/bmetkjq2rhokxjuoysnz.jpg";

const PRABHUPADA_QUOTES = [
  "If you simply give some contribution to spreading this Krishna consciousness movement, you get a permanent credit.",
  "The more you give in Krishna's service, the more you become enriched. That is the spiritual version.",
  "Charity given to a worthy person at the proper time and place, without expectation of return, is considered to be in the mode of goodness.",
  "One who is engaged in devotional service has already attained liberation.",
  "There is no loss or diminution in devotional service. A little effort in this direction can protect one from the greatest danger.",
  "The highest perfection of human life is to remember the Supreme Lord at the end of life.",
  "Service to the devotees of the Lord is more valuable than service to the Lord Himself.",
  "Real happiness is not found in material possessions but in serving Krishna with love and devotion.",
  "By giving Krishna prasadam to others, you are performing the highest welfare activity.",
  "Every living entity is the servant of God. When we forget this, we suffer. When we remember, we are happy.",
];

function PublicNav() {
  const navigate = useNavigate();
  return (
    <>
      <div className="text-[11px] text-center py-1.5 tracking-[0.2em] font-medium text-[#FDF2E9]" style={{ background: "linear-gradient(90deg, #7B241C, #922B21, #7B241C)" }}>
        ✦ Hare Krishna Hare Krishna Krishna Krishna Hare Hare · Hare Rama Hare Rama Rama Rama Hare Hare ✦
      </div>
      <nav className="bg-white/95 backdrop-blur-lg border-b border-[#E8DCCF] sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          <button onClick={() => navigate("/")} className="flex items-center gap-3 group">
            <img src={LOGO} alt="Inspire MANIT" className="h-16 w-16 object-contain group-hover:scale-105 transition-transform rounded-lg" />
            <div className="text-left">
              <span className="text-xl font-serif font-bold text-[#7B241C] block leading-tight tracking-wide">Inspire MANIT</span>
              <span className="text-[10px] text-[#D35400] tracking-[0.2em] uppercase font-medium">Bhopal · Serving Humanity Through Devotion</span>
            </div>
          </button>
          <a href="tel:+917692932955" className="hidden sm:flex items-center gap-2 text-sm font-medium text-[#D35400] hover:text-[#7B241C] bg-[#FDF2E9] hover:bg-[#FADBD8] px-5 py-2.5 rounded-full transition-all border border-[#E8DCCF]">
            📞 +91 76929 32955
          </a>
        </div>
      </nav>
    </>
  );
}

function PublicFooter() {
  const [quoteIndex, setQuoteIndex] = useState(Math.floor(Math.random() * PRABHUPADA_QUOTES.length));
  useEffect(() => {
    const timer = setInterval(() => setQuoteIndex((i) => (i + 1) % PRABHUPADA_QUOTES.length), 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <footer className="px-6 py-4 bg-[#FDF2E9] border-t border-[#E8DCCF]">
      <div className="max-w-6xl mx-auto space-y-2">
        <p className="text-center text-[#7B241C] text-base font-serif italic leading-relaxed">
          "{PRABHUPADA_QUOTES[quoteIndex]}"
          <span className="not-italic text-[#D35400]/50 text-sm ml-1">— Srila Prabhupada</span>
        </p>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-1.5 text-xs text-[#5D6D7E]/60 pt-1">
          <div className="flex items-center gap-2">
            <img src={LOGO} alt="Inspire MANIT" className="h-4 w-4 object-contain" />
            <span>Inspire MANIT · Bhopal, MP</span>
          </div>
          <div className="flex items-center gap-3">
            <span>📞 +91 76929 32955</span>
            <span>✉️ inspiremanit@gmail.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAF6F0" }}>
      <PublicNav />
      <div className="flex-1 max-w-6xl mx-auto px-6 py-8 w-full"><Home onSelect={(id) => navigate(`/campaign/${id}`)} /></div>
      <PublicFooter />
    </div>
  );
}

function CampaignPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAF6F0" }}>
      <PublicNav />
      <div className="flex-1 max-w-6xl mx-auto px-6 py-8 w-full"><CampaignDetail id={id} onBack={() => navigate("/")} /></div>
      <PublicFooter />
    </div>
  );
}

function AdminPage() {
  const navigate = useNavigate();
  const { pathname } = window.location;
  useEffect(() => { if (pathname !== "/admin") navigate("/admin", { replace: true }); }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAF6F0" }}>
      <nav className="bg-white/95 backdrop-blur-lg border-b border-[#E8DCCF] sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          <button onClick={() => navigate("/admin")} className="flex items-center gap-3">
            <img src={LOGO} alt="Inspire MANIT" className="h-12 w-12 object-contain rounded-lg" />
            <span className="text-lg font-serif font-bold text-[#7B241C]">Admin Panel</span>
          </button>
          <button onClick={() => navigate("/")} className="text-[#D35400] text-sm font-medium hover:text-[#7B241C] transition-colors">← Back to site</button>
        </div>
      </nav>
      <div className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full"><CreateCampaign onCreated={() => {}} /></div>
    </div>
  );
}

function ThankYouPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAF6F0" }}>
      <PublicNav />
      <div className="flex-1 max-w-6xl mx-auto px-6 py-8 w-full"><ThankYou /></div>
      <PublicFooter />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/campaign/:id" element={<CampaignPage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
        <Route path="/admin/*" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
