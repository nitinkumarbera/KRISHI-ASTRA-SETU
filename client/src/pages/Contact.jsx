import { useState } from 'react';
import { kasAlert } from '../components/KasDialog';
import { Mail, MapPin, Phone, Send } from 'lucide-react';

const CONTACT_INFO = [
    { icon: Mail, label: "Email Us", value: "beranitincs232446@gmail.com", href: "mailto:beranitincs232446@gmail.com", border: "#2E7D32" },
    { icon: Phone, label: "Call Support", value: "+91-8591106399", href: "tel:+918591106399", border: "#8BC34A" },
    { icon: MapPin, label: "Headquarters", value: "Sheth L.U.J & Sir M.V College of Arts, Science & Commerce, Mumbai, MH", href: null, border: "#2563EB" },
];

const SUBJECTS = ["General Inquiry", "Lender Registration Help", "Booking Issues", "KYC Verification Help", "Feedback / Suggestions"];

const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: "10px",
    border: "1.5px solid #E5E7EB", fontSize: "13.5px",
    outline: "none", background: "#F9FAFB", boxSizing: "border-box",
    fontFamily: "inherit", transition: "border-color 0.18s",
};

export default function Contact() {
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", subject: SUBJECTS[0], message: "" });
    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    const [loading, setLoading] = useState(false);
    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, source: 'contact_form' })
            });
            const data = await res.json();
            if (res.ok) { setSubmitted(true); }
            else { await kasAlert(data.message || 'Failed to send. Please try again.'); }
        } catch { await kasAlert('Network error. Please check your connection.'); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ background: "#F5F5F5", minHeight: "100vh", paddingBottom: "80px" }}>
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg, #1B5E20, #2E7D32)", padding: "72px 28px 80px", textAlign: "center" }}>
                <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff", fontFamily: "'Poppins', sans-serif", marginBottom: "12px" }}>Contact Support</h1>
                <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.85)", maxWidth: "480px", margin: "0 auto" }}>
                    Have questions about equipment rentals or KYC verification? We're here to help you grow.
                </p>
            </div>

            {/* Negative margin grid to overlap header */}
            <div style={{ maxWidth: "1060px", margin: "-40px auto 0", padding: "0 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", alignItems: "flex-start" }}>

                {/* Left — Info cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {CONTACT_INFO.map((c, i) => {
                        const Icon = c.icon;
                        return (
                            <div key={i} style={{ background: "#fff", borderRadius: "16px", padding: "22px 24px", boxShadow: "0 4px 16px rgba(0,0,0,0.09)", borderBottom: `4px solid ${c.border}` }}>
                                <Icon size={22} color={c.border} style={{ marginBottom: "8px" }} />
                                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>{c.label}</h3>
                                {c.href
                                    ? <a href={c.href} style={{ fontSize: "13px", color: c.border, fontWeight: 600, textDecoration: "none" }}>{c.value}</a>
                                    : <p style={{ fontSize: "12.5px", color: "#6B7280", lineHeight: 1.55 }}>{c.value}</p>
                                }
                            </div>
                        );
                    })}

                    {/* Developer connect */}
                    <div style={{ background: "#fff", borderRadius: "16px", padding: "22px 24px", boxShadow: "0 4px 16px rgba(0,0,0,0.09)", borderBottom: "4px solid #2E7D32" }}>
                        <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "14px" }}>Connect with Developer</h3>
                        <div style={{ display: "flex", gap: "12px" }}>
                            {[
                                { label: "LinkedIn", href: "https://www.linkedin.com/in/nitinkumar-bera-7261a4298", color: "#2563EB" },
                                { label: "Instagram", href: "https://www.instagram.com/beranitinkumar?igsh=dDJnMHI1azAxc2E3", color: "#EC4899" },
                                { label: "GitHub", href: "https://github.com/nitinkumarbera", color: "#111827" },
                            ].map(s => (
                                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                                    style={{ fontSize: "12px", fontWeight: 700, color: s.color, background: "#F5F5F5", padding: "7px 14px", borderRadius: "8px", textDecoration: "none", transition: "all 0.2s" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = s.color; e.currentTarget.style.color = "#fff"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "#F5F5F5"; e.currentTarget.style.color = s.color; }}
                                >
                                    {s.label}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right — Form */}
                <div style={{ background: "#fff", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.09)", padding: "36px" }}>
                    {submitted ? (
                        <div style={{ textAlign: "center", padding: "48px 0" }}>
                            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                                <Send size={28} color="#16A34A" />
                            </div>
                            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#111827", marginBottom: "8px" }}>Feedback Received!</h2>
                            <p style={{ fontSize: "14px", color: "#6B7280" }}>Dhanyavad! Nitin and the team will get back to you soon.</p>
                            <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: SUBJECTS[0], message: "" }); }}
                                style={{ marginTop: "20px", background: "none", border: "none", color: "#2E7D32", fontWeight: 700, fontSize: "14px", cursor: "pointer", textDecoration: "underline" }}>
                                Send another message
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                {[
                                    { name: "name", label: "Your Name *", type: "text", placeholder: "e.g. Nitin Bera" },
                                    { name: "email", label: "Email Address *", type: "email", placeholder: "name@gmail.com" },
                                ].map(f => (
                                    <div key={f.name}>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>{f.label}</label>
                                        <input required type={f.type} name={f.name} value={form[f.name]} onChange={handleChange} placeholder={f.placeholder} style={inputStyle}
                                            onFocus={e => e.target.style.borderColor = "#2E7D32"}
                                            onBlur={e => e.target.style.borderColor = "#E5E7EB"}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Subject</label>
                                <select name="subject" value={form.subject} onChange={handleChange} style={{ ...inputStyle }}>
                                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Your Message *</label>
                                <textarea required name="message" value={form.message} onChange={handleChange} rows={4} placeholder="How can we help your farm today?"
                                    style={{ ...inputStyle, resize: "vertical" }}
                                    onFocus={e => e.target.style.borderColor = "#2E7D32"}
                                    onBlur={e => e.target.style.borderColor = "#E5E7EB"}
                                />
                            </div>
                            <button type="submit" disabled={loading} style={{ width: "100%", background: "#2E7D32", color: "#fff", fontWeight: 700, fontSize: "14px", padding: "14px", borderRadius: "12px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "background 0.2s" }}
                                onMouseEnter={e => e.currentTarget.style.background = "#388E3C"}
                                onMouseLeave={e => e.currentTarget.style.background = "#2E7D32"}
                            >
                                {loading ? 'Sending…' : <><Send size={18} /> Submit Feedback</>}
                            </button>
                        </form>
                    )}
                </div>

            </div>
        </div>
    );
}
