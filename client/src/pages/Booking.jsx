import { useState, useMemo, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
    Calendar, Clock, MapPin, ShieldCheck, Star, ArrowLeft,
    CheckCircle2, IndianRupee, Tractor, Info, Copy, ChevronRight, ChevronLeft, Zap, Download,
    RefreshCw, AlertCircle, ZoomIn, X
} from 'lucide-react';
import jsPDF from 'jspdf';
import _autoTableMod from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';
import { kasAlert } from '../components/KasDialog';


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
    const [bookingId, setBookingId] = useState(null);
    const [token, setToken] = useState('');
    const [copied, setCopied] = useState(false);
    const [errors, setErrors] = useState({});
    // Cancel booking states
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [cancelled, setCancelled] = useState(false);

    // Lightbox for booking-page equipment photos
    const [lightboxBIdx, setLightboxBIdx] = useState(null);
    const [carouselBIdx, setCarouselBIdx] = useState(0);
    const [bSliding, setBSliding] = useState(false);

    // Restore booking session (survives refresh) — but verify booking is still active first
    useEffect(() => {
        const saved = sessionStorage.getItem(`kas_booking_${id}`);
        if (saved) {
            try {
                const { bookingId: bid, token: tok } = JSON.parse(saved);
                if (bid && authToken) {
                    // Verify the booking is still pending/active before restoring
                    fetch(`http://localhost:5000/api/bookings/my`, {
                        headers: { 'x-auth-token': authToken }
                    }).then(r => r.json()).then(data => {
                        const bookings = data.data || [];
                        const match = bookings.find(b => b._id === bid);
                        if (match && !['Completed', 'Cancelled'].includes(match.status)) {
                            setBookingId(bid);
                            setToken(tok || '');
                            setBooked(true);
                        } else {
                            // Stale session — booking is done or cancelled, start fresh
                            sessionStorage.removeItem(`kas_booking_${id}`);
                        }
                    }).catch(() => {
                        // Network error — clear stale session to be safe
                        sessionStorage.removeItem(`kas_booking_${id}`);
                    });
                }
            } catch { /* ignore */ }
        }
    }, [id, authToken]);

    // ── Fetch Equipment ──────────────────────────────────────
    useEffect(() => {
        const fetchEquip = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/equipment/${id}`);
                const data = await res.json();
                if (data.success) {
                    setEquip(data.data);
                    // If equipment is available again, any saved booking session is stale — clear it
                    if (data.data?.isAvailable) {
                        sessionStorage.removeItem(`kas_booking_${id}`);
                        // Also reset booking state in case session restore already ran
                        setBooked(false);
                        setBookingId(null);
                        setToken('');
                    }
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
                const bid = data.data?._id || data.data?.id;
                const tok = data.handoverToken;
                setToken(tok);
                setBookingId(bid);
                // Persist for cancel (survives refresh)
                sessionStorage.setItem(`kas_booking_${id}`, JSON.stringify({ bookingId: bid, token: tok }));
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

    // ── Cancel Booking ───────────────────────────────────────
    async function handleCancelBooking() {
        if (!bookingId) return;
        setCancelling(true);
        try {
            const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/cancel`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': authToken },
                body: JSON.stringify({ reason: cancelReason || 'Cancelled by renter' })
            });
            const data = await res.json();
            if (res.ok) {
                setCancelled(true);
                setShowCancelConfirm(false);
                sessionStorage.removeItem(`kas_booking_${id}`); // clear persisted session
            } else {
                await kasAlert(data.message || 'Cancellation failed. Please try again.');
            }
        } catch {
            await kasAlert('Network error during cancellation.');
        }
        setCancelling(false);
    }

    // ── Generate PDF Bill ────────────────────────────────────
    async function generateBill() {
        // Fetch fresh renter profile so all address/finance fields are present
        let renterProfile = currentUser || {};
        try {
            const res = await fetch('http://localhost:5000/api/user/profile', {
                headers: { 'x-auth-token': authToken }
            });
            if (res.ok) {
                const data = await res.json();
                renterProfile = data?.data ?? data;
            }
        } catch { /* fall back to currentUser */ }

        const owner = equip?.owner || {};
        const ownerAddr = owner.address || {};
        const ownerFinance = owner.finance || {};
        const ownerName = [owner.name?.first, owner.name?.middle, owner.name?.last].filter(Boolean).join(' ') || 'KAS Lender';

        const LENDER = {
            name: ownerName,
            email: owner.email || 'N/A',
            mobile: owner.mobile || 'N/A',
            // Address
            houseNo: ownerAddr.houseNo || 'N/A',
            village: ownerAddr.village || 'N/A',
            postOffice: ownerAddr.postOffice || 'N/A',
            gpWard: ownerAddr.gpWard || 'N/A',
            block: ownerAddr.block || 'N/A',
            policeStation: ownerAddr.policeStation || 'N/A',
            landmark: ownerAddr.landmark || 'N/A',
            district: ownerAddr.district || 'N/A',
            state: ownerAddr.state || 'N/A',
            pinCode: ownerAddr.pinCode || 'N/A',
            // Bank
            bankName: ownerFinance.bankName || 'N/A',
            branchName: ownerFinance.branchName || 'N/A',
            accountNo: ownerFinance.accountNo || 'N/A',
            ifscCode: ownerFinance.ifscCode || 'N/A',
            upiId: ownerFinance.upiId || 'N/A',
        };

        const rAddr = renterProfile?.address || {};
        const rFinance = renterProfile?.finance || {};
        const RENTER = {
            name: [renterProfile?.name?.first, renterProfile?.name?.middle, renterProfile?.name?.last].filter(Boolean).join(' ') || 'Valued Renter',
            email: renterProfile?.email || 'N/A',
            mobile: renterProfile?.mobile || 'N/A',
            aadhaar: renterProfile?.aadhaarNo ? `XXXX-XXXX-${renterProfile.aadhaarNo.slice(-4)}` : 'N/A',
            // Address
            houseNo: rAddr.houseNo || 'N/A',
            village: rAddr.village || 'N/A',
            postOffice: rAddr.postOffice || 'N/A',
            gpWard: rAddr.gpWard || 'N/A',
            block: rAddr.block || 'N/A',
            policeStation: rAddr.policeStation || 'N/A',
            landmark: rAddr.landmark || 'N/A',
            district: rAddr.district || 'N/A',
            state: rAddr.state || 'N/A',
            pinCode: rAddr.pinCode || 'N/A',
            // Bank
            bankName: rFinance.bankName || 'N/A',
            branchName: rFinance.branchName || 'N/A',
            accountNo: rFinance.accountNo || 'N/A',
            ifscCode: rFinance.ifscCode || 'N/A',
            upiId: rFinance.upiId || 'N/A',
        };

        const now = new Date();
        const billNo = `KAS-BILL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${token.slice(-4)}`;
        const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const W = doc.internal.pageSize.getWidth();
        const H = doc.internal.pageSize.getHeight();

        // ── LOGO WATERMARK (vector drawn — no async needed) ──────
        const drawLogo = (ox, oy, scale) => {
            doc.setFillColor(241, 248, 233); doc.setDrawColor(139, 195, 74); doc.setLineWidth(0.5);
            doc.circle(ox, oy, 29 * scale, 'FD');
            doc.setFillColor(46, 125, 50); doc.setDrawColor(46, 125, 50);
            doc.roundedRect(ox - 14 * scale, oy + 2 * scale, 18 * scale, 11 * scale, 1, 1, 'F');
            doc.setFillColor(56, 142, 60);
            doc.roundedRect(ox - 1 * scale, oy - 6 * scale, 10 * scale, 9 * scale, 1, 1, 'F');
            doc.setFillColor(165, 214, 167);
            doc.roundedRect(ox, oy - 5 * scale, 7 * scale, 5 * scale, 0.5, 0.5, 'F');
            doc.setFillColor(27, 94, 32);
            doc.roundedRect(ox + 8 * scale, oy - 10 * scale, 2 * scale, 5 * scale, 0.5, 0.5, 'F');
            doc.setFillColor(27, 94, 32); doc.circle(ox - 8 * scale, oy + 13 * scale, 7.5 * scale, 'F');
            doc.setFillColor(46, 125, 50); doc.circle(ox - 8 * scale, oy + 13 * scale, 4.5 * scale, 'F');
            doc.setFillColor(139, 195, 74); doc.circle(ox - 8 * scale, oy + 13 * scale, 1.5 * scale, 'F');
            doc.setFillColor(27, 94, 32); doc.circle(ox + 5 * scale, oy + 13 * scale, 4.5 * scale, 'F');
            doc.setFillColor(46, 125, 50); doc.circle(ox + 5 * scale, oy + 13 * scale, 2.5 * scale, 'F');
            doc.setDrawColor(139, 195, 74); doc.setLineWidth(0.8);
            doc.line(ox - 25 * scale, oy + 19 * scale, ox + 25 * scale, oy + 19 * scale);
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

        // ── Helper: draw a keyed-value table block ───────────────
        let y = 83;

        const sectionHeader = (label, color = [46, 125, 50]) => {
            doc.setFillColor(...color); doc.rect(14, y, W - 28, 7, 'F');
            doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
            doc.text(label, W / 2, y + 5, { align: 'center' });
            y += 7;
        };

        const drawRows = (rows) => {
            const bw = W - 28;
            rows.forEach((r, i) => {
                doc.setFillColor(i % 2 === 0 ? 249 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 251 : 255);
                doc.rect(14, y, bw, 6.5, 'F');
                doc.setDrawColor(229, 231, 235); doc.rect(14, y, bw, 6.5, 'S');
                doc.setTextColor(107, 114, 128); doc.setFontSize(7.2); doc.setFont('helvetica', 'bold');
                doc.text(r[0], 16, y + 4.5);
                doc.setTextColor(17, 24, 39); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
                doc.text(String(r[1] ?? 'N/A'), 14 + bw - 2, y + 4.5, { align: 'right', maxWidth: bw - 40 });
                y += 6.5;
            });
            y += 3;
        };

        const subHeader = (label) => {
            doc.setFillColor(232, 245, 233); doc.rect(14, y, W - 28, 5.5, 'F');
            doc.setDrawColor(187, 247, 208); doc.rect(14, y, W - 28, 5.5, 'S');
            doc.setTextColor(27, 94, 32); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
            doc.text(`— ${label} —`, W / 2, y + 4, { align: 'center' });
            y += 5.5;
        };

        // ── LENDER DETAILS ───────────────────────────────────────
        sectionHeader('LENDER DETAILS');
        subHeader('Personal Information');
        drawRows([
            ['Full Name', LENDER.name],
            ['Email ID', LENDER.email],
            ['Mobile No.', LENDER.mobile],
        ]);
        subHeader('Full Address');
        drawRows([
            ['House / Premise No.', LENDER.houseNo],
            ['Village / Town / City', LENDER.village],
            ['Post Office', LENDER.postOffice],
            ['GP / Ward No.', LENDER.gpWard],
            ['Taluka / Block', LENDER.block],
            ['Police Station', LENDER.policeStation],
            ['Landmark', LENDER.landmark],
            ['District', LENDER.district],
            ['State', LENDER.state],
            ['PIN Code', LENDER.pinCode],
        ]);
        subHeader('Bank Details');
        drawRows([
            ['Bank Name', LENDER.bankName],
            ['Branch Name', LENDER.branchName],
            ['Account Number', LENDER.accountNo],
            ['IFSC Code', LENDER.ifscCode],
            ['UPI ID', LENDER.upiId],
        ]);

        // ── RENTER DETAILS ───────────────────────────────────────
        sectionHeader('RENTER DETAILS');
        subHeader('Personal Information');
        drawRows([
            ['Full Name', RENTER.name],
            ['Email ID', RENTER.email],
            ['Mobile No.', RENTER.mobile],
            ['Aadhaar No.', RENTER.aadhaar],
        ]);

        // ── PAGE BREAK: Renter address + bank start on a fresh page ──
        doc.addPage();
        y = 14;

        subHeader('Full Address');
        drawRows([
            ['House / Premise No.', RENTER.houseNo],
            ['Village / Town / City', RENTER.village],
            ['Post Office', RENTER.postOffice],
            ['GP / Ward No.', RENTER.gpWard],
            ['Taluka / Block', RENTER.block],
            ['Police Station', RENTER.policeStation],
            ['Landmark', RENTER.landmark],
            ['District', RENTER.district],
            ['State', RENTER.state],
            ['PIN Code', RENTER.pinCode],
        ]);
        subHeader('Bank Details');
        drawRows([
            ['Bank Name', RENTER.bankName],
            ['Branch Name', RENTER.branchName],
            ['Account Number', RENTER.accountNo],
            ['IFSC Code', RENTER.ifscCode],
            ['UPI ID', RENTER.upiId],
        ]);

        // ── EQUIPMENT DETAILS ────────────────────────────────────
        sectionHeader('EQUIPMENT DETAILS', [27, 94, 32]);
        drawRows([
            ['Equipment Name', equip?.name || 'N/A'],
            ['Category', equip?.category || 'N/A'],
            ['Brand', equip?.brand || 'N/A'],
            ['Model No.', equip?.modelNo || equip?.model || 'N/A'],
            ['Condition', equip?.condition || 'N/A'],
            ['Fuel Type', equip?.fuelType || 'N/A'],
            ['Rating', equip?.rating ? `${equip.rating}/5 ⭐ (${equip.reviewCount || 0} reviews)` : '—'],
            ['Quantity', '1'],
            ['Price per Hour', `Rs. ${equip?.priceHr?.toLocaleString('en-IN') || 'N/A'}`],
            ['Equipment Location', [equip?.location?.village, equip?.location?.district, equip?.location?.state].filter(Boolean).join(', ') || 'N/A'],
        ]);

        // ── RENTAL PERIOD & PRICE BREAKDOWN ──────────────────────
        sectionHeader('RENTAL PERIOD & PRICE BREAKDOWN');
        autoTable(doc, {
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

                    {/* Cancel Booking */}
                    {!cancelled ? (
                        !showCancelConfirm ? (
                            <button
                                type="button"
                                onClick={() => setShowCancelConfirm(true)}
                                style={{ width: '100%', padding: '13px', borderRadius: '12px', border: '2px solid #FCA5A5', background: '#FFF7F7', color: '#DC2626', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '12px', transition: 'all 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#FFF7F7'; }}
                            >
                                ✕ Cancel Booking
                            </button>
                        ) : (
                            <div style={{ background: '#FFF7F7', border: '2px solid #FCA5A5', borderRadius: '14px', padding: '18px', marginBottom: '12px', textAlign: 'left' }}>
                                <p style={{ fontWeight: 700, color: '#DC2626', fontSize: '14px', marginBottom: '8px' }}>⚠️ Confirm Cancellation</p>
                                <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '12px' }}>This will cancel your booking and initiate a refund. The equipment will be made available again.</p>
                                <textarea
                                    placeholder="Reason for cancellation (optional)..."
                                    value={cancelReason}
                                    onChange={e => setCancelReason(e.target.value)}
                                    rows={2}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #FCA5A5', fontSize: '13px', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' }}
                                />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => setShowCancelConfirm(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '2px solid #E5E7EB', background: '#fff', color: '#374151', fontWeight: 700, cursor: 'pointer' }}>Keep Booking</button>
                                    <button onClick={handleCancelBooking} disabled={cancelling} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#DC2626', color: '#fff', fontWeight: 700, border: 'none', cursor: cancelling ? 'not-allowed' : 'pointer', opacity: cancelling ? 0.7 : 1 }}>
                                        {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
                                    </button>
                                </div>
                            </div>
                        )
                    ) : (
                        <div style={{ background: '#FFF7F7', border: '2px solid #FCA5A5', borderRadius: '14px', padding: '18px', marginBottom: '12px', textAlign: 'center' }}>
                            <p style={{ fontWeight: 800, color: '#DC2626', fontSize: '16px', marginBottom: '6px' }}>✅ Booking Cancelled</p>
                            <p style={{ color: '#6B7280', fontSize: '13px' }}>Your booking has been cancelled and a refund has been initiated.</p>
                        </div>
                    )}

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
    const formScreen = (
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
                        {/* ── Equipment Photo Carousel ── */}
                        {(() => {
                            const imgs = equip.images || [];
                            const slideTo = (dir, e) => {
                                e.stopPropagation();
                                if (bSliding || imgs.length < 2) return;
                                setBSliding(true);
                                setTimeout(() => {
                                    setCarouselBIdx(i => dir === 'next'
                                        ? (i + 1) % imgs.length
                                        : (i - 1 + imgs.length) % imgs.length);
                                    setBSliding(false);
                                }, 280);
                            };
                            return (
                                <div style={{ position: 'relative', height: '180px', borderRadius: '12px', overflow: 'hidden', background: 'linear-gradient(135deg,#F1F8E9,#DCEDC8)', marginBottom: '16px' }}>
                                    {imgs.length > 0 ? (
                                        <>
                                            <img
                                                src={imgs[carouselBIdx]}
                                                alt={equip.name}
                                                onClick={() => setLightboxBIdx(carouselBIdx)}
                                                style={{
                                                    width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in',
                                                    transform: bSliding ? 'scale(0.94) translateX(4%)' : 'scale(1)',
                                                    opacity: bSliding ? 0.5 : 1,
                                                    transition: 'transform 0.28s ease, opacity 0.28s ease'
                                                }}
                                            />
                                            {/* Zoom hint */}
                                            <div onClick={() => setLightboxBIdx(carouselBIdx)}
                                                style={{
                                                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: 'transparent', cursor: 'zoom-in', transition: 'background 0.2s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.15)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div style={{ background: 'rgba(255,255,255,0.85)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', opacity: 0, transition: 'opacity 0.2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                                    onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                                                    <ZoomIn size={18} color="#2E7D32" />
                                                </div>
                                            </div>
                                            {imgs.length > 1 && <>
                                                <button onClick={e => slideTo('prev', e)} style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.88)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 5px rgba(0,0,0,0.18)', zIndex: 2 }}><ChevronLeft size={16} /></button>
                                                <button onClick={e => slideTo('next', e)} style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.88)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 5px rgba(0,0,0,0.18)', zIndex: 2 }}><ChevronRight size={16} /></button>
                                                <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, zIndex: 2 }}>
                                                    {imgs.map((_, i) => <span key={i} onClick={e => { e.stopPropagation(); setCarouselBIdx(i); }} style={{ width: i === carouselBIdx ? 18 : 6, height: 6, borderRadius: 999, background: i === carouselBIdx ? '#fff' : 'rgba(255,255,255,0.55)', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />)}
                                                </div>
                                                <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, zIndex: 2 }}>{carouselBIdx + 1}/{imgs.length}</span>
                                            </>}
                                        </>
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Tractor size={64} color="#2E7D32" strokeWidth={1.2} />
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                        {/* ── Rental Rates ── */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                            {equip.priceHr != null && (
                                <div style={{ flex: 1, minWidth: '110px', background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '1.5px solid #BBF7D0', borderRadius: '12px', padding: '10px 14px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 700, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Per Hour</p>
                                    <p style={{ fontSize: '20px', fontWeight: 900, color: '#15803D', margin: 0 }}>₹{equip.priceHr.toLocaleString('en-IN')}</p>
                                </div>
                            )}
                            {equip.priceDay != null && (
                                <div style={{ flex: 1, minWidth: '110px', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '1.5px solid #BFDBFE', borderRadius: '12px', padding: '10px 14px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 700, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Per Day</p>
                                    <p style={{ fontSize: '20px', fontWeight: 900, color: '#1D4ED8', margin: 0 }}>₹{equip.priceDay.toLocaleString('en-IN')}</p>
                                </div>
                            )}
                        </div>

                        {/* ── Name & Badge ── */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', lineHeight: 1.3, wordBreak: 'break-word', flex: 1 }}>{equip.name}</h3>
                            {equip.verified && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F0FDF4', color: '#15803D', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px', flexShrink: 0 }}>
                                    <ShieldCheck size={11} /> Verified
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '8px 0 4px' }}>
                            <Star size={13} fill="#8BC34A" strokeWidth={0} />
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>{equip.rating}</span>
                            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>({equip.reviews || equip.reviewCount || 0} reviews)</span>
                        </div>

                        {/* ── Full Location ── */}
                        <div style={{ background: '#F9FAFB', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px', borderLeft: '3px solid #2E7D32' }}>
                            <p style={{ fontSize: '11px', fontWeight: 800, color: '#2E7D32', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <MapPin size={11} /> Equipment Location
                            </p>
                            <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, margin: 0, wordBreak: 'break-word' }}>
                                {[equip.location?.houseNo, equip.location?.village, equip.location?.landmark, equip.location?.block, equip.location?.district, equip.location?.state, equip.location?.pinCode ? `PIN: ${equip.location.pinCode}` : null].filter(Boolean).join(', ')}
                            </p>
                        </div>

                        {/* ── Description ── */}
                        {equip.description && (
                            <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6, borderTop: '1px solid #F3F4F6', paddingTop: '12px', marginBottom: '12px', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{equip.description}</p>
                        )}

                        {/* ── Lender card ── */}
                        <div style={{ background: '#F9FAFB', borderRadius: '10px', padding: '10px 12px', borderLeft: '3px solid #8BC34A' }}>
                            <p style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Listed By</p>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg,#2E7D32,#8BC34A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '15px', fontWeight: 800, flexShrink: 0 }}>
                                    {(equip.owner?.name?.first?.[0] || 'L').toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '13px', fontWeight: 800, color: '#111827', margin: '0 0 2px', wordBreak: 'break-word' }}>{equip.owner?.name?.first} {equip.owner?.name?.last}</p>
                                    <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 4px' }}>{equip.owner?.mobile ? `📞 ${equip.owner.mobile}` : ''}</p>
                                    {equip.owner?.address && (
                                        <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0, wordBreak: 'break-word', lineHeight: 1.4 }}>
                                            📍 {[equip.owner.address.village, equip.owner.address.district, equip.owner.address.state].filter(Boolean).join(', ')}
                                        </p>
                                    )}
                                </div>
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

    // Append lightbox outside the main JSX so it overlays everything
    return (
        <>
            {formScreen}
            {lightboxBIdx !== null && (equip?.images?.length > 0) && (() => {
                const imgs = equip.images;
                const goTo = dir => setLightboxBIdx(i => dir === 'next' ? (i + 1) % imgs.length : (i - 1 + imgs.length) % imgs.length);
                return (
                    <div onClick={() => setLightboxBIdx(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
                        <button onClick={() => setLightboxBIdx(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', zIndex: 2 }}><X size={22} /></button>
                        {imgs.length > 1 && <button onClick={e => { e.stopPropagation(); goTo('prev'); }} style={{ position: 'absolute', left: 16, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', zIndex: 2 }}><ChevronLeft size={26} /></button>}
                        <img src={imgs[lightboxBIdx]} alt="equipment" onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }} />
                        {imgs.length > 1 && <button onClick={e => { e.stopPropagation(); goTo('next'); }} style={{ position: 'absolute', right: 16, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', zIndex: 2 }}><ChevronRight size={26} /></button>}
                        {imgs.length > 1 && (
                            <div style={{ position: 'absolute', bottom: 24, display: 'flex', gap: 8 }}>
                                {imgs.map((_, i) => <span key={i} onClick={e => { e.stopPropagation(); setLightboxBIdx(i); }} style={{ width: i === lightboxBIdx ? 24 : 8, height: 8, borderRadius: 999, background: i === lightboxBIdx ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.3s' }} />)}
                            </div>
                        )}
                        {imgs.length > 1 && <span style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>{lightboxBIdx + 1} / {imgs.length}</span>}
                    </div>
                );
            })()}
        </>
    );
}
