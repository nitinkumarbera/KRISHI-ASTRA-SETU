import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    User, MapPin, CreditCard, Upload, CheckCircle2, Loader2,
    Eye, EyeOff, Phone, Mail, Calendar, Building2, Landmark,
    FileText, Camera, ChevronDown, AlertCircle
} from 'lucide-react';

import { ALL_STATES, getDistricts, getTalukas } from '../utils/locationData';

const BANKS = [
    'State Bank of India', 'Punjab National Bank', 'Bank of Baroda', 'Canara Bank', 'Union Bank of India',
    'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'IndusInd Bank', 'Federal Bank',
    'Bank of India', 'UCO Bank', 'Central Bank of India', 'Indian Bank', 'IDBI Bank', 'Other'
];

// ── Helpers ────────────────────────────────────────────────
function isGmail(e) { return /^[^\s@]+@gmail\.com$/i.test(e.trim()); }
function Err({ msg }) { return msg ? <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} />{msg}</p> : null; }

const STEP_ICONS = [User, MapPin, CreditCard, Upload];
const STEP_LABELS = ['Identity', 'Address', 'Finance', 'KYC Docs'];

// ── Sub-components (MUST be outside Register to prevent focus loss on re-render) ──
function SectionHead({ icon: Icon, title, subtitle }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #F0FDF4' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #2E7D32, #8BC34A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color="#fff" />
            </div>
            <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#111827', margin: 0 }}>{title}</h3>
                {subtitle && <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>{subtitle}</p>}
            </div>
        </div>
    );
}

function FG({ label, required, children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
            </label>
            {children}
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────
export default function Register() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState({});

    // ── Form State ─────────────────────────────────────────
    const [form, setForm] = useState({
        firstName: '', middleName: '', lastName: '',
        gender: '', dob: '', age: '',
        mobile: '', email: '', aadhaarNo: '', password: '', confirmPassword: '',
        houseNo: '', village: '', postOffice: '', gpWard: '',
        block: '', policeStation: '', landmark: '', district: '', pinCode: '', state: 'Maharashtra',
        bankName: '', branchName: '', accountNo: '', ifscCode: '', upiId: '', customBankName: '',
    });
    const [showPass, setShowPass] = useState(false);
    const [files, setFiles] = useState({ passportPhoto: null, aadhaarImage: null, voterIdImage: null, passbookImage: null, qrCodeImage: null });
    const [previews, setPreviews] = useState({});
    const fileRefs = { passportPhoto: useRef(), aadhaarImage: useRef(), voterIdImage: useRef(), passbookImage: useRef(), qrCodeImage: useRef() };

    function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); }

    // Auto-calc age from DOB
    function handleDob(v) {
        set('dob', v);
        if (v) {
            const age = Math.floor((new Date() - new Date(v)) / (1000 * 60 * 60 * 24 * 365.25));
            set('age', age > 0 ? age : '');
        }
    }

    function handleFile(k, e) {
        const file = e.target.files[0];
        if (!file) return;
        // ── 5 MB size guard ──────────────────────────────────────
        if (file.size > 5 * 1024 * 1024) {
            alert(`⚠️ Image too large!\n\n"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB.\n\nMaximum allowed size is 5 MB.\nPlease compress or resize the image and try again.`);
            e.target.value = ''; // reset the input so user can pick again
            return;
        }
        setFiles(f => ({ ...f, [k]: file }));
        setPreviews(p => ({ ...p, [k]: URL.createObjectURL(file) }));
        setErrors(er => ({ ...er, [k]: undefined }));
    }

    // ── Step Validators ────────────────────────────────────
    function validateStep(s) {
        const e = {};
        if (s === 0) {
            if (!form.firstName.trim()) e.firstName = 'Required';
            if (!form.lastName.trim()) e.lastName = 'Required';
            if (!form.gender) e.gender = 'Required';
            if (!form.dob) e.dob = 'Required';
            if (!/^\d{10}$/.test(form.mobile)) e.mobile = 'Must be exactly 10 digits';
            if (!isGmail(form.email)) e.email = 'Must be a valid @gmail.com address';
            if (!/^\d{12}$/.test(form.aadhaarNo)) e.aadhaarNo = 'Must be exactly 12 digits';
            if (form.password.length < 6) e.password = 'Minimum 6 characters';
            if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
        }
        if (s === 1) {
            if (!form.village.trim()) e.village = 'Required';
            if (!form.district.trim()) e.district = 'Required';
            if (!/^\d{6}$/.test(form.pinCode)) e.pinCode = 'Must be exactly 6 digits';
            if (!form.state) e.state = 'Required';
        }
        if (s === 2) {
            if (!form.bankName) e.bankName = 'Required';
            if (form.bankName === 'Other' && !form.customBankName.trim()) e.customBankName = 'Please specify your bank name';
            if (!form.accountNo.trim()) e.accountNo = 'Required';
            if (!form.ifscCode.trim()) e.ifscCode = 'IFSC Code is required';
        }
        if (s === 3) {
            if (!files.passportPhoto) e.passportPhoto = 'Upload required';
            if (!files.aadhaarImage) e.aadhaarImage = 'Upload required';
        }
        return e;
    }

    function next() {
        const e = validateStep(step);
        if (Object.keys(e).length) { setErrors(e); return; }
        setStep(s => s + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    function back() { setStep(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }

    const [serverError, setServerError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        const e2 = validateStep(3);
        if (Object.keys(e2).length) { setErrors(e2); return; }
        setLoading(true);
        setServerError('');

        try {
            // Build FormData — required for file uploads (multipart/form-data)
            const fd = new FormData();

            // Append all 30+ text fields
            Object.entries(form).forEach(([k, v]) => fd.append(k, v));

            // Append the 5 KYC document files
            Object.entries(files).forEach(([k, file]) => { if (file) fd.append(k, file); });

            const res = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                body: fd,
                // Do NOT set Content-Type header — browser sets it with boundary automatically
            });

            const data = await res.json();

            if (!res.ok) {
                setServerError(data.message || 'Registration failed. Please try again.');
                setLoading(false);
                return;
            }

            // Success
            setSubmitted(true);
        } catch (err) {
            setServerError('Cannot connect to server. Please ensure the backend is running on port 5000.');
        } finally {
            setLoading(false);
        }
    }

    // ── Styles ─────────────────────────────────────────────
    const inp = (k) => ({
        width: '100%', padding: '11px 14px', borderRadius: '10px', fontSize: '14px',
        border: `1.5px solid ${errors[k] ? '#EF4444' : '#E5E7EB'}`, outline: 'none',
        background: '#F9FAFB', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif",
        transition: 'border-color 0.2s'
    });
    const focusIn = (e) => { e.target.style.borderColor = '#2E7D32'; e.target.style.boxShadow = '0 0 0 3px rgba(46,125,50,0.1)'; };
    const blurIn = (e, k) => { e.target.style.borderColor = errors[k] ? '#EF4444' : '#E5E7EB'; e.target.style.boxShadow = 'none'; };


    // ── Success Screen ─────────────────────────────────────

    if (submitted) {
        return (
            <div style={{ minHeight: '100vh', background: '#F5F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Inter', sans-serif" }}>
                <div style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
                    <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'linear-gradient(135deg, #2E7D32, #8BC34A)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 12px 40px rgba(46,125,50,0.3)' }}>
                        <CheckCircle2 size={52} color="#fff" strokeWidth={2} />
                    </div>
                    <h1 style={{ fontSize: '30px', fontWeight: 900, color: '#111827', marginBottom: '12px', fontFamily: "'Poppins', sans-serif" }}>Registration Complete! 🎉</h1>
                    <div style={{ background: '#fff', borderRadius: '18px', padding: '28px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FEF9C3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>⏳</div>
                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '10px' }}>Pending Admin Approval</h2>
                        <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.7 }}>
                            Your profile has been submitted successfully. Our admin team will review your KYC documents within <strong>24–48 hours</strong>. You will receive an SMS and email once approved.
                        </p>
                        <div style={{ marginTop: '20px', padding: '14px', background: '#F0FDF4', borderRadius: '10px', fontSize: '13px', color: '#15803D', fontWeight: 600 }}>
                            ✅ You can rent or lend equipment once verified.
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Link to="/login" style={{ flex: 1, padding: '13px', borderRadius: '12px', background: '#2E7D32', textAlign: 'center', fontSize: '14px', fontWeight: 700, color: '#fff', textDecoration: 'none' }}>Go to Login</Link>
                        <Link to="/" style={{ flex: 1, padding: '13px', borderRadius: '12px', border: '2px solid #E5E7EB', textAlign: 'center', fontSize: '14px', fontWeight: 700, color: '#374151', textDecoration: 'none' }}>Home</Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── Form ───────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: '#F5F7F5', fontFamily: "'Inter', sans-serif", paddingBottom: '60px' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', padding: '28px 20px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#fff', margin: '0 0 4px', fontFamily: "'Poppins', sans-serif" }}>🌾 Join Krishi Astra Setu</h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: 0 }}>Register as a Member — rent or lend farm equipment once verified.</p>
            </div>

            {/* Step Progress */}
            <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '20px' }}>
                <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0' }}>
                    {STEP_LABELS.map((label, i) => {
                        const Icon = STEP_ICONS[i];
                        const done = i < step, active = i === step;
                        return (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                {i > 0 && <div style={{ position: 'absolute', top: '20px', left: 0, right: '50%', height: '2px', background: done || active ? '#2E7D32' : '#E5E7EB', transform: 'translateX(-50%)' }} />}
                                {i < 3 && <div style={{ position: 'absolute', top: '20px', left: '50%', right: 0, height: '2px', background: done ? '#2E7D32' : '#E5E7EB' }} />}
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: done ? '#2E7D32' : active ? '#2E7D32' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, border: `2px solid ${active || done ? '#2E7D32' : '#E5E7EB'}` }}>
                                    {done ? <CheckCircle2 size={20} color="#fff" /> : <Icon size={18} color={active ? '#fff' : '#9CA3AF'} />}
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: active ? '#2E7D32' : done ? '#374151' : '#9CA3AF', marginTop: '6px' }}>{label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={{ maxWidth: '860px', margin: '28px auto', padding: '0 20px' }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>

                        {/* ── STEP 0: Identity ─────────────────── */}
                        {step === 0 && (
                            <>
                                <SectionHead icon={User} title="Section 1: Identity & Contact" subtitle="Personal details for your KYC verification" />
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                                    <FG label="First Name" required>
                                        <input value={form.firstName} onChange={e => set('firstName', e.target.value)} style={inp('firstName')} placeholder="e.g. Ramesh" onFocus={focusIn} onBlur={e => blurIn(e, 'firstName')} />
                                        <Err msg={errors.firstName} />
                                    </FG>
                                    <FG label="Middle Name">
                                        <input value={form.middleName} onChange={e => set('middleName', e.target.value)} style={inp('middleName')} placeholder="e.g. Kumar" onFocus={focusIn} onBlur={e => blurIn(e, 'middleName')} />
                                    </FG>
                                    <FG label="Last Name" required>
                                        <input value={form.lastName} onChange={e => set('lastName', e.target.value)} style={inp('lastName')} placeholder="e.g. Patil" onFocus={focusIn} onBlur={e => blurIn(e, 'lastName')} />
                                        <Err msg={errors.lastName} />
                                    </FG>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: '16px', marginBottom: '16px' }}>
                                    <FG label="Gender" required>
                                        <select value={form.gender} onChange={e => set('gender', e.target.value)} style={{ ...inp('gender'), background: '#F9FAFB' }} onFocus={focusIn} onBlur={e => blurIn(e, 'gender')}>
                                            <option value="">Select...</option>
                                            <option>Male</option><option>Female</option><option>Other</option>
                                        </select>
                                        <Err msg={errors.gender} />
                                    </FG>
                                    <FG label="Date of Birth" required>
                                        <input type="date" value={form.dob} onChange={e => handleDob(e.target.value)} max={new Date().toISOString().split('T')[0]} style={inp('dob')} onFocus={focusIn} onBlur={e => blurIn(e, 'dob')} />
                                        <Err msg={errors.dob} />
                                    </FG>
                                    <FG label="Age">
                                        <input value={form.age} readOnly style={{ ...inp('age'), background: '#F3F4F6', color: '#6B7280' }} placeholder="Auto" />
                                    </FG>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                    <FG label="Mobile Number" required>
                                        <div style={{ position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>+91</span>
                                            <input value={form.mobile} onChange={e => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} style={{ ...inp('mobile'), paddingLeft: '48px' }} placeholder="98765 43210" onFocus={focusIn} onBlur={e => blurIn(e, 'mobile')} />
                                        </div>
                                        <Err msg={errors.mobile} />
                                    </FG>
                                    <FG label="Email ID (Gmail)" required>
                                        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inp('email')} placeholder="name@gmail.com" onFocus={focusIn} onBlur={e => blurIn(e, 'email')} />
                                        <Err msg={errors.email} />
                                    </FG>
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <FG label="Aadhaar Number" required>
                                        <input value={form.aadhaarNo} onChange={e => set('aadhaarNo', e.target.value.replace(/\D/g, '').slice(0, 12))} style={inp('aadhaarNo')} placeholder="12-digit Aadhaar number" onFocus={focusIn} onBlur={e => blurIn(e, 'aadhaarNo')} />
                                        <Err msg={errors.aadhaarNo} />
                                    </FG>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <FG label="Create Password" required>
                                        <div style={{ position: 'relative' }}>
                                            <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} style={{ ...inp('password'), paddingRight: '44px' }} placeholder="Min. 6 characters" onFocus={focusIn} onBlur={e => blurIn(e, 'password')} />
                                            <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                                                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        <Err msg={errors.password} />
                                    </FG>
                                    <FG label="Confirm Password" required>
                                        <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} style={inp('confirmPassword')} placeholder="Re-enter password" onFocus={focusIn} onBlur={e => blurIn(e, 'confirmPassword')} />
                                        <Err msg={errors.confirmPassword} />
                                    </FG>
                                </div>
                            </>
                        )}

                        {step === 1 && (
                            <>
                                <SectionHead icon={MapPin} title="Section 2: Full Address" subtitle="Your permanent residential address for KYC" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' }}>
                                    <FG label="House/Premise No">
                                        <input value={form.houseNo} onChange={e => set('houseNo', e.target.value)} style={inp('houseNo')} placeholder="e.g. Plot 12" onFocus={focusIn} onBlur={e => blurIn(e, 'houseNo')} />
                                    </FG>
                                    <FG label="Village / Town / City" required>
                                        <input value={form.village} onChange={e => set('village', e.target.value)} style={inp('village')} placeholder="e.g. Pimpalgaon Baswant" onFocus={focusIn} onBlur={e => blurIn(e, 'village')} />
                                        <Err msg={errors.village} />
                                    </FG>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                    <FG label="Post Office">
                                        <input value={form.postOffice} onChange={e => set('postOffice', e.target.value)} style={inp('postOffice')} placeholder="e.g. Ozar P.O." onFocus={focusIn} onBlur={e => blurIn(e, 'postOffice')} />
                                    </FG>
                                    <FG label="GP / Ward No.">
                                        <input value={form.gpWard} onChange={e => set('gpWard', e.target.value)} style={inp('gpWard')} placeholder="e.g. Ward 7" onFocus={focusIn} onBlur={e => blurIn(e, 'gpWard')} />
                                    </FG>
                                </div>

                                {/* ── Cascading Location ────────────────────── */}
                                <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#15803D', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        📍 Select your location step-by-step
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                        <FG label="State" required>
                                            <select value={form.state}
                                                onChange={e => { set('state', e.target.value); set('district', ''); set('block', ''); }}
                                                style={{ ...inp('state'), background: '#fff' }}
                                                onFocus={focusIn} onBlur={e => blurIn(e, 'state')}>
                                                <option value="">-- Select State --</option>
                                                {ALL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <Err msg={errors.state} />
                                        </FG>
                                        <FG label="District" required>
                                            <select value={form.district}
                                                onChange={e => { set('district', e.target.value); set('block', ''); }}
                                                disabled={!getDistricts(form.state).length}
                                                style={{ ...inp('district'), background: '#fff', opacity: getDistricts(form.state).length ? 1 : 0.6 }}
                                                onFocus={focusIn} onBlur={e => blurIn(e, 'district')}>
                                                <option value="">-- Select District --</option>
                                                {getDistricts(form.state).map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                            <Err msg={errors.district} />
                                        </FG>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <FG label="Taluka / Block">
                                            <select value={form.block}
                                                onChange={e => set('block', e.target.value)}
                                                disabled={!getTalukas(form.state, form.district).length}
                                                style={{ ...inp('block'), background: '#fff', opacity: getTalukas(form.state, form.district).length ? 1 : 0.6 }}
                                                onFocus={focusIn} onBlur={e => blurIn(e, 'block')}>
                                                <option value="">-- Select Taluka --</option>
                                                {getTalukas(form.state, form.district).map(ta => <option key={ta} value={ta}>{ta}</option>)}
                                            </select>
                                        </FG>
                                        <FG label="PIN Code" required>
                                            <input value={form.pinCode} onChange={e => set('pinCode', e.target.value.replace(/\D/g, '').slice(0, 6))} style={inp('pinCode')} placeholder="6-digit" onFocus={focusIn} onBlur={e => blurIn(e, 'pinCode')} />
                                            <Err msg={errors.pinCode} />
                                        </FG>
                                    </div>
                                </div>

                                <FG label="Police Station">
                                    <input value={form.policeStation} onChange={e => set('policeStation', e.target.value)} style={inp('policeStation')} placeholder="e.g. Niphad PS" onFocus={focusIn} onBlur={e => blurIn(e, 'policeStation')} />
                                </FG>
                                <div style={{ marginTop: '16px' }}>
                                    <FG label="Landmark Location">
                                        <input value={form.landmark} onChange={e => set('landmark', e.target.value)} style={inp('landmark')} placeholder="e.g. Near Gram Panchayat Office" onFocus={focusIn} onBlur={e => blurIn(e, 'landmark')} />
                                    </FG>
                                </div>
                            </>
                        )}

                        {/* ── STEP 2: Finance ──────────────────── */}
                        {step === 2 && (
                            <>
                                <SectionHead icon={CreditCard} title="Section 3: Bank & Payment Details" subtitle="Required for processing rental payments securely" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                    <FG label="Bank Name" required>
                                        <select value={form.bankName} onChange={e => set('bankName', e.target.value)} style={{ ...inp('bankName'), background: '#F9FAFB' }} onFocus={focusIn} onBlur={e => blurIn(e, 'bankName')}>
                                            <option value="">Select Bank...</option>
                                            {BANKS.map(b => <option key={b}>{b}</option>)}
                                        </select>
                                        <Err msg={errors.bankName} />
                                    </FG>
                                    {form.bankName === 'Other' && (
                                        <FG label="Specify Bank Name" required>
                                            <input
                                                value={form.customBankName}
                                                onChange={e => set('customBankName', e.target.value)}
                                                style={inp('customBankName')}
                                                placeholder="e.g. Saraswat Co-operative Bank"
                                                onFocus={focusIn}
                                                onBlur={e => blurIn(e, 'customBankName')}
                                            />
                                            <Err msg={errors.customBankName} />
                                        </FG>
                                    )}
                                    <FG label="Branch Name">
                                        <input value={form.branchName} onChange={e => set('branchName', e.target.value)} style={inp('branchName')} placeholder="e.g. Nashik Main Branch" onFocus={focusIn} onBlur={e => blurIn(e, 'branchName')} />
                                    </FG>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                    <FG label="Account Number" required>
                                        <input value={form.accountNo} onChange={e => set('accountNo', e.target.value.replace(/\D/g, ''))} style={inp('accountNo')} placeholder="Enter account number" onFocus={focusIn} onBlur={e => blurIn(e, 'accountNo')} />
                                        <Err msg={errors.accountNo} />
                                    </FG>
                                    <FG label="IFSC Code" required>
                                        <input value={form.ifscCode} onChange={e => set('ifscCode', e.target.value.toUpperCase())} style={inp('ifscCode')} placeholder="e.g. SBIN0001234" maxLength={11} onFocus={focusIn} onBlur={e => blurIn(e, 'ifscCode')} />
                                        <Err msg={errors.ifscCode} />
                                    </FG>
                                </div>
                                <FG label="UPI ID">
                                    <input value={form.upiId} onChange={e => set('upiId', e.target.value)} style={inp('upiId')} placeholder="e.g. 9876543210@upi" onFocus={focusIn} onBlur={e => blurIn(e, 'upiId')} />
                                </FG>
                                <div style={{ marginTop: '20px', padding: '14px', background: '#FEF9C3', borderRadius: '10px', fontSize: '13px', color: '#92400E' }}>
                                    🔒 Your banking data is encrypted and only used for payment disbursements. We never charge your account automatically.
                                </div>
                            </>
                        )}

                        {/* ── STEP 3: KYC Uploads ──────────────── */}
                        {step === 3 && (
                            <>
                                <SectionHead icon={Upload} title="Section 4: KYC Document Uploads" subtitle="Upload clear photos or scans. Accepted: JPG, PNG (max 5MB each)" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    {[
                                        { k: 'passportPhoto', label: 'Passport Photo', required: true, hint: 'Recent clear face photo' },
                                        { k: 'aadhaarImage', label: 'Aadhaar Card Copy', required: true, hint: 'Front & back scan' },
                                        { k: 'voterIdImage', label: 'Voter ID Card', required: false, hint: 'Optional but recommended' },
                                        { k: 'passbookImage', label: 'Bank Passbook (First Page)', required: false, hint: 'Shows name, account & IFSC' },
                                        { k: 'qrCodeImage', label: 'Payment QR Code', required: false, hint: 'PhonePe / GPay / Paytm QR' },
                                    ].map(({ k, label, required, hint }) => (
                                        <div key={k} onClick={() => fileRefs[k].current.click()} style={{ border: `2px dashed ${errors[k] ? '#EF4444' : previews[k] ? '#2E7D32' : '#D1D5DB'}`, borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: previews[k] ? '#F0FDF4' : '#F9FAFB', transition: 'all 0.2s', position: 'relative' }}>
                                            <input ref={fileRefs[k]} type="file" accept="image/png,image/jpg,image/jpeg" style={{ display: 'none' }} onChange={e => handleFile(k, e)} />
                                            {previews[k] ? (
                                                <img src={previews[k]} alt={label} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', margin: '0 auto 8px' }} />
                                            ) : (
                                                <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                                    <Camera size={24} color="#9CA3AF" />
                                                </div>
                                            )}
                                            <p style={{ fontSize: '13px', fontWeight: 700, color: previews[k] ? '#15803D' : '#374151', margin: '0 0 4px' }}>
                                                {previews[k] ? '✅ ' + label : label} {required && <span style={{ color: '#EF4444' }}>*</span>}
                                            </p>
                                            <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>{previews[k] ? 'Click to change' : hint}</p>
                                            <Err msg={errors[k]} />
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '24px', padding: '16px', background: '#F0FDF4', borderRadius: '12px', fontSize: '13px', color: '#15803D', fontWeight: 600 }}>
                                    🛡️ Your documents are encrypted and stored securely. Only accessible to the KAS Admin team during verification.
                                </div>
                            </>
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    {serverError && (
                        <div style={{ margin: '16px 0 0', padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', color: '#B91C1C', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={16} /> {serverError}
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>

                        {step > 0 ? (
                            <button type="button" onClick={back} style={{ padding: '12px 28px', borderRadius: '12px', border: '2px solid #E5E7EB', background: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: '#374151' }}>
                                ← Back
                            </button>
                        ) : (
                            <Link to="/login" style={{ fontSize: '14px', color: '#6B7280', textDecoration: 'none' }}>Already registered? <strong style={{ color: '#2E7D32' }}>Login</strong></Link>
                        )}
                        {step < 3 ? (
                            <button type="button" onClick={next} style={{ padding: '13px 36px', borderRadius: '12px', background: 'linear-gradient(135deg, #2E7D32, #388E3C)', color: '#fff', fontSize: '15px', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(46,125,50,0.25)' }}>
                                Continue →
                            </button>
                        ) : (
                            <button type="submit" disabled={loading} style={{ padding: '13px 36px', borderRadius: '12px', background: loading ? '#6B7280' : 'linear-gradient(135deg, #2E7D32, #388E3C)', color: '#fff', fontSize: '15px', fontWeight: 800, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 16px rgba(46,125,50,0.25)' }}>
                                {loading ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : '🚀 Submit for Verification'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
