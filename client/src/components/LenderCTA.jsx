import { ArrowRight, Users, TrendingUp, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

const STATS = (t) => [
    { icon: Users, value: "5,000+", label: t('lender_cta.stat_active') },
    { icon: TrendingUp, value: "₹20,000", label: t('lender_cta.stat_income') },
    { icon: Star, value: "4.9 ★", label: t('lender_cta.stat_sat') },
];

export default function LenderCTA() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();

    function goAuth(dest) {
        if (user) { navigate(dest); }
        else { navigate('/login', { state: { from: dest } }); }
    }

    return (
        <section>
            <div
                style={{
                    borderRadius: "22px",
                    overflow: "hidden",
                    position: "relative",
                    minHeight: "320px",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                {/* Background gradient (simulates dark agriculture image) */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(135deg, #1A2E1A 0%, #1B3A1F 30%, #2E5A1F 65%, #3A6B28 100%)",
                        zIndex: 0,
                    }}
                />

                {/* Decorative texture dots */}
                <div style={{ position: "absolute", inset: 0, zIndex: 1, overflow: "hidden", pointerEvents: "none" }}>
                    {/* Large circle top-right */}
                    <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "340px", height: "340px", borderRadius: "50%", background: "rgba(139,195,74,0.08)" }} />
                    {/* Medium circle bottom-left */}
                    <div style={{ position: "absolute", bottom: "-60px", left: "-60px", width: "240px", height: "240px", borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                    {/* Wheat emoji scattered */}
                    <div style={{ position: "absolute", top: "20px", right: "20%", fontSize: "80px", opacity: 0.06, transform: "rotate(-15deg)" }}>🌾</div>
                    <div style={{ position: "absolute", bottom: "10px", left: "15%", fontSize: "60px", opacity: 0.05, transform: "rotate(10deg)" }}>🌿</div>
                    <div style={{ position: "absolute", top: "40%", right: "8%", fontSize: "50px", opacity: 0.05 }}>🚜</div>
                </div>

                {/* Content */}
                <div
                    style={{
                        position: "relative",
                        zIndex: 2,
                        width: "100%",
                        padding: "52px 48px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "32px",
                        flexWrap: "wrap",
                    }}
                >
                    {/* Left: text block */}
                    <div style={{ maxWidth: "520px" }}>
                        {/* Badge */}
                        <span style={{ display: "inline-block", background: "rgba(139,195,74,0.2)", color: "#8BC34A", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 14px", borderRadius: "999px", marginBottom: "18px" }}>
                            💼 {t('lender_cta.badge')}
                        </span>

                        <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#ffffff", fontFamily: "'Poppins', sans-serif", lineHeight: 1.2, marginBottom: "14px" }}>
                            {t('lender_cta.title')}<br />
                            <span style={{ color: "#8BC34A" }}>{t('lender_cta.subtitle')}</span>
                        </h2>

                        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.78)", lineHeight: 1.65, marginBottom: "28px", maxWidth: "440px" }}>
                            {t('lender_cta.text', { count: '5,000+', income: '₹20,000' })
                                .replace('{count}', '5,000+')
                                .replace('{income}', '₹20,000')}
                        </p>

                        {/* Buttons */}
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                            <button
                                onClick={() => goAuth('/register')}
                                style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", color: "#2E7D32", fontWeight: 700, fontSize: "14px", padding: "13px 28px", borderRadius: "12px", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.2)", transition: "all 0.2s ease" }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#F1F8E9"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.transform = "none"; }}
                            >
                                {t('lender_cta.btn_register')} <ArrowRight size={16} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={() => goAuth('/about')}
                                style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: "13px", padding: "13px 20px", borderRadius: "12px", border: "1.5px solid rgba(255,255,255,0.3)", cursor: "pointer", transition: "all 0.2s ease" }}
                                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
                            >
                                {t('lender_cta.btn_learn')} →
                            </button>
                        </div>
                    </div>

                    {/* Right: stat pills */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", flexShrink: 0 }}>
                        {STATS(t).map(({ icon: Icon, value, label }, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "14px",
                                    background: "rgba(255,255,255,0.08)",
                                    backdropFilter: "blur(8px)",
                                    borderRadius: "14px",
                                    padding: "14px 20px",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    minWidth: "200px",
                                }}
                            >
                                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(139,195,74,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Icon size={20} color="#8BC34A" strokeWidth={1.75} />
                                </div>
                                <div>
                                    <p style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", fontFamily: "'Poppins', sans-serif", lineHeight: 1 }}>{value}</p>
                                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", marginTop: "3px" }}>{label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
}
