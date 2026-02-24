import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EquipmentCard from "./EquipmentCard";

const MOCK_EQUIPMENT = [
    { id: 1, name: "Mahindra 575 DI Tractor", category: "Tractor", location: "📍 3 km away · Pune, MH", priceHr: 500, rating: 4.8, reviews: 42, verified: true },
    { id: 2, name: "Kartar 4000 Harvester", category: "Harvester", location: "📍 7 km away · Nashik, MH", priceHr: 1200, rating: 4.5, reviews: 29, verified: true },
    { id: 3, name: "Aspee HTP Knapsack Sprayer", category: "Sprayer", location: "📍 2 km away · Aurangabad, MH", priceHr: 150, rating: 4.3, reviews: 17, verified: false },
    { id: 4, name: "Sonalika Rotavator 7ft", category: "Rotavator", location: "📍 11 km away · Satara, MH", priceHr: 350, rating: 4.6, reviews: 35, verified: true },
];

export default function FeaturedGrid() {
    const { user } = useAuth();
    const navigate = useNavigate();

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

            {/* Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
                {MOCK_EQUIPMENT.map(item => (
                    <EquipmentCard key={item.id} {...item} />
                ))}
            </div>

            {/* Load more button */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: "32px" }}>
                <button
                    onClick={() => goAuth('/marketplace')}
                    style={{ display: "flex", alignItems: "center", gap: "8px", border: "2px solid #2E7D32", color: "#2E7D32", fontWeight: 600, fontSize: "14px", padding: "11px 32px", borderRadius: "12px", background: "transparent", cursor: "pointer", transition: "all 0.2s ease" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#2E7D32"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#2E7D32"; }}
                >
                    Load More Equipment <ArrowRight size={15} strokeWidth={2.5} />
                </button>
            </div>
        </section>
    );
}
