import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Leaf, Mail, Lock, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1 = form, 2 = success

    const [form, setForm] = useState({ email: '', aadhaarNo: '', newPassword: '', confirmPassword: '' });
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);

    function handleChange(e) {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
        setErrors(er => ({ ...er, [e.target.name]: '' }));
        setApiError('');
    }

    function validate() {
        const errs = {};
        if (!form.email) errs.email = 'Email is required.';
        else if (!/^[\w-.]+@gmail\.com$/i.test(form.email.trim())) errs.email = 'Must be a valid @gmail.com address.';
        if (!form.aadhaarNo) errs.aadhaarNo = 'Aadhaar number is required.';
        else if (!/^\d{12}$/.test(form.aadhaarNo.trim())) errs.aadhaarNo = 'Aadhaar must be exactly 12 digits.';
        if (!form.newPassword) errs.newPassword = 'New password is required.';
        else if (form.newPassword.length < 6) errs.newPassword = 'Password must be at least 6 characters.';
        if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
        else if (form.newPassword !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
        return errs;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        setApiError('');
        try {
            const res = await fetch('http://localhost:5000/api/user/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.email.trim().toLowerCase(),
                    aadhaarNo: form.aadhaarNo.trim(),
                    newPassword: form.newPassword,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setStep(2);
            } else {
                setApiError(data.message || 'Something went wrong. Please try again.');
            }
        } catch {
            setApiError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }

    /* ── styles ──────────────────────────────────────────────── */
    const inputBase = (hasErr) => ({
        width: '100%', padding: '12px 16px 12px 44px', borderRadius: '12px',
        border: `1.5px solid ${hasErr ? '#EF4444' : '#E5E7EB'}`,
        fontSize: '14px', outline: 'none', background: '#FAFAFA',
        boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.18s',
    });
    const iconLeft = { position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' };
    const errText = { fontSize: '12px', color: '#EF4444', marginTop: '4px', marginBottom: '8px' };
    const label = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' };
    const onFocus = e => { e.target.style.borderColor = '#2E7D32'; e.target.style.boxShadow = '0 0 0 3px rgba(46,125,50,0.1)'; };
    const onBlur = (hasErr) => e => { e.target.style.borderColor = hasErr ? '#EF4444' : '#E5E7EB'; e.target.style.boxShadow = ''; };

    return (
        <div style={{ minHeight: '100vh', display: 'flex' }}>

            {/* ── LEFT — Branded panel ────────────────────────── */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(160deg, #1B5E20 0%, #2E7D32 45%, #33691E 80%, #1B4332 100%)',
                padding: '48px 40px', position: 'relative', overflow: 'hidden', minWidth: '360px',
            }} className="hidden md:flex">
                {[{ s: 340, t: -120, r: -120, o: 0.06 }, { s: 220, b: -80, l: -80, o: 0.07 }, { s: 160, t: '40%', r: 40, o: 0.05 }].map((c, i) => (
                    <div key={i} style={{ position: 'absolute', width: c.s, height: c.s, borderRadius: '50%', background: '#fff', opacity: c.o, top: c.t, right: c.r, bottom: c.b, left: c.l }} />
                ))}

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', position: 'relative' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '16px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Leaf size={30} color="#8BC34A" />
                    </div>
                    <div>
                        <p style={{ fontSize: '20px', fontWeight: 800, color: '#fff', fontFamily: "'Poppins', sans-serif", lineHeight: 1.1 }}>Krishi Astra</p>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: '#8BC34A', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Setu</p>
                    </div>
                </div>

                <div style={{ fontSize: '96px', marginBottom: '24px', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' }}>🔐</div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', fontFamily: "'Poppins', sans-serif", textAlign: 'center', marginBottom: '14px', lineHeight: 1.3 }}>
                    Reset Your Password
                </h2>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 1.75, maxWidth: '300px', marginBottom: '32px' }}>
                    Verify your identity using your registered Aadhaar number to securely reset your password.
                </p>

                {['🆔 Aadhaar-Based Verification', '🔒 Secure Password Reset', '✅ No Email Required'].map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', padding: '8px 18px', marginBottom: '8px', width: '100%', maxWidth: '280px' }}>
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{b}</span>
                    </div>
                ))}
            </div>

            {/* ── RIGHT — Form ────────────────────────────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: '48px 32px', minWidth: '320px' }}>
                <div style={{ width: '100%', maxWidth: '420px' }}>

                    {/* Back to login */}
                    <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6B7280', fontWeight: 600, textDecoration: 'none', marginBottom: '28px' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#2E7D32'}
                        onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}>
                        <ArrowLeft size={15} /> Back to Login
                    </Link>

                    {step === 1 ? (
                        <>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827', fontFamily: "'Poppins', sans-serif", marginBottom: '6px' }}>Forgot Password</h1>
                            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '28px' }}>Enter your registered email and Aadhaar number to reset your password.</p>

                            {apiError && (
                                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#DC2626' }}>
                                    ⚠️ {apiError}
                                </div>
                            )}

                            {/* Info box */}
                            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontSize: '13px', color: '#166534', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                                <span>Your Aadhaar number is used <strong>only to verify your identity</strong> and is never stored in plain text.</span>
                            </div>

                            <form onSubmit={handleSubmit} noValidate>
                                {/* Email */}
                                <label style={label}>Registered Email Address</label>
                                <div style={{ position: 'relative', marginBottom: '4px' }}>
                                    <Mail size={16} style={iconLeft} />
                                    <input type="email" name="email" value={form.email} onChange={handleChange}
                                        placeholder="yourname@gmail.com"
                                        style={inputBase(errors.email)} onFocus={onFocus} onBlur={onBlur(errors.email)} />
                                </div>
                                {errors.email && <p style={errText}>{errors.email}</p>}

                                {/* Aadhaar */}
                                <label style={{ ...label, marginTop: '16px' }}>Aadhaar Number (12 digits)</label>
                                <div style={{ position: 'relative', marginBottom: '4px' }}>
                                    <ShieldCheck size={16} style={iconLeft} />
                                    <input type="text" name="aadhaarNo" value={form.aadhaarNo} onChange={handleChange}
                                        placeholder="XXXX XXXX XXXX" maxLength={12}
                                        style={inputBase(errors.aadhaarNo)} onFocus={onFocus} onBlur={onBlur(errors.aadhaarNo)} />
                                </div>
                                {errors.aadhaarNo && <p style={errText}>{errors.aadhaarNo}</p>}

                                {/* New Password */}
                                <label style={{ ...label, marginTop: '16px' }}>New Password</label>
                                <div style={{ position: 'relative', marginBottom: '4px' }}>
                                    <Lock size={16} style={iconLeft} />
                                    <input type={showNew ? 'text' : 'password'} name="newPassword" value={form.newPassword} onChange={handleChange}
                                        placeholder="Min. 6 characters"
                                        style={{ ...inputBase(errors.newPassword), paddingRight: '44px' }}
                                        onFocus={onFocus} onBlur={onBlur(errors.newPassword)} />
                                    <button type="button" onClick={() => setShowNew(v => !v)}
                                        style={{ position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
                                        {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>
                                {errors.newPassword && <p style={errText}>{errors.newPassword}</p>}

                                {/* Confirm Password */}
                                <label style={{ ...label, marginTop: '16px' }}>Confirm New Password</label>
                                <div style={{ position: 'relative', marginBottom: '24px' }}>
                                    <Lock size={16} style={iconLeft} />
                                    <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                                        placeholder="Re-enter new password"
                                        style={{ ...inputBase(errors.confirmPassword), paddingRight: '44px' }}
                                        onFocus={onFocus} onBlur={onBlur(errors.confirmPassword)} />
                                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                                        style={{ position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
                                        {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p style={{ ...errText, marginTop: '-20px' }}>{errors.confirmPassword}</p>}

                                <button type="submit" disabled={loading}
                                    style={{ width: '100%', background: loading ? '#6B7280' : '#2E7D32', color: '#fff', fontWeight: 700, fontSize: '15px', padding: '14px', borderRadius: '12px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s', fontFamily: 'inherit' }}
                                    onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#388E3C'; }}
                                    onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#2E7D32'; }}>
                                    {loading ? '⏳ Verifying...' : <><span>Reset Password</span><ArrowRight size={17} /></>}
                                </button>
                            </form>
                        </>
                    ) : (
                        /* ── Step 2 — Success ──────────────────── */
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: 'linear-gradient(135deg, #2E7D32, #8BC34A)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 32px rgba(46,125,50,0.3)' }}>
                                <CheckCircle2 size={44} color="#fff" strokeWidth={2} />
                            </div>
                            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', fontFamily: "'Poppins', sans-serif", marginBottom: '12px' }}>Password Reset! 🎉</h1>
                            <p style={{ color: '#6B7280', fontSize: '14px', lineHeight: 1.7, marginBottom: '32px' }}>
                                Your password has been successfully reset.<br />
                                You can now log in with your new password.
                            </p>
                            <button onClick={() => navigate('/login')}
                                style={{ width: '100%', background: '#2E7D32', color: '#fff', fontWeight: 700, fontSize: '15px', padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit' }}>
                                <span>Go to Login</span><ArrowRight size={17} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
