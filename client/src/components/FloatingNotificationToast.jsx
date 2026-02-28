/**
 * FloatingNotificationToast
 * ─────────────────────────────────────────────────────────────
 * Polls /api/notifications every 30 s and pops a branded toast
 * whenever a genuinely NEW unread notification arrives.
 */
import { useState, useEffect, useRef } from 'react';
import { X, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API_BASE from '../utils/api';
import logo from '../assets/logo.svg';

const TYPE_CFG = {
    Booking: { icon: '📅', label: 'Booking Update' },
    KYC: { icon: '🛡️', label: 'KYC Status' },
    System: { icon: '🌾', label: 'KAS Admin' },
    Equipment: { icon: '🚜', label: 'Equipment Alert' },
    Payment: { icon: '💰', label: 'Payment Update' },
    Review: { icon: '⭐', label: 'New Review' },
    Handover: { icon: '🤝', label: 'Handover Update' },
};

function senderLabel(notif) {
    if (notif.sender) {
        const first = notif.sender?.name?.first || '';
        const last = notif.sender?.name?.last || '';
        const name = [first, last].filter(Boolean).join(' ');
        if (name) return `From ${name}`;
        if (notif.sender?.role === 'Admin') return 'From KAS Admin';
    }
    return TYPE_CFG[notif.type]?.label || 'Krishi Astra Setu';
}

export default function FloatingNotificationToast() {
    const { isAuthenticated, token } = useAuth();
    const [toasts, setToasts] = useState([]);
    const seenIds = useRef(new Set());
    const initialized = useRef(false);

    const removeToast = (id) => setToasts(p => p.filter(t => t._toastId !== id));

    const checkNotifs = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/api/notifications`, {
                headers: { 'x-auth-token': token }
            });
            const d = await res.json();
            if (!d.success) return;

            const unread = (d.data || []).filter(n => !n.isRead);

            if (!initialized.current) {
                // First load — seed seen IDs without showing toasts
                unread.forEach(n => seenIds.current.add(n._id));
                initialized.current = true;
                return;
            }

            const newNotifs = unread.filter(n => !seenIds.current.has(n._id));
            newNotifs.forEach(n => seenIds.current.add(n._id));

            newNotifs.slice(0, 3).forEach(notif => {   // At most 3 toasts at once
                const _toastId = `${notif._id}-${Date.now()}`;
                setToasts(p => [...p, { ...notif, _toastId }]);
                setTimeout(() => removeToast(_toastId), 7000);
            });
        } catch { /* silent */ }
    };

    useEffect(() => {
        if (!isAuthenticated) return;
        checkNotifs();
        const iv = setInterval(checkNotifs, 30000);
        return () => clearInterval(iv);
    }, [isAuthenticated, token]);   // eslint-disable-line

    if (toasts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed', bottom: '80px', right: '14px',
            zIndex: 9998, display: 'flex', flexDirection: 'column-reverse', gap: '10px',
            maxWidth: '340px', width: 'calc(100vw - 28px)',
            pointerEvents: 'none'          // let clicks through the gap
        }}>
            {toasts.map(toast => {
                const cfg = TYPE_CFG[toast.type] || TYPE_CFG.System;
                return (
                    <div key={toast._toastId} className="kas-toast" style={{
                        background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 55%, #43A047 100%)',
                        borderRadius: '18px',
                        padding: '14px 14px 14px 16px',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.1)',
                        display: 'flex', gap: '12px', alignItems: 'flex-start',
                        pointerEvents: 'all',
                    }}>

                        {/* Type icon circle */}
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '12px',
                            background: 'rgba(255,255,255,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '20px', flexShrink: 0,
                        }}>
                            {cfg.icon}
                        </div>

                        {/* Text content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Header row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <img src={logo} alt=""
                                    style={{ width: '16px', height: '16px', borderRadius: '4px' }}
                                    onError={e => e.target.style.display = 'none'} />
                                <span style={{
                                    fontSize: '10px', fontWeight: 800, color: '#A5D6A7',
                                    textTransform: 'uppercase', letterSpacing: '0.07em',
                                }}>
                                    Krishi Astra Setu
                                </span>
                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                                    · {cfg.label}
                                </span>
                            </div>

                            {/* Sender line */}
                            <p style={{
                                fontSize: '11px', fontWeight: 700, color: '#C8E6C9',
                                margin: '0 0 3px', letterSpacing: '0.02em',
                            }}>
                                {senderLabel(toast)}
                            </p>

                            {/* Message */}
                            <p style={{
                                fontSize: '13px', color: '#fff', fontWeight: 500,
                                lineHeight: 1.45, margin: 0,
                                display: '-webkit-box', WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                                {toast.message}
                            </p>

                            {/* Time */}
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', margin: '5px 0 0' }}>
                                {new Date(toast.createdAt).toLocaleTimeString('en-IN', {
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </p>
                        </div>

                        {/* Close */}
                        <button onClick={() => removeToast(toast._toastId)}
                            style={{
                                background: 'rgba(255,255,255,0.12)', border: 'none',
                                borderRadius: '8px', color: 'rgba(255,255,255,0.7)',
                                cursor: 'pointer', padding: '4px', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                            <X size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
