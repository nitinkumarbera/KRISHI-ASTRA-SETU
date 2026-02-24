import { MapPin, ShieldCheck, Star, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function EquipmentCard({ id, image, name = "Farm Equipment", location = "Nearby", priceHr = 500, rating = 4.5, reviews = 24, verified = true, category = "Equipment" }) {

    const navigate = useNavigate();
    const { user } = useAuth();
    const stars = [1, 2, 3, 4, 5];

    return (
        <article
            className="group"
            style={{
                background: "#ffffff",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
                display: "flex",
                flexDirection: "column",
                transition: "box-shadow 0.25s ease, transform 0.25s ease",
                cursor: "pointer",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 10px 30px rgba(46,125,50,0.18)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.07)"; e.currentTarget.style.transform = "none"; }}
        >
            {/* Image area */}
            <div style={{ position: "relative", width: "100%", height: "188px", background: "linear-gradient(145deg, #F1F8E9, #DCEDC8)", overflow: "hidden" }}>
                {image ? (
                    <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        <span style={{ fontSize: "52px" }}>🚜</span>
                        <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: 500 }}>{category}</span>
                    </div>
                )}

                {/* Category pill */}
                <span style={{ position: "absolute", top: "12px", left: "12px", background: "rgba(255,255,255,0.92)", color: "#2E7D32", fontSize: "10px", fontWeight: 700, padding: "4px 10px", borderRadius: "999px", letterSpacing: "0.06em", textTransform: "uppercase", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
                    {category}
                </span>

                {/* Verified badge */}
                {verified && (
                    <span style={{ position: "absolute", top: "12px", right: "12px", background: "#2E7D32", color: "#fff", fontSize: "10px", fontWeight: 600, padding: "4px 10px", borderRadius: "999px", display: "flex", alignItems: "center", gap: "4px", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
                        <ShieldCheck size={11} strokeWidth={2.5} /> Verified
                    </span>
                )}
            </div>

            {/* Card body */}
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>

                {/* Name */}
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111827", lineHeight: 1.35, fontFamily: "'Poppins', sans-serif" }}>
                    {name}
                </h3>

                {/* Stars */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ display: "flex", gap: "2px" }}>
                        {stars.map(s => (
                            <Star key={s} size={12} strokeWidth={0} fill={s <= Math.round(rating) ? "#8BC34A" : "#E5E7EB"} />
                        ))}
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>{rating}</span>
                    <span style={{ fontSize: "12px", color: "#9CA3AF" }}>({reviews})</span>
                </div>

                {/* Location */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <MapPin size={13} strokeWidth={2} color="#8BC34A" />
                    <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: 500 }}>{location}</span>
                </div>

                {/* Divider */}
                <div style={{ height: "1px", background: "#F3F4F6" }} />

                {/* Price */}
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontSize: "22px", fontWeight: 800, color: "#2E7D32", fontFamily: "'Poppins', sans-serif" }}>
                        ₹{priceHr.toLocaleString("en-IN")}
                    </span>
                    <span style={{ fontSize: "13px", color: "#9CA3AF", fontWeight: 500 }}>/hr</span>
                </div>

                {/* CTA button */}
                <button
                    onClick={() => {
                        const dest = id ? `/booking/${id}` : '/booking';
                        if (user) navigate(dest);
                        else navigate('/login', { state: { from: dest } });
                    }}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#2E7D32", color: "#fff", fontWeight: 600, fontSize: "14px", padding: "11px 0", borderRadius: "10px", border: "none", cursor: "pointer", transition: "background 0.2s ease", marginTop: "2px" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#388E3C"}
                    onMouseLeave={e => e.currentTarget.style.background = "#2E7D32"}
                >
                    Book Now <ArrowRight size={15} strokeWidth={2.5} />
                </button>
            </div>
        </article>
    );
}
