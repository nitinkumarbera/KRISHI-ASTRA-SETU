/* ── RefundPolicy.jsx ────────────────────────────────────── */

const SECTIONS = [
    {
        title: "1. The Handover Guarantee",
        clauses: [
            { id: "1.1", text: "Krishi Astra Setu offers a 'Handover Guarantee' on every confirmed booking. If the listed equipment fails to start, is not available, or is in a condition materially different from its listing at the agreed pick-up time, the Renter is entitled to a 100% full refund of all amounts paid." },
            { id: "1.2", text: "To claim the Handover Guarantee, the Renter must report the issue to the platform support team within 60 minutes of the scheduled handover time via the in-app chat or by calling +91-8591106399." },
            { id: "1.3", text: "The platform may require photographic evidence or a video of the equipment at the time of the reported issue. Cooperation with this requirement is necessary to process the refund." },
        ],
    },
    {
        title: "2. Renter-Initiated Cancellations",
        clauses: [
            { id: "2.1", text: "Cancellations made 48 or more hours before the scheduled booking start time: 100% refund of the booking amount." },
            { id: "2.2", text: "Cancellations made between 24 and 48 hours before the scheduled booking start time: 50% refund of the booking amount." },
            { id: "2.3", text: "Cancellations made less than 24 hours before the scheduled booking start time: No refund. The full amount is transferred to the Lender as compensation for lost availability." },
            { id: "2.4", text: "In cases of documented emergency (natural disaster, medical emergency, government curfew), a full refund may be granted at the sole discretion of Krishi Astra Setu upon review of supporting documentation." },
        ],
    },
    {
        title: "3. Lender-Initiated Cancellations",
        clauses: [
            { id: "3.1", text: "If a Lender cancels a confirmed booking at any time, the Renter receives a 100% full refund of all amounts paid, without any deduction." },
            { id: "3.2", text: "Lenders who cancel a confirmed booking within 24 hours of the scheduled start time are subject to a platform penalty fee and a temporary downgrade in their search ranking." },
            { id: "3.3", text: "Repeated Lender-initiated cancellations (3 or more within 90 days) may result in permanent suspension of the Lender's account." },
        ],
    },
    {
        title: "4. Damage & Dispute Resolution",
        clauses: [
            { id: "4.1", text: "In the event of accidental damage caused by the Renter, the Renter's security deposit (if applicable) will be used to cover verified repair costs assessed by the Lender." },
            { id: "4.2", text: "Disputed damage claims must be raised within 12 hours of equipment return. The platform will act as mediator and conduct a review within 5 business days." },
            { id: "4.3", text: "The platform's decision on damage disputes, while advisory, is final for the purpose of security deposit settlement." },
        ],
    },
    {
        title: "5. Refund Processing Timeline",
        clauses: [
            { id: "5.1", text: "Approved refunds are processed within 3–5 business days to the original payment method (UPI, bank account, or wallet)." },
            { id: "5.2", text: "Platform convenience fees (if any) are non-refundable in all cases except Lender-initiated cancellations and Handover Guarantee claims." },
        ],
    },
];

export default function RefundPolicy() {
    return (
        <div style={{ background: "#F5F5F5", minHeight: "100vh" }}>
            <div style={{ background: "linear-gradient(135deg, #1B5E20, #2E7D32)", padding: "56px 28px 48px", textAlign: "center" }}>
                <span style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "5px 14px", borderRadius: "999px", marginBottom: "14px" }}>💰 Legal Document</span>
                <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#fff", fontFamily: "'Poppins', sans-serif", marginBottom: "10px" }}>Refund Policy</h1>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>Krishi Astra Setu Pvt Ltd — Effective: January 1, 2026</p>
            </div>
            <div style={{ maxWidth: "860px", margin: "0 auto", padding: "48px 24px 80px" }}>
                {/* Handover Guarantee highlight box */}
                <div style={{ background: "#2E7D32", borderRadius: "16px", padding: "24px 28px", marginBottom: "32px", display: "flex", gap: "16px", alignItems: "center" }}>
                    <span style={{ fontSize: "36px", flexShrink: 0 }}>🛡️</span>
                    <div>
                        <p style={{ fontSize: "15px", fontWeight: 800, color: "#fff", marginBottom: "4px", fontFamily: "'Poppins', sans-serif" }}>100% Handover Guarantee</p>
                        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", lineHeight: 1.65 }}>
                            If the equipment doesn't start or isn't available at the agreed pick-up time, you get a full refund — guaranteed. No questions asked.
                        </p>
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {SECTIONS.map((s, si) => (
                        <div key={si} style={{ background: "#fff", borderRadius: "16px", padding: "28px 32px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
                            <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#111827", fontFamily: "'Poppins', sans-serif", marginBottom: "18px", paddingBottom: "12px", borderBottom: "1px solid #F3F4F6" }}>{s.title}</h2>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {s.clauses.map(c => (
                                    <div key={c.id} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                        <span style={{ background: "#F1F8E9", color: "#2E7D32", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px", flexShrink: 0, marginTop: "2px" }}>{c.id}</span>
                                        <p style={{ fontSize: "13.5px", color: "#4B5563", lineHeight: 1.75 }}>{c.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ background: "#F1F8E9", borderRadius: "14px", padding: "24px 28px", marginTop: "32px", border: "1px solid #DCEDC8" }}>
                    <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.7 }}>
                        To initiate a refund or report a Handover Guarantee issue, contact us immediately at{" "}
                        <a href="mailto:beranitincs232446@gmail.com" style={{ color: "#2E7D32", fontWeight: 600 }}>beranitincs232446@gmail.com</a>{" "}or call{" "}
                        <strong>+91-8591106399</strong>.
                    </p>
                </div>
            </div>
        </div>
    );
}
