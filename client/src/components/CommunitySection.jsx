/* ── CommunitySection.jsx ───────────────────────────────────
   Farmer Reviews + Agri Quotes + Statistics Bar
─────────────────────────────────────────────────────────── */

const REVIEWS = [
    {
        name: "Rajesh Kumar",
        location: "Varanasi, UP",
        avatar: "RK",
        avatarBg: "#2E7D32",
        rating: 5,
        badge: "Verified Farmer",
        quote: "The Mahindra tractor I rented arrived on time and saved my crop during the unseasonal rains. Very grateful to Krishi Astra Setu!",
        crop: "Wheat Farmer",
        season: "Rabi 2025",
    },
    {
        name: "Anita Devi",
        location: "Amravati, Maharashtra",
        avatar: "AD",
        avatarBg: "#388E3C",
        rating: 5,
        badge: "Verified Farmer",
        quote: "Maine is platform pe rotavator kiraaye pe liya aur ek hi din mein kheti ho gayi. Bahut sasta aur aasaan raha — dil se shukriya!",
        crop: "Soybean Farmer",
        season: "Kharif 2025",
    },
    {
        name: "Somnath Patil",
        location: "Solapur, Maharashtra",
        avatar: "SP",
        avatarBg: "#558B2F",
        rating: 5,
        badge: "Verified Farmer",
        quote: "Digital contract aur 6-digit token ne poori process transparent bana di. Ab main apne padosiyon ko bhi is platform ke baare mein batata hoon.",
        crop: "Sugarcane Farmer",
        season: "Annual 2025",
    },
];

const QUOTES = [
    { text: "Jai Jawan, Jai Kisan", author: "Lal Bahadur Shastri" },
    { text: "Agriculture is the backbone of the Indian economy.", author: "Indian Economic Council" },
];

const STATS = [
    { value: "10,000+", label: "Farmers Impacted", emoji: "👨‍🌾" },
    { value: "500+", label: "Villages Covered", emoji: "🏘️" },
    { value: "2,000+", label: "Tools Available", emoji: "🚜" },
    { value: "98%", label: "Satisfaction Rate", emoji: "⭐" },
];

function StarRow({ count = 5 }) {
    return (
        <div style={{ display: "flex", gap: "2px" }}>
            {[1, 2, 3, 4, 5].map(i => (
                <span key={i} style={{ fontSize: "15px", color: i <= count ? "#F59E0B" : "#E5E7EB" }}>★</span>
            ))}
        </div>
    );
}

export default function CommunitySection() {
    return (
        <section style={{ display: "flex", flexDirection: "column", gap: "48px" }}>

            {/* ── 1. Farmer Reviews ─────────────────────────────────── */}
            <div>
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <span style={{ display: "inline-block", background: "#DCEDC8", color: "#2E7D32", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 14px", borderRadius: "999px", marginBottom: "12px" }}>
                        🌾 Farmer Voices
                    </span>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#111827", fontFamily: "'Poppins', sans-serif" }}>
                        Stories from the <span style={{ color: "#2E7D32" }}>Field</span>
                    </h2>
                    <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "8px" }}>
                        Real experiences from farmers who rented through our platform.
                    </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "22px" }}>
                    {REVIEWS.map((r, i) => (
                        <div
                            key={i}
                            style={{ background: "#fff", borderRadius: "18px", padding: "26px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", gap: "14px", transition: "all 0.25s ease", cursor: "default", position: "relative" }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(46,125,50,0.14)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)"; e.currentTarget.style.transform = "none"; }}
                        >
                            {/* Decorative quote mark */}
                            <div style={{ position: "absolute", top: "16px", right: "18px", fontSize: "56px", color: "#F1F8E9", lineHeight: 1, fontFamily: "Georgia, serif", pointerEvents: "none" }}>"</div>

                            {/* Stars + badge */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <StarRow count={r.rating} />
                                <span style={{ background: "#F0FDF4", color: "#16A34A", fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "999px", border: "1px solid #BBF7D0" }}>
                                    ✅ {r.badge}
                                </span>
                            </div>

                            {/* Quote */}
                            <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.72, fontStyle: "italic", flex: 1 }}>
                                "{r.quote}"
                            </p>

                            {/* Tags */}
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                <span style={{ background: "#F1F8E9", color: "#2E7D32", fontSize: "10px", fontWeight: 600, padding: "3px 9px", borderRadius: "999px" }}>🌱 {r.crop}</span>
                                <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: "10px", fontWeight: 600, padding: "3px 9px", borderRadius: "999px" }}>📅 {r.season}</span>
                            </div>

                            <div style={{ height: "1px", background: "#F3F4F6" }} />

                            {/* Author */}
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: r.avatarBg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "13px", flexShrink: 0 }}>
                                    {r.avatar}
                                </div>
                                <div>
                                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>{r.name}</p>
                                    <p style={{ fontSize: "11px", color: "#9CA3AF" }}>📍 {r.location}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── 2. Agri Quotes Banner ─────────────────────────────── */}
            <div
                style={{
                    borderRadius: "20px",
                    overflow: "hidden",
                    position: "relative",
                    padding: "64px 48px",
                    textAlign: "center",
                    background: "linear-gradient(160deg, #0D2B0D 0%, #1B4332 30%, #2D6A36 65%, #1B5E20 100%)",
                }}
            >
                {/* Decorative overlays */}
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: "-80px", left: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(139,195,74,0.08)" }} />
                    <div style={{ position: "absolute", bottom: "-60px", right: "-60px", width: "260px", height: "260px", borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: "200px", opacity: 0.04, pointerEvents: "none" }}>🌾</div>
                </div>

                <div style={{ position: "relative", zIndex: 1 }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "#8BC34A", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "28px" }}>
                        — Inspirational Agri Wisdom —
                    </p>

                    {QUOTES.map((q, i) => (
                        <div key={i} style={{ marginBottom: i < QUOTES.length - 1 ? "36px" : 0 }}>
                            <blockquote
                                style={{
                                    fontSize: i === 0 ? "2.2rem" : "1.3rem",
                                    fontWeight: 700,
                                    color: "#ffffff",
                                    fontFamily: "Georgia, 'Times New Roman', serif",
                                    lineHeight: 1.35,
                                    letterSpacing: i === 0 ? "0.02em" : "0",
                                    marginBottom: "10px",
                                }}
                            >
                                "{q.text}"
                            </blockquote>
                            <cite style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", fontStyle: "normal", fontWeight: 500 }}>
                                — {q.author}
                            </cite>
                            {i < QUOTES.length - 1 && (
                                <div style={{ width: "60px", height: "2px", background: "rgba(139,195,74,0.4)", borderRadius: "999px", margin: "28px auto 0" }} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── 3. Statistics Bar ─────────────────────────────────── */}
            <div
                style={{
                    background: "#ffffff",
                    borderRadius: "18px",
                    padding: "32px 28px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: "4px",
                }}
            >
                {STATS.map((s, i) => (
                    <div
                        key={i}
                        style={{
                            textAlign: "center",
                            padding: "16px 8px",
                            borderRight: i < STATS.length - 1 ? "1px solid #F3F4F6" : "none",
                        }}
                    >
                        <div style={{ fontSize: "32px", marginBottom: "6px" }}>{s.emoji}</div>
                        <p style={{ fontSize: "1.85rem", fontWeight: 800, color: "#2E7D32", fontFamily: "'Poppins', sans-serif", lineHeight: 1 }}>
                            {s.value}
                        </p>
                        <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "5px", fontWeight: 500 }}>
                            {s.label}
                        </p>
                    </div>
                ))}
            </div>

        </section>
    );
}
