import { GraduationCap, Target, Cpu, ShieldCheck, Github, Linkedin } from 'lucide-react';
import founderImg from '../assets/founder.jpg';

const TECH_ITEMS = ["Google Maps API", "Cloudinary (KYC)", "JWT Authentication", "Tailwind CSS"];

const AIMS = [
    "Reducing individual farmer debt related to equipment loans.",
    "Enhancing crop yield through timely access to specialized tools.",
    "Empowering equipment owners to generate passive income.",
    "Ensuring trust through digital KYC and geo-tagged verification.",
];

export default function AboutUs() {
    return (
        <div style={{ background: "#F5F5F5", minHeight: "100vh" }}>

            {/* ── Header ─────────────────────────────────────────── */}
            <div style={{ background: "linear-gradient(135deg, #1B5E20, #2E7D32, #388E3C)", padding: "72px 28px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "260px", height: "260px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
                <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 800, color: "#fff", fontFamily: "'Poppins', sans-serif", marginBottom: "12px", position: "relative" }}>
                    About Krishi Astra Setu
                </h1>
                <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.85)", fontStyle: "italic", position: "relative" }}>
                    "Bridging Tools, Empowering Farmers"
                </p>
            </div>

            <div style={{ maxWidth: "1060px", margin: "0 auto", padding: "56px 24px 80px", display: "flex", flexDirection: "column", gap: "48px" }}>

                {/* ── Founder Card ─────────────────────────────────── */}
                <section style={{ background: "#fff", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", padding: "40px 44px", display: "flex", gap: "40px", alignItems: "center", flexWrap: "wrap", borderLeft: "8px solid #8BC34A" }}>
                    {/* Avatar */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                        <div style={{ width: "180px", height: "220px", borderRadius: "20px", background: "#F1F8E9", border: "4px solid #388E3C", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
                            <img src={founderImg} alt="Nitin Kumar Bera" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                        </div>
                        <span style={{ background: "#F0FDF4", color: "#16A34A", fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderRadius: "999px", border: "1px solid #BBF7D0" }}>
                            ✅ Founder & Developer
                        </span>
                    </div>
                    {/* Bio */}
                    <div style={{ flex: 1, minWidth: "260px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "7px", color: "#388E3C", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "12px", marginBottom: "10px" }}>
                            <GraduationCap size={18} /> Founder & Developer
                        </div>
                        <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#111827", fontFamily: "'Poppins', sans-serif", marginBottom: "14px" }}>
                            Nitin Kumar Bera
                        </h2>
                        <p style={{ fontSize: "15px", color: "#4B5563", lineHeight: 1.75, marginBottom: "12px" }}>
                            This project is conceptualized and developed by <strong>Nitin Kumar Bera</strong>, a dedicated{" "}
                            <strong>TYBSc Computer Science student</strong> at{" "}
                            <strong>Sheth L.U.J &amp; Sir M.V College of Arts, Science &amp; Commerce</strong>.
                        </p>
                        <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.7 }}>
                            As part of the final year curriculum, this platform was built to demonstrate how Full-Stack development can solve real-world socio-economic challenges in the Indian agricultural sector.
                        </p>
                        {/* Social links */}
                        <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                            <a href="https://github.com/nitinkumarbera" target="_blank" rel="noopener noreferrer"
                                style={{ display: "flex", alignItems: "center", gap: "7px", background: "#F1F8E9", color: "#2E7D32", fontSize: "12px", fontWeight: 700, padding: "8px 14px", borderRadius: "10px", textDecoration: "none", transition: "all 0.2s" }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#2E7D32"; e.currentTarget.style.color = "#fff"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#F1F8E9"; e.currentTarget.style.color = "#2E7D32"; }}
                            >
                                <Github size={14} /> GitHub
                            </a>
                            <a href="https://www.linkedin.com/in/nitinkumar-bera-7261a4298" target="_blank" rel="noopener noreferrer"
                                style={{ display: "flex", alignItems: "center", gap: "7px", background: "#EFF6FF", color: "#2563EB", fontSize: "12px", fontWeight: 700, padding: "8px 14px", borderRadius: "10px", textDecoration: "none", transition: "all 0.2s" }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#2563EB"; e.currentTarget.style.color = "#fff"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.color = "#2563EB"; }}
                            >
                                <Linkedin size={14} /> LinkedIn
                            </a>
                        </div>
                    </div>
                </section>

                {/* ── Mission & Aims Grid ──────────────────────────── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
                    {/* Mission */}
                    <div style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", padding: "32px", borderTop: "4px solid #388E3C" }}>
                        <Target size={40} color="#388E3C" style={{ marginBottom: "16px" }} />
                        <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#111827", fontFamily: "'Poppins', sans-serif", marginBottom: "12px" }}>Our Mission</h3>
                        <p style={{ fontSize: "14px", color: "#4B5563", lineHeight: 1.75 }}>
                            To democratize access to advanced farm machinery. We aim to bridge the "Mechanization Gap" by allowing small-scale farmers to rent high-end tractors and harvesters that would otherwise be financially unreachable.
                        </p>
                    </div>
                    {/* Aims */}
                    <div style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", padding: "32px", borderTop: "4px solid #8BC34A" }}>
                        <ShieldCheck size={40} color="#8BC34A" style={{ marginBottom: "16px" }} />
                        <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#111827", fontFamily: "'Poppins', sans-serif", marginBottom: "12px" }}>Aims &amp; Objectives</h3>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                            {AIMS.map((a, i) => (
                                <li key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                    <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#8BC34A", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px", flexShrink: 0, marginTop: "2px" }}>✓</span>
                                    <span style={{ fontSize: "13.5px", color: "#4B5563", lineHeight: 1.6 }}>{a}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* ── Technical Stack ──────────────────────────────── */}
                <section style={{ background: "#fff", borderRadius: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", padding: "44px", textAlign: "center" }}>
                    <Cpu size={48} color="#2E7D32" style={{ margin: "0 auto 16px" }} />
                    <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", fontFamily: "'Poppins', sans-serif", marginBottom: "12px" }}>Technical Architecture</h3>
                    <p style={{ fontSize: "14px", color: "#6B7280", maxWidth: "580px", margin: "0 auto 28px", lineHeight: 1.7 }}>
                        Krishi Astra Setu is built on the <strong>MERN Stack</strong> (MongoDB, Express, React, Node.js). It integrates advanced modern technologies to ensure reliability and trust:
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px" }}>
                        {TECH_ITEMS.map((t, i) => (
                            <div key={i} style={{ background: "#F5F5F5", borderRadius: "12px", padding: "16px", fontSize: "13px", fontWeight: 700, color: "#2E7D32", transition: "all 0.2s" }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#2E7D32"; e.currentTarget.style.color = "#fff"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#F5F5F5"; e.currentTarget.style.color = "#2E7D32"; }}
                            >
                                {t}
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
}
