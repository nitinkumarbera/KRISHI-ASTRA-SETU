import API_BASE from '../utils/api';
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EquipmentCard from "./EquipmentCard";

const API = `${API_BASE}`;

export default function FeaturedGrid() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API}/api/equipment/all`)
            .then(r => r.json())
            .then(data => {
                if (data?.success && Array.isArray(data.data)) {
                    // Show only available equipment, max 8 on homepage
                    const available = data.data.filter(e => e.isAvailable).slice(0, 8);
                    setEquipment(available);
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    function goAuth(dest) {
        if (user) navigate(dest);
        else navigate('/login', { state: { from: dest } });
    }

    return (
        <section>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "20px" }}>
                <div>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", fontFamily: "'Poppins', sans-serif", lineHeight: 1.2 }}>
                        Available Near You
                    </h2>
                    <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "4px" }}>
                        Top-rated equipment from verified local lenders
                    </p>
                </div>
                <button
                    onClick={() => goAuth('/marketplace')}
                    style={{ background: 'none', border: 'none', display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", fontWeight: 600, color: "#2E7D32", cursor: "pointer", whiteSpace: "nowrap" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#388E3C"}
                    onMouseLeave={e => e.currentTarget.style.color = "#2E7D32"}
                >
                    View All <ArrowRight size={15} strokeWidth={2.5} />
                </button>
            </div>

            {/* Loading skeleton */}
            {loading && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", background: "#fff" }}>
                            <div style={{ height: "188px", background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)", animation: "pulse 1.5s infinite" }} />
                            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                                <div style={{ height: "16px", borderRadius: "8px", background: "#f0f0f0", width: "70%" }} />
                                <div style={{ height: "12px", borderRadius: "8px", background: "#f0f0f0", width: "50%" }} />
                                <div style={{ height: "12px", borderRadius: "8px", background: "#f0f0f0", width: "60%" }} />
                                <div style={{ height: "40px", borderRadius: "10px", background: "#e8f5e9" }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Real equipment grid */}
            {!loading && equipment.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
                    {equipment.map(item => (
                        <EquipmentCard
                            key={item._id}
                            id={item._id}
                            images={item.images || []}
                            name={item.name}
                            category={item.category}
                            location={item.location
                                ? `📍 ${item.location.village || item.location.district || 'Nearby'}, ${item.location.state || 'MH'}`
                                : '📍 Nearby'}
                            priceHr={item.priceHr}
                            rating={item.averageRating || 4.5}
                            reviews={item.reviewCount || 0}
                            verified={item.owner?.kycStatus === 'Verified'}
                        />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && equipment.length === 0 && (
                <div style={{ textAlign: "center", padding: "48px 20px", color: "#6B7280" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>🚜</div>
                    <p style={{ fontWeight: 700, fontSize: "16px", color: "#374151" }}>No equipment listed yet</p>
                    <p style={{ fontSize: "14px", marginTop: "6px" }}>Be the first to list your farm equipment!</p>
                    <button
                        onClick={() => goAuth('/add-equipment')}
                        style={{ marginTop: "20px", background: "#2E7D32", color: "#fff", border: "none", padding: "12px 28px", borderRadius: "12px", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}
                    >
                        + List Your Equipment
                    </button>
                </div>
            )}

            {/* Load more button */}
            {!loading && equipment.length > 0 && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: "32px" }}>
                    <button
                        onClick={() => goAuth('/marketplace')}
                        style={{ display: "flex", alignItems: "center", gap: "8px", border: "2px solid #2E7D32", color: "#2E7D32", fontWeight: 600, fontSize: "14px", padding: "11px 32px", borderRadius: "12px", background: "transparent", cursor: "pointer", transition: "all 0.2s ease" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#2E7D32"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#2E7D32"; }}
                    >
                        View All Equipment <ArrowRight size={15} strokeWidth={2.5} />
                    </button>
                </div>
            )}
        </section>
    );
}
