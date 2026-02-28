/* ── Footer.jsx ─────────────────────────────────────────────
   Multi-column professional footer
─────────────────────────────────────────────────────────── */
import API_BASE from '../utils/api';
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import VisitorCounter from "./VisitorCounter";

const POLICY_LINKS = ["Privacy Policy", "Terms of Service", "Refund Policy", "Cookie Policy"];
const AIMS = [
    "Reducing Farmer Debt",
    "Promoting Mechanization",
    "Digital Empowerment",
    "Supporting Rural Economy",
];

function FootingLink({ children, to = "#", external = false }) {
    const style = { display: "block", fontSize: "13px", color: "rgba(255,255,255,0.55)", textDecoration: "none", marginBottom: "9px", transition: "color 0.18s ease" };
    const hover = e => e.currentTarget.style.color = "#8BC34A";
    const blur = e => e.currentTarget.style.color = "rgba(255,255,255,0.55)";
    if (external) return <a href={to} target="_blank" rel="noopener noreferrer" style={style} onMouseEnter={hover} onMouseLeave={blur}>{children}</a>;
    return <Link to={to} style={style} onMouseEnter={hover} onMouseLeave={blur}>{children}</Link>;
}

function ColHeading({ children }) {
    return (
        <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#8BC34A", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "18px" }}>
            {children}
        </h4>
    );
}

export default function Footer() {
    const [feedback, setFeedback] = useState("");
    const [fbSent, setFbSent] = useState(false);
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    function authNav(path) {
        if (isAuthenticated) {
            navigate(path);
        } else {
            navigate('/login', { state: { from: path } });
        }
    }

    async function handleFeedback(e) {
        e.preventDefault();
        if (!feedback.trim()) return;
        try {
            await fetch(`${API_BASE}/api/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Anonymous',
                    email: 'anonymous@kas.app',
                    subject: 'Quick Feedback',
                    message: feedback.trim(),
                    source: 'quick_feedback'
                })
            });
        } catch { } // non-critical — swallow errors
        setFbSent(true);
        setFeedback("");
    }

    return (
        <footer style={{ background: "#1B4332" }}>

            {/* ── Quick Feedback strip ─────────────────────── */}
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "14px 28px" }}>
                <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.65)", whiteSpace: "nowrap" }}>💬 Quick Feedback:</span>
                    {fbSent ? (
                        <span style={{ fontSize: "13px", color: "#8BC34A", fontWeight: 600 }}>Thank you! We'll use your feedback to improve the platform. 🙏</span>
                    ) : (
                        <form onSubmit={handleFeedback} style={{ display: "flex", gap: "8px", flex: 1, maxWidth: "500px" }}>
                            <input
                                type="text"
                                value={feedback}
                                onChange={e => setFeedback(e.target.value)}
                                placeholder="How can we improve?"
                                style={{ flex: 1, padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: "13px", outline: "none" }}
                            />
                            <button type="submit" style={{ background: "#8BC34A", color: "#1B4332", fontWeight: 700, fontSize: "12px", padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                                Send →
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "56px 28px 40px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "40px" }}>

                    {/* Col 1 — About */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#2E7D32", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                                🌾
                            </div>
                            <div>
                                <p style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff", fontFamily: "'Poppins', sans-serif" }}>Krishi Astra</p>
                                <p style={{ fontSize: "10px", fontWeight: 600, color: "#8BC34A", letterSpacing: "0.12em", textTransform: "uppercase" }}>Setu</p>
                            </div>
                        </div>
                        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: "20px" }}>
                            Krishi Astra Setu is a community-driven digital bridge empowering Indian farmers through affordable machinery access.
                        </p>
                        {/* Social icons — GitHub, LinkedIn, Instagram */}
                        <div style={{ display: "flex", gap: "10px" }}>
                            {[
                                {
                                    label: "GitHub",
                                    href: "https://github.com/nitinkumarbera",
                                    svg: (
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                                        </svg>
                                    ),
                                },
                                {
                                    label: "LinkedIn",
                                    href: "https://www.linkedin.com/in/nitinkumar-bera-7261a4298",
                                    svg: (
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                        </svg>
                                    ),
                                },
                                {
                                    label: "Instagram",
                                    href: "https://www.instagram.com/beranitinkumar?igsh=dDJnMHI1azAxc2E3",
                                    svg: (
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                        </svg>
                                    ),
                                },
                            ].map(s => (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={s.label}
                                    title={s.label}
                                    style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)", textDecoration: "none", transition: "all 0.2s ease" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(139,195,74,0.2)"; e.currentTarget.style.color = "#8BC34A"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
                                >
                                    {s.svg}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Col 2 — Contact */}
                    <div>
                        <ColHeading>Contact Us</ColHeading>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {[
                                { icon: "📞", text: "+91-8591106399" },
                                { icon: "✉️", text: "beranitincs232446@gmail.com" },
                                { icon: "📍", text: "Krishi Astra Setu Pvt Ltd, Navghar Road, Bhayander East, Thane, Maharashtra – 401105" },
                                { icon: "🕐", text: "Mon–Sat: 9 AM – 6 PM IST" },
                            ].map((c, i) => (
                                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                    <span style={{ fontSize: "15px", flexShrink: 0, marginTop: "1px" }}>{c.icon}</span>
                                    <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>{c.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Col 3 — Policies */}
                    <div>
                        <ColHeading>Information &amp; Policies</ColHeading>
                        <FootingLink to="/privacy">Privacy Policy</FootingLink>
                        <FootingLink to="/terms">Terms of Service</FootingLink>
                        <FootingLink to="/refunds">Refund Policy</FootingLink>
                        <FootingLink to="#">Cookie Policy</FootingLink>

                        <div style={{ marginTop: "20px" }}>
                            <ColHeading>Quick Links</ColHeading>
                            <FootingLink to="/about">About Us</FootingLink>
                            <button onClick={() => authNav('/marketplace')} style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.55)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '9px', padding: 0, textAlign: 'left', transition: 'color 0.18s' }} onMouseEnter={e => e.currentTarget.style.color = '#8BC34A'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}>🔍 Find Equipment</button>
                            <button onClick={() => authNav('/add-equipment')} style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.55)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '9px', padding: 0, textAlign: 'left', transition: 'color 0.18s' }} onMouseEnter={e => e.currentTarget.style.color = '#8BC34A'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}>🌾 List Equipment</button>
                            <FootingLink to="/contact">Contact &amp; Support</FootingLink>
                            <FootingLink to="/">Home</FootingLink>
                        </div>
                    </div>

                    {/* Col 4 — Live Visitor Counter */}
                    <div>
                        <ColHeading>Live Visitors</ColHeading>
                        <VisitorCounter />
                    </div>

                </div>
            </div>


            {/* ── Bottom bar ──────────────────────────────────────── */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "18px 28px" }}>
                <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>
                        © 2026 Krishi Astra Setu. All rights reserved. Made with ❤️ for Indian Farmers.
                    </p>
                    <div style={{ display: "flex", gap: "20px" }}>
                        {["Privacy", "Terms", "Sitemap"].map(l => (
                            <a key={l} href="#" style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", textDecoration: "none", transition: "color 0.2s" }}
                                onMouseEnter={e => e.currentTarget.style.color = "#8BC34A"}
                                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
                            >
                                {l}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

        </footer>
    );
}
