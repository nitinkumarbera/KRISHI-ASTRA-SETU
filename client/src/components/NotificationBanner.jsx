import { AlertCircle, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

// ── NotificationBanner ─────────────────────────────────────
// Show this on the farmer/lender dashboard when kycStatus === 'Rejected'.
// Props:
//   reason  – string from backend (e.g. "Document Blurry")
//   onClose – optional callback to dismiss the banner
// ──────────────────────────────────────────────────────────
export default function NotificationBanner({ reason = 'Document could not be verified.', onClose }) {
    const [dismissed, setDismissed] = useState(false);
    if (dismissed) return null;

    function handleClose() {
        setDismissed(true);
        if (onClose) onClose();
    }

    return (
        <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderLeft: '4px solid #DC2626',
            borderRadius: '14px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            position: 'relative',
            boxShadow: '0 2px 8px rgba(239,68,68,0.1)',
            fontFamily: "'Inter', sans-serif",
        }}>
            {/* Icon */}
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertCircle size={20} color="#DC2626" />
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#991B1B', marginBottom: '4px' }}>
                    ⚠️ KYC Verification Declined
                </p>
                <p style={{ fontSize: '13px', color: '#7F1D1D', lineHeight: 1.65, marginBottom: '14px' }}>
                    Your KYC was declined.{' '}
                    <strong>Reason: {reason}</strong>.{' '}
                    Please re-upload your documents to access equipment listings and rentals.
                </p>
                <Link
                    to="/profile/kyc-upload"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '7px',
                        background: '#DC2626', color: '#fff',
                        fontSize: '13px', fontWeight: 700,
                        padding: '9px 18px', borderRadius: '9px',
                        textDecoration: 'none', transition: 'background 0.18s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#B91C1C'}
                    onMouseLeave={e => e.currentTarget.style.background = '#DC2626'}
                >
                    <Upload size={14} />
                    Re-upload Documents
                </Link>
            </div>

            {/* Dismiss */}
            <button
                onClick={handleClose}
                style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#FCA5A5', display: 'flex' }}
                title="Dismiss"
            >
                <X size={16} />
            </button>
        </div>
    );
}
