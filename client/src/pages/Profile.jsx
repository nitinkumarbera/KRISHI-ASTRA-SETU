import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
    User, MapPin, CreditCard, FileText, ShieldCheck, ShieldX, Clock,
    Download, Edit3, Eye, EyeOff, Phone, Mail, Calendar, CheckCircle2,
    AlertTriangle, Building2, QrCode, Tractor, Zap, RefreshCw, ChevronRight,
    Search, Tag
} from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────
function maskAadhaar(n) { return n ? `XXXX-XXXX-${n.slice(-4)}` : '—'; }
function maskAccount(n) { return n ? `${'*'.repeat(n.length - 4)}${n.slice(-4)}` : '—'; }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'; }

const STATUS_CONFIG = {
    Verified: { color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0', icon: CheckCircle2, label: '✅ KYC Verified', desc: 'You can now rent and list equipment on KAS.' },
    Pending: { color: '#92400E', bg: '#FFFBEB', border: '#FDE68A', icon: Clock, label: '⏳ Pending Admin Approval', desc: 'Your documents are under review. This usually takes 24–48 hours.' },
    Rejected: { color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA', icon: ShieldX, label: '❌ KYC Rejected', desc: 'Please update your details and re-submit.' },
};

export default function Profile() {
    const { user, authToken, refreshUser } = useAuth();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'rentals' | 'equipment'
    const [showAccount, setShowAccount] = useState(false);

    const [rentals, setRentals] = useState([]);
    const [myEquipment, setMyEquipment] = useState([]);
    const [lenderRentals, setLenderRentals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (authToken) {
            fetchDashboardData();
        }
    }, [authToken]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const headers = { 'x-auth-token': authToken };

            const [resRentals, resEquip, resLender] = await Promise.all([
                fetch('http://localhost:5000/api/bookings/my', { headers }),
                fetch('http://localhost:5000/api/equipment/my', { headers }),
                fetch('http://localhost:5000/api/bookings/lender', { headers })
            ]);

            const dRentals = await resRentals.json();
            const dEquip = await resEquip.json();
            const dLender = await resLender.json();

            if (resRentals.ok) setRentals(dRentals.data || []);
            if (resEquip.ok) setMyEquipment(dEquip.data || []);
            if (resLender.ok) setLenderRentals(dLender.data || []);
        } catch (err) {
            setError('Failed to sync activity data.');
        } finally {
            setLoading(false);
        }
    };

    const toggleEquipStatus = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/equipment/${id}/toggle`, {
                method: 'PATCH',
                headers: { 'x-auth-token': authToken }
            });
            if (res.ok) {
                fetchDashboardData();
            }
        } catch (err) {
            console.error('Failed to toggle status');
        }
    };

    if (!user) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F7F5' }}>
            <div style={{ textAlign: 'center' }}>
                <RefreshCw size={48} color="#2E7D32" className="animate-spin" style={{ margin: '0 auto 16px' }} />
                <p style={{ fontWeight: 700, color: '#111827' }}>{t('profile.loading')}</p>
            </div>
        </div>
    );

    const STATUS_CONFIG = {
        Verified: { color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0', icon: CheckCircle2, label: t('profile.kyc.verified'), desc: t('profile.kyc.verified_desc') },
        Pending: { color: '#92400E', bg: '#FFFBEB', border: '#FDE68A', icon: Clock, label: t('profile.kyc.pending'), desc: t('profile.kyc.pending_desc') },
        Rejected: { color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA', icon: ShieldX, label: t('profile.kyc.rejected'), desc: t('profile.kyc.rejected_desc') },
    };

    const status = STATUS_CONFIG[user.kycStatus] || STATUS_CONFIG.Pending;
    const canEdit = user.kycStatus !== 'Verified';



    const SectionCard = ({ icon: Icon, title, children }) => (
        <div style={{ background: '#fff', borderRadius: '18px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 24px', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #2E7D32, #8BC34A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color="#fff" />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', margin: 0 }}>{title}</h3>
            </div>
            <div style={{ padding: '20px 24px' }}>{children}</div>
        </div>
    );

    const Row = ({ label, value, sensitive }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F9FAFB' }}>
            <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600, minWidth: '150px' }}>{label}</span>
            <span style={{ fontSize: '14px', color: '#111827', fontWeight: 700, textAlign: 'right' }}>{value || '—'}</span>
        </div>
    );

    const DocBox = ({ label, url, icon: Icon }) => (
        <div style={{ border: `2px dashed ${url ? '#2E7D32' : '#D1D5DB'}`, borderRadius: '12px', padding: '20px', textAlign: 'center', background: url ? '#F0FDF4' : '#F9FAFB' }}>
            {url
                ? <img src={url} alt={label} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', margin: '0 auto 8px' }} />
                : <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}><Icon size={22} color="#9CA3AF" /></div>
            }
            <p style={{ fontSize: '12px', fontWeight: 700, color: url ? '#15803D' : '#6B7280', margin: 0 }}>{url ? '✅ ' + label : label}</p>
            <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '4px 0 0' }}>{url ? 'Submitted' : 'Not uploaded'}</p>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#F5F7F5', fontFamily: "'Inter', sans-serif", paddingBottom: '60px' }}>

            {/* ── Profile Header ─────────────────────────── */}
            <div style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', padding: '40px 20px 80px' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 900, color: '#fff', border: '3px solid rgba(255,255,255,0.5)', flexShrink: 0 }}>
                        {user.name.first[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', margin: '0 0 4px', fontFamily: "'Poppins', sans-serif" }}>
                            {user.name.first} {user.name.middle} {user.name.last}
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', margin: 0 }}>{t('profile.member_since').replace('{date}', formatDate(user.createdAt))}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {canEdit && (
                            <Link to="/register" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '13px', fontWeight: 700, textDecoration: 'none', backdropFilter: 'blur(4px)' }}>
                                <Edit3 size={14} /> {t('profile.edit_profile')}
                            </Link>
                        )}
                        {user.kycStatus === 'Verified' && (
                            <button type="button" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '10px', background: '#fff', color: '#2E7D32', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                                <Download size={14} /> {t('profile.download_id')}
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Tab Navigation ────────────────────────── */}
                <div style={{ maxWidth: '900px', margin: '40px auto 0', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px' }}>
                    {[
                        { id: 'profile', icon: User, label: t('profile.tabs.profile') },
                        { id: 'rentals', icon: Clock, label: t('profile.tabs.rentals') },
                        { id: 'equipment', icon: Tractor, label: t('profile.tabs.equipment') },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px',
                                border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 700, transition: 'all 0.2s',
                                background: activeTab === t.id ? '#fff' : 'rgba(255,255,255,0.15)',
                                color: activeTab === t.id ? '#2E7D32' : '#fff',
                                backdropFilter: activeTab === t.id ? 'none' : 'blur(4px)',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <t.icon size={16} /> {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ maxWidth: '900px', margin: '-32px auto 0', padding: '0 20px' }}>
                {activeTab === 'profile' && (
                    <>
                        {/* ── KYC Status Banner ─────────────────────── */}
                        <div style={{ background: status.bg, border: `2px solid ${status.border}`, borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <status.icon size={28} color={status.color} strokeWidth={2} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '16px', fontWeight: 800, color: status.color, margin: '0 0 4px' }}>{status.label}</p>
                                <p style={{ fontSize: '14px', color: status.color, opacity: 0.8, margin: 0 }}>{status.desc}</p>
                                {user.kycStatus === 'Rejected' && user.rejectionReason && (
                                    <div style={{ marginTop: '10px', padding: '10px 14px', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA', fontSize: '13px', color: '#B91C1C', fontWeight: 600 }}>
                                        <AlertTriangle size={14} style={{ marginRight: '6px', display: 'inline' }} />
                                        {t('profile.kyc.reason').replace('{reason}', user.rejectionReason)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <SectionCard icon={User} title={t('profile.identity_title')}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0 40px' }}>
                                <div>
                                    <Row label={t('profile.identity.name')} value={`${user.name?.first || ''} ${user.name?.last || ''}`} />
                                    <Row label={t('profile.identity.gender')} value={user.gender} />
                                    <Row label={t('profile.identity.aadhaar')} value={maskAadhaar(user.aadhaar)} />
                                </div>
                                <div>
                                    <Row label={t('profile.identity.mobile')} value={`+91 ${user.mobile}`} />
                                    <Row label={t('profile.identity.email')} value={user.email} />
                                    <Row label={t('profile.identity.role')} value={user.role} />
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard icon={MapPin} title={t('profile.address_title')}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0 40px' }}>
                                <div>
                                    <Row label={t('profile.address.village')} value={user.address?.village} />
                                    <Row label={t('profile.address.gp')} value={user.address?.gpWard} />
                                    <Row label={t('profile.address.block')} value={user.address?.block} />
                                </div>
                                <div>
                                    <Row label={t('profile.address.district')} value={user.address?.district} />
                                    <Row label={t('profile.address.pin')} value={user.address?.pinCode} />
                                    <Row label={t('profile.address.state')} value={user.address?.state} />
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard icon={FileText} title={t('profile.documents_title')}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                                <DocBox label={t('profile.documents.photo')} url={user.kycDocuments?.photo} icon={User} />
                                <DocBox label={t('profile.documents.aadhaar_f')} url={user.kycDocuments?.aadhaarFront} icon={ShieldCheck} />
                                <DocBox label={t('profile.documents.aadhaar_b')} url={user.kycDocuments?.aadhaarBack} icon={ShieldCheck} />
                            </div>
                        </SectionCard>
                    </>
                )}

                {activeTab === 'rentals' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>{t('profile.rentals.title')}</h2>
                        {rentals.length === 0 ? (
                            <div style={{ background: '#fff', borderRadius: '18px', padding: '40px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                                <Clock size={48} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
                                <p style={{ fontWeight: 700, color: '#6B7280' }}>{t('profile.rentals.no_bookings')}</p>
                                <Link to="/marketplace" style={{ display: 'inline-block', marginTop: '16px', color: '#2E7D32', fontWeight: 700, textDecoration: 'none' }}>{t('profile.rentals.go_marketplace')} →</Link>
                            </div>
                        ) : (
                            rentals.map(b => (
                                <div key={b._id} style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E7D32' }}>
                                            <Tractor size={32} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>{b.equipmentId?.name}</h4>
                                            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>{formatDate(b.startDate)} → {formatDate(b.endDate)}</p>
                                            <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#E0F2F1', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, color: '#00695C' }}>
                                                <Zap size={12} /> {t('profile.rentals.token')}: {b.handoverToken}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '16px', fontWeight: 900, color: '#2E7D32', margin: '0 0 4px' }}>₹{b.totalPrice.toLocaleString()}</p>
                                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', background: b.status === 'Completed' ? '#F0FDF4' : '#FFFBEB', color: b.status === 'Completed' ? '#15803D' : '#92400E' }}>
                                            {b.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'equipment' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #2E7D32, #1B5E20)', borderRadius: '18px', padding: '30px', color: '#fff', boxShadow: '0 8px 30px rgba(46,125,50,0.3)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 4px' }}>{t('profile.lender.title')}</h2>
                                    <p style={{ fontSize: '14px', opacity: 0.8 }}>{t('profile.lender.desc')}</p>
                                </div>
                                <Link to="/add-equipment" style={{ padding: '10px 20px', background: '#fff', color: '#2E7D32', borderRadius: '12px', textDecoration: 'none', fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Zap size={16} fill="#2E7D32" /> {t('profile.lender.add_machine')}
                                </Link>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)' }}>
                                    <p style={{ fontSize: '12px', fontWeight: 700, opacity: 0.8, marginBottom: '4px' }}>{t('profile.lender.stat_total')}</p>
                                    <p style={{ fontSize: '24px', fontWeight: 900 }}>{myEquipment.length}</p>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)' }}>
                                    <p style={{ fontSize: '12px', fontWeight: 700, opacity: 0.8, marginBottom: '4px' }}>{t('profile.lender.stat_active')}</p>
                                    <p style={{ fontSize: '24px', fontWeight: 900 }}>{lenderRentals.filter(r => r.status === 'Confirmed' || r.status === 'In Progress').length}</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>{t('profile.lender.rentals_title')}</h3>
                            {lenderRentals.length === 0 ? (
                                <div style={{ background: '#fff', borderRadius: '18px', padding: '30px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                                    {t('profile.lender.no_lender_bookings')}
                                </div>
                            ) : (
                                lenderRentals.map(r => (
                                    <div key={r._id} style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: r.status === 'Confirmed' ? '1.5px solid #BBF7D0' : 'none' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E7D32' }}>
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '14px', fontWeight: 800, color: '#111827', margin: 0 }}>{r.renterId?.name?.first} {r.renterId?.name?.last}</p>
                                                    <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>{r.renterId?.mobile} · {r.equipmentId?.name}</p>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '999px', background: r.status === 'In Progress' ? '#E0F2F1' : '#F9FAFB', color: r.status === 'In Progress' ? '#00796B' : '#6B7280' }}>
                                                {r.status.toUpperCase()}
                                            </span>
                                        </div>

                                        {r.status === 'Confirmed' ? (
                                            <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <p style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563', margin: 0 }}>{t('profile.lender.ask_token')}</p>
                                                <button
                                                    onClick={() => {
                                                        const tok = prompt('Enter the 6-digit Handover Token from Renter:');
                                                        if (tok) {
                                                            fetch('http://localhost:5000/api/bookings/verify-handover', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json', 'x-auth-token': authToken },
                                                                body: JSON.stringify({ bookingId: r._id, token: tok })
                                                            }).then(res => res.ok ? fetchDashboardData() : alert('Invalid Token'));
                                                        }
                                                    }}
                                                    style={{ background: '#2E7D32', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                                                >
                                                    {t('profile.lender.verify_start')}
                                                </button>
                                            </div>
                                        ) : r.status === 'In Progress' ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontSize: '13px', fontWeight: 700 }}>
                                                <ShieldCheck size={16} /> {t('profile.lender.started_success')}
                                            </div>
                                        ) : null}
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>{t('profile.lender.listed_title')}</h3>
                            {myEquipment.length === 0 ? (
                                <div style={{ background: '#fff', borderRadius: '18px', padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                                    <Tractor size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                    <p>{t('profile.lender.no_listed')}</p>
                                </div>
                            ) : (
                                myEquipment.map(eq => (
                                    <div key={eq._id} style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E7D32' }}>
                                                <Tractor size={24} />
                                            </div>
                                            <div>
                                                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', margin: '0 0 2px' }}>{eq.name}</h4>
                                                <p style={{ fontSize: '12px', color: '#6B7280' }}>₹{eq.priceHr}/hr · {eq.category}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ textAlign: 'right', marginRight: '8px' }}>
                                                <p style={{ fontSize: '11px', fontWeight: 800, color: eq.isAvailable ? '#16A34A' : '#9CA3AF', margin: 0 }}>
                                                    {eq.isAvailable ? t('profile.lender.status_available') : t('profile.lender.status_offline')}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => toggleEquipStatus(eq._id)}
                                                style={{ width: '44px', height: '24px', borderRadius: '999px', background: eq.isAvailable ? '#2E7D32' : '#D1D5DB', border: 'none', cursor: 'pointer', position: 'relative', transition: 'all 0.3s' }}
                                            >
                                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: eq.isAvailable ? '23px' : '3px', transition: 'all 0.3s' }} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
