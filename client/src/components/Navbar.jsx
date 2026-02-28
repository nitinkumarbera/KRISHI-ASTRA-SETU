import API_BASE from '../utils/api';
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    Search, Heart, CalendarDays, UserCircle2, Menu, X, ChevronDown,
    LogOut, ShieldCheck, Bell, Clock, CheckCircle2, AlertCircle, Info
} from "lucide-react";
import logo from "../assets/logo.svg";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const NAV_LINKS = (t, isAuthenticated) => [
    { label: 'Home', to: '/' },
    { label: t('nav.marketplace'), to: isAuthenticated ? '/marketplace' : '/login', state: !isAuthenticated ? { from: '/marketplace' } : undefined },
    { label: t('nav.about'), to: '/about' },
    { label: t('nav.contact'), to: '/contact' },
];


export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [langMenuOpen, setLangMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const { user, isAuthenticated, token: authToken, isAdmin, logout } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    // Determine if a nav link is active
    const isActive = (to) => {
        if (to === '/') return location.pathname === '/';
        return location.pathname.startsWith(to);
    };

    const languages = [
        { code: 'en', label: 'English' },
        { code: 'hi', label: 'हिंदी (Hindi)' },
        { code: 'mr', label: 'मराठी (Marathi)' }
    ];

    const fetchNotifications = async () => {
        if (!authToken) return;
        try {
            const res = await fetch(`${API_BASE}/api/notifications`, {
                headers: { 'x-auth-token': authToken }
            });
            const d = await res.json();
            if (d.success) setNotifications(d.data);
        } catch (err) {
            console.error('Notif fetch failed');
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, authToken]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleNotifClick = async (notif) => {
        if (!notif.isRead) {
            await fetch(`${API_BASE}/api/notifications/${notif._id}/read`, {
                method: 'PATCH',
                headers: { 'x-auth-token': authToken }
            });
            fetchNotifications();
        }
        if (notif.link) navigate(notif.link);
        setNotifOpen(false);
    };

    const markAllRead = async () => {
        await fetch(`${API_BASE}/api/notifications/read-all`, {
            method: 'POST',
            headers: { 'x-auth-token': authToken }
        });
        fetchNotifications();
    };

    const handleLogout = () => { logout(); navigate('/login'); setUserMenuOpen(false); };

    return (
        <>
            {/* Announcement strip */}
            <div style={{ background: "#2E7D32", color: "#fff", textAlign: "center", fontSize: "12px", padding: "8px 16px", fontWeight: 500, letterSpacing: "0.02em" }}>
                🌾 Rent quality farm equipment at the best prices — Harvest more, spend less!
            </div>

            {/* Main Navbar */}
            <header style={{ position: "sticky", top: 0, zIndex: 50, background: "#fff", borderBottom: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", gap: "12px", height: "64px" }}>

                    {/* Logo — Link prevents full page reload */}
                    <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
                        <img src={logo} alt="Krishi Astra Setu" style={{ height: "48px", width: "auto" }} />
                        <div style={{ display: "none" }} className="md:block">
                            <p style={{ fontSize: "14px", fontWeight: 800, color: "#2E7D32", lineHeight: 1.2 }}>Krishi Astra</p>
                            <p style={{ fontSize: "10px", fontWeight: 700, color: "#8BC34A", letterSpacing: "0.12em", textTransform: "uppercase" }}>Setu</p>
                        </div>
                    </Link>

                    {/* Category button — desktop only */}
                    <button
                        style={{ display: "none", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, padding: "8px 12px", borderRadius: "8px", border: "2px solid #2E7D32", color: "#2E7D32", background: "transparent", cursor: "pointer", flexShrink: 0, transition: "all 0.18s" }}
                        className="lg:flex"
                        onMouseEnter={e => { e.currentTarget.style.background = "#2E7D32"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#2E7D32"; }}
                    >
                        {t('nav.all_equipment')} <ChevronDown size={14} />
                    </button>

                    {/* Central Branding */}
                    <div style={{ flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center" }} className="hidden sm:flex">
                        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#2E7D32", margin: 0, lineHeight: 1, fontFamily: "'Poppins', sans-serif" }}>
                            Krishi Astra Setu
                        </h1>
                        <p style={{ fontSize: "10px", fontWeight: 700, color: "#8BC34A", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "1px" }}>
                            Bridging Tools, Empowering Farmers
                        </p>
                    </div>

                    {/* Desktop nav links */}
                    <nav style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }} className="hidden md:flex">
                        {NAV_LINKS(t, isAuthenticated).map(n => {
                            const active = isActive(n.to);
                            return (
                                <Link key={n.to} to={n.to}
                                    state={n.state}
                                    style={{
                                        fontSize: "13px", fontWeight: active ? 800 : 600,
                                        color: active ? "#2E7D32" : "#4B5563",
                                        textDecoration: "none", padding: "6px 10px",
                                        borderRadius: "8px", transition: "all 0.18s",
                                        background: active ? "#F1F8E9" : "transparent",
                                        borderBottom: active ? "2px solid #2E7D32" : "2px solid transparent",
                                    }}
                                    onMouseEnter={e => { if (!active) { e.currentTarget.style.color = "#2E7D32"; e.currentTarget.style.background = "#F1F8E9"; } }}
                                    onMouseLeave={e => { if (!active) { e.currentTarget.style.color = "#4B5563"; e.currentTarget.style.background = ""; } }}
                                >
                                    {n.label}
                                </Link>
                            );
                        })}
                        {/* List Your Tool — always visible in desktop nav */}
                        <Link
                            to={isAuthenticated ? "/add-equipment" : "/login"}
                            state={!isAuthenticated ? { from: "/add-equipment" } : undefined}
                            style={{ fontSize: "13px", fontWeight: 700, color: "#fff", textDecoration: "none", padding: "7px 14px", borderRadius: "10px", background: "#2E7D32", transition: "all 0.18s", border: "none" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#1B5E20"}
                            onMouseLeave={e => e.currentTarget.style.background = "#2E7D32"}
                        >
                            🌾 {t('nav.list_tool')}
                        </Link>
                    </nav>

                    {/* Right action buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "auto", flexShrink: 0 }}>

                        {/* Admin Panel link */}
                        {isAdmin && (
                            <Link to="/admin-dashboard"
                                style={{ display: "flex", alignItems: "center", gap: "6px", background: "#FFF3E0", color: "#E65100", fontSize: "12px", fontWeight: 800, padding: "7px 14px", borderRadius: "10px", textDecoration: "none", border: "1.5px solid #FFCC80", letterSpacing: "0.02em" }}
                            >
                                <ShieldCheck size={15} /> {t('nav.admin')}
                            </Link>
                        )}

                        {/* ── Language Switcher ── */}
                        <div style={{ position: "relative" }}>
                            <button onClick={() => setLangMenuOpen(v => !v)}
                                style={{ background: "none", border: "1.5px solid #E5E7EB", borderRadius: "10px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#4B5563" }}
                            >
                                {language.toUpperCase()} <ChevronDown size={14} />
                            </button>
                            {langMenuOpen && (
                                <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#fff", borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", minWidth: "150px", border: "1px solid #E5E7EB", zIndex: 100, overflow: "hidden" }}>
                                    {languages.map(l => (
                                        <button key={l.code} onClick={() => { setLanguage(l.code); setLangMenuOpen(false); }}
                                            style={{ width: "100%", padding: "10px 16px", background: language === l.code ? "#F1F8E9" : "#fff", border: "none", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: language === l.code ? "#2E7D32" : "#374151", textAlign: "left" }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                                            onMouseLeave={e => e.currentTarget.style.background = language === l.code ? "#F1F8E9" : "#fff"}
                                        >
                                            {language === l.code && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2E7D32" }} />}
                                            {l.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Notification Bell ── */}
                        {isAuthenticated && (
                            <div style={{ position: "relative" }}>
                                <button
                                    onClick={() => setNotifOpen(v => !v)}
                                    style={{ background: notifOpen ? "#F3F4F6" : "none", border: "none", borderRadius: "10px", padding: "8px", cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", color: notifOpen ? "#2E7D32" : "#6B7280" }}
                                >
                                    <Bell size={20} strokeWidth={2.5} />
                                    {unreadCount > 0 && (
                                        <span style={{ position: "absolute", top: "5px", right: "5px", background: "#DC2626", color: "#fff", fontSize: "10px", fontWeight: 900, borderRadius: "50%", minWidth: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {notifOpen && (
                                    <div style={{ position: "absolute", right: 0, top: "calc(100% + 12px)", background: "#fff", borderRadius: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.15)", width: "320px", border: "1px solid #E5E7EB", zIndex: 100, overflow: "hidden" }}>
                                        <div style={{ padding: "14px 18px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#111827" }}>Notifications</h4>
                                            {unreadCount > 0 && (
                                                <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#2E7D32", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>Mark all seen</button>
                                            )}
                                        </div>
                                        <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                                            {notifications.length === 0 ? (
                                                <div style={{ padding: "40px 20px", textAlign: "center", color: "#9CA3AF" }}>
                                                    <Bell size={32} style={{ margin: "0 auto 12px", opacity: 0.2 }} />
                                                    <p style={{ fontSize: "13px", fontWeight: 600 }}>No notifications yet</p>
                                                </div>
                                            ) : (
                                                notifications.map(n => {
                                                    const Icon = n.type === 'Booking' ? Clock : n.type === 'KYC' ? ShieldCheck : Info;
                                                    return (
                                                        <div
                                                            key={n._id}
                                                            onClick={() => handleNotifClick(n)}
                                                            style={{ padding: "14px 18px", borderBottom: "1px solid #F3F4F6", cursor: "pointer", transition: "background 0.2s", background: n.isRead ? "#fff" : "#F0FDF4", display: "flex", gap: "12px" }}
                                                            onMouseEnter={e => e.currentTarget.style.background = n.isRead ? "#F9FAFB" : "#E8F5E9"}
                                                            onMouseLeave={e => e.currentTarget.style.background = n.isRead ? "#fff" : "#F0FDF4"}
                                                        >
                                                            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: n.type === 'Booking' ? '#E0F2F1' : '#F3F4F6', display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: n.type === 'Booking' ? '#2E7D32' : '#6B7280' }}>
                                                                <Icon size={18} />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <p style={{ margin: "0 0 3px", fontSize: "13px", color: "#1F2937", fontWeight: n.isRead ? 500 : 700, lineHeight: 1.4 }}>{n.message}</p>
                                                                <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF" }}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                            </div>
                                                            {!n.isRead && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2E7D32", marginTop: "6px" }} />}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {isAuthenticated ? (
                            /* ── User Avatar + Dropdown ── */
                            <div style={{ position: "relative" }}>
                                <button onClick={() => setUserMenuOpen(v => !v)}
                                    style={{ display: "flex", alignItems: "center", gap: "8px", background: "#F1F8E9", border: "1.5px solid #A5D6A7", borderRadius: "10px", padding: "6px 12px 6px 6px", cursor: "pointer" }}
                                >
                                    {user?.documents?.passportPhoto
                                        ? <img src={user.documents.passportPhoto} alt="" style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover", border: "2px solid #2E7D32" }} />
                                        : <UserCircle2 size={28} color="#2E7D32" />
                                    }
                                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#2E7D32", maxWidth: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name?.first || "User"}</span>
                                    <ChevronDown size={14} color="#6B7280" />
                                </button>

                                {userMenuOpen && (
                                    <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#fff", borderRadius: "14px", boxShadow: "0 8px 32px rgba(0,0,0,0.14)", minWidth: "200px", border: "1px solid #E5E7EB", zIndex: 100, overflow: "hidden" }}
                                        onMouseLeave={() => setUserMenuOpen(false)}
                                    >
                                        <div style={{ padding: "12px 16px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                                            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#1F2937" }}>{user?.name?.first} {user?.name?.last}</p>
                                            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#6B7280" }}>{user?.memberID || user?.role}</p>
                                            <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "99px", background: user?.kycStatus === 'Verified' ? '#E8F5E9' : '#FFF3E0', color: user?.kycStatus === 'Verified' ? '#2E7D32' : '#E65100' }}>
                                                {user?.kycStatus === 'Verified' ? '✅ Verified' : '⏳ ' + (user?.kycStatus || 'Pending')}
                                            </span>
                                        </div>
                                        <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                                            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 16px", fontSize: "13px", fontWeight: 600, color: "#374151", textDecoration: "none" }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#F1F8E9'}
                                            onMouseLeave={e => e.currentTarget.style.background = ''}
                                        >
                                            <UserCircle2 size={16} /> My Profile
                                        </Link>
                                        <Link to="/add-equipment" onClick={() => setUserMenuOpen(false)}
                                            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 16px", fontSize: "13px", fontWeight: 600, color: "#2E7D32", textDecoration: "none", borderTop: "1px solid #F3F4F6" }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#F1F8E9'}
                                            onMouseLeave={e => e.currentTarget.style.background = ''}
                                        >
                                            🌾 {t('nav.list_tool')}
                                        </Link>
                                        <button onClick={handleLogout}
                                            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 16px", fontSize: "13px", fontWeight: 600, color: "#DC2626", background: "none", border: "none", width: "100%", cursor: "pointer", borderTop: "1px solid #F3F4F6" }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                                            onMouseLeave={e => e.currentTarget.style.background = ''}
                                        >
                                            <LogOut size={16} /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login"
                                style={{ display: "flex", alignItems: "center", gap: "8px", background: "#2E7D32", color: "#fff", fontSize: "13px", fontWeight: 700, padding: "9px 18px", borderRadius: "10px", textDecoration: "none", transition: "background 0.18s" }}
                                onMouseEnter={e => e.currentTarget.style.background = "#388E3C"}
                                onMouseLeave={e => e.currentTarget.style.background = "#2E7D32"}
                            >
                                <UserCircle2 size={17} strokeWidth={1.75} />
                                <span className="hidden sm:block">Login</span>
                            </Link>
                        )}

                        {/* Hamburger — mobile only */}
                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", display: "block" }} className="sm:hidden"
                            onClick={() => setMobileOpen(v => !v)}>
                            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile drawer */}
                {mobileOpen && (
                    <div style={{ background: "#fff", borderTop: "1px solid #F3F4F6", padding: "12px 20px 20px", display: "flex", flexDirection: "column", gap: "6px" }} className="sm:hidden">
                        {/* Mobile search */}
                        <div style={{ position: "relative", marginBottom: "8px" }}>
                            <input type="text" placeholder="Search equipment..."
                                style={{ width: "100%", borderRadius: "999px", padding: "10px 48px 10px 16px", fontSize: "13px", border: "1.5px solid #E5E7EB", outline: "none", background: "#F5F5F5", boxSizing: "border-box" }} />
                            <button style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", background: "#2E7D32", color: "#fff", border: "none", borderRadius: "50%", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                <Search size={14} strokeWidth={2.5} />
                            </button>
                        </div>
                        {/* Mobile page links */}
                        {[
                            { label: "🏠 Home", to: "/" },
                            { label: "🚜 Marketplace", to: "/marketplace" },
                            { label: "🌾 " + t('nav.list_tool'), to: isAuthenticated ? "/add-equipment" : "/login" },
                            { label: "ℹ️  About Us", to: "/about" },
                            { label: "📬 Contact", to: "/contact" },
                            { label: "🔒 Privacy Policy", to: "/privacy" },
                            { label: "📋 Terms of Service", to: "/terms" },
                        ].map(n => (
                            <Link key={n.to} to={n.to}
                                onClick={() => setMobileOpen(false)}
                                style={{ display: "block", padding: "11px 14px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, color: "#374151", textDecoration: "none", transition: "all 0.15s" }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#F1F8E9"; e.currentTarget.style.color = "#2E7D32"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "#374151"; }}
                            >
                                {n.label}
                            </Link>
                        ))}
                    </div>
                )}
            </header>
        </>
    );
}
