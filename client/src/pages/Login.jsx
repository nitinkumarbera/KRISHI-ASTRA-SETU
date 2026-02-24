import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Leaf, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Email must end with @gmail.com
function isValidEmail(email) {
    return /^[^\s@]+@gmail\.com$/i.test(email.trim());
}

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState({ email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    function handleChange(e) {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
        setErrors(er => ({ ...er, [e.target.name]: '' }));
        setApiError('');
    }

    function validate() {
        const errs = {};
        if (!form.email) errs.email = 'Email is required.';
        else if (!isValidEmail(form.email)) errs.email = 'Please enter a valid @gmail.com address.';
        if (!form.password) errs.password = 'Password is required.';
        else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
        return errs;
    }



    async function handleSubmit(e) {
        e.preventDefault();

        const errs = {};
        if (!form.email) errs.email = 'Email is required.';
        if (!form.password) errs.password = 'Password is required.';
        else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
        if (!errs.email && !isValidEmail(form.email))
            errs.email = 'Please enter a valid @gmail.com address.';
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        try {
            // ── Try real backend API first ──────────────────────
            let res, data;
            try {
                res = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: form.email.trim().toLowerCase(), password: form.password }),
                });
                data = await res.json();
            } catch (networkErr) {
                data = null;
            }

            if (data && res?.ok) {
                // Real login success — call context so Navbar updates immediately
                login({ token: data.token, user: data.user });
                const role = (data.user?.role || 'Member').toLowerCase();
                const ROLE_ROUTES_LIVE = { admin: '/admin-dashboard', member: '/marketplace' };
                navigate(data.redirect || ROLE_ROUTES_LIVE[role] || '/marketplace');
                return;
            }

            throw new Error('Invalid credentials. Check your email and password.');
        } catch (err) {
            setApiError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }


    /* ── styles ────────────────────────────────────────────── */
    const inputWrap = { position: 'relative', marginBottom: '4px' };
    const inputStyle = (hasErr) => ({
        width: '100%', padding: '12px 16px 12px 44px', borderRadius: '12px',
        border: `1.5px solid ${hasErr ? '#EF4444' : '#E5E7EB'}`,
        fontSize: '14px', outline: 'none', background: '#FAFAFA',
        boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.18s',
    });
    const iconLeft = { position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' };
    const errText = { fontSize: '12px', color: '#EF4444', marginTop: '4px', marginBottom: '8px' };

    return (
        <div style={{ minHeight: '100vh', display: 'flex' }}>

            {/* ── LEFT — Branded farm panel ─────────────────────── */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(160deg, #1B5E20 0%, #2E7D32 45%, #33691E 80%, #1B4332 100%)',
                padding: '48px 40px', position: 'relative', overflow: 'hidden',
                minWidth: '360px',
            }} className="hidden md:flex">

                {/* Decorative circles */}
                {[{ s: 340, t: -120, r: -120, o: 0.06 }, { s: 220, b: -80, l: -80, o: 0.07 }, { s: 160, t: '40%', r: 40, o: 0.05 }].map((c, i) => (
                    <div key={i} style={{ position: 'absolute', width: c.s, height: c.s, borderRadius: '50%', background: '#fff', opacity: c.o, top: c.t, right: c.r, bottom: c.b, left: c.l, pointerEvents: 'none' }} />
                ))}

                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', position: 'relative' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '16px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Leaf size={30} color="#8BC34A" />
                    </div>
                    <div>
                        <p style={{ fontSize: '20px', fontWeight: 800, color: '#fff', fontFamily: "'Poppins', sans-serif", lineHeight: 1.1 }}>Krishi Astra</p>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: '#8BC34A', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Setu</p>
                    </div>
                </div>

                {/* Farm sunrise illustration */}
                <div style={{ fontSize: '96px', marginBottom: '24px', position: 'relative', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' }}>🌅</div>

                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', fontFamily: "'Poppins', sans-serif", textAlign: 'center', marginBottom: '14px', lineHeight: 1.3 }}>
                    Welcome Back,<br />Kisan Mitra! 🌾
                </h2>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 1.75, maxWidth: '300px', marginBottom: '32px' }}>
                    Log in to access your equipment listings, active bookings, and earnings dashboard.
                </p>

                {/* Trust badges */}
                {['🔒 KYC Verified Platform', '📍 Geo-Tagged Equipment', '🤝 1,200+ Farmers Onboarded'].map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', padding: '8px 18px', marginBottom: '8px', width: '100%', maxWidth: '280px' }}>
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{b}</span>
                    </div>
                ))}
            </div>

            {/* ── RIGHT — Login form ────────────────────────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: '48px 32px', minWidth: '320px' }}>
                <div style={{ width: '100%', maxWidth: '420px' }}>

                    {/* Mobile logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }} className="md:hidden">
                        <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Leaf size={22} color="#8BC34A" />
                        </div>
                        <div>
                            <p style={{ fontSize: '16px', fontWeight: 800, color: '#2E7D32', fontFamily: "'Poppins', sans-serif", lineHeight: 1.1 }}>Krishi Astra Setu</p>
                            <p style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 500 }}>Bridging Tools, Empowering Farmers</p>
                        </div>
                    </div>

                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827', fontFamily: "'Poppins', sans-serif", marginBottom: '6px' }}>Sign In</h1>
                    <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '28px' }}>
                        Access your farmer or lender dashboard
                    </p>

                    {/* API error banner */}
                    {apiError && (
                        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#DC2626' }}>
                            ⚠️ {apiError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        {/* Email */}
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                            Email Address
                        </label>
                        <div style={inputWrap}>
                            <Mail size={16} style={iconLeft} />
                            <input
                                type="email" name="email" value={form.email}
                                onChange={handleChange} placeholder="yourname@gmail.com"
                                style={inputStyle(errors.email)}
                                onFocus={e => { e.target.style.borderColor = '#2E7D32'; e.target.style.boxShadow = '0 0 0 3px rgba(46,125,50,0.1)'; }}
                                onBlur={e => { e.target.style.borderColor = errors.email ? '#EF4444' : '#E5E7EB'; e.target.style.boxShadow = ''; }}
                            />
                        </div>
                        {errors.email && <p style={errText}>{errors.email}</p>}

                        {/* Password */}
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', marginTop: '16px' }}>
                            Password
                        </label>
                        <div style={{ ...inputWrap }}>
                            <Lock size={16} style={iconLeft} />
                            <input
                                type={showPass ? 'text' : 'password'} name="password" value={form.password}
                                onChange={handleChange} placeholder="••••••••"
                                style={{ ...inputStyle(errors.password), paddingRight: '44px' }}
                                onFocus={e => { e.target.style.borderColor = '#2E7D32'; e.target.style.boxShadow = '0 0 0 3px rgba(46,125,50,0.1)'; }}
                                onBlur={e => { e.target.style.borderColor = errors.password ? '#EF4444' : '#E5E7EB'; e.target.style.boxShadow = ''; }}
                            />
                            <button type="button" onClick={() => setShowPass(v => !v)}
                                style={{ position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
                                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                            </button>
                        </div>
                        {errors.password && <p style={errText}>{errors.password}</p>}

                        {/* Forgot password */}
                        <div style={{ textAlign: 'right', marginTop: '6px', marginBottom: '24px' }}>
                            <a href="#" style={{ fontSize: '13px', fontWeight: 600, color: '#8BC34A', textDecoration: 'none' }}
                                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                            >
                                Forgot Password?
                            </a>
                        </div>

                        {/* Submit */}
                        <button type="submit" disabled={loading}
                            style={{ width: '100%', background: loading ? '#6B7280' : '#2E7D32', color: '#fff', fontWeight: 700, fontSize: '15px', padding: '14px', borderRadius: '12px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s', fontFamily: 'inherit' }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#388E3C'; }}
                            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#2E7D32'; }}
                        >
                            {loading ? '⏳ Signing in...' : <><span>Login</span><ArrowRight size={17} /></>}
                        </button>
                    </form>

                    {/* Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
                        <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
                        <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500 }}>OR</span>
                        <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
                    </div>

                    {/* Register link */}
                    <p style={{ textAlign: 'center', fontSize: '14px', color: '#6B7280' }}>
                        New to the platform?{' '}
                        <Link to="/register" style={{ color: '#2E7D32', fontWeight: 700, textDecoration: 'none' }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        >
                            Register here
                        </Link>
                    </p>




                </div>
            </div>

        </div>
    );
}
