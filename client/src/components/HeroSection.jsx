import { ArrowRight, Tractor, Wind, Zap, Shovel, Droplets, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = (t) => [
    { name: t('categories.tractor'), icon: Tractor, color: "#2E7D32" },
    { name: t('categories.harvester'), icon: Wind, color: "#388E3C" },
    { name: t('categories.rotavator'), icon: Zap, color: "#558B2F" },
    { name: t('categories.seeddrill'), icon: Shovel, color: "#33691E" },
    { name: t('categories.pump_diesel'), icon: Droplets, color: "#1B5E20" },
    { name: t('categories.drone'), icon: Leaf, color: "#7CB342" },
];

function CategoryPill({ name, icon: Icon, color }) {
    return (
        <button
            className="flex flex-col items-center gap-2.5 shrink-0 group"
            style={{ width: "80px" }}
        >
            <div
                className="rounded-full bg-white flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                style={{
                    width: "68px",
                    height: "68px",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
                }}
            >
                <Icon size={30} color={color} strokeWidth={1.75} />
            </div>
            <span className="text-xs font-bold text-center leading-tight" style={{ color: "#374151" }}>
                {name}
            </span>
        </button>
    );
}

export default function HeroSection() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();

    function goAuth(dest) {
        if (user) { navigate(dest); }
        else { navigate('/login', { state: { from: dest } }); }
    }

    return (
        <section className="w-full" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* ── Hero Banner ─────────────────────────────────────── */}
            <div
                className="relative overflow-hidden"
                style={{
                    background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 40%, #388E3C 75%, #558B2F 100%)",
                    borderRadius: "20px",
                    padding: "clamp(28px, 5vw, 52px) clamp(20px, 5vw, 48px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "24px",
                    minHeight: "200px",
                }}
            >
                {/* Decorative circles */}
                <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "280px", height: "280px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: "-40px", left: "30%", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(139,195,74,0.12)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: "20px", right: "220px", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

                {/* Text content */}
                <div style={{ position: "relative", zIndex: 1, maxWidth: "520px" }}>
                    {/* Badge */}
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", borderRadius: "999px", padding: "5px 14px", marginBottom: "20px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#fff", letterSpacing: "0.05em", textTransform: "uppercase" }}>🌾 {t('hero.badge')}</span>
                    </div>

                    {/* Headline */}
                    <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2.6rem)", fontWeight: 800, color: "#ffffff", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: "16px", fontFamily: "'Poppins', sans-serif" }}>
                        {t('hero.title_part1')}<br />
                        <span style={{ color: "#C5E1A5" }}>{t('hero.title_part2')}</span>
                    </h1>

                    {/* Subtext */}
                    <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.82)", lineHeight: 1.65, marginBottom: "28px", maxWidth: "420px" }}>
                        {t('hero.subtitle')}
                    </p>

                    {/* Buttons */}
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <button
                            onClick={() => goAuth('/marketplace')}
                            className="transition-all duration-200"
                            style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", color: "#2E7D32", fontWeight: 700, fontSize: "0.9rem", padding: "12px 28px", borderRadius: "12px", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.14)" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#F1F8E9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.transform = "none"; }}
                        >
                            {t('hero.get_started')} <ArrowRight size={16} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={() => goAuth('/add-equipment')}
                            className="transition-all duration-200"
                            style={{ display: "flex", alignItems: "center", gap: "8px", background: "transparent", color: "#ffffff", fontWeight: 700, fontSize: "0.9rem", padding: "12px 28px", borderRadius: "12px", border: "2px solid rgba(255,255,255,0.7)", cursor: "pointer" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                        >
                            {t('hero.list_equipment')}
                        </button>
                    </div>
                </div>

                {/* Right icon illustration */}
                <div style={{ position: "relative", zIndex: 1, alignItems: "center", justifyContent: "center", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(255,255,255,0.10)", flexShrink: 0 }} className="hidden md:flex">
                    <Tractor size={100} color="rgba(255,255,255,0.9)" strokeWidth={1.2} />
                </div>
            </div>

            {/* ── Category Carousel ───────────────────────────────── */}
            <div
                style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    padding: "20px 24px 24px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                }}
            >
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>
                    {t('home.browse_category')}
                </p>
                <div
                    style={{
                        display: "flex",
                        gap: "8px",
                        overflowX: "auto",
                        paddingBottom: "4px",
                        scrollbarWidth: "none",
                        justifyContent: "space-between",
                    }}
                >
                    {CATEGORIES(t).map(cat => (
                        <CategoryPill key={cat.name} {...cat} />
                    ))}
                </div>
            </div>

        </section>
    );
}
