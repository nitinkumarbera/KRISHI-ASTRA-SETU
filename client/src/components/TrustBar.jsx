const TRUST_ITEMS = [
    { emoji: "🛡️", title: "KYC Verified Users", subtitle: "Every user is ID-verified" },
    { emoji: "📸", title: "Geo-Tagged Equipment", subtitle: "Real-time location tracking" },
    { emoji: "🤝", title: "Secure Digital Contracts", subtitle: "Legally binding e-agreements" },
    { emoji: "📞", title: "24/7 Farmer Support", subtitle: "Help whenever you need it" },
];

export default function TrustBar() {
    return (
        <div
            style={{
                background: "#ffffff",
                borderRadius: "14px",
                padding: "18px 28px",
                boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
            }}
        >
            {TRUST_ITEMS.map((item, i) => (
                <div
                    key={i}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "4px 0",
                    }}
                >
                    {/* Emoji icon in a soft green circle */}
                    <div
                        style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            background: "#F1F8E9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                            flexShrink: 0,
                        }}
                    >
                        {item.emoji}
                    </div>

                    {/* Text */}
                    <div>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.3 }}>
                            {item.title}
                        </p>
                        <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>
                            {item.subtitle}
                        </p>
                    </div>

                    {/* Vertical divider (hidden on last item) */}
                    {i < TRUST_ITEMS.length - 1 && (
                        <div
                            style={{
                                width: "1px",
                                height: "36px",
                                background: "#F3F4F6",
                                marginLeft: "auto",
                                flexShrink: 0,
                            }}
                            className="hidden lg:block"
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
