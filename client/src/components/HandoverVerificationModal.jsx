/**
 * HandoverVerificationModal.jsx
 * ─────────────────────────────────────────────────────────────
 * Modal used by the LENDER to enter the 6-digit Handover Code
 * provided by the Renter in person, officially starting the rental.
 *
 * Usage:
 *   <HandoverVerificationModal
 *       bookingId={b._id}
 *       equipmentName={b.equipment.name}
 *       authToken={token}
 *       onSuccess={(bookingId) => refetchBookings()}
 *       onClose={() => setModalOpen(false)}
 *   />
 */

import { useState } from 'react';
import { X, ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { kasAlert } from './KasDialog';

export default function HandoverVerificationModal({
    bookingId, equipmentName, authToken, onSuccess, onClose
}) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    async function handleVerify() {
        const cleaned = code.trim();
        if (cleaned.length !== 6 || !/^\d{6}$/.test(cleaned)) {
            setError('Please enter a valid 6-digit numeric code.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`http://localhost:5000/api/payments/verify-handover/${bookingId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': authToken },
                body: JSON.stringify({ code: cleaned })
            });
            const data = await res.json();
            if (!data.success) { setError(data.message || 'Code incorrect.'); setLoading(false); return; }
            setSuccess(true);
            setTimeout(() => { onSuccess(bookingId); onClose(); }, 2000);
        } catch {
            setError('Network error. Please try again.');
        }
        setLoading(false);
    }

    // Digit-only, max 6 chars
    function handleInput(e) {
        const v = e.target.value.replace(/\D/g, '').slice(0, 6);
        setCode(v);
        if (error) setError('');
    }

    return (
        // Backdrop
        <div
            onClick={e => e.target === e.currentTarget && onClose()}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px'
            }}
        >
            {/* Modal box */}
            <div style={{
                background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '420px',
                boxShadow: '0 24px 80px rgba(0,0,0,0.35)', overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg,#1B5E20,#2E7D32)', padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldCheck size={22} color="#fff" />
                        </div>
                        <div>
                            <p style={{ color: '#fff', fontWeight: 900, fontSize: '16px', margin: 0 }}>Enter Handover Code</p>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: 0 }}>{equipmentName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '28px 24px' }}>
                    {success ? (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <CheckCircle2 size={56} color="#16a34a" style={{ margin: '0 auto 16px' }} />
                            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>🎉 Rental Started!</h3>
                            <p style={{ fontSize: '14px', color: '#6B7280' }}>Handover verified. The rental is now officially in progress.</p>
                        </div>
                    ) : (
                        <>
                            <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, marginBottom: '20px' }}>
                                Ask the <strong>Renter</strong> to show their 6-digit Handover Code from the Krishi Astra Setu app and enter it below to officially start the rental.
                            </p>

                            {/* Code input */}
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={code}
                                onChange={handleInput}
                                placeholder="_ _ _ _ _ _"
                                style={{
                                    width: '100%', padding: '16px', textAlign: 'center',
                                    fontSize: '32px', fontWeight: 900, letterSpacing: '0.35em',
                                    fontFamily: 'monospace', border: `2.5px solid ${error ? '#EF4444' : code.length === 6 ? '#2E7D32' : '#E5E7EB'}`,
                                    borderRadius: '14px', outline: 'none', background: '#F9FAFB',
                                    color: '#111827', boxSizing: 'border-box',
                                    transition: 'border-color 0.2s'
                                }}
                            />

                            {error && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', padding: '10px 12px', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA' }}>
                                    <AlertTriangle size={14} color="#DC2626" />
                                    <span style={{ fontSize: '13px', color: '#DC2626', fontWeight: 600 }}>{error}</span>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
                                <button
                                    onClick={onClose}
                                    style={{ padding: '13px', borderRadius: '12px', border: '2px solid #E5E7EB', background: 'transparent', color: '#374151', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleVerify}
                                    disabled={code.length !== 6 || loading}
                                    style={{
                                        padding: '13px', borderRadius: '12px', border: 'none',
                                        background: (code.length !== 6 || loading) ? '#E5E7EB' : 'linear-gradient(135deg,#2E7D32,#388E3C)',
                                        color: (code.length !== 6 || loading) ? '#9CA3AF' : '#fff',
                                        fontWeight: 800, fontSize: '14px',
                                        cursor: (code.length !== 6 || loading) ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        boxShadow: (code.length !== 6 || loading) ? 'none' : '0 4px 14px rgba(46,125,50,0.3)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {loading ? <><RefreshCw size={14} className="animate-spin" /> Verifying…</> : <>✅ Verify & Start Rental</>}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
