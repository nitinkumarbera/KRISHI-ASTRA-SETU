import { Lock, EyeOff, ShieldCheck } from 'lucide-react';

const SECTIONS = [
    {
        icon: Lock,
        title: "1. Data Collection & Security",
        text: "At Krishi Astra Setu, we collect essential personal information including name, contact details, and Aadhaar/KYC documents to ensure a trusted marketplace. As a project developed at Sheth L.U.J & Sir M.V College, we prioritize data integrity. All sensitive documents are stored using Cloudinary's secure storage and are never shared with third parties.",
        border: "#2E7D32",
    },
    {
        icon: EyeOff,
        title: "2. Real-Time Location Tracking",
        text: "We use Google Maps API to provide location-based search results. Your location data is used solely to calculate the distance between lenders and renters to facilitate logistics. We do not track your background location once the application is closed.",
        border: "#2E7D32",
    },
    {
        icon: ShieldCheck,
        title: "3. User Authentication",
        text: "User sessions are protected using JSON Web Tokens (JWT). This ensures that your private dashboard, booking history, and equipment listings are only accessible by you.",
        border: "#2E7D32",
    },
    {
        icon: Lock,
        title: "4. Aadhaar Data Protection",
        text: "Aadhaar card numbers and scans are encrypted using AES-256 encryption at rest and are transmitted over TLS 1.3. This data is used exclusively for KYC identity verification and is never shared with any equipment owner, third party, or government body without explicit legal obligation.",
        border: "#2E7D32",
    },
    {
        icon: ShieldCheck,
        title: "5. Your Rights",
        text: "You may request a full export of your personal data, correct inaccurate information, or permanently delete your account at any time by emailing beranitincs232446@gmail.com. Deletion requests are processed within 30 working days subject to applicable legal data retention requirements.",
        border: "#2E7D32",
    },
];

export default function PrivacyPolicy() {
    return (
        <div style={{ background: "#F5F5F5", minHeight: "100vh", paddingBottom: "80px" }}>
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg, #1B5E20, #2E7D32)", padding: "56px 28px 48px", textAlign: "center" }}>
                <span style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "5px 14px", borderRadius: "999px", marginBottom: "14px" }}>🔒 Legal Document</span>
                <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#fff", fontFamily: "'Poppins', sans-serif", marginBottom: "8px" }}>Privacy Policy</h1>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>Last Updated: February 2026 — Effective: January 1, 2026</p>
            </div>

            <div style={{ maxWidth: "860px", margin: "0 auto", padding: "48px 24px 0", display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Intro */}
                <div style={{ background: "#fff", borderRadius: "16px", padding: "24px 28px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", borderLeft: "4px solid #2E7D32" }}>
                    <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.75 }}>
                        Krishi Astra Setu Pvt Ltd ("we", "us", "our") is committed to protecting the privacy of all farmers, lenders, and visitors. This Privacy Policy explains what data we collect, how we use it, and your rights.
                    </p>
                </div>

                {/* Clause cards */}
                {SECTIONS.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <div key={i} style={{ background: "#fff", borderRadius: "16px", padding: "28px 32px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", borderLeft: `4px solid ${s.border}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", color: "#2E7D32" }}>
                                <Icon size={22} strokeWidth={2} />
                                <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#111827", fontFamily: "'Poppins', sans-serif" }}>{s.title}</h2>
                            </div>
                            <p style={{ fontSize: "13.5px", color: "#4B5563", lineHeight: 1.8 }}>{s.text}</p>
                        </div>
                    );
                })}

                {/* Contact */}
                <div style={{ background: "#F1F8E9", borderRadius: "14px", padding: "22px 28px", border: "1px solid #DCEDC8" }}>
                    <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.7 }}>
                        Questions? Contact our Data Protection Officer at{" "}
                        <a href="mailto:beranitincs232446@gmail.com" style={{ color: "#2E7D32", fontWeight: 600 }}>beranitincs232446@gmail.com</a> or write to Krishi Astra Setu Pvt Ltd, Navghar Road, Bhayander East, Thane, Maharashtra – 401105.
                    </p>
                </div>
            </div>
        </div>
    );
}
