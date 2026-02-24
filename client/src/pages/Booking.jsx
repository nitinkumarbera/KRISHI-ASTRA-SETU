import { useState, useMemo, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
    Calendar, Clock, MapPin, ShieldCheck, Star, ArrowLeft,
    CheckCircle2, IndianRupee, Tractor, Info, Copy, ChevronRight, Zap, Download,
    RefreshCw, AlertCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import _autoTableMod from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';

// jspdf-autotable v5 ESM/CJS interop
const autoTable = typeof _autoTableMod === 'function' ? _autoTableMod : (_autoTableMod?.default ?? _autoTableMod);

// ── Styles ───────────────────────────────────────────────────
const s = {
    page: { minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Inter', sans-serif" },
    topBar: { maxWidth: '960px', margin: '0 auto', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #E5E7EB', background: '#fff' },
    wrap: { maxWidth: '960px', margin: '0 auto', padding: '24px 20px', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' },
    card: { background: '#fff', borderRadius: '18px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' },
    sectionTitle: { fontSize: '16px', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', fontFamily: "'Poppins', sans-serif" },
    label: { display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' },
    input: { width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #E5E7EB', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', background: '#fff', boxSizing: 'border-box' },
    row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
};

// Today's date string for date input min attribute
const today = new Date().toISOString().split('T')[0];


export default function Booking() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, token: authToken, isVerified } = useAuth();

    const [equip, setEquip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [apiError, setApiError] = useState('');

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('18:00');
    const [purpose, setPurpose] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [booked, setBooked] = useState(false);
    const [token, setToken] = useState('');
    const [copied, setCopied] = useState(false);
    const [errors, setErrors] = useState({});

    // ── Fetch Equipment ──────────────────────────────────────
    useEffect(() => {
        const fetchEquip = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/equipment/${id}`);
                const data = await res.json();
                if (data.success) {
                    setEquip(data.data);
                } else {
                    setApiError(data.message || 'Equipment not found.');
                }
            } catch {
                setApiError('Network error while fetching equipment details.');
            }
            setLoading(false);
        };
        fetchEquip();
    }, [id]);

    // ── Price Calculation (Client-side preview) ──────────────
    const pricing = useMemo(() => {
        if (!equip || !startDate || !endDate) return null;
        const s = new Date(`${startDate}T${startTime}`);
        const e = new Date(`${endDate}T${endTime}`);
        const diffMs = e - s;
        if (diffMs <= 0) return null;
        const hours = Math.ceil(diffMs / (1000 * 60 * 60));
        const subtotal = hours * equip.priceHr;
        const platformFee = Math.round(subtotal * 0.05);
        const gst = Math.round(subtotal * 0.18);
        const total = subtotal + platformFee + gst;
        return { hours, subtotal, platformFee, gst, total };
    }, [startDate, endDate, startTime, endTime, equip]);

    // ── Validation & Confirm ─────────────────────────────────
    async function handleConfirm() {
        const e = {};
        if (!startDate) e.startDate = 'Required';
        if (!endDate) e.endDate = 'Required';
        if (startDate && endDate && new Date(`${endDate}T${endTime}`) <= new Date(`${startDate}T${startTime}`))
            e.endDate = 'End must be after start';
        if (!agreed) e.agreed = 'You must agree to the terms';
        if (Object.keys(e).length > 0) { setErrors(e); return; }

        if (!isVerified) {
            setApiError('Your KYC is not verified. Only verified members can book equipment.');
            return;
        }

        setConfirming(true);
        setApiError('');

        try {
            const res = await fetch('http://localhost:5000/api/bookings/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': authToken
                },
                body: JSON.stringify({
                    equipmentId: id,
                    startDate, endDate, startTime, endTime
                })
            });
            const data = await res.json();
            if (res.ok) {
                setToken(data.handoverToken); // Real 6-digit token from backend
                setBooked(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                setApiError(data.message || 'Booking failed. Is the equipment still available?');
            }
        } catch {
            setApiError('Network error while creating booking.');
        }
        setConfirming(false);
    }

    function copyToken() {
        navigator.clipboard.writeText(token).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    // ── Generate PDF Bill ────────────────────────────────────
    function generateBill() {
        const RENTER = {
            name: `${currentUser?.name?.first || ''} ${currentUser?.name?.last || ''}`.trim() || 'Valued Renter',
            mobile: currentUser?.mobile || 'N/A',
            email: currentUser?.email || 'N/A',
            aadhaar: currentUser?.aadhaar ? `XXXX-XXXX-${currentUser.aadhaar.slice(-4)}` : 'N/A',
            village: currentUser?.address?.village || 'N/A',
            district: currentUser?.address?.district || 'N/A',
            state: currentUser?.address?.state || 'Maharashtra',
            pinCode: currentUser?.address?.pinCode || 'N/A'
        };


        const now = new Date();
        const billNo = `KAS-BILL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${token.slice(-4)}`;
        const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const W = doc.internal.pageSize.getWidth();
        const H = doc.internal.pageSize.getHeight();

        // ── LOGO WATERMARK (vector drawn — no async needed) ──────
        // Draw KAS tractor logo as jsPDF vector shapes, faint, centred
        const drawLogo = (ox, oy, scale) => {
            // Outer circle
            doc.setFillColor(241, 248, 233); doc.setDrawColor(139, 195, 74); doc.setLineWidth(0.5);
            doc.circle(ox, oy, 29 * scale, 'FD');
            // Tractor body
            doc.setFillColor(46, 125, 50); doc.setDrawColor(46, 125, 50);
            doc.roundedRect(ox - 14 * scale, oy + 2 * scale, 18 * scale, 11 * scale, 1, 1, 'F');
            // Cab
            doc.setFillColor(56, 142, 60);
            doc.roundedRect(ox - 1 * scale, oy - 6 * scale, 10 * scale, 9 * scale, 1, 1, 'F');
            // Cab window
            doc.setFillColor(165, 214, 167);
            doc.roundedRect(ox, oy - 5 * scale, 7 * scale, 5 * scale, 0.5, 0.5, 'F');
            // Exhaust
            doc.setFillColor(27, 94, 32);
            doc.roundedRect(ox + 8 * scale, oy - 10 * scale, 2 * scale, 5 * scale, 0.5, 0.5, 'F');
            // Big rear wheel
            doc.setFillColor(27, 94, 32); doc.circle(ox - 8 * scale, oy + 13 * scale, 7.5 * scale, 'F');
            doc.setFillColor(46, 125, 50); doc.circle(ox - 8 * scale, oy + 13 * scale, 4.5 * scale, 'F');
            doc.setFillColor(139, 195, 74); doc.circle(ox - 8 * scale, oy + 13 * scale, 1.5 * scale, 'F');
            // Small front wheel
            doc.setFillColor(27, 94, 32); doc.circle(ox + 5 * scale, oy + 13 * scale, 4.5 * scale, 'F');
            doc.setFillColor(46, 125, 50); doc.circle(ox + 5 * scale, oy + 13 * scale, 2.5 * scale, 'F');
            // Ground line
            doc.setDrawColor(139, 195, 74); doc.setLineWidth(0.8);
            doc.line(ox - 25 * scale, oy + 19 * scale, ox + 25 * scale, oy + 19 * scale);
            // Wheat left stalk
            doc.setDrawColor(85, 139, 47); doc.setLineWidth(0.7);
            doc.line(ox - 20 * scale, oy + 4 * scale, ox - 18 * scale, oy - 18 * scale);
            doc.setFillColor(139, 195, 74);
            doc.ellipse(ox - 21 * scale, oy - 8 * scale, 2.5 * scale, 4.5 * scale, 'F');
            doc.ellipse(ox - 19 * scale, oy - 15 * scale, 2.5 * scale, 4.5 * scale, 'F');
            doc.ellipse(ox - 23 * scale, oy - 2 * scale, 2 * scale, 4 * scale, 'F');
        };

        // ── HEADER ───────────────────────────────────────────────
        doc.setFillColor(27, 94, 32);
        doc.rect(0, 0, W, 42, 'F');
        doc.setFillColor(46, 125, 50);
        doc.rect(0, 38, W, 4, 'F');

        // Small KAS logo in header top-right
        drawLogo(W - 16, 18, 0.45);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18); doc.setFont('helvetica', 'bold');
        doc.text('Krishi Astra Setu', 14, 14);
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
        doc.text('Farm Equipment Rental Platform', 14, 20);
        doc.text('Website: www.krishiastrasetu.in  |  Email: support@krishiastrasetu.in  |  Phone: +91 800 000 1234', 14, 26);
        doc.text('GST No: 27AABCK1234M1Z5  |  CIN: U74999MH2025PTC123456  |  Registered in Maharashtra, India', 14, 32);

        doc.setFontSize(12); doc.setFont('helvetica', 'bold');
        doc.text('TAX INVOICE', W - 32, 12, { align: 'right' });
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
        doc.text(`Bill No : ${billNo}`, W - 32, 20, { align: 'right' });
        doc.text(`Date    : ${dateStr}`, W - 32, 26, { align: 'right' });
        doc.text(`Time    : ${timeStr}`, W - 32, 32, { align: 'right' });

        // ── BOOKING CONFIRMED BADGE ──────────────────────────────
        doc.setFillColor(240, 253, 244);
        doc.roundedRect(14, 46, W - 28, 10, 2, 2, 'F');
        doc.setDrawColor(187, 247, 208);
        doc.roundedRect(14, 46, W - 28, 10, 2, 2, 'S');
        doc.setTextColor(21, 128, 61); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text('[ BOOKING CONFIRMED ]   Status: ACTIVE   Platform: Krishi Astra Setu', W / 2, 53, { align: 'center' });

        // ── HANDOVER TOKEN ───────────────────────────────────────
        doc.setFillColor(46, 125, 50);
        doc.roundedRect(14, 60, W - 28, 17, 3, 3, 'F');
        doc.setTextColor(197, 225, 165); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.text('HANDOVER TOKEN  --  Show this code to the lender at equipment pickup AND return', W / 2, 66, { align: 'center' });
        doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.setFont('helvetica', 'bold');
        doc.text(token, W / 2, 75, { align: 'center' });

        let y = 83;
        const colW = (W - 28 - 6) / 2;

        // ── LENDER & RENTER SIDE-BY-SIDE ────────────────────────
        doc.setFillColor(46, 125, 50); doc.rect(14, y, W - 28, 7, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text('LENDER DETAILS', 14 + colW / 2, y + 5, { align: 'center' });
        doc.text('RENTER DETAILS', 14 + colW + 6 + colW / 2, y + 5, { align: 'center' });
        y += 7;

        const lenderRows = [
            ['Name', equip?.owner?.name || 'KAS Lender'],
            ['Contact', equip?.owner?.mobile || 'N/A'],
            ['Location', `${equip?.location?.village}, ${equip?.location?.district}`],
            ['Equipment', equip?.name || 'Machine'],
            ['Category', equip?.category || 'Equipment'],
            ['Rating', `${equip?.rating || 4.5}/5 (${equip?.reviewCount || 0} reviews)`],
        ];
        const renterRows = [
            ['Name', RENTER.name], ['Mobile', RENTER.mobile], ['Email', RENTER.email],
            ['Aadhaar', RENTER.aadhaar], ['Village', RENTER.village],
            ['District/State', `${RENTER.district}, ${RENTER.state} - ${RENTER.pinCode}`],
        ];


        const drawBox = (sx, sy, rows, bw) => {
            rows.forEach((r, i) => {
                doc.setFillColor(i % 2 === 0 ? 249 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 251 : 255);
                doc.rect(sx, sy, bw, 7, 'F');
                doc.setDrawColor(229, 231, 235); doc.rect(sx, sy, bw, 7, 'S');
                doc.setTextColor(107, 114, 128); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
                doc.text(r[0], sx + 2, sy + 4.5);
                doc.setTextColor(17, 24, 39); doc.setFont('helvetica', 'normal');
                doc.text(String(r[1]), sx + bw - 2, sy + 4.5, { align: 'right', maxWidth: bw - 22 });
                sy += 7;
            });
            return sy;
        };

        const endL = drawBox(14, y, lenderRows, colW);
        const endR = drawBox(14 + colW + 6, y, renterRows, colW);
        y = Math.max(endL, endR) + 6;

        // ── RENTAL PERIOD & PRICE BREAKDOWN ──────────────────────
        doc.setFillColor(46, 125, 50); doc.rect(14, y, W - 28, 7, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text('RENTAL PERIOD & PRICE BREAKDOWN', W / 2, y + 5, { align: 'center' });
        y += 7;

        const tableResult = autoTable(doc, {
            startY: y,
            head: [['Description', 'Rate / Info', 'Amount (INR)']],
            body: [
                ['Rental Period Start', `${startDate} at ${startTime}`, ''],
                ['Rental Period End', `${endDate} at ${endTime}`, ''],
                ['Total Duration', `${pricing ? pricing.hours : 0} hour(s)`, ''],
                ['Rental Charge', `Rs.${equip.priceHr}/hr x ${pricing ? pricing.hours : 0} hr(s)`, pricing ? `Rs.${pricing.subtotal.toLocaleString('en-IN')}` : 'Rs.0'],
                ['Platform Fee (KAS)', '5% of Rental Charge', pricing ? `Rs.${pricing.platformFee.toLocaleString('en-IN')}` : 'Rs.0'],
                ['GST @ 18%', '18% on Rental Charge', pricing ? `Rs.${pricing.gst.toLocaleString('en-IN')}` : 'Rs.0'],
            ],
            foot: [['', 'TOTAL AMOUNT PAID', pricing ? `Rs.${pricing.total.toLocaleString('en-IN')}` : 'Rs.0']],
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 3, textColor: [17, 24, 39] },
            headStyles: { fillColor: [46, 125, 50], textColor: 255, fontStyle: 'bold', fontSize: 8 },
            footStyles: { fillColor: [240, 253, 244], textColor: [21, 128, 61], fontStyle: 'bold', fontSize: 9 },
            columnStyles: { 0: { cellWidth: 68, fillColor: [249, 250, 251], fontStyle: 'bold' }, 1: { cellWidth: 72 }, 2: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' } },
            margin: { left: 14, right: 14 },
        });
        y = (doc.lastAutoTable?.finalY ?? y + 50) + 6;

        // ── TERMS & CONDITIONS ────────────────────────────────────
        doc.setFillColor(27, 94, 32); doc.rect(14, y, W - 28, 7, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text('TERMS & CONDITIONS', W / 2, y + 5, { align: 'center' });
        y += 7;

        const terms = [
            '1. The Handover Token must be presented to the lender at both pickup and return of the equipment.',
            '2. The renter is fully responsible for the equipment from the time of pickup until return.',
            '3. Any damage during the rental period will be assessed and billed to the renter at market repair cost.',
            "4. Fuel, lubricants, and consumables during the rental period are solely the renter's responsibility.",
            '5. Cancellations made within 24 hours of the start time are completely non-refundable.',
            '6. Krishi Astra Setu (KAS) charges a 5% platform facilitation fee on all rental transactions.',
            '7. GST at 18% is applicable on all rental charges as per Government of India regulations.',
            '8. KAS acts as a marketplace only. All equipment condition disputes are settled between lender and renter.',
            '9. Equipment returned after agreed end time will be charged at 1.5x the hourly rate for every extra hour.',
            '10. KAS reserves the right to suspend accounts misusing the platform or fraudulently using Handover Tokens.',
        ];

        const termBoxH = terms.length * 5.8 + 5;
        doc.setFillColor(248, 250, 252); doc.rect(14, y, W - 28, termBoxH, 'F');
        doc.setDrawColor(187, 247, 208); doc.rect(14, y, W - 28, termBoxH, 'S');
        doc.setTextColor(31, 41, 55); doc.setFontSize(7.2); doc.setFont('helvetica', 'normal');
        terms.forEach((t, i) => { doc.text(t, 17, y + 5 + i * 5.8); });
        y += termBoxH + 5;

        // ── WARNING BOX ──────────────────────────────────────────
        doc.setFillColor(254, 242, 242);
        doc.roundedRect(14, y, W - 28, 22, 2, 2, 'F');
        doc.setDrawColor(252, 165, 165);
        doc.roundedRect(14, y, W - 28, 22, 2, 2, 'S');
        doc.setTextColor(185, 28, 28); doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
        doc.text('! WARNING FROM KRISHI ASTRA SETU:', 17, y + 7);
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
        doc.text('>> Do NOT hand over equipment without verifying the Handover Token above. KAS will NOT be liable', 17, y + 13);
        doc.text('   for unauthorised handovers. Report fraud: support@krishiastrasetu.in | +91 800 000 1234', 17, y + 19);

        // ── FOOTER ───────────────────────────────────────────────
        doc.setFillColor(27, 94, 32); doc.rect(0, H - 16, W, 16, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text('Krishi Astra Setu  |  Bridging Tools, Empowering Farmers', W / 2, H - 9, { align: 'center' });
        doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.text('This is a computer-generated invoice. No signature required.  |  www.krishiastrasetu.in', W / 2, H - 4, { align: 'center' });

        // ── SAVE ─────────────────────────────────────────────────
        doc.save(`KAS-Bill-${token}.pdf`);
    }

    const focusStyle = (e) => { e.target.style.borderColor = '#2E7D32'; e.target.style.boxShadow = '0 0 0 3px rgba(46,125,50,0.1)'; };
    const blurStyle = (e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; };

    if (loading) return (
        <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <RefreshCw size={48} color="#2E7D32" className="animate-spin" style={{ margin: '0 auto 16px' }} />
                <p style={{ fontWeight: 700, color: '#111827' }}>Loading equipment details...</p>
            </div>
        </div>
    );

    if (apiError && !booked && !equip) return (
        <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', textAlign: 'center', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                <AlertCircle size={48} color="#DC2626" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', marginBottom: '12px' }}>Oops! Something went wrong</h2>
                <p style={{ color: '#6B7280', marginBottom: '24px' }}>{apiError}</p>
                <button onClick={() => navigate('/marketplace')} style={{ background: '#2E7D32', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Back to Marketplace</button>
            </div>
        </div>
    );

    // ── 🎉 Success Screen ────────────────────────────────────
    if (booked) {
        return (
            <div style={{ ...s.page, display: 'flex', flexDirection: 'column' }}>
                <div style={s.topBar}>
                    <button onClick={() => navigate('/marketplace')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#6B7280', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                        <ArrowLeft size={16} /> Back to Marketplace
                    </button>
                </div>

                <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
                    {/* Animated checkmark */}
                    <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: 'linear-gradient(135deg, #2E7D32, #8BC34A)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 32px rgba(46,125,50,0.3)' }}>
                        <CheckCircle2 size={44} color="#fff" strokeWidth={2} />
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', marginBottom: '8px', fontFamily: "'Poppins', sans-serif" }}>Booking Confirmed! 🎉</h1>
                    <p style={{ color: '#6B7280', fontSize: '15px', marginBottom: '32px', lineHeight: 1.6 }}>
                        Share the Handover Token below with <strong>{equip.owner?.name?.first} {equip.owner?.name?.last}</strong> at the time of equipment pickup. It serves as your rental contract.
                    </p>

                    {/* Token Card */}
                    <div style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', borderRadius: '18px', padding: '28px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>🔐 Handover Token</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '28px', fontWeight: 900, color: '#fff', letterSpacing: '0.12em', fontFamily: "'Poppins', sans-serif" }}>{token}</span>
                            <button type="button" onClick={copyToken} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                        <p style={{ color: 'rgba(197,225,165,0.9)', fontSize: '12px', marginTop: '10px' }}>Valid for: {equip.name}</p>
                    </div>

                    {/* Summary mini-card */}
                    <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', textAlign: 'left', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: '24px' }}>
                        {[
                            { label: 'Equipment', value: equip.name },
                            { label: 'Lender', value: `${equip.owner?.name?.first || ''} ${equip.owner?.name?.last || ''}`.trim() || 'Lender' },
                            { label: 'Contact', value: equip.owner?.mobile || '—' },
                            { label: 'Period', value: `${startDate} ${startTime} → ${endDate} ${endTime}` },
                            { label: 'Duration', value: pricing ? `${pricing.hours} hr(s)` : '—' },
                            { label: 'Total Paid', value: pricing ? `₹${pricing.total.toLocaleString('en-IN')}` : '—' },
                        ].map(r => (
                            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid #F3F4F6', fontSize: '14px' }}>
                                <span style={{ color: '#6B7280', fontWeight: 600 }}>{r.label}</span>
                                <span style={{ color: '#111827', fontWeight: 700 }}>{r.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Download Bill Button */}
                    <button
                        type="button"
                        onClick={generateBill}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px', borderRadius: '14px', background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', color: '#fff', fontSize: '15px', fontWeight: 800, border: 'none', cursor: 'pointer', marginBottom: '12px', boxShadow: '0 6px 24px rgba(46,125,50,0.35)', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(46,125,50,0.45)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(46,125,50,0.35)'; }}
                    >
                        <Download size={18} strokeWidth={2.5} />
                        Download Bill PDF
                    </button>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Link to="/marketplace" style={{ flex: 1, display: 'block', padding: '13px', borderRadius: '12px', border: '2px solid #E5E7EB', textAlign: 'center', fontSize: '14px', fontWeight: 700, color: '#374151', textDecoration: 'none' }}>
                            Browse More
                        </Link>
                        <Link to="/" style={{ flex: 1, display: 'block', padding: '13px', borderRadius: '12px', background: '#2E7D32', textAlign: 'center', fontSize: '14px', fontWeight: 700, color: '#fff', textDecoration: 'none' }}>
                            Go Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── 📋 Booking Form Screen ──────────────────────────────
    return (
        <div style={s.page}>
            {/* Top Bar */}
            <div style={s.topBar}>
                <Link to="/marketplace" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6B7280', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
                    <ArrowLeft size={16} /> Back to Marketplace
                </Link>
                <span style={{ fontSize: '14px', color: '#9CA3AF' }}>/</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Confirm Booking</span>
            </div>

            <div style={s.wrap}>
                {/* ── LEFT: Form ──────────────────────────── */}
                <div style={{ flex: 2, minWidth: '340px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Rental Period */}
                    <div style={s.card}>
                        <h2 style={s.sectionTitle}><Calendar size={18} color="#2E7D32" /> Set Rental Period</h2>
                        <div style={s.row2}>
                            <div>
                                <label style={s.label}>Start Date</label>
                                <input type="date" value={startDate} min={today} onChange={e => { setStartDate(e.target.value); setErrors(p => ({ ...p, startDate: undefined })); }} style={{ ...s.input, borderColor: errors.startDate ? '#EF4444' : '#E5E7EB' }} onFocus={focusStyle} onBlur={blurStyle} />
                                {errors.startDate && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.startDate}</p>}
                            </div>
                            <div>
                                <label style={s.label}>Start Time</label>
                                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={s.input} onFocus={focusStyle} onBlur={blurStyle} />
                            </div>
                            <div>
                                <label style={s.label}>End Date</label>
                                <input type="date" value={endDate} min={startDate || today} onChange={e => { setEndDate(e.target.value); setErrors(p => ({ ...p, endDate: undefined })); }} style={{ ...s.input, borderColor: errors.endDate ? '#EF4444' : '#E5E7EB' }} onFocus={focusStyle} onBlur={blurStyle} />
                                {errors.endDate && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.endDate}</p>}
                            </div>
                            <div>
                                <label style={s.label}>End Time</label>
                                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={s.input} onFocus={focusStyle} onBlur={blurStyle} />
                            </div>
                        </div>

                        {/* Duration Live Badge */}
                        {pricing && (
                            <div style={{ marginTop: '16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Zap size={16} color="#16A34A" />
                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#15803D' }}>Duration: {pricing.hours} hour{pricing.hours !== 1 ? 's' : ''}</span>
                            </div>
                        )}
                    </div>

                    {/* Purpose */}
                    <div style={s.card}>
                        <h2 style={s.sectionTitle}><Info size={18} color="#2E7D32" /> Purpose of Rental (Optional)</h2>
                        <textarea value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g. Deep ploughing of soybean field, approximately 3 acres..." rows={3} style={{ ...s.input, resize: 'vertical', lineHeight: 1.6 }} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>

                    {/* Terms */}
                    <div style={s.card}>
                        <h2 style={s.sectionTitle}><ShieldCheck size={18} color="#2E7D32" /> Terms & Conditions</h2>
                        <div style={{ background: '#F9FAFB', borderRadius: '10px', padding: '16px', fontSize: '13px', color: '#4B5563', lineHeight: 1.7, maxHeight: '150px', overflowY: 'auto', marginBottom: '16px' }}>
                            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <li>The lender's equipment must be returned in the same condition as received. Any damage will be charged to the renter.</li>
                                <li>Fuel is the sole responsibility of the renter unless otherwise agreed in writing.</li>
                                <li>The Handover Token must be shown to the lender at both pickup and return.</li>
                                <li>Cancellations within 24 hours of start time are non-refundable.</li>
                                <li>Krishi Astra Setu (KAS) charges a 5% platform fee on all transactions.</li>
                                <li>GST at 18% is applicable on all rental charges.</li>
                            </ul>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '14px', color: errors.agreed ? '#EF4444' : '#374151', fontWeight: 500 }}>
                            <input type="checkbox" checked={agreed} onChange={e => { setAgreed(e.target.checked); setErrors(p => ({ ...p, agreed: undefined })); }} style={{ width: '18px', height: '18px', accentColor: '#2E7D32', marginTop: '2px', flexShrink: 0 }} />
                            I have read and agree to the Terms & Conditions and KAS rental policy.
                        </label>
                        {errors.agreed && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px' }}>{errors.agreed}</p>}
                    </div>
                </div>

                {/* ── RIGHT: Summary Sidebar ─────────────── */}
                <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '80px', alignSelf: 'flex-start' }}>

                    {/* Equipment card */}
                    <div style={s.card}>
                        <div style={{ height: '140px', background: 'linear-gradient(135deg, #F1F8E9, #DCEDC8)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                            <Tractor size={64} color="#2E7D32" strokeWidth={1.2} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', lineHeight: 1.3 }}>{equip.name}</h3>
                            {equip.verified && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F0FDF4', color: '#15803D', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px', flexShrink: 0 }}>
                                    <ShieldCheck size={11} /> Verified
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '8px 0' }}>
                            <Star size={13} fill="#8BC34A" strokeWidth={0} />
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>{equip.rating}</span>
                            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>({equip.reviews} reviews)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                            <MapPin size={13} color="#8BC34A" />
                            <span style={{ fontSize: '13px', color: '#6B7280' }}>
                                {equip.location?.village}, {equip.location?.district}
                            </span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6, borderTop: '1px solid #F3F4F6', paddingTop: '12px' }}>{equip.description}</p>
                        <div style={{ marginTop: '12px', padding: '10px', background: '#F9FAFB', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 800 }}>
                                {(equip.owner?.name?.first?.[0] || 'L').toUpperCase()}
                            </div>
                            <div>
                                <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{equip.owner?.name?.first} {equip.owner?.name?.last}</p>
                                <p style={{ fontSize: '12px', color: '#9CA3AF' }}>{equip.owner?.mobile}</p>
                            </div>
                        </div>
                    </div>

                    {/* Price breakdown */}
                    <div style={s.card}>
                        <h2 style={s.sectionTitle}><IndianRupee size={18} color="#2E7D32" /> Price Breakdown</h2>
                        {pricing ? (
                            <>
                                {[
                                    { label: `₹${equip.priceHr}/hr × ${pricing.hours} hr(s)`, value: `₹${pricing.subtotal.toLocaleString('en-IN')}` },
                                    { label: 'Platform Fee (5%)', value: `₹${pricing.platformFee.toLocaleString('en-IN')}` },
                                    { label: 'GST (18%)', value: `₹${pricing.gst.toLocaleString('en-IN')}` },
                                ].map(r => (
                                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#4B5563', marginBottom: '10px' }}>
                                        <span>{r.label}</span>
                                        <span style={{ fontWeight: 600 }}>{r.value}</span>
                                    </div>
                                ))}
                                <div style={{ height: '1px', background: '#E5E7EB', margin: '12px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 900, color: '#2E7D32' }}>
                                    <span>Total</span>
                                    <span>₹{pricing.total.toLocaleString('en-IN')}</span>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                <Calendar size={32} color="#D1D5DB" style={{ margin: '0 auto 8px' }} />
                                <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Select dates to see the price</p>
                            </div>
                        )}

                        {apiError && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', color: '#B91C1C', fontSize: '13px', fontWeight: 600, margin: '16px 0' }}>
                                <AlertCircle size={16} /> {apiError}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={!pricing || confirming}
                            style={{
                                marginTop: '20px', width: '100%', padding: '15px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: 800,
                                cursor: (pricing && !confirming) ? 'pointer' : 'not-allowed',
                                background: (pricing && !confirming) ? 'linear-gradient(135deg, #2E7D32, #388E3C)' : '#E5E7EB',
                                color: (pricing && !confirming) ? '#fff' : '#9CA3AF',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s',
                                boxShadow: (pricing && !confirming) ? '0 4px 16px rgba(46,125,50,0.3)' : 'none'
                            }}
                        >
                            {confirming ? <RefreshCw size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                            {confirming ? 'Creating Booking...' : 'Confirm Booking'}
                        </button>
                        <p style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'center', marginTop: '10px' }}>🔒 Secured by Krishi Astra Setu — No advance payment</p>

                    </div>
                </div>
            </div>
        </div>
    );
}
