import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const STEPS = [
    {
        number: "01",
        icon: "🔍",
        title: "Search & Book",
        description: "Find equipment near your village and select your dates.",
        color: "#2E7D32",
    },
    {
        number: "02",
        icon: "🤝",
        title: "Digital Handover",
        description: "Meet the owner and verify the rental with a secure 6-digit token.",
        color: "#388E3C",
    },
    {
        number: "03",
        icon: "🌾",
        title: "Work & Return",
        description: "Complete your farm work and return the equipment safely.",
        color: "#558B2F",
    },
];

export default function HowItWorks() {
    const { user } = useAuth();
    const navigate = useNavigate();

    function goAuth(dest) {
        if (user) navigate(dest);
        else navigate('/login', { state: { from: dest } });
    }

    return (
        <section
            style={{
                background: "linear-gradient(135deg, #F1F8E9 0%, #E8F5E9 100%)",
                borderRadius: "20px",
                padding: "48px 40px",
            }}
        >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
                <span
                    style={{
                        display: "inline-block",
                        background: "#DCEDC8",
                        color: "#2E7D32",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        padding: "5px 14px",
                        borderRadius: "999px",
                        marginBottom: "14px",
                    }}
                >
                    Simple 3-Step Process
                </span>
                <h2
                    style={{
                        fontSize: "1.75rem",
                        fontWeight: 800,
                        color: "#111827",
                        fontFamily: "'Poppins', sans-serif",
                        lineHeight: 1.2,
                    }}
                >
                    Start Your Rental in{" "}
                    <span style={{ color: "#2E7D32" }}>3 Easy Steps</span>
                </h2>
                <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "10px", maxWidth: "420px", margin: "10px auto 0" }}>
                    From search to harvest — the whole process takes less than 5 minutes.
                </p>
            </div>

            {/* Steps grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "24px",
                    position: "relative",
                }}
            >
                {STEPS.map((step, i) => (
                    <div key={i} style={{ position: "relative" }}>
                        {/* Card */}
                        <div
                            style={{
                                background: "#ffffff",
                                borderRadius: "16px",
                                padding: "28px 24px",
                                boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                gap: "14px",
                                transition: "box-shadow 0.2s ease, transform 0.2s ease",
                                cursor: "default",
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.boxShadow = "0 8px 28px rgba(46,125,50,0.15)";
                                e.currentTarget.style.transform = "translateY(-4px)";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)";
                                e.currentTarget.style.transform = "none";
                            }}
                        >
                            {/* Step number + emoji row */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                {/* Step number badge */}
                                <div
                                    style={{
                                        width: "48px",
                                        height: "48px",
                                        borderRadius: "14px",
                                        background: step.color,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#fff",
                                        fontWeight: 800,
                                        fontSize: "17px",
                                        fontFamily: "'Poppins', sans-serif",
                                        boxShadow: `0 4px 12px ${step.color}40`,
                                    }}
                                >
                                    {step.number}
                                </div>

                                {/* Emoji */}
                                <span style={{ fontSize: "36px", lineHeight: 1 }}>{step.icon}</span>
                            </div>

                            {/* Title */}
                            <h3
                                style={{
                                    fontSize: "16px",
                                    fontWeight: 700,
                                    color: "#111827",
                                    fontFamily: "'Poppins', sans-serif",
                                }}
                            >
                                {step.title}
                            </h3>

                            {/* Description */}
                            <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.65 }}>
                                {step.description}
                            </p>

                            {/* Green accent bottom line */}
                            <div
                                style={{
                                    marginTop: "auto",
                                    height: "3px",
                                    borderRadius: "999px",
                                    background: `linear-gradient(90deg, ${step.color}, transparent)`,
                                }}
                            />
                        </div>

                        {/* Arrow between steps (desktop) */}
                        {i < STEPS.length - 1 && (
                            <div
                                className="hidden lg:flex"
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    right: "-20px",
                                    transform: "translateY(-50%)",
                                    zIndex: 10,
                                    width: "40px",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "22px",
                                    color: "#8BC34A",
                                    pointerEvents: "none",
                                }}
                            >
                                →
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* CTA row */}
            <div style={{ textAlign: "center", marginTop: "36px" }}>
                <button
                    onClick={() => goAuth('/marketplace')}
                    style={{
                        background: "#2E7D32",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "14px",
                        padding: "13px 36px",
                        borderRadius: "12px",
                        border: "none",
                        cursor: "pointer",
                        transition: "background 0.2s ease, transform 0.2s ease",
                        boxShadow: "0 4px 14px rgba(46,125,50,0.25)",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#388E3C"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#2E7D32"; e.currentTarget.style.transform = "none"; }}
                >
                    🚀 Start Renting Now — It's Free
                </button>
            </div>
        </section>
    );
}
