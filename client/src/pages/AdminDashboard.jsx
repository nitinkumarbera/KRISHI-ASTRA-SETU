import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ShieldCheck, Users, Clock, XCircle, CheckCircle, Eye, EyeOff,
    MapPin, Building, RefreshCw, X, AlertCircle, Search, Trash2,
    Package, CalendarDays, Star, Megaphone, BarChart3, Send
} from 'lucide-react';
import { kasAlert, kasPrompt } from '../components/KasDialog';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

const API = 'http://localhost:5000';
const C = {
    green: '#2E7D32', lightGreen: '#4CAF50', paleGreen: '#E8F5E9',
    orange: '#F57C00', paleOrange: '#FFF3E0',
    red: '#C62828', paleRed: '#FFEBEE',
    blue: '#1565C0', paleBlue: '#E3F2FD',
    purple: '#6A1B9A', palePurple: '#F3E5F5',
    gray: '#6B7280', bg: '#F0F4F0'
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ── Shared helpers ────────────────────────────────────────────
function KycBadge({ status }) {
    const map = {
        Pending: { bg: C.paleOrange, color: C.orange, label: '⏳ Pending' },
        Verified: { bg: C.paleGreen, color: C.green, label: '✅ Verified' },
        Rejected: { bg: C.paleRed, color: C.red, label: '❌ Rejected' },
    };
    const s = map[status] || map.Pending;
    return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 700 }}>{s.label}</span>;
}

function StatusBadge({ status }) {
    const map = {
        Pending: { bg: C.paleOrange, color: C.orange },
        Confirmed: { bg: C.paleBlue, color: C.blue },
        Active: { bg: C.paleGreen, color: C.green },
        Completed: { bg: '#E0F2F1', color: '#00695C' },
        Cancelled: { bg: C.paleRed, color: C.red },
    };
    const s = map[status] || map.Pending;
    return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 700 }}>{status}</span>;
}

function Stars({ rating }) {
    return (
        <span style={{ color: '#F59E0B', fontSize: '13px', letterSpacing: '1px' }}>
            {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
            <span style={{ color: C.gray, marginLeft: '4px', fontWeight: 600 }}>{rating?.toFixed(1)}</span>
        </span>
    );
}

function InfoRow({ label, value }) {
    if (!value) return null;
    return (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '13px' }}>
            <span style={{ color: C.gray, minWidth: '120px', flexShrink: 0, fontWeight: 600 }}>{label}</span>
            <span style={{ color: '#1F2937', wordBreak: 'break-word' }}>{value}</span>
        </div>
    );
}

function DocThumbnail({ label, url }) {
    if (!url) return (
        <div style={{ border: '2px dashed #D1D5DB', borderRadius: '12px', padding: '16px', textAlign: 'center', color: '#9CA3AF', fontSize: '12px' }}>
            <EyeOff size={20} style={{ margin: '0 auto 6px' }} /><p>{label}</p><p style={{ fontSize: '10px' }}>Not uploaded</p>
        </div>
    );
    return (
        <div style={{ border: '1.5px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', padding: '6px 8px', borderBottom: '1px solid #E5E7EB', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
            <img src={url} alt={label} style={{ width: '100%', height: '130px', objectFit: 'cover', cursor: 'zoom-in', display: 'block' }} onClick={() => window.open(url, '_blank')} />
        </div>
    );
}

function StatCard({ label, count, color, icon, sub }) {
    return (
        <div style={{ flex: 1, background: '#fff', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `5px solid ${color}`, minWidth: '140px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <p style={{ fontSize: '12px', color: C.gray, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{label}</p>
                    <p style={{ fontSize: '28px', fontWeight: 800, color, margin: '4px 0 0' }}>{typeof count === 'number' ? count.toLocaleString('en-IN') : count}</p>
                    {sub && <p style={{ fontSize: '11px', color: C.gray, margin: '2px 0 0' }}>{sub}</p>}
                </div>
                <div style={{ fontSize: '28px', opacity: 0.15 }}>{icon}</div>
            </div>
        </div>
    );
}


function EmptyState({ icon, msg }) {
    return (
        <div style={{ padding: '60px', textAlign: 'center', color: C.gray }}>
            <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>{icon}</div>
            <p style={{ fontWeight: 600 }}>{msg}</p>
        </div>
    );
}

function TableWrap({ children }) {
    return <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>{children}</div>;
}

function TH({ children }) {
    return <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: C.gray, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#F9FAFB', borderBottom: '1.5px solid #E5E7EB' }}>{children}</th>;
}
function TD({ children, style }) {
    return <td style={{ padding: '13px 16px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #F3F4F6', ...style }}>{children}</td>;
}

function fmt(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
export default function AdminDashboard() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('kyc');
    const [toast, setToast] = useState(null);

    // KYC state
    const [kycTab, setKycTab] = useState('Pending');
    const [kycUsers, setKycUsers] = useState([]);
    const [kycStats, setKycStats] = useState({ pending: 0, verified: 0, rejected: 0, total: 0 });
    const [selectedUser, setSelectedUser] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectBox, setShowRejectBox] = useState(false);
    const [kycSearch, setKycSearch] = useState('');
    const [kycLoading, setKycLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    // Equipment state
    const [equipment, setEquipment] = useState([]);
    const [equipLoading, setEquipLoading] = useState(false);
    const [selectedEquip, setSelectedEquip] = useState(null);

    // Bookings state
    const [bookings, setBookings] = useState([]);
    const [bookLoading, setBookLoading] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [reviewLoading, setReviewLoading] = useState(false);

    // Analytics state
    const [analytics, setAnalytics] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    // Announce state
    const [announcement, setAnnouncement] = useState('');
    const [announceSending, setAnnounceSending] = useState(false);

    // Feedback state
    const [feedbacks, setFeedbacks] = useState([]);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);

    const headers = { 'x-auth-token': token, 'Content-Type': 'application/json' };

    useEffect(() => { if (user && user.role !== 'Admin') navigate('/'); }, [user, navigate]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ── Fetch helpers ──────────────────────────────────────────
    const fetchKycStats = useCallback(async () => {
        try {
            const r = await fetch(`${API}/api/admin/stats`, { headers });
            if (r.ok) { const d = await r.json(); setKycStats(d.data); }
        } catch { }
    }, [token]);

    const fetchKycUsers = useCallback(async () => {
        setKycLoading(true);
        try {
            const r = await fetch(`${API}/api/admin/users?status=${kycTab}`, { headers });
            if (r.ok) { const d = await r.json(); setKycUsers(d.data); }
        } catch { }
        setKycLoading(false);
    }, [kycTab, token]);

    const fetchEquipment = useCallback(async () => {
        setEquipLoading(true);
        try {
            const r = await fetch(`${API}/api/admin/equipment`, { headers });
            if (r.ok) { const d = await r.json(); setEquipment(d.data); }
        } catch { }
        setEquipLoading(false);
    }, [token]);

    const fetchBookings = useCallback(async () => {
        setBookLoading(true);
        try {
            const r = await fetch(`${API}/api/admin/bookings`, { headers });
            if (r.ok) { const d = await r.json(); setBookings(d.data); }
        } catch { }
        setBookLoading(false);
    }, [token]);

    const fetchReviews = useCallback(async () => {
        setReviewLoading(true);
        try {
            const r = await fetch(`${API}/api/admin/reviews`, { headers });
            if (r.ok) { const d = await r.json(); setReviews(d.data); }
        } catch { }
        setReviewLoading(false);
    }, [token]);

    const fetchAnalytics = useCallback(async () => {
        setAnalyticsLoading(true);
        try {
            const r = await fetch(`${API}/api/admin/analytics`, { headers });
            if (r.ok) { const d = await r.json(); setAnalytics(d.data); }
        } catch { }
        setAnalyticsLoading(false);
    }, [token]);

    const fetchFeedbacks = useCallback(async () => {
        setFeedbackLoading(true);
        try {
            const r = await fetch(`${API}/api/feedback`, { headers });
            if (r.ok) {
                const d = await r.json();
                setFeedbacks(d.data || []);
                setUnreadFeedbackCount((d.data || []).filter(f => !f.isRead).length);
            }
        } catch { }
        setFeedbackLoading(false);
    }, [token]);

    useEffect(() => { fetchKycStats(); fetchKycUsers(); }, [kycTab]);
    useEffect(() => { if (activeTab === 'equipment') fetchEquipment(); }, [activeTab]);
    useEffect(() => { if (activeTab === 'bookings') fetchBookings(); }, [activeTab]);
    useEffect(() => { if (activeTab === 'reviews') fetchReviews(); }, [activeTab]);
    useEffect(() => { if (activeTab === 'analytics') fetchAnalytics(); }, [activeTab]);
    useEffect(() => { if (activeTab === 'feedback') fetchFeedbacks(); }, [activeTab]);

    // ── KYC Actions ────────────────────────────────────────────
    const handleKycAction = async (userId, status) => {
        if (status === 'Rejected' && !rejectionReason.trim()) {
            showToast('Enter a rejection reason first.', 'error'); return;
        }
        setActionLoading(userId);
        try {
            const r = await fetch(`${API}/api/admin/verify-user/${userId}`, {
                method: 'PATCH', headers,
                body: JSON.stringify({ status, rejectionReason: status === 'Rejected' ? rejectionReason : '' })
            });
            const d = await r.json();
            if (r.ok) {
                showToast(`${d.data.name.first} ${d.data.name.last} — ${status}!`);
                setKycUsers(p => p.filter(u => u._id !== userId));
                setSelectedUser(null); setRejectionReason(''); setShowRejectBox(false);
                fetchKycStats();
            } else showToast(d.message || 'Action failed.', 'error');
        } catch { showToast('Network error.', 'error'); }
        setActionLoading(null);
    };

    // ── Delete equipment ───────────────────────────────────────
    const handleDeleteEquipment = async (id, name) => {
        const confirmed = await kasPrompt(`Remove "${name}" from the platform? (Type YES to confirm)`);
        if (!confirmed || confirmed.trim().toLowerCase() !== 'yes') return;
        try {
            const r = await fetch(`${API}/api/admin/equipment/${id}`, { method: 'DELETE', headers });
            const d = await r.json();
            if (r.ok) { showToast(d.message); setEquipment(p => p.filter(e => e._id !== id)); }
            else showToast(d.message, 'error');
        } catch { showToast('Network error.', 'error'); }
    };

    // ── Delete user (admin action) ────────────────────────────
    const handleDeleteUser = async (userId, userName) => {
        const confirmed = await kasPrompt(`Delete user "${userName}" and ALL their data? This is irreversible. Type YES to confirm.`);
        if (!confirmed || confirmed.trim().toLowerCase() !== 'yes') return;
        setActionLoading(userId);
        try {
            const r = await fetch(`${API}/api/admin/users/${userId}`, { method: 'DELETE', headers });
            const d = await r.json();
            if (r.ok) {
                showToast(d.message || 'User deleted.');
                setKycUsers(prev => prev.filter(u => u._id !== userId));
                setSelectedUser(null);
                fetchKycStats();
            } else showToast(d.message || 'Delete failed.', 'error');
        } catch { showToast('Network error.', 'error'); }
        setActionLoading(null);
    };

    // ── Delete review ──────────────────────────────────────────
    const handleDeleteReview = async (id) => {
        const confirmed = await kasPrompt('Remove this review? (Type YES to confirm)');
        if (!confirmed || confirmed.trim().toLowerCase() !== 'yes') return;
        try {
            const r = await fetch(`${API}/api/admin/reviews/${id}`, { method: 'DELETE', headers });
            const d = await r.json();
            if (r.ok) { showToast(d.message); setReviews(p => p.filter(rv => rv._id !== id)); }
            else showToast(d.message, 'error');
        } catch { showToast('Network error.', 'error'); }
    };

    // ── Send announcement ──────────────────────────────────────
    const handleAnnounce = async () => {
        if (!announcement.trim()) { showToast('Please type a message.', 'error'); return; }
        setAnnounceSending(true);
        try {
            const r = await fetch(`${API}/api/admin/announce`, { method: 'POST', headers, body: JSON.stringify({ message: announcement }) });
            const d = await r.json();
            if (r.ok) { showToast(d.message); setAnnouncement(''); }
            else showToast(d.message, 'error');
        } catch { showToast('Network error.', 'error'); }
        setAnnounceSending(false);
    };

    // ── Filtered KYC users ─────────────────────────────────────
    const filteredKyc = kycUsers.filter(u => {
        const q = kycSearch.toLowerCase();
        return `${u.name?.first} ${u.name?.last}`.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.address?.district?.toLowerCase().includes(q) ||
            u.aadhaarNo?.includes(q);
    });

    // ── Tab nav config ─────────────────────────────────────────
    const TABS = [
        { id: 'kyc', icon: <ShieldCheck size={16} />, label: 'KYC' },
        { id: 'equipment', icon: <Package size={16} />, label: 'Equipment' },
        { id: 'bookings', icon: <CalendarDays size={16} />, label: 'Bookings' },
        { id: 'reviews', icon: <Star size={16} />, label: 'Reviews' },
        { id: 'announce', icon: <Megaphone size={16} />, label: 'Announce' },
        { id: 'analytics', icon: <BarChart3 size={16} />, label: 'Analytics' },
        { id: 'feedback', icon: <Send size={16} />, label: 'Feedback' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* Toast */}
            {toast && (
                <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: toast.type === 'error' ? C.red : C.green, color: '#fff', padding: '14px 20px', borderRadius: '12px', fontWeight: 600, fontSize: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '360px' }}>
                    {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />} {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ background: C.green, padding: '0 32px', display: 'flex', alignItems: 'center', gap: '16px', height: '64px' }}>
                <ShieldCheck size={28} color="#fff" />
                <div>
                    <p style={{ color: '#fff', fontWeight: 800, fontSize: '18px', margin: 0, lineHeight: 1.2 }}>KAS Admin Command Centre</p>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', margin: 0 }}>Logged in as {user?.email || 'Admin'}</p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <button onClick={() => { fetchKycStats(); fetchKycUsers(); }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px' }}>
                        <RefreshCw size={15} /> Refresh
                    </button>
                </div>
            </div>

            {/* Tab Bar */}
            <div style={{ background: '#fff', borderBottom: '1.5px solid #E5E7EB', padding: '0 32px', display: 'flex', gap: '4px', overflowX: 'auto' }}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '14px 18px', border: 'none', background: 'none', borderBottom: activeTab === t.id ? `3px solid ${C.green}` : '3px solid transparent', color: activeTab === t.id ? C.green : C.gray, fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 24px' }}>

                {/* ══ KYC TAB ══════════════════════════════════════════ */}
                {activeTab === 'kyc' && (
                    <>
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
                            <StatCard label="Total Users" count={kycStats.total} color={C.blue} icon="👥" />
                            <StatCard label="Pending KYC" count={kycStats.pending} color={C.orange} icon="⏳" />
                            <StatCard label="Verified" count={kycStats.verified} color={C.green} icon="✅" />
                            <StatCard label="Rejected" count={kycStats.rejected} color={C.red} icon="❌" />
                        </div>
                        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: '4px', background: '#F3F4F6', borderRadius: '12px', padding: '4px' }}>
                                {['Pending', 'Verified', 'Rejected'].map(s => (
                                    <button key={s} onClick={() => setKycTab(s)} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: kycTab === s ? C.green : 'transparent', color: kycTab === s ? '#fff' : C.gray, fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s' }}>{s === 'Pending' ? `⏳ Pending (${kycStats.pending})` : s === 'Verified' ? '✅ Verified' : '❌ Rejected'}</button>
                                ))}
                            </div>
                            <div style={{ marginLeft: 'auto', position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.gray }} />
                                <input value={kycSearch} onChange={e => setKycSearch(e.target.value)} placeholder="Search name, district, Aadhaar..." style={{ paddingLeft: '36px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px', border: '1.5px solid #E5E7EB', borderRadius: '10px', fontSize: '13px', outline: 'none', minWidth: '240px' }} />
                            </div>
                        </div>

                        <TableWrap>
                            {kycLoading ? <EmptyState icon={<RefreshCw />} msg="Loading…" /> : filteredKyc.length === 0 ? <EmptyState icon="👥" msg={`No ${kycTab.toLowerCase()} users`} /> : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead><tr>{['Farmer Name', 'Mobile', 'District', 'Registered', 'Status', 'Action'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                                    <tbody>
                                        {filteredKyc.map((u, i) => (
                                            <tr key={u._id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                                                <TD><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>{u.documents?.passportPhoto && <img src={u.documents.passportPhoto} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #E5E7EB' }} />}<span style={{ fontWeight: 700, color: '#1F2937' }}>{u.name?.first} {u.name?.middle || ''} {u.name?.last}</span></div></TD>
                                                <TD>{u.mobile}</TD>
                                                <TD>{u.address?.district}, {u.address?.state}</TD>
                                                <TD style={{ color: C.gray }}>{fmt(u.createdAt)}</TD>
                                                <TD><KycBadge status={u.kycStatus} /></TD>
                                                <TD><button onClick={() => { setSelectedUser(u); setRejectionReason(''); setShowRejectBox(false); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: C.paleGreen, color: C.green, border: 'none', padding: '7px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}><Eye size={14} /> Review</button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(u._id, `${u.name?.first} ${u.name?.last}`); }} disabled={actionLoading === u._id} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FECACA', padding: '7px 10px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', marginLeft: '4px' }} title="Delete User"><Trash2 size={13} /></button></TD>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </TableWrap>
                    </>
                )}

                {/* ══ EQUIPMENT TAB ════════════════════════════════════ */}
                {activeTab === 'equipment' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1F2937' }}>📦 All Equipment Listings</h2>
                            <span style={{ background: C.paleGreen, color: C.green, padding: '6px 14px', borderRadius: '99px', fontWeight: 700, fontSize: '13px' }}>{equipment.length} listings</span>
                        </div>
                        <TableWrap>
                            {equipLoading ? <EmptyState icon="📦" msg="Loading equipment…" /> : equipment.length === 0 ? <EmptyState icon="📦" msg="No equipment listed yet" /> : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead><tr>{['Equipment', 'Category', 'Owner', 'Price/Day', 'Location', 'Listed', 'Action'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                                    <tbody>
                                        {equipment.map((e, i) => (
                                            <tr key={e._id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA', cursor: 'pointer' }} onClick={() => setSelectedEquip(e)}>
                                                <TD><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>{e.images?.[0] && <img src={e.images[0]} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />}<div><p style={{ margin: 0, fontWeight: 700, color: '#1F2937', fontSize: '13px' }}>{e.name}</p><p style={{ margin: 0, color: C.gray, fontSize: '11px' }}>{e.brand} {e.modelNo}</p></div></div></TD>
                                                <TD><span style={{ background: C.paleBlue, color: C.blue, padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 700 }}>{e.category}</span></TD>
                                                <TD><p style={{ margin: 0, fontWeight: 600 }}>{e.owner?.name?.first} {e.owner?.name?.last}</p><p style={{ margin: 0, color: C.gray, fontSize: '11px' }}>{e.owner?.mobile}</p></TD>
                                                <TD style={{ fontWeight: 700, color: C.green }}>₹{e.priceHr?.toLocaleString('en-IN')}<span style={{ fontWeight: 400, color: C.gray, fontSize: '11px' }}>/hr</span></TD>
                                                <TD>{e.location?.village}, {e.location?.district}</TD>
                                                <TD style={{ color: C.gray }}>{fmt(e.createdAt)}</TD>
                                                <TD><button onClick={() => handleDeleteEquipment(e._id, e.name)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: C.paleRed, color: C.red, border: 'none', padding: '7px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}><Trash2 size={14} /> Remove</button></TD>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </TableWrap>

                        {/* Equipment Detail Modal */}
                        {selectedEquip && (
                            <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedEquip(null)}>
                                <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '560px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1F2937' }}>📦 Equipment Details</h3>
                                        <button onClick={() => setSelectedEquip(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gray }}><X size={20} /></button>
                                    </div>
                                    {selectedEquip.images?.length > 0 && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: '8px', marginBottom: '16px' }}>
                                            {selectedEquip.images.map((img, idx) => (
                                                <img key={idx} src={img} alt={`img-${idx}`} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '10px', cursor: 'zoom-in' }} onClick={() => window.open(img, '_blank')} />
                                            ))}
                                        </div>
                                    )}
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        <InfoRow label="Name" value={selectedEquip.name} />
                                        <InfoRow label="Category" value={selectedEquip.category} />
                                        <InfoRow label="Brand" value={selectedEquip.brand} />
                                        <InfoRow label="Model No" value={selectedEquip.modelNo} />
                                        <InfoRow label="Year" value={selectedEquip.year?.toString()} />
                                        <InfoRow label="Condition" value={selectedEquip.condition} />
                                        <InfoRow label="Price/Hr" value={selectedEquip.priceHr ? `₹${selectedEquip.priceHr.toLocaleString('en-IN')}/hr` : undefined} />
                                        <InfoRow label="Description" value={selectedEquip.description} />
                                        <InfoRow label="Location" value={[selectedEquip.location?.village, selectedEquip.location?.block, selectedEquip.location?.district, selectedEquip.location?.state].filter(Boolean).join(', ')} />
                                        <InfoRow label="Available" value={selectedEquip.isAvailable ? 'Yes ✅' : 'No (Booked)'} />
                                        <InfoRow label="Owner" value={`${selectedEquip.owner?.name?.first || ''} ${selectedEquip.owner?.name?.last || ''}`} />
                                        <InfoRow label="Owner Mobile" value={selectedEquip.owner?.mobile} />
                                        <InfoRow label="Listed On" value={fmt(selectedEquip.createdAt)} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ══ BOOKINGS TAB ═════════════════════════════════════ */}
                {activeTab === 'bookings' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1F2937' }}>📅 All Bookings</h2>
                            <span style={{ background: C.paleBlue, color: C.blue, padding: '6px 14px', borderRadius: '99px', fontWeight: 700, fontSize: '13px' }}>{bookings.length} total</span>
                        </div>
                        <TableWrap>
                            {bookLoading ? <EmptyState icon="📅" msg="Loading bookings…" /> : bookings.length === 0 ? <EmptyState icon="📅" msg="No bookings yet" /> : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead><tr>{['Equipment', 'Renter', 'Owner', 'Dates', 'Amount', 'Status', 'Booked On'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                                    <tbody>
                                        {bookings.map((b, i) => (
                                            <tr key={b._id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA', cursor: 'pointer' }} onClick={() => setSelectedBooking(b)}>
                                                <TD><p style={{ margin: 0, fontWeight: 700, color: '#1F2937' }}>{b.equipment?.name || '—'}</p><p style={{ margin: 0, color: C.gray, fontSize: '11px' }}>{b.equipment?.category}</p></TD>
                                                <TD><p style={{ margin: 0, fontWeight: 600 }}>{b.renter?.name?.first} {b.renter?.name?.last}</p><p style={{ margin: 0, color: C.gray, fontSize: '11px' }}>{b.renter?.mobile}</p></TD>
                                                <TD><p style={{ margin: 0, fontWeight: 600 }}>{b.owner?.name?.first} {b.owner?.name?.last}</p></TD>
                                                <TD style={{ fontSize: '12px' }}>{fmt(b.rentalDates?.start)} → {fmt(b.rentalDates?.end)}</TD>
                                                <TD style={{ fontWeight: 700, color: C.green }}>₹{b.totalAmount?.toLocaleString('en-IN') || '—'}</TD>
                                                <TD><StatusBadge status={b.status} /></TD>
                                                <TD style={{ color: C.gray, fontSize: '12px' }}>{fmt(b.createdAt)}</TD>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </TableWrap>

                        {/* Booking Detail Modal */}
                        {selectedBooking && (
                            <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedBooking(null)}>
                                <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '560px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1F2937' }}>📅 Booking Details</h3>
                                        <button onClick={() => setSelectedBooking(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gray }}><X size={20} /></button>
                                    </div>
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        <InfoRow label="Booking ID" value={selectedBooking._id} />
                                        <InfoRow label="Equipment" value={`${selectedBooking.equipment?.name || '—'} (${selectedBooking.equipment?.category || ''})`} />
                                        <InfoRow label="Brand" value={selectedBooking.equipment?.brand} />
                                        <InfoRow label="Renter" value={`${selectedBooking.renter?.name?.first || ''} ${selectedBooking.renter?.name?.last || ''}`} />
                                        <InfoRow label="Renter Mobile" value={selectedBooking.renter?.mobile} />
                                        <InfoRow label="Renter Email" value={selectedBooking.renter?.email} />
                                        <InfoRow label="Owner" value={`${selectedBooking.owner?.name?.first || ''} ${selectedBooking.owner?.name?.last || ''}`} />
                                        <InfoRow label="Owner Mobile" value={selectedBooking.owner?.mobile} />
                                        <InfoRow label="Start Date" value={fmt(selectedBooking.rentalDates?.start)} />
                                        <InfoRow label="End Date" value={fmt(selectedBooking.rentalDates?.end)} />
                                        <InfoRow label="Start Time" value={selectedBooking.startTime} />
                                        <InfoRow label="End Time" value={selectedBooking.endTime} />
                                        <InfoRow label="Duration" value={selectedBooking.hours ? `${selectedBooking.hours} hr(s)` : undefined} />
                                        <InfoRow label="Price/Hr" value={selectedBooking.pricePerHour ? `₹${selectedBooking.pricePerHour}` : undefined} />
                                        <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '14px', marginTop: '4px' }}>
                                            <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#1F2937', fontSize: '13px' }}>💰 Price Breakdown</p>
                                            {[['Subtotal', selectedBooking.subtotal], ['Platform Fee (5%)', selectedBooking.platformFee], ['GST (18%)', selectedBooking.gst], ['Total', selectedBooking.totalAmount]].map(([k, v]) => (
                                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', borderBottom: k === 'Total' ? 'none' : '1px solid #E5E7EB', fontWeight: k === 'Total' ? 800 : 500, color: k === 'Total' ? C.green : '#374151' }}>
                                                    <span>{k}</span><span>₹{(v || 0).toLocaleString('en-IN')}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <InfoRow label="Status" value={selectedBooking.status?.replace(/_/g, ' ') || '—'} />
                                        <InfoRow label="Payment Status" value={selectedBooking.paymentStatus} />
                                        <InfoRow label="Handover Token" value={selectedBooking.handoverToken} />
                                        <InfoRow label="Booked On" value={fmt(selectedBooking.createdAt)} />

                                        {/* ── 💳 Payment Proof Review (Escrow) ── */}
                                        {(selectedBooking.lenderPaymentProofUrl || selectedBooking.adminPaymentProofUrl || selectedBooking.status === 'Admin_Paid_Pending') && (
                                            <div style={{ marginTop: '12px', background: '#F0FDF4', borderRadius: '14px', padding: '16px', border: '1.5px solid #BBF7D0' }}>
                                                <p style={{ margin: '0 0 12px', fontWeight: 800, color: '#15803D', fontSize: '13px' }}>
                                                    💳 Payment Proof Screenshots
                                                </p>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                                                    <DocThumbnail label="Screenshot #1 — Paid to Lender" url={selectedBooking.lenderPaymentProofUrl} />
                                                    <DocThumbnail label="Screenshot #2 — Paid to Admin" url={selectedBooking.adminPaymentProofUrl} />
                                                </div>
                                                {selectedBooking.status === 'Admin_Paid_Pending' && (
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            try {
                                                                const r = await fetch(`${API}/api/payments/admin-approve/${selectedBooking._id}`, {
                                                                    method: 'PATCH', headers
                                                                });
                                                                const d = await r.json();
                                                                if (d.success) {
                                                                    showToast('✅ Booking approved! Renter & Lender notified.');
                                                                    setSelectedBooking(null);
                                                                    fetchBookings();
                                                                } else {
                                                                    showToast(d.message || 'Approval failed.', 'error');
                                                                }
                                                            } catch {
                                                                showToast('Network error.', 'error');
                                                            }
                                                        }}
                                                        style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#1B5E20,#2E7D32)', color: '#fff', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(46,125,50,0.35)' }}
                                                    >
                                                        <CheckCircle size={16} /> ✅ Approve Both Payments & Notify Parties
                                                    </button>
                                                )}
                                                {selectedBooking.status === 'Admin_Approved' && (
                                                    <div style={{ textAlign: 'center', padding: '10px', background: '#DCFCE7', borderRadius: '10px', color: '#15803D', fontWeight: 800, fontSize: '13px' }}>
                                                        ✅ Payments Approved — Awaiting Lender Handover Code Entry
                                                    </div>
                                                )}
                                                {selectedBooking.status === 'Rental_Started' && (
                                                    <div style={{ textAlign: 'center', padding: '10px', background: '#DCFCE7', borderRadius: '10px', color: '#15803D', fontWeight: 800, fontSize: '13px' }}>
                                                        🚜 Rental In Progress — Handover Code Verified
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Rental Proof Photos — only shown after rental started */}
                                        {selectedBooking.rentalPhotos?.length > 0 && (
                                            <div style={{ marginTop: '8px' }}>
                                                <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#1F2937', fontSize: '13px' }}>
                                                    📸 Rental Completion Photos
                                                    <span style={{ marginLeft: '8px', background: '#F0FDF4', color: C.green, padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 700 }}>
                                                        {selectedBooking.rentalPhotos.length} photo{selectedBooking.rentalPhotos.length > 1 ? 's' : ''}
                                                    </span>
                                                </p>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: '8px' }}>
                                                    {selectedBooking.rentalPhotos.map((ph, i) => (
                                                        <div key={i} style={{ position: 'relative' }}>
                                                            <img src={ph.url} alt={`proof-${i}`} onClick={() => window.open(ph.url, '_blank')}
                                                                style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '10px', cursor: 'zoom-in', border: '2px solid #BBF7D0', display: 'block' }} />
                                                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', borderRadius: '0 0 8px 8px', padding: '3px 6px', fontSize: '9px', color: '#fff' }}>
                                                                {ph.lat ? `${ph.lat.toFixed(4)},${ph.lng.toFixed(4)}` : ''}
                                                                <br />{new Date(ph.takenAt).toLocaleDateString('en-IN')}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {/* Only warn about missing rental photos after rental has actually started */}
                                        {(!selectedBooking.rentalPhotos || selectedBooking.rentalPhotos.length === 0) &&
                                            ['Rental_Started', 'Completed'].includes(selectedBooking.status) && (
                                                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#92400E', fontWeight: 600 }}>
                                                    ⚠️ No proof photos uploaded yet by the renter.
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ══ REVIEWS TAB ══════════════════════════════════════ */}
                {activeTab === 'reviews' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1F2937' }}>⭐ All Reviews</h2>
                            <span style={{ background: C.paleOrange, color: C.orange, padding: '6px 14px', borderRadius: '99px', fontWeight: 700, fontSize: '13px' }}>{reviews.length} reviews</span>
                        </div>
                        <TableWrap>
                            {reviewLoading ? <EmptyState icon="⭐" msg="Loading reviews…" /> : reviews.length === 0 ? <EmptyState icon="⭐" msg="No reviews yet" /> : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead><tr>{['Equipment', 'Reviewer', 'Rating', 'Comment', 'Date', 'Action'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                                    <tbody>
                                        {reviews.map((rv, i) => (
                                            <tr key={rv._id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                                                <TD><p style={{ margin: 0, fontWeight: 700, color: '#1F2937' }}>{rv.equipment?.name || '—'}</p><p style={{ margin: 0, color: C.gray, fontSize: '11px' }}>{rv.equipment?.category}</p></TD>
                                                <TD><p style={{ margin: 0, fontWeight: 600 }}>{rv.renter?.name?.first} {rv.renter?.name?.last}</p><p style={{ margin: 0, color: C.gray, fontSize: '11px' }}>{rv.renter?.email}</p></TD>
                                                <TD><Stars rating={rv.rating} /></TD>
                                                <TD style={{ maxWidth: '260px' }}><p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{rv.comment || <em style={{ color: C.gray }}>No comment</em>}</p></TD>
                                                <TD style={{ color: C.gray, fontSize: '12px' }}>{fmt(rv.createdAt)}</TD>
                                                <TD><button onClick={() => handleDeleteReview(rv._id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: C.paleRed, color: C.red, border: 'none', padding: '7px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}><Trash2 size={14} /> Delete</button></TD>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </TableWrap>
                    </>
                )}

                {/* ══ ANNOUNCE TAB ═════════════════════════════════════ */}
                {activeTab === 'announce' && (
                    <div style={{ maxWidth: '640px' }}>
                        <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800, color: '#1F2937' }}>📢 Send Announcement</h2>
                        <p style={{ margin: '0 0 24px', color: C.gray, fontSize: '14px' }}>Send a notification to ALL registered users on the platform.</p>
                        <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '8px' }}>Message</label>
                            <textarea
                                value={announcement}
                                onChange={e => setAnnouncement(e.target.value)}
                                placeholder="e.g. New season discounts available! Check the marketplace for updated rates."
                                rows={5}
                                style={{ width: '100%', padding: '14px', border: '1.5px solid #E5E7EB', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                <p style={{ margin: 0, color: C.gray, fontSize: '12px' }}>{announcement.length} characters</p>
                                <button
                                    onClick={handleAnnounce}
                                    disabled={announceSending || !announcement.trim()}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: C.green, color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: announceSending ? 'not-allowed' : 'pointer', opacity: announceSending ? 0.7 : 1, boxShadow: '0 4px 16px rgba(46,125,50,0.3)' }}>
                                    <Send size={16} /> {announceSending ? 'Sending…' : 'Send to All Users'}
                                </button>
                            </div>
                        </div>
                        <div style={{ background: '#FFF8E1', border: '1.5px solid #FFE082', borderRadius: '12px', padding: '14px 18px', marginTop: '16px', fontSize: '13px', color: '#92400E' }}>
                            ⚠️ This will send a push notification to every registered member. Use sparingly for important updates only.
                        </div>
                    </div>
                )}

                {/* ══ ANALYTICS TAB ════════════════════════════════════ */}
                {activeTab === 'analytics' && (
                    <AnalyticsDashboard
                        analytics={analytics}
                        loading={analyticsLoading}
                        onRefresh={() => {
                            setAnalyticsLoading(true);
                            fetch(`${API}/api/admin/analytics`, { headers })
                                .then(r => r.json())
                                .then(d => { if (d.success) setAnalytics(d.data); })
                                .finally(() => setAnalyticsLoading(false));
                        }}
                    />
                )}

                {/* ── FEEDBACK TAB ── */}
                {activeTab === 'feedback' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: 0 }}>
                                💬 User Feedback & Complaints
                                {unreadFeedbackCount > 0 && (
                                    <span style={{ marginLeft: '10px', background: '#EF4444', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '2px 10px', borderRadius: '99px' }}>
                                        {unreadFeedbackCount} unread
                                    </span>
                                )}
                            </h2>
                            <button onClick={fetchFeedbacks} style={{ background: C.paleGreen, color: C.green, border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
                                🔄 Refresh
                            </button>
                        </div>
                        {feedbackLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: C.gray }}>Loading feedback…</div>
                        ) : feedbacks.length === 0 ? (
                            <div style={{ background: '#fff', borderRadius: '16px', padding: '48px', textAlign: 'center', color: C.gray }}>
                                <p style={{ fontSize: '40px', marginBottom: '12px' }}>💬</p>
                                <p style={{ fontWeight: 700, fontSize: '16px' }}>No feedback received yet</p>
                                <p style={{ fontSize: '13px' }}>Feedback from the Contact page and Quick Feedback bar will appear here.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {feedbacks.map(fb => (
                                    <div key={fb._id} style={{
                                        background: '#fff', borderRadius: '14px', padding: '18px 20px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                        borderLeft: fb.isRead ? '4px solid #E5E7EB' : '4px solid #2E7D32',
                                        opacity: fb.isRead ? 0.75 : 1
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 800, fontSize: '14px', color: '#111827' }}>{fb.name}</span>
                                                    <span style={{ fontSize: '12px', color: C.gray }}>{fb.email}</span>
                                                    <span style={{ background: fb.source === 'quick_feedback' ? '#EDE9FE' : '#DBEAFE', color: fb.source === 'quick_feedback' ? '#6D28D9' : '#1D4ED8', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px' }}>
                                                        {fb.source === 'quick_feedback' ? '⚡ Quick' : '📧 Contact Form'}
                                                    </span>
                                                    {!fb.isRead && <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px' }}>● New</span>}
                                                </div>
                                                <p style={{ fontSize: '12px', fontWeight: 700, color: C.gray, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{fb.subject}</p>
                                                <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: 1.6 }}>{fb.message}</p>
                                                <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '8px' }}>{new Date(fb.createdAt).toLocaleString('en-IN')}</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                                {!fb.isRead && (
                                                    <button onClick={async () => { await fetch(`${API}/api/feedback/${fb._id}/read`, { method: 'PATCH', headers }); fetchFeedbacks(); }} style={{ background: C.paleGreen, color: C.green, border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>✓ Mark Read</button>
                                                )}
                                                <button onClick={async () => { const ok = await kasPrompt('Delete this feedback? (Type YES)'); if (ok?.trim().toLowerCase() !== 'yes') return; await fetch(`${API}/api/feedback/${fb._id}`, { method: 'DELETE', headers }); fetchFeedbacks(); }} style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>🗑 Delete</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ════ KYC REVIEW MODAL ═══════════════════════════════════ */}
            {selectedUser && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }} onClick={e => e.target === e.currentTarget && setSelectedUser(null)}>
                    <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '1100px', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.35)', marginTop: '8px', marginBottom: '20px' }}>
                        <div style={{ background: C.green, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <p style={{ color: '#fff', fontWeight: 800, fontSize: '18px', margin: 0 }}>Reviewing: {selectedUser.name?.first} {selectedUser.name?.middle || ''} {selectedUser.name?.last}</p>
                                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: '4px 0 0' }}>{selectedUser.email}</p>
                            </div>
                            <button onClick={() => setSelectedUser(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#F9FAFB' }}>
                            <div style={{ padding: '24px', borderRight: '1.5px solid #E5E7EB', overflowY: 'auto', maxHeight: '60vh' }}>
                                <div style={{ background: C.paleBlue, borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                                    <p style={{ color: C.blue, fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', margin: '0 0 10px' }}>👤 Personal Info</p>
                                    <InfoRow label="Full Name" value={`${selectedUser.name?.first} ${selectedUser.name?.middle || ''} ${selectedUser.name?.last}`} />
                                    <InfoRow label="Gender" value={selectedUser.gender} />
                                    <InfoRow label="Date of Birth" value={selectedUser.dob ? new Date(selectedUser.dob).toLocaleDateString('en-IN') : null} />
                                    <InfoRow label="Age" value={selectedUser.age ? `${selectedUser.age} years` : null} />
                                    <InfoRow label="Mobile" value={selectedUser.mobile} />
                                    <InfoRow label="Email" value={selectedUser.email} />
                                    <InfoRow label="Aadhaar No." value={selectedUser.aadhaarNo} />
                                </div>
                                <div style={{ background: C.paleGreen, borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                                    <p style={{ color: C.green, fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', margin: '0 0 10px', display: 'flex', gap: '6px', alignItems: 'center' }}><MapPin size={14} /> Address</p>
                                    <InfoRow label="Village" value={selectedUser.address?.village} />
                                    <InfoRow label="Block/Taluka" value={selectedUser.address?.block} />
                                    <InfoRow label="District" value={selectedUser.address?.district} />
                                    <InfoRow label="PIN Code" value={selectedUser.address?.pinCode} />
                                    <InfoRow label="State" value={selectedUser.address?.state} />
                                </div>
                                <div style={{ background: '#F3E5F5', borderRadius: '12px', padding: '16px' }}>
                                    <p style={{ color: C.purple, fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', margin: '0 0 10px', display: 'flex', gap: '6px', alignItems: 'center' }}><Building size={14} /> Bank & Payments</p>
                                    <InfoRow label="Bank Name" value={selectedUser.finance?.bankName} />
                                    <InfoRow label="Account No." value={selectedUser.finance?.accountNo} />
                                    <InfoRow label="IFSC Code" value={selectedUser.finance?.ifscCode} />
                                    <InfoRow label="UPI ID" value={selectedUser.finance?.upiId} />
                                    {selectedUser.finance?.upiId && (
                                        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('upi://pay?pa=' + selectedUser.finance.upiId + '&pn=' + encodeURIComponent([selectedUser.name?.first, selectedUser.name?.last].filter(Boolean).join(' ') || 'KAS User') + '&cu=INR')}`}
                                                alt="UPI QR"
                                                style={{ width: '84px', height: '84px', borderRadius: '8px', border: '2px solid #E9D5FF', background: '#fff', padding: '3px', boxSizing: 'border-box' }}
                                                onError={e => { e.target.style.display = 'none'; }}
                                            />
                                            <div>
                                                <p style={{ fontSize: '10px', color: '#7C3AED', fontWeight: 700, margin: '0 0 3px' }}>SCAN TO PAY</p>
                                                <p style={{ fontSize: '11px', color: '#6B7280', margin: 0, maxWidth: '120px', lineHeight: 1.4 }}>Scan this QR in any UPI app to pay this user</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                            <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '60vh', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <p style={{ fontWeight: 800, fontSize: '12px', color: C.gray, textTransform: 'uppercase', margin: '0 0 4px' }}>📂 KYC Documents</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <DocThumbnail label="Passport Photo" url={selectedUser.documents?.passportPhoto} />
                                    <DocThumbnail label="Aadhaar Card" url={selectedUser.documents?.aadhaarImage} />
                                    <DocThumbnail label="Voter ID" url={selectedUser.documents?.voterIdImage} />
                                    <DocThumbnail label="Bank Passbook" url={selectedUser.documents?.passbookImage} />
                                    <DocThumbnail label="Payment QR Code" url={selectedUser.finance?.qrCodeUrl} />
                                </div>
                                {selectedUser.rejectionReason && (
                                    <div style={{ background: C.paleRed, border: `1.5px solid ${C.red}`, borderRadius: '10px', padding: '12px 14px' }}>
                                        <p style={{ color: C.red, fontWeight: 700, fontSize: '12px', margin: '0 0 4px' }}>Previous Rejection Reason:</p>
                                        <p style={{ color: '#7F1D1D', fontSize: '13px', margin: 0 }}>{selectedUser.rejectionReason}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {selectedUser.kycStatus === 'Pending' ? (
                            <div style={{ background: '#fff', borderTop: '1.5px solid #E5E7EB', padding: '20px 28px' }}>
                                {showRejectBox && (
                                    <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="e.g. Aadhaar image is blurry. Please re-upload a clear photo." rows={2} style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${C.red}`, borderRadius: '10px', fontSize: '13px', resize: 'none', outline: 'none', fontFamily: 'inherit', marginBottom: '12px', boxSizing: 'border-box' }} />
                                )}
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    <KycBadge status={selectedUser.kycStatus} />
                                    <div style={{ flex: 1 }} />
                                    {!showRejectBox ? (
                                        <button onClick={() => setShowRejectBox(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', background: C.paleRed, color: C.red, border: `1.5px solid ${C.red}`, fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}><XCircle size={18} /> Reject KYC</button>
                                    ) : (
                                        <button disabled={actionLoading === selectedUser._id} onClick={() => handleKycAction(selectedUser._id, 'Rejected')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', background: C.red, color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}><XCircle size={18} /> Confirm Rejection</button>
                                    )}
                                    <button disabled={actionLoading === selectedUser._id} onClick={() => handleKycAction(selectedUser._id, 'Verified')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '12px', background: C.green, color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(46,125,50,0.35)' }}>
                                        <CheckCircle size={18} /> {actionLoading === selectedUser._id ? 'Processing…' : '✅ Approve & Verify'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '16px 28px', background: selectedUser.kycStatus === 'Verified' ? C.paleGreen : C.paleRed, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ margin: 0, fontWeight: 700, color: selectedUser.kycStatus === 'Verified' ? C.green : C.red, fontSize: '14px' }}>
                                    This user is already {selectedUser.kycStatus.toLowerCase()}.{selectedUser.rejectionReason && ` Reason: ${selectedUser.rejectionReason}`}
                                </p>
                                <button onClick={() => setSelectedUser(null)} style={{ background: '#fff', border: '1.5px solid #D1D5DB', padding: '8px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>Close</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
