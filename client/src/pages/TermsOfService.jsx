import { Scale, AlertTriangle } from 'lucide-react';

const CLAUSES = [
    {
        id: "1.1",
        label: "Eligibility",
        text: "Users must be at least 18 years of age and possess a valid Aadhaar Card for KYC verification to participate in the rental marketplace.",
    },
    {
        id: "1.2",
        label: "Equipment Maintenance",
        text: "Lenders are responsible for ensuring machinery is in working condition before every rental. Renters must return the equipment in the same state it was received, barring normal wear and tear.",
    },
    {
        id: "1.3",
        label: "Renter Liability for Damage",
        text: "Renters are fully responsible for any accidental damage, misuse, or negligent operation of the rented equipment during the booking period. Costs of repair will be deducted from the security deposit.",
    },
    {
        id: "1.4",
        label: "Cancellation & Refunds",
        text: "Cancellations made 48+ hours before the booking start time are eligible for a 100% refund. Cancellations 24–48 hours before receive a 50% refund. Late cancellations (< 24 hrs) incur no refund as compensation for the lender.",
    },
    {
        id: "1.5",
        label: "Platform Role",
        text: "Krishi Astra Setu acts solely as an intermediary marketplace and is not a party to the rental agreement between Lenders and Renters. The platform is not liable for equipment malfunctions or crop losses.",
    },
    {
        id: "1.6",
        label: "Governing Law",
        text: "These Terms shall be governed by the laws of India. Disputes are subject to the exclusive jurisdiction of the courts of Thane, Maharashtra.",
    },
];

export default function TermsOfService() {
    return (
        <div style={{ background: "#F5F5F5", minHeight: "100vh", paddingBottom: "80px" }}>
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg, #1B5E20, #2E7D32)", padding: "56px 28px 48px", textAlign: "center" }}>
                <span style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "5px 14px", borderRadius: "999px", marginBottom: "14px" }}>📋 Legal Document</span>
                <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#fff", fontFamily: "'Poppins', sans-serif", marginBottom: "8px" }}>Terms of Service</h1>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>Rules &amp; Regulations for Platform Use — Effective: January 1, 2026</p>
            </div>

            <div style={{ maxWidth: "860px", margin: "0 auto", padding: "48px 24px 0", display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Intro */}
                <div style={{ background: "#fff", borderRadius: "16px", padding: "24px 28px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", borderLeft: "4px solid #2E7D32" }}>
                    <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.75 }}>
                        By accessing or using the Krishi Astra Setu platform, you agree to be bound by these Terms. Please read them carefully before creating an account or making a booking.
                    </p>
                </div>

                {/* User Agreement card */}
                <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", borderTop: "4px solid #2E7D32" }}>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111827", fontFamily: "'Poppins', sans-serif", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <Scale size={22} color="#2E7D32" /> User Agreement
                    </h2>

                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {CLAUSES.map(c => (
                            <div key={c.id}>
                                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
                                    <span style={{ color: "#2E7D32" }}>{c.id}</span> — {c.label}
                                </h3>
                                <p style={{ fontSize: "13.5px", color: "#4B5563", lineHeight: 1.75 }}>{c.text}</p>
                            </div>
                        ))}
                    </div>

                    {/* Handover token alert */}
                    <div style={{ background: "#FFF7ED", borderLeft: "4px solid #F97316", borderRadius: "10px", padding: "16px 20px", marginTop: "24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#C2410C", fontWeight: 700, marginBottom: "6px" }}>
                            <AlertTriangle size={17} /> Handover Protocol
                        </div>
                        <p style={{ fontSize: "13px", color: "#9A3412", lineHeight: 1.7 }}>
                            A <strong>6-digit Handover Token</strong> must be exchanged only after physical inspection of the tool. Once the token is entered, the rental period officially begins and the Renter assumes full responsibility for the equipment.
                        </p>
                    </div>
                </div>

                {/* Footer note */}
                <div style={{ textAlign: "center", padding: "16px", fontSize: "13px", color: "#9CA3AF" }}>
                    By using Krishi Astra Setu, you agree to follow these guidelines to support the Indian farming community.
                </div>
            </div>
        </div>
    );
}
