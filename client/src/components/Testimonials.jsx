const TESTIMONIALS = [
    {
        name: "Rajesh Patil",
        location: "Pune, Maharashtra",
        avatar: "RP",
        rating: 5,
        quote: "I rented a Mahindra tractor for my wheat harvest in just 10 minutes. The digital token system made the handover so smooth — no paperwork at all!",
        equipment: "Mahindra 575 DI Tractor",
        savings: "Saved ₹18,000",
        avatarBg: "#2E7D32",
    },
    {
        name: "Sunita Devi",
        location: "Nashik, Maharashtra",
        avatar: "SD",
        rating: 5,
        quote: "As a small farmer, buying a sprayer was out of reach. Krishi Astra Setu helped me rent one nearby and finish spraying in one day. Brilliant service!",
        equipment: "HTP Power Sprayer",
        savings: "Saved ₹6,500",
        avatarBg: "#388E3C",
    },
    {
        name: "Amol Shinde",
        location: "Satara, Maharashtra",
        avatar: "AS",
        rating: 5,
        quote: "The 24/7 support team resolved my issue within minutes. The owner was verified and the rotavator was in perfect condition. Will use again next season.",
        equipment: "Sonalika Rotavator 7ft",
        savings: "Saved ₹9,200",
        avatarBg: "#558B2F",
    },
];

function StarRow({ count }) {
    return (
        <div style={{ display: "flex", gap: "3px" }}>
            {[1, 2, 3, 4, 5].map(i => (
                <span key={i} style={{ fontSize: "16px", color: i <= count ? "#F59E0B" : "#E5E7EB" }}>★</span>
            ))}
        </div>
    );
}

export default function Testimonials() {
    return (
        <section>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "36px" }}>
                <span style={{ display: "inline-block", background: "#DCEDC8", color: "#2E7D32", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 14px", borderRadius: "999px", marginBottom: "12px" }}>
                    Real Farmers, Real Stories
                </span>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#111827", fontFamily: "'Poppins', sans-serif", lineHeight: 1.2 }}>
                    Trusted by <span style={{ color: "#2E7D32" }}>50,000+ Farmers</span>
                </h2>
                <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "10px" }}>
                    See what farmers across India are saying about their rental experience.
                </p>
            </div>

            {/* Cards grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
                {TESTIMONIALS.map((t, i) => (
                    <div
                        key={i}
                        style={{
                            background: "#ffffff",
                            borderRadius: "18px",
                            padding: "28px 24px",
                            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                            transition: "box-shadow 0.2s ease, transform 0.2s ease",
                            cursor: "default",
                            position: "relative",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(46,125,50,0.14)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)"; e.currentTarget.style.transform = "none"; }}
                    >
                        {/* Quote mark */}
                        <div style={{ position: "absolute", top: "20px", right: "22px", fontSize: "52px", color: "#F1F8E9", lineHeight: 1, fontFamily: "Georgia, serif", pointerEvents: "none" }}>
                            "
                        </div>

                        {/* Stars */}
                        <StarRow count={t.rating} />

                        {/* Quote */}
                        <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.7, fontStyle: "italic", flex: 1 }}>
                            "{t.quote}"
                        </p>

                        {/* Equipment + Savings tag */}
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ background: "#F1F8E9", color: "#2E7D32", fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "999px" }}>
                                🚜 {t.equipment}
                            </span>
                            <span style={{ background: "#FEF9C3", color: "#92400E", fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "999px" }}>
                                💰 {t.savings}
                            </span>
                        </div>

                        {/* Divider */}
                        <div style={{ height: "1px", background: "#F3F4F6" }} />

                        {/* Reviewer */}
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {/* Avatar */}
                            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: t.avatarBg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px", flexShrink: 0, letterSpacing: "0.04em" }}>
                                {t.avatar}
                            </div>
                            <div>
                                <p style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>{t.name}</p>
                                <p style={{ fontSize: "12px", color: "#9CA3AF" }}>📍 {t.location}</p>
                            </div>
                            {/* Verified badge */}
                            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px", background: "#F0FDF4", color: "#16A34A", fontSize: "10px", fontWeight: 700, padding: "4px 10px", borderRadius: "999px", border: "1px solid #BBF7D0", whiteSpace: "nowrap" }}>
                                ✅ Verified Renter
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Trust score summary */}
            <div style={{ marginTop: "36px", display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
                {[
                    { label: "Average Rating", value: "4.9 / 5.0" },
                    { label: "Total Rentals", value: "1,20,000+" },
                    { label: "Lender Partners", value: "5,000+" },
                    { label: "Districts Covered", value: "200+" },
                ].map((stat, i) => (
                    <div key={i} style={{ textAlign: "center", padding: "12px 24px", background: "#fff", borderRadius: "12px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                        <p style={{ fontSize: "20px", fontWeight: 800, color: "#2E7D32", fontFamily: "'Poppins', sans-serif" }}>{stat.value}</p>
                        <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>{stat.label}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
