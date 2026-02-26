import { useState, useCallback } from "react";
import { MapPin, ShieldCheck, Star, ArrowRight, ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ── Full-screen Lightbox ─────────────────────────────────────────────────────
function Lightbox({ images, startIndex, onClose }) {
    const [idx, setIdx] = useState(startIndex);
    const prev = (e) => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); };
    const next = (e) => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); };

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed", inset: 0, zIndex: 9999,
                background: "rgba(0,0,0,0.92)",
                display: "flex", alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(6px)",
            }}
        >
            {/* Close */}
            <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", zIndex: 2 }}>
                <X size={22} />
            </button>

            {/* Prev */}
            {images.length > 1 && (
                <button onClick={prev} style={{ position: "absolute", left: 16, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", zIndex: 2 }}>
                    <ChevronLeft size={26} />
                </button>
            )}

            {/* Image */}
            <img
                src={images[idx]}
                alt={`photo-${idx + 1}`}
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: "90vw", maxHeight: "88vh", objectFit: "contain", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", userSelect: "none" }}
            />

            {/* Next */}
            {images.length > 1 && (
                <button onClick={next} style={{ position: "absolute", right: 16, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", zIndex: 2 }}>
                    <ChevronRight size={26} />
                </button>
            )}

            {/* Dots */}
            {images.length > 1 && (
                <div style={{ position: "absolute", bottom: 24, display: "flex", gap: 8 }}>
                    {images.map((_, i) => (
                        <span key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
                            style={{ width: i === idx ? 24 : 8, height: 8, borderRadius: 999, background: i === idx ? "#fff" : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.3s" }} />
                    ))}
                </div>
            )}

            {/* Counter */}
            {images.length > 1 && (
                <span style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600 }}>
                    {idx + 1} / {images.length}
                </span>
            )}
        </div>
    );
}

// ── Card Image Carousel ──────────────────────────────────────────────────────
function CardCarousel({ images, name, category, onZoom }) {
    const [idx, setIdx] = useState(0);
    const [animDir, setAnimDir] = useState(null); // 'left' | 'right'
    const [sliding, setSliding] = useState(false);

    const slide = useCallback((dir, e) => {
        e.stopPropagation();
        if (sliding || images.length < 2) return;
        setAnimDir(dir);
        setSliding(true);
        setTimeout(() => {
            setIdx(i => dir === "right" ? (i + 1) % images.length : (i - 1 + images.length) % images.length);
            setAnimDir(null);
            setSliding(false);
        }, 280);
    }, [sliding, images.length]);

    const hasImgs = images && images.length > 0;

    return (
        <div style={{ position: "relative", width: "100%", height: "188px", background: "linear-gradient(145deg, #F1F8E9, #DCEDC8)", overflow: "hidden" }}>

            {hasImgs ? (
                <>
                    <img
                        src={images[idx]}
                        alt={name}
                        onClick={e => { e.stopPropagation(); onZoom(idx); }}
                        style={{
                            width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in",
                            transform: sliding
                                ? animDir === "right" ? "translateX(-8%) scale(0.96)" : "translateX(8%) scale(0.96)"
                                : "translateX(0) scale(1)",
                            transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.28s",
                            opacity: sliding ? 0.55 : 1,
                        }}
                    />

                    {/* Zoom hint overlay */}
                    <div
                        onClick={e => { e.stopPropagation(); onZoom(idx); }}
                        style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s", cursor: "zoom-in", background: "rgba(0,0,0,0.18)" }}
                        className="zoom-hint"
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0}
                    >
                        <div style={{ background: "rgba(255,255,255,0.9)", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}>
                            <ZoomIn size={20} color="#2E7D32" />
                        </div>
                    </div>

                    {/* Prev arrow */}
                    {images.length > 1 && (
                        <button onClick={e => slide("left", e)} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.88)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 6px rgba(0,0,0,0.18)", zIndex: 2 }}>
                            <ChevronLeft size={16} color="#374151" />
                        </button>
                    )}
                    {/* Next arrow */}
                    {images.length > 1 && (
                        <button onClick={e => slide("right", e)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.88)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 6px rgba(0,0,0,0.18)", zIndex: 2 }}>
                            <ChevronRight size={16} color="#374151" />
                        </button>
                    )}

                    {/* Dot indicators */}
                    {images.length > 1 && (
                        <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5, zIndex: 2 }}>
                            {images.map((_, i) => (
                                <span
                                    key={i}
                                    onClick={e => { e.stopPropagation(); setIdx(i); }}
                                    style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 999, background: i === idx ? "#fff" : "rgba(255,255,255,0.55)", cursor: "pointer", transition: "all 0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Photo count badge */}
                    {images.length > 1 && (
                        <span style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.52)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, zIndex: 2 }}>
                            {idx + 1}/{images.length}
                        </span>
                    )}
                </>
            ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <span style={{ fontSize: "52px" }}>🚜</span>
                    <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: 500 }}>{category}</span>
                </div>
            )}
        </div>
    );
}

// ── Main Card ─────────────────────────────────────────────────────────────────
export default function EquipmentCard({
    id, images, image, name = "Farm Equipment",
    location = "Nearby", priceHr = 500, rating = 4.5,
    reviews = 24, verified = true, category = "Equipment"
}) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const stars = [1, 2, 3, 4, 5];

    // Accept both `images` array and legacy `image` string
    const allImages = images?.length ? images : (image ? [image] : []);
    const [lightboxIdx, setLightboxIdx] = useState(null);

    return (
        <>
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
                {/* Image Carousel */}
                <div style={{ position: "relative" }}>
                    <CardCarousel images={allImages} name={name} category={category} onZoom={setLightboxIdx} />

                    {/* Category pill */}
                    <span style={{ position: "absolute", top: "12px", left: "12px", background: "rgba(255,255,255,0.92)", color: "#2E7D32", fontSize: "10px", fontWeight: 700, padding: "4px 10px", borderRadius: "999px", letterSpacing: "0.06em", textTransform: "uppercase", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", zIndex: 3 }}>
                        {category}
                    </span>

                    {/* Verified badge */}
                    {verified && (
                        <span style={{ position: "absolute", top: "12px", right: "12px", background: "#2E7D32", color: "#fff", fontSize: "10px", fontWeight: 600, padding: "4px 10px", borderRadius: "999px", display: "flex", alignItems: "center", gap: "4px", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", zIndex: 3 }}>
                            <ShieldCheck size={11} strokeWidth={2.5} /> Verified
                        </span>
                    )}
                </div>

                {/* Card body */}
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>

                    <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111827", lineHeight: 1.35, fontFamily: "'Poppins', sans-serif" }}>
                        {name}
                    </h3>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ display: "flex", gap: "2px" }}>
                            {stars.map(s => (
                                <Star key={s} size={12} strokeWidth={0} fill={s <= Math.round(rating) ? "#8BC34A" : "#E5E7EB"} />
                            ))}
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>{rating}</span>
                        <span style={{ fontSize: "12px", color: "#9CA3AF" }}>({reviews})</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <MapPin size={13} strokeWidth={2} color="#8BC34A" />
                        <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: 500 }}>{location}</span>
                    </div>

                    <div style={{ height: "1px", background: "#F3F4F6" }} />

                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                        <span style={{ fontSize: "22px", fontWeight: 800, color: "#2E7D32", fontFamily: "'Poppins', sans-serif" }}>
                            ₹{priceHr.toLocaleString("en-IN")}
                        </span>
                        <span style={{ fontSize: "13px", color: "#9CA3AF", fontWeight: 500 }}>/hr</span>
                    </div>

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

            {/* Lightbox */}
            {lightboxIdx !== null && allImages.length > 0 && (
                <Lightbox images={allImages} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
            )}
        </>
    );
}
