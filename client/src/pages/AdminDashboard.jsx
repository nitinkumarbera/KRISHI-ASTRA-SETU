import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ShieldCheck, Users, Clock, XCircle, CheckCircle,
    Eye, EyeOff, ChevronDown, MapPin, Phone, Mail,
    Building, CreditCard, RefreshCw, X, AlertCircle, Search
} from 'lucide-react';

// ── API helper ────────────────────────────────────────────────
const API = 'http://localhost:5000';

// ── Color palette ────────────────────────────────────────────
const C = {
    green: '#2E7D32', lightGreen: '#4CAF50', paleGreen: '#E8F5E9',
    orange: '#F57C00', paleOrange: '#FFF3E0',
    red: '#C62828', paleRed: '#FFEBEE',
    blue: '#1565C0', paleBlue: '#E3F2FD',
    gray: '#6B7280', bg: '#F0F4F0'
};

// ── Badge helper ─────────────────────────────────────────────
function KycBadge({ status }) {
    const map = {
        Pending: { bg: C.paleOrange, color: C.orange, label: '⏳ Pending' },
        Verified: { bg: C.paleGreen, color: C.green, label: '✅ Verified' },
        Rejected: { bg: C.paleRed, color: C.red, label: '❌ Rejected' },
    };
    const s = map[status] || map.Pending;
    return (
        <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 700 }}>
            {s.label}
        </span>
    );
}

// ── DocThumbnail ─────────────────────────────────────────────
function DocThumbnail({ label, url }) {
    if (!url) return (
        <div style={{ border: '2px dashed #D1D5DB', borderRadius: '12px', padding: '16px', textAlign: 'center', color: '#9CA3AF', fontSize: '12px' }}>
            <EyeOff size={20} style={{ margin: '0 auto 6px' }} />
            <p>{label}</p><p style={{ fontSize: '10px' }}>Not uploaded</p>
        </div>
    );
    return (
        <div style={{ border: '1.5px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', background: '#F9FAFB' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', padding: '6px 8px', borderBottom: '1px solid #E5E7EB', letterSpacing: '0.05em' }}>{label}</p>
            <img
                src={url} alt={label}
                style={{ width: '100%', height: '130px', objectFit: 'cover', cursor: 'zoom-in', display: 'block' }}
                onClick={() => window.open(url, '_blank')}
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
            <div style={{ display: 'none', height: '130px', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '12px', flexDirection: 'column', gap: '4px' }}>
                <AlertCircle size={20} /> Failed to load
            </div>
        </div>
    );
}

// ── Info Row ─────────────────────────────────────────────────
function InfoRow({ label, value }) {
    if (!value) return null;
    return (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '13px' }}>
            <span style={{ color: C.gray, minWidth: '120px', flexShrink: 0, fontWeight: 600 }}>{label}</span>
            <span style={{ color: '#1F2937', wordBreak: 'break-word' }}>{value}</span>
        </div>
    );
}

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
export default function AdminDashboard() {
    const { user, token, isAdmin } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('Pending');
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({ pending: 0, verified: 0, rejected: 0, total: 0 });
    const [selectedUser, setSelectedUser] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectBox, setShowRejectBox] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // userId being processed
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(null);

    const headers = { 'x-auth-token': token, 'Content-Type': 'application/json' };

    // ── Redirect non-admins ──────────────────────────────────
    useEffect(() => {
        if (user && !isAdmin) navigate('/');
    }, [user, isAdmin, navigate]);

    // ── Load stats ───────────────────────────────────────────
    const fetchStats = async () => {
        try {
            const res = await fetch(`${API}/api/admin/stats`, { headers });
            if (res.ok) { const d = await res.json(); setStats(d.data); }
        } catch { /* offline */ }
    };

    // ── Load users by tab ─────────────────────────────────────
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/admin/users?status=${activeTab}`, { headers });
            if (res.ok) { const d = await res.json(); setUsers(d.data); }
        } catch { /* offline */ }
        setLoading(false);
    };

    useEffect(() => { fetchStats(); fetchUsers(); }, [activeTab]);

    // ── Show toast ────────────────────────────────────────────
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ── Approve / Reject ──────────────────────────────────────
    const handleAction = async (userId, status) => {
        if (status === 'Rejected' && !rejectionReason.trim()) {
            showToast('Please enter a rejection reason before rejecting.', 'error');
            return;
        }
        setActionLoading(userId);
        try {
            const res = await fetch(`${API}/api/admin/verify-user/${userId}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ status, rejectionReason: status === 'Rejected' ? rejectionReason : '' })
            });
            const data = await res.json();
            if (res.ok) {
                showToast(`${data.data.name.first} ${data.data.name.last} — ${status}!`);
                setUsers(prev => prev.filter(u => u._id !== userId));
                setSelectedUser(null);
                setRejectionReason('');
                setShowRejectBox(false);
                fetchStats();
            } else {
                showToast(data.message || 'Action failed.', 'error');
            }
        } catch {
            showToast('Network error. Is the backend running?', 'error');
        }
        setActionLoading(null);
    };

    // ── Filtered list ──────────────────────────────────────────
    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        return (
            `${u.name?.first} ${u.name?.last}`.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.address?.district?.toLowerCase().includes(q) ||
            u.aadhaarNo?.includes(q)
        );
    });

    // ── Stat Card ─────────────────────────────────────────────
    const StatCard = ({ label, count, color, icon }) => (
        <div style={{ flex: 1, background: '#fff', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `5px solid ${color}`, minWidth: '140px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <p style={{ fontSize: '12px', color: C.gray, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                    <p style={{ fontSize: '32px', fontWeight: 800, color, margin: '4px 0 0' }}>{count}</p>
                </div>
                <div style={{ fontSize: '28px', opacity: 0.15 }}>{icon}</div>
            </div>
        </div>
    );

    // ── Tab Button ────────────────────────────────────────────
    const Tab = ({ id, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                padding: '10px 20px', borderRadius: '10px', border: 'none',
                background: activeTab === id ? C.green : 'transparent',
                color: activeTab === id ? '#fff' : C.gray,
                fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                transition: 'all 0.18s'
            }}
        >{label}</button>
    );

    return (
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* ── Toast ───────────────────────────────────────── */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
                    background: toast.type === 'error' ? '#C62828' : C.green,
                    color: '#fff', padding: '14px 20px', borderRadius: '12px',
                    fontWeight: 600, fontSize: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '360px'
                }}>
                    {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
                    {toast.msg}
                </div>
            )}

            {/* ── Header ──────────────────────────────────────── */}
            <div style={{ background: C.green, padding: '0 32px', display: 'flex', alignItems: 'center', gap: '16px', height: '64px' }}>
                <ShieldCheck size={28} color="#fff" />
                <div>
                    <p style={{ color: '#fff', fontWeight: 800, fontSize: '18px', margin: 0, lineHeight: 1.2 }}>KAS Admin — KYC Command Centre</p>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', margin: 0 }}>Logged in as {user?.email || 'Admin'}</p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <button onClick={fetchUsers} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px' }}>
                        <RefreshCw size={15} /> Refresh
                    </button>
                </div>
            </div>

            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 24px' }}>

                {/* ── Stats ──────────────────────────────────── */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
                    <StatCard label="Total Users" count={stats.total} color={C.blue} icon="👥" />
                    <StatCard label="Pending KYC" count={stats.pending} color={C.orange} icon="⏳" />
                    <StatCard label="Verified" count={stats.verified} color={C.green} icon="✅" />
                    <StatCard label="Rejected" count={stats.rejected} color={C.red} icon="❌" />
                </div>

                {/* ── Tabs + Search ──────────────────────────── */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '4px', background: '#F3F4F6', borderRadius: '12px', padding: '4px' }}>
                        <Tab id="Pending" label={`⏳ Pending (${stats.pending})`} />
                        <Tab id="Verified" label={`✅ Verified`} />
                        <Tab id="Rejected" label={`❌ Rejected`} />
                    </div>
                    <div style={{ marginLeft: 'auto', position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.gray }} />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search name, district, Aadhaar..."
                            style={{ paddingLeft: '36px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px', border: '1.5px solid #E5E7EB', borderRadius: '10px', fontSize: '13px', outline: 'none', minWidth: '240px' }}
                        />
                    </div>
                </div>

                {/* ── User Table ─────────────────────────────── */}
                <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    {loading ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: C.gray }}>
                            <RefreshCw size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                            <p>Loading users…</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: C.gray }}>
                            <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                            <p style={{ fontWeight: 600 }}>No {activeTab.toLowerCase()} users found</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ background: '#F9FAFB', borderBottom: '1.5px solid #E5E7EB' }}>
                                    {['Farmer Name', 'Mobile', 'District', 'Registered', 'KYC Status', 'Action'].map(h => (
                                        <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: C.gray, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((u, i) => (
                                    <tr key={u._id} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1F2937' }}>
                                            {u.documents?.passportPhoto && (
                                                <img src={u.documents.passportPhoto} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', marginRight: '10px', verticalAlign: 'middle', display: 'inline-block', border: '2px solid #E5E7EB' }} />
                                            )}
                                            {u.name?.first} {u.name?.middle || ''} {u.name?.last}
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#374151' }}>{u.mobile}</td>
                                        <td style={{ padding: '14px 16px', color: '#374151' }}>{u.address?.district}, {u.address?.state}</td>
                                        <td style={{ padding: '14px 16px', color: C.gray }}>{new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td style={{ padding: '14px 16px' }}><KycBadge status={u.kycStatus} /></td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <button
                                                onClick={() => { setSelectedUser(u); setRejectionReason(''); setShowRejectBox(false); }}
                                                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: C.paleGreen, color: C.green, border: 'none', padding: '7px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                                            >
                                                <Eye size={14} /> Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ════════════════════════════════════════════════════
                REVIEW MODAL
            ════════════════════════════════════════════════════ */}
            {selectedUser && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}
                    onClick={e => e.target === e.currentTarget && setSelectedUser(null)}
                >
                    <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '1100px', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.35)', marginTop: '8px', marginBottom: '20px' }}>

                        {/* Modal Header */}
                        <div style={{ background: C.green, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <p style={{ color: '#fff', fontWeight: 800, fontSize: '18px', margin: 0 }}>
                                    Reviewing: {selectedUser.name?.first} {selectedUser.name?.middle || ''} {selectedUser.name?.last}
                                </p>
                                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: '4px 0 0' }}>
                                    MemberID: {selectedUser.memberID || 'N/A'} · {selectedUser.email}
                                </p>
                            </div>
                            <button onClick={() => setSelectedUser(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body — 2 columns */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', background: '#F9FAFB' }}>

                            {/* ── LEFT: Data Details ─────────── */}
                            <div style={{ padding: '24px', borderRight: '1.5px solid #E5E7EB', overflowY: 'auto', maxHeight: '60vh' }}>

                                {/* Personal */}
                                <div style={{ background: C.paleBlue, borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                                    <p style={{ color: C.blue, fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px', display: 'flex', gap: '6px', alignItems: 'center' }}>👤 Personal Info</p>
                                    <InfoRow label="Full Name" value={`${selectedUser.name?.first} ${selectedUser.name?.middle || ''} ${selectedUser.name?.last}`} />
                                    <InfoRow label="Gender" value={selectedUser.gender} />
                                    <InfoRow label="Date of Birth" value={selectedUser.dob ? new Date(selectedUser.dob).toLocaleDateString('en-IN') : null} />
                                    <InfoRow label="Age" value={selectedUser.age ? `${selectedUser.age} years` : null} />
                                    <InfoRow label="Mobile" value={selectedUser.mobile} />
                                    <InfoRow label="Email" value={selectedUser.email} />
                                    <InfoRow label="Aadhaar No." value={selectedUser.aadhaarNo} />
                                </div>

                                {/* Address */}
                                <div style={{ background: C.paleGreen, borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                                    <p style={{ color: C.green, fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px', display: 'flex', gap: '6px', alignItems: 'center' }}><MapPin size={14} /> Address</p>
                                    <InfoRow label="House No." value={selectedUser.address?.houseNo} />
                                    <InfoRow label="Village" value={selectedUser.address?.village} />
                                    <InfoRow label="Post Office" value={selectedUser.address?.postOffice} />
                                    <InfoRow label="Block/Taluka" value={selectedUser.address?.block} />
                                    <InfoRow label="GP/Ward" value={selectedUser.address?.gpWard} />
                                    <InfoRow label="Police Station" value={selectedUser.address?.policeStation} />
                                    <InfoRow label="Landmark" value={selectedUser.address?.landmark} />
                                    <InfoRow label="District" value={selectedUser.address?.district} />
                                    <InfoRow label="PIN Code" value={selectedUser.address?.pinCode} />
                                    <InfoRow label="State" value={selectedUser.address?.state} />
                                </div>

                                {/* Bank */}
                                <div style={{ background: '#F3E5F5', borderRadius: '12px', padding: '16px' }}>
                                    <p style={{ color: '#6A1B9A', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px', display: 'flex', gap: '6px', alignItems: 'center' }}><Building size={14} /> Bank & Payments</p>
                                    <InfoRow label="Bank Name" value={selectedUser.finance?.bankName} />
                                    <InfoRow label="Branch" value={selectedUser.finance?.branchName} />
                                    <InfoRow label="Account No." value={selectedUser.finance?.accountNo} />
                                    <InfoRow label="IFSC Code" value={selectedUser.finance?.ifscCode} />
                                    <InfoRow label="UPI ID" value={selectedUser.finance?.upiId} />
                                </div>
                            </div>

                            {/* ── RIGHT: Documents ───────────── */}
                            <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '60vh', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <p style={{ fontWeight: 800, fontSize: '13px', color: C.gray, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>📂 KYC Documents</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <DocThumbnail label="Passport Photo" url={selectedUser.documents?.passportPhoto} />
                                    <DocThumbnail label="Aadhaar Card" url={selectedUser.documents?.aadhaarImage} />
                                    <DocThumbnail label="Voter ID" url={selectedUser.documents?.voterIdImage} />
                                    <DocThumbnail label="Bank Passbook" url={selectedUser.documents?.passbookImage} />
                                </div>
                                <DocThumbnail label="Payment QR Code" url={selectedUser.finance?.qrCodeUrl} />

                                {/* Rejection history (if any) */}
                                {selectedUser.rejectionReason && (
                                    <div style={{ background: C.paleRed, border: `1.5px solid ${C.red}`, borderRadius: '10px', padding: '12px 14px', marginTop: '4px' }}>
                                        <p style={{ color: C.red, fontWeight: 700, fontSize: '12px', margin: '0 0 4px' }}>Previous Rejection Reason:</p>
                                        <p style={{ color: '#7F1D1D', fontSize: '13px', margin: 0 }}>{selectedUser.rejectionReason}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Action Footer ──────────────────── */}
                        {selectedUser.kycStatus === 'Pending' && (
                            <div style={{ background: '#fff', borderTop: '1.5px solid #E5E7EB', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {showRejectBox && (
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={e => setRejectionReason(e.target.value)}
                                            placeholder="e.g. Aadhaar image is blurry. Please re-upload a clear photo."
                                            rows={2}
                                            style={{ flex: 1, padding: '10px 14px', border: `1.5px solid ${C.red}`, borderRadius: '10px', fontSize: '13px', resize: 'none', outline: 'none', fontFamily: 'inherit' }}
                                        />
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    <KycBadge status={selectedUser.kycStatus} />
                                    <div style={{ flex: 1 }} />
                                    {!showRejectBox ? (
                                        <button
                                            onClick={() => setShowRejectBox(true)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', background: C.paleRed, color: C.red, border: `1.5px solid ${C.red}`, fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                                        >
                                            <XCircle size={18} /> Reject KYC
                                        </button>
                                    ) : (
                                        <button
                                            disabled={actionLoading === selectedUser._id}
                                            onClick={() => handleAction(selectedUser._id, 'Rejected')}
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', background: C.red, color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                                        >
                                            <XCircle size={18} /> Confirm Rejection
                                        </button>
                                    )}
                                    <button
                                        disabled={actionLoading === selectedUser._id}
                                        onClick={() => handleAction(selectedUser._id, 'Verified')}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '12px', background: C.green, color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(46,125,50,0.35)' }}
                                    >
                                        <CheckCircle size={18} />
                                        {actionLoading === selectedUser._id ? 'Processing…' : '✅ Approve & Verify'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Already decided status */}
                        {selectedUser.kycStatus !== 'Pending' && (
                            <div style={{ padding: '16px 28px', background: selectedUser.kycStatus === 'Verified' ? C.paleGreen : C.paleRed, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ margin: 0, fontWeight: 700, color: selectedUser.kycStatus === 'Verified' ? C.green : C.red, fontSize: '14px' }}>
                                    This user is already {selectedUser.kycStatus.toLowerCase()}.
                                    {selectedUser.rejectionReason && ` Reason: ${selectedUser.rejectionReason}`}
                                </p>
                                <button onClick={() => setSelectedUser(null)} style={{ background: '#fff', border: '1.5px solid #D1D5DB', padding: '8px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
