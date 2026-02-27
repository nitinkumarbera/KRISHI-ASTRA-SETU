import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
    User, MapPin, CreditCard, FileText, ShieldCheck, ShieldX, Clock,
    Download, Edit3, Eye, EyeOff, Phone, Mail, Calendar, CheckCircle2,
    AlertTriangle, Building2, QrCode, Tractor, Zap, RefreshCw, ChevronRight,
    Search, Tag, Star, Lock
} from 'lucide-react';
import jsPDF from 'jspdf';
import _autoTableMod from 'jspdf-autotable';
const autoTable = typeof _autoTableMod === 'function' ? _autoTableMod : (_autoTableMod?.default ?? _autoTableMod);
import { kasAlert, kasPrompt } from '../components/KasDialog';
import UserAnalytics from '../components/UserAnalytics';

// ── Helpers ─────────────────────────────────────────────────
function maskAadhaar(n) { return n ? `XXXX-XXXX-${n.slice(-4)}` : '—'; }
function maskAccount(n) { return n ? `${'*'.repeat(n.length - 4)}${n.slice(-4)}` : '—'; }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'; }

// ── Generate Lender Bill PDF ─────────────────────────────────
function generateLenderBill(r, authToken) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    const renter = r.renter || {};
    const equip = r.equipment || {};
    const rAddr = renter.address || {};
    const rFin = renter.finance || {};

    const now = new Date();
    const billNo = `KAS-BILL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${r.handoverToken?.slice(-4) || 'XXXX'}`;
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Draw logo
    const drawLogo = (ox, oy, scale) => {
        doc.setFillColor(241, 248, 233); doc.setDrawColor(139, 195, 74); doc.setLineWidth(0.5);
        doc.circle(ox, oy, 29 * scale, 'FD');
        doc.setFillColor(46, 125, 50); doc.setDrawColor(46, 125, 50);
        doc.roundedRect(ox - 14 * scale, oy + 2 * scale, 18 * scale, 11 * scale, 1, 1, 'F');
        doc.setFillColor(56, 142, 60);
        doc.roundedRect(ox - 1 * scale, oy - 6 * scale, 10 * scale, 9 * scale, 1, 1, 'F');
        doc.setFillColor(27, 94, 32); doc.circle(ox - 8 * scale, oy + 13 * scale, 7.5 * scale, 'F');
        doc.setFillColor(46, 125, 50); doc.circle(ox - 8 * scale, oy + 13 * scale, 4.5 * scale, 'F');
        doc.setFillColor(27, 94, 32); doc.circle(ox + 5 * scale, oy + 13 * scale, 4.5 * scale, 'F');
        doc.setFillColor(46, 125, 50); doc.circle(ox + 5 * scale, oy + 13 * scale, 2.5 * scale, 'F');
    };

    // Header
    doc.setFillColor(27, 94, 32); doc.rect(0, 0, W, 42, 'F');
    doc.setFillColor(46, 125, 50); doc.rect(0, 38, W, 4, 'F');
    drawLogo(W - 16, 18, 0.45);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.text('Krishi Astra Setu', 14, 14);
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.text('Farm Equipment Rental Platform', 14, 20);
    doc.text('Website: www.krishiastrasetu.in  |  Email: support@krishiastrasetu.in  |  Phone: +91 800 000 1234', 14, 26);
    doc.text('GST No: 27AABCK1234M1Z5  |  Registered in Maharashtra, India', 14, 32);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text('TAX INVOICE', W - 32, 12, { align: 'right' });
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.text(`Bill No : ${billNo}`, W - 32, 20, { align: 'right' });
    doc.text(`Date    : ${dateStr}`, W - 32, 26, { align: 'right' });
    doc.text(`Time    : ${timeStr}`, W - 32, 32, { align: 'right' });

    // Status badge
    doc.setFillColor(240, 253, 244); doc.roundedRect(14, 46, W - 28, 10, 2, 2, 'F');
    doc.setDrawColor(187, 247, 208); doc.roundedRect(14, 46, W - 28, 10, 2, 2, 'S');
    doc.setTextColor(21, 128, 61); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text(`[ BOOKING ${r.status?.toUpperCase() || 'CONFIRMED'} ]   Platform: Krishi Astra Setu`, W / 2, 53, { align: 'center' });

    // Handover Token box
    doc.setFillColor(46, 125, 50); doc.roundedRect(14, 60, W - 28, 17, 3, 3, 'F');
    doc.setTextColor(197, 225, 165); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text('HANDOVER TOKEN  —  Use this code for equipment pickup & return verification', W / 2, 66, { align: 'center' });
    doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text(r.handoverToken || '——', W / 2, 75, { align: 'center' });

    let y = 83;
    const sectionHeader = (label, color = [46, 125, 50]) => {
        doc.setFillColor(...color); doc.rect(14, y, W - 28, 7, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text(label, W / 2, y + 5, { align: 'center' }); y += 7;
    };
    const subHeader = (label) => {
        doc.setFillColor(232, 245, 233); doc.rect(14, y, W - 28, 5.5, 'F');
        doc.setDrawColor(187, 247, 208); doc.rect(14, y, W - 28, 5.5, 'S');
        doc.setTextColor(27, 94, 32); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
        doc.text(`— ${label} —`, W / 2, y + 4, { align: 'center' }); y += 5.5;
    };
    const drawRows = (rows) => {
        const bw = W - 28;
        rows.forEach((row, i) => {
            doc.setFillColor(i % 2 === 0 ? 249 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 251 : 255);
            doc.rect(14, y, bw, 6.5, 'F');
            doc.setDrawColor(229, 231, 235); doc.rect(14, y, bw, 6.5, 'S');
            doc.setTextColor(107, 114, 128); doc.setFontSize(7.2); doc.setFont('helvetica', 'bold');
            doc.text(row[0], 16, y + 4.5);
            doc.setTextColor(17, 24, 39); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
            doc.text(String(row[1] ?? 'N/A'), 14 + bw - 2, y + 4.5, { align: 'right', maxWidth: bw - 40 });
            y += 6.5;
        }); y += 3;
    };

    // Renter details
    sectionHeader('RENTER DETAILS');
    subHeader('Personal Information');
    drawRows([
        ['Full Name', [renter.name?.first, renter.name?.middle, renter.name?.last].filter(Boolean).join(' ') || 'N/A'],
        ['Email ID', renter.email || 'N/A'],
        ['Mobile No.', renter.mobile || 'N/A'],
    ]);
    subHeader('Address');
    drawRows([
        ['House / Premise No.', rAddr.houseNo || 'N/A'],
        ['Village / Town', rAddr.village || 'N/A'],
        ['Post Office', rAddr.postOffice || 'N/A'],
        ['GP / Ward', rAddr.gpWard || 'N/A'],
        ['Taluka / Block', rAddr.block || 'N/A'],
        ['District', rAddr.district || 'N/A'],
        ['State', rAddr.state || 'N/A'],
        ['PIN Code', rAddr.pincode || rAddr.pinCode || 'N/A'],
    ]);
    subHeader('Bank Details');
    drawRows([
        ['Bank Name', rFin.bankAccount?.bankName || rFin.bankName || 'N/A'],
        ['Account Number', rFin.bankAccount?.accountNumber || rFin.accountNo || 'N/A'],
        ['IFSC Code', rFin.bankAccount?.ifsc || rFin.ifscCode || 'N/A'],
        ['UPI ID', rFin.upiId || 'N/A'],
    ]);

    // Equipment & price — page 2
    doc.addPage(); y = 14;
    sectionHeader('EQUIPMENT DETAILS', [27, 94, 32]);
    drawRows([
        ['Equipment Name', equip.name || 'N/A'],
        ['Category', equip.category || 'N/A'],
        ['Price per Hour', `Rs. ${(equip.priceHr || 0).toLocaleString('en-IN')}`],
        ['Rental Start', formatDate(r.rentalDates?.start)],
        ['Rental End', formatDate(r.rentalDates?.end)],
        ['Purpose', r.purpose || 'N/A'],
        ['Payment Status', r.paymentStatus || 'N/A'],
    ]);

    sectionHeader('PRICE BREAKDOWN');
    const total = r.totalAmount || 0;
    const platformFee = Math.round(total / 1.18 * 0.05);
    const gst = Math.round(total / 1.18 * 0.18);
    const subtotal = total - platformFee - gst;
    autoTable(doc, {
        startY: y,
        head: [['Description', 'Amount (INR)']],
        body: [
            ['Rental Charge (subtotal)', `Rs.${subtotal.toLocaleString('en-IN')}`],
            ['Platform Fee (5%)', `Rs.${platformFee.toLocaleString('en-IN')}`],
            ['GST @ 18%', `Rs.${gst.toLocaleString('en-IN')}`],
        ],
        foot: [['TOTAL AMOUNT', `Rs.${total.toLocaleString('en-IN')}`]],
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3, textColor: [17, 24, 39] },
        headStyles: { fillColor: [46, 125, 50], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [240, 253, 244], textColor: [21, 128, 61], fontStyle: 'bold', fontSize: 9 },
        columnStyles: { 0: { cellWidth: 120, fillColor: [249, 250, 251], fontStyle: 'bold' }, 1: { halign: 'right', fontStyle: 'bold' } },
        margin: { left: 14, right: 14 },
    });
    y = (doc.lastAutoTable?.finalY ?? y + 50) + 6;

    // Footer
    doc.setFillColor(27, 94, 32); doc.rect(0, H - 16, W, 16, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text('Krishi Astra Setu  |  Bridging Tools, Empowering Farmers', W / 2, H - 9, { align: 'center' });
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text('This is a computer-generated invoice. No signature required.  |  www.krishiastrasetu.in', W / 2, H - 4, { align: 'center' });

    doc.save(`KAS-Lender-Bill-${r.handoverToken || r._id?.slice(-6)}.pdf`);
}

const STATUS_CONFIG = {
    Verified: { color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0', icon: CheckCircle2, label: '✅ KYC Verified', desc: 'You can now rent and list equipment on KAS.' },
    Pending: { color: '#92400E', bg: '#FFFBEB', border: '#FDE68A', icon: Clock, label: '⏳ Pending Admin Approval', desc: 'Your documents are under review. This usually takes 24–48 hours.' },
    Rejected: { color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA', icon: ShieldX, label: '❌ KYC Rejected', desc: 'Please update your details and re-submit.' },
};

// ── ID Card PDF Generator (Premium KAS Theme) ───────────────
function downloadIdCard(user) {
    const fullName = [user.name?.first, user.name?.middle, user.name?.last].filter(Boolean).join(' ') || user.role || 'Member';
    const memberId = 'KAS-' + (user._id?.slice(-8).toUpperCase() || '00000001');
    const district = user.address?.district || '\u2014';
    const state = user.address?.state || '\u2014';
    const mobile = user.mobile ? '+91 ' + user.mobile : '\u2014';
    const joined = formatDate(user.createdAt);
    const photoUrl = user.documents?.passportPhoto || '';
    const initial = (fullName[0] || 'K').toUpperCase();
    const aadhaar = user.aadhaarNo ? 'XXXX-XXXX-' + user.aadhaarNo.slice(-4) : '\u2014';
    const uid = 'kas-' + Date.now();

    const barLines = Array.from({ length: 36 }, (_, i) => {
        const w = i % 5 === 0 ? 3 : i % 3 === 0 ? 1 : 2;
        const o = i % 4 === 0 ? 0.75 : 0.35;
        return '<div style="width:' + w + 'px;height:26px;background:rgba(0,0,0,' + o + ');border-radius:1px;flex-shrink:0"></div>';
    }).join('');

    const photoHTML = photoUrl
        ? '<img src="' + photoUrl + '" crossorigin="anonymous" style="width:88px;height:88px;border-radius:14px;object-fit:cover;border:3px solid rgba(255,255,255,0.85);box-shadow:0 0 0 4px rgba(139,195,74,0.45),0 8px 24px rgba(0,0,0,0.4);display:block;"/>'
        : '<div style="width:88px;height:88px;border-radius:14px;background:linear-gradient(135deg,rgba(255,255,255,0.2),rgba(255,255,255,0.07));border:3px solid rgba(255,255,255,0.55);display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:900;color:#fff;box-shadow:0 0 0 4px rgba(139,195,74,0.35),0 8px 24px rgba(0,0,0,0.3);">' + initial + '</div>';

    const fields = [
        ['Aadhaar', aadhaar],
        ['Mobile', mobile],
        ['District', district + ', ' + state],
        ['Email', (user.email || '\u2014').length > 24 ? (user.email || '\u2014').slice(0, 24) + '\u2026' : (user.email || '\u2014')],
        ['Joined', joined],
    ].map(function (pair) {
        return '<div style="display:flex;gap:8px;align-items:baseline;">'
            + '<span style="font-size:8.5px;color:rgba(165,214,167,0.8);font-weight:700;min-width:54px;flex-shrink:0;text-transform:uppercase;letter-spacing:0.06em;">' + pair[0] + '</span>'
            + '<span style="font-size:10px;color:rgba(255,255,255,0.92);font-weight:600;">' + pair[1] + '</span>'
            + '</div>';
    }).join('');

    const card = [
        '<div style="width:430px;height:265px;border-radius:22px;overflow:hidden;',
        'font-family:Segoe UI,system-ui,Arial,sans-serif;',
        'background:linear-gradient(140deg,#071d07 0%,#1B5E20 38%,#2E7D32 68%,#0f3610 100%);',
        'position:relative;box-shadow:0 24px 64px rgba(0,0,0,0.6);">',

        // Glow orbs
        '<div style="position:absolute;top:-70px;right:-70px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(139,195,74,0.18),transparent 70%);pointer-events:none;"></div>',
        '<div style="position:absolute;bottom:-50px;left:110px;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,0.05),transparent 70%);pointer-events:none;"></div>',
        '<div style="position:absolute;top:30px;left:-20px;width:110px;height:110px;border-radius:50%;background:radial-gradient(circle,rgba(76,175,80,0.1),transparent 70%);pointer-events:none;"></div>',

        // Wheat watermarks
        '<div style="position:absolute;right:10px;top:6px;font-size:70px;opacity:0.055;transform:rotate(12deg);pointer-events:none;line-height:1;">\uD83C\uDF3E</div>',
        '<div style="position:absolute;left:140px;bottom:32px;font-size:50px;opacity:0.045;transform:rotate(-8deg);pointer-events:none;line-height:1;">\uD83C\uDF3E</div>',

        // ── HEADER ──
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:15px 20px 10px;">',
        '<div style="display:flex;align-items:center;gap:9px;">',
        '<div style="width:33px;height:33px;border-radius:9px;background:linear-gradient(135deg,#A5D6A7,#4CAF50);display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 10px rgba(0,0,0,0.35);">\uD83C\uDF3E</div>',
        '<div>',
        '<div style="color:#fff;font-size:12.5px;font-weight:900;letter-spacing:0.08em;line-height:1.1;">KRISHI ASTRA SETU</div>',
        '<div style="color:rgba(165,214,167,0.8);font-size:7px;letter-spacing:0.18em;font-weight:600;text-transform:uppercase;">Farmer Equipment Network \u00b7 India</div>',
        '</div></div>',
        '<div style="background:linear-gradient(135deg,#43A047,#1B5E20);border:1.5px solid rgba(255,255,255,0.28);color:#fff;padding:4px 12px;border-radius:99px;font-size:8.5px;font-weight:800;letter-spacing:0.1em;box-shadow:0 2px 12px rgba(76,175,80,0.5);">\u2705 KYC VERIFIED</div>',
        '</div>',

        // ── BODY ──
        '<div style="display:flex;padding:0 20px 0;gap:0;">',

        // LEFT column
        '<div style="display:flex;flex-direction:column;align-items:center;gap:9px;width:115px;flex-shrink:0;padding-top:2px;">',
        photoHTML,
        // Gold chip
        '<div style="width:42px;height:30px;border-radius:6px;background:linear-gradient(135deg,#FFD54F 0%,#F9A825 40%,#FFE082 58%,#F57F17 100%);border:1px solid rgba(255,255,255,0.45);box-shadow:0 3px 12px rgba(245,127,23,0.55),inset 0 1px 0 rgba(255,255,255,0.55);padding:4px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:2.5px;">',
        Array(9).fill('<div style="background:rgba(100,50,0,0.28);border-radius:2px;"></div>').join(''),
        '</div>',
        // Member ID
        '<div style="text-align:center;margin-top:-2px;">',
        '<div style="font-size:7px;color:rgba(165,214,167,0.75);font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Member ID</div>',
        '<div style="font-size:9px;color:#fff;font-weight:900;letter-spacing:0.05em;margin-top:1px;">' + memberId + '</div>',
        '</div>',
        '</div>',

        // Vertical divider
        '<div style="width:1px;background:linear-gradient(to bottom,transparent,rgba(255,255,255,0.18),transparent);margin:0 16px;flex-shrink:0;"></div>',

        // RIGHT column — details
        '<div style="flex:1;padding-top:0;">',
        '<div style="font-size:20px;font-weight:900;color:#fff;line-height:1.15;text-shadow:0 2px 10px rgba(0,0,0,0.5);letter-spacing:0.01em;margin-bottom:2px;">' + fullName + '</div>',
        '<div style="display:inline-block;background:linear-gradient(90deg,rgba(165,214,167,0.22),rgba(165,214,167,0.09));border:1px solid rgba(165,214,167,0.38);color:#A5D6A7;font-size:7.5px;font-weight:800;padding:2px 9px;border-radius:99px;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:9px;">' + (user.role || 'Member') + '</div>',
        '<div style="display:flex;flex-direction:column;gap:5px;">' + fields + '</div>',
        '</div>',
        '</div>',

        // ── BARCODE FOOTER ──
        '<div style="position:absolute;bottom:0;left:0;right:0;height:38px;background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,0.55) 100%);display:flex;align-items:center;padding:0 20px;gap:2px;">',
        '<div style="display:flex;gap:1.5px;align-items:center;height:26px;">' + barLines + '</div>',
        '<div style="margin-left:auto;display:flex;flex-direction:column;align-items:flex-end;gap:2px;">',
        '<span style="color:rgba(165,214,167,0.9);font-size:7px;font-weight:800;letter-spacing:0.14em;">krishi-astra-setu.in</span>',
        '<span style="color:rgba(255,255,255,0.38);font-size:6px;letter-spacing:0.06em;">' + '\uD83D\uDD12 SECURE · GOVT. RECOGNISED</span>',
        '</div></div>',

        '</div>'
    ].join('');

    // Inject styles
    const style = document.createElement('style');
    style.innerHTML = [
        '@media print{',
        '  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}',
        '  body>*:not(#' + uid + '){display:none!important;}',
        '  #' + uid + '{',
        '    display:flex!important;position:fixed;top:0;left:0;width:100vw;height:100vh;',
        '    align-items:center;justify-content:center;',
        '    background:#0a3d0a!important;',
        '  }',
        '  @page{size:A4 landscape;margin:0;}',
        '}',
        '#' + uid + '{display:none;}'
    ].join('');

    const wrap = document.createElement('div');
    wrap.id = uid;
    wrap.innerHTML = card;
    wrap.style.cssText = 'position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);';

    document.head.appendChild(style);
    document.body.appendChild(wrap);
    wrap.style.display = 'flex';

    setTimeout(function () {
        window.print();
        setTimeout(function () {
            if (style.parentNode) style.parentNode.removeChild(style);
            if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
        }, 1200);
    }, 150);
}




// ── DamageReportForm ──────────────────────────────────────────
// Lets the lender file a damage report (description + severity + optional photos)
function DamageReportForm({ bookingId, authToken, onReported }) {
    const [open, setOpen] = useState(false);
    const [desc, setDesc] = useState('');
    const [severity, setSeverity] = useState('Minor');
    const [photos, setPhotos] = useState([]); // base64 strings
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState('');
    const fileRef = useRef(null);

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files).slice(0, 5 - photos.length);
        files.forEach(f => {
            const reader = new FileReader();
            reader.onload = ev => setPhotos(prev => [...prev, ev.target.result]);
            reader.readAsDataURL(f);
        });
    };

    const submit = async () => {
        if (!desc.trim()) { setErr('Please describe the damage.'); return; }
        setSubmitting(true); setErr('');
        try {
            const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/damage-report`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': authToken },
                body: JSON.stringify({ description: desc, severity, photos })
            });
            const data = await res.json();
            if (res.ok) { onReported?.(); }
            else { setErr(data.message || 'Failed to file report.'); }
        } catch { setErr('Network error.'); }
        setSubmitting(false);
    };

    return (
        <div style={{ marginBottom: '12px' }}>
            {!open ? (
                <button onClick={() => setOpen(true)}
                    style={{ background: 'transparent', border: '1.5px solid #EF4444', color: '#EF4444', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', width: '100%' }}>
                    ⚠️ Report Damage (Optional)
                </button>
            ) : (
                <div style={{ background: '#FFF7F7', border: '1.5px solid #FECACA', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 800, color: '#991B1B', margin: 0 }}>⚠️ File Damage Report</p>
                        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#6B7280' }}>✕</button>
                    </div>
                    {/* Severity */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                        {['Minor', 'Moderate', 'Severe'].map(s => (
                            <label key={s} style={{
                                display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                padding: '4px 10px', borderRadius: '999px',
                                background: severity === s ? (s === 'Severe' ? '#7F1D1D' : s === 'Moderate' ? '#92400E' : '#166534') : '#F3F4F6',
                                color: severity === s ? '#fff' : '#374151'
                            }}>
                                <input type="radio" name="severity" value={s} checked={severity === s} onChange={() => setSeverity(s)} style={{ display: 'none' }} />
                                {s}
                            </label>
                        ))}
                    </div>
                    {/* Description */}
                    <textarea
                        rows={3}
                        placeholder="Describe the damage (e.g. scratches on hood, broken part, etc.)..."
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                        style={{ width: '100%', borderRadius: '8px', border: '1px solid #FECACA', padding: '8px', fontSize: '12px', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                    {/* Photo upload */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {photos.map((p, i) => (
                            <div key={i} style={{ position: 'relative' }}>
                                <img src={p} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #FECACA' }} />
                                <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                                    style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#EF4444', border: 'none', borderRadius: '50%', width: '16px', height: '16px', color: '#fff', fontSize: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
                            </div>
                        ))}
                        {photos.length < 5 && (
                            <button onClick={() => fileRef.current?.click()}
                                style={{ width: '48px', height: '48px', border: '2px dashed #FECACA', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: '#EF4444', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        )}
                        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoChange} />
                    </div>
                    {err && <p style={{ fontSize: '11px', color: '#EF4444', marginTop: '6px' }}>{err}</p>}
                    <button onClick={submit} disabled={submitting}
                        style={{ marginTop: '10px', background: '#B91C1C', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '12px', cursor: 'pointer', width: '100%' }}>
                        {submitting ? 'Filing Report…' : '⚠️ Submit Damage Report'}
                    </button>
                </div>
            )}
        </div>
    );
}


// ── GeoPhotoUploader ─────────────────────────────────────────
// Lets the renter capture GPS-stamped proof photos during an In Progress rental
function GeoPhotoUploader({ bookingId, existingPhotos, authToken, onUploaded }) {
    const [photos, setPhotos] = useState(existingPhotos || []);
    const [capturing, setCapturing] = useState(false);   // live camera open
    const [preview, setPreview] = useState(null);      // { base64, lat, lng, address, takenAt }
    const [stream, setStream] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [gps, setGps] = useState(null);
    const [gpsAddr, setGpsAddr] = useState('');
    const [error, setError] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const startCamera = async () => {
        setError('');
        setPreview(null);
        // Get GPS (don't block camera on GPS)
        navigator.geolocation.getCurrentPosition(async pos => {
            const { latitude: lat, longitude: lng } = pos.coords;
            setGps({ lat, lng });
            try {
                const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyCFPRjUXcZqyeShhQHT3ku748UJSJUgBlw`);
                const d = await r.json();
                if (d.results?.[0]) setGpsAddr(d.results[0].formatted_address);
            } catch { setGpsAddr(`${lat.toFixed(5)}, ${lng.toFixed(5)}`); }
        }, () => { /* GPS denied — camera still works, stamp will show coords unavailable */ });

        try {
            // Try rear camera first, fall back to any camera (desktop webcam)
            let s;
            try {
                s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: 'environment' } }, audio: false });
            } catch {
                s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            }
            setStream(s);
            setCapturing(true);
            // Use a small delay so the video element is mounted before we attach srcObject
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = s;
                    videoRef.current.play().catch(() => { });
                }
            }, 150);
        } catch (e) {
            setError('Camera access denied. Please allow camera access in your browser settings.');
        }
    };

    const stopCamera = (s) => {
        (s || stream)?.getTracks().forEach(t => t.stop());
        setStream(null);
        setCapturing(false);
    };

    // Step 1 — Freeze frame, draw GPS stamp, store as preview (no upload yet)
    const capturePreview = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        // ── GPS Map Camera stamp ──────────────────────────────────
        const now = new Date();
        const W = canvas.width, H = canvas.height;
        const scale = W / 640;
        const fSmall = Math.round(11 * scale);
        const fMed = Math.round(13 * scale);
        const fLg = Math.round(15 * scale);
        const pad = Math.round(10 * scale);
        const lineH = Math.round(20 * scale);

        const latAbs = gps ? Math.abs(gps.lat) : 0;
        const lngAbs = gps ? Math.abs(gps.lng) : 0;
        const latStr = gps ? `Lat  ${latAbs.toFixed(6)}\u00b0${gps.lat >= 0 ? 'N' : 'S'}` : 'Lat  \u2014';
        const lngStr = gps ? `Long ${lngAbs.toFixed(6)}\u00b0${gps.lng >= 0 ? 'E' : 'W'}` : 'Long \u2014';

        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const mi = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        const ampm = now.getHours() < 12 ? 'AM' : 'PM';
        const timeStr = `${dd}/${mm}/${now.getFullYear()}  ${hh}:${mi}:${ss} ${ampm}  GMT+05:30`;

        const addrParts = gpsAddr ? gpsAddr.split(',').map(s => s.trim()) : [];
        const addrLine1 = addrParts.slice(0, 2).join(', ') || (gps ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}` : 'Location unavailable');
        const addrLine2 = addrParts.slice(2, 5).join(', ') || '';

        const rows = [addrLine1, addrLine2, latStr, lngStr, timeStr].filter(Boolean);
        const boxH = pad * 2 + fLg + lineH * rows.length + Math.round(6 * scale);

        ctx.fillStyle = 'rgba(0,0,0,0.72)';
        ctx.fillRect(0, H - boxH, W, boxH);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(0, H - boxH, Math.round(5 * scale), boxH);
        ctx.font = `bold ${fSmall}px Arial`; ctx.fillStyle = '#4CAF50';
        ctx.fillText('  GPS Map Camera', pad + Math.round(8 * scale), H - boxH + pad + fSmall);

        let y = H - boxH + pad + fSmall + Math.round(4 * scale);
        rows.forEach(line => {
            y += lineH;
            const isCoord = line.startsWith('Lat') || line.startsWith('Long');
            const isTime = line.includes('GMT');
            ctx.font = isCoord ? `bold ${fMed}px 'Courier New',monospace`
                : isTime ? `${fSmall}px Arial` : `${fMed}px Arial`;
            ctx.fillStyle = isCoord ? '#A5D6A7' : isTime ? '#9CA3AF' : '#FFFFFF';
            ctx.fillText(line, pad + Math.round(10 * scale), y);
        });

        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        stopCamera(stream); // release camera NOW — preview is captured
        setPreview({ base64, lat: gps?.lat, lng: gps?.lng, address: gpsAddr, takenAt: now.toISOString() });
    };

    // Step 2 — User reviewed preview, now upload to server
    const submitPhoto = async () => {
        if (!preview) return;
        setUploading(true); setError('');
        try {
            const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/rental-photos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': authToken },
                body: JSON.stringify({ photos: [preview] })
            });
            const data = await res.json();
            if (res.ok) { setPhotos(data.data); setPreview(null); onUploaded?.(); }
            else setError(data.message || 'Upload failed.');
        } catch { setError('Network error during upload.'); }
        setUploading(false);
    };

    return (
        <div style={{ marginTop: '16px', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>
                📸 PROOF PHOTOS — Upload geo-tagged photos of the equipment during your rental
                <span style={{ marginLeft: '8px', background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '99px', fontSize: '11px' }}>Required ·{photos.length}/20</span>
            </p>

            {error && <p style={{ fontSize: '12px', color: '#DC2626', marginBottom: '8px', fontWeight: 600 }}>⚠️ {error}</p>}

            {/* Uploaded thumbnails */}
            {photos.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {photos.map((ph, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                            <img src={ph.url} alt={`proof-${i}`} onClick={() => window.open(ph.url, '_blank')}
                                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px', cursor: 'zoom-in', border: '2px solid #BBF7D0', display: 'block' }} />
                            <button onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                                style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: '#DC2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 900, lineHeight: '20px', textAlign: 'center', padding: 0, zIndex: 2 }}
                                title="Remove photo">✕</button>
                            <span style={{ position: 'absolute', bottom: '2px', left: '4px', fontSize: '8px', color: '#fff', background: 'rgba(0,0,0,0.55)', borderRadius: '3px', padding: '1px 4px' }}>
                                {new Date(ph.takenAt).toLocaleDateString('en-IN')}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* ── STATE A: Live camera feed ── */}
            {capturing && (
                <div style={{ marginBottom: '12px', borderRadius: '14px', overflow: 'hidden', border: '2px solid #1565C0', position: 'relative' }}>
                    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', display: 'block', background: '#000' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.65)', padding: '6px 12px', fontSize: '11px', color: '#fff' }}>
                        {gps ? `📍 ${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}  ${gpsAddr.slice(0, 55)}` : '⏳ Getting GPS location…'}
                    </div>
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
            )}

            {/* ── STATE B: GPS-stamped preview — review before submitting ── */}
            {!capturing && preview && (
                <div style={{ marginBottom: '12px', borderRadius: '14px', overflow: 'hidden', border: '2px solid #F59E0B', position: 'relative' }}>
                    <img src={preview.base64} alt="preview" style={{ width: '100%', maxHeight: '320px', objectFit: 'contain', display: 'block', background: '#111' }} />
                    <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(245,158,11,0.92)', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '99px' }}>
                        👁 Review — GPS stamp visible below the photo
                    </div>
                </div>
            )}

            {/* ── BUTTONS ── */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

                {/* Initial: no camera, no preview */}
                {!capturing && !preview && (
                    <button onClick={startCamera} disabled={uploading || photos.length >= 20}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2E7D32', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', opacity: (uploading || photos.length >= 20) ? 0.6 : 1 }}>
                        📷 Take Proof Photo
                    </button>
                )}

                {/* Camera live → Capture + Cancel */}
                {capturing && (
                    <>
                        <button onClick={capturePreview}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1565C0', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '10px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(21,101,192,0.4)' }}>
                            📸 Capture Photo {!gps && <span style={{ fontSize: '10px', opacity: 0.8 }}>(GPS loading…)</span>}
                        </button>
                        <button onClick={() => stopCamera()}
                            style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                            ✕ Cancel
                        </button>
                    </>
                )}

                {/* Preview → Submit + Retake */}
                {!capturing && preview && (
                    <>
                        <button onClick={submitPhoto} disabled={uploading}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2E7D32', color: '#fff', border: 'none', padding: '11px 28px', borderRadius: '10px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', opacity: uploading ? 0.65 : 1, boxShadow: '0 3px 10px rgba(46,125,50,0.35)' }}>
                            ✅ {uploading ? 'Uploading…' : 'Submit Photo'}
                        </button>
                        <button onClick={startCamera} disabled={uploading}
                            style={{ background: '#F3F4F6', color: '#374151', border: '1.5px solid #D1D5DB', padding: '11px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', opacity: uploading ? 0.6 : 1 }}>
                            🔄 Retake
                        </button>
                    </>
                )}

            </div>
        </div>
    );
}









// ── 🔐 SecuritySection ───────────────────────────────────────
function SecuritySection({ user, authToken, refreshUser, onAccountDeleted }) {
    const [secEmail, setSecEmail] = useState({ open: false, newEmail: '', password: '', loading: false, success: '', error: '' });
    const [secPass, setSecPass] = useState({ open: false, currentPassword: '', newPassword: '', confirmPassword: '', showCurrent: false, showNew: false, showConfirm: false, loading: false, success: '', error: '' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteAccPassword, setDeleteAccPassword] = useState('');
    const [deleteAccMsg, setDeleteAccMsg] = useState('');
    const [deleteAccLoading, setDeleteAccLoading] = useState(false);

    // ── Delete Account Handler ──────────────────────────────────
    async function handleDeleteAccount() {
        if (!deleteAccPassword.trim()) { setDeleteAccMsg('⚠️ Please enter your password.'); return; }
        setDeleteAccLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/user/account', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': authToken },
                body: JSON.stringify({ password: deleteAccPassword })
            });
            const data = await res.json();
            if (res.ok) {
                setDeleteAccMsg('✅ Account deleted. Redirecting...');
                setTimeout(() => { onAccountDeleted?.(); }, 1500);
            } else {
                setDeleteAccMsg('⚠️ ' + (data.message || 'Failed to delete account.'));
            }
        } catch {
            setDeleteAccMsg('⚠️ Network error. Please try again.');
        } finally {
            setDeleteAccLoading(false);
        }
    }


    const handleEmailChange = async () => {
        setSecEmail(s => ({ ...s, loading: true, error: '', success: '' }));
        try {
            const res = await fetch('http://localhost:5000/api/user/change-email', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': authToken },
                body: JSON.stringify({ currentPassword: secEmail.password, newEmail: secEmail.newEmail }),
            });
            const data = await res.json();
            if (res.ok) {
                setSecEmail(s => ({ ...s, loading: false, success: data.message, newEmail: '', password: '' }));
                await refreshUser();
            } else {
                setSecEmail(s => ({ ...s, loading: false, error: data.message }));
            }
        } catch {
            setSecEmail(s => ({ ...s, loading: false, error: 'Network error. Check your connection.' }));
        }
    };

    const handlePasswordChange = async () => {
        if (secPass.newPassword !== secPass.confirmPassword) {
            setSecPass(s => ({ ...s, error: 'Passwords do not match.' })); return;
        }
        if (secPass.newPassword.length < 6) {
            setSecPass(s => ({ ...s, error: 'New password must be at least 6 characters.' })); return;
        }
        setSecPass(s => ({ ...s, loading: true, error: '', success: '' }));
        try {
            const res = await fetch('http://localhost:5000/api/user/change-password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': authToken },
                body: JSON.stringify({ currentPassword: secPass.currentPassword, newPassword: secPass.newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                setSecPass(s => ({ ...s, loading: false, success: data.message, currentPassword: '', newPassword: '', confirmPassword: '' }));
            } else {
                setSecPass(s => ({ ...s, loading: false, error: data.message }));
            }
        } catch {
            setSecPass(s => ({ ...s, loading: false, error: 'Network error. Check your connection.' }));
        }
    };

    // ── shared style helpers (plain objects / functions, NOT JSX components) ──
    const cardStyle = { background: '#fff', borderRadius: '18px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6', marginBottom: '16px', overflow: 'hidden' };
    const headerStyle = (open) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', cursor: 'pointer', background: open ? '#F0FDF4' : '#fff', transition: 'background 0.2s' });
    const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #E5E7EB', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
    const pwInputStyle = { ...inputStyle, paddingRight: '44px' };
    const focusGreen = e => { e.target.style.borderColor = '#2E7D32'; };
    const blurGray = e => { e.target.style.borderColor = '#E5E7EB'; };
    const labelStyle = { fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' };
    const msgStyle = (ok) => ({ background: ok ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${ok ? '#BBF7D0' : '#FECACA'}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: ok ? '#15803D' : '#DC2626', fontWeight: 600 });
    const btnStyle = (loading) => ({ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', borderRadius: '10px', border: 'none', background: loading ? '#9CA3AF' : '#2E7D32', color: '#fff', fontWeight: 800, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' });

    return (
        <>
            <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} color="#2E7D32" /> Security & Login
                </h3>

                {/* ── Change Email ── */}
                <div style={cardStyle}>
                    <div style={headerStyle(secEmail.open)} onClick={() => setSecEmail(s => ({ ...s, open: !s.open, error: '', success: '' }))}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 800, color: '#111827' }}>
                            <Mail size={17} color="#2E7D32" /> Change Email Address
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#9CA3AF', fontWeight: 600 }}>
                            <span style={{ fontSize: '11px', background: '#F3F4F6', borderRadius: '6px', padding: '3px 8px', color: '#6B7280' }}>{user.email}</span>
                            {secEmail.open ? '▲' : '▼'}
                        </span>
                    </div>
                    {secEmail.open && (
                        <div style={{ padding: '20px 22px', borderTop: '1px solid #F3F4F6' }}>
                            {secEmail.success && <div style={msgStyle(true)}>✅ {secEmail.success}</div>}
                            {secEmail.error && <div style={msgStyle(false)}>⚠️ {secEmail.error}</div>}
                            <div style={{ display: 'grid', gap: '14px' }}>
                                <div>
                                    <label style={labelStyle}>New Email Address (@gmail.com)</label>
                                    <input type="email" value={secEmail.newEmail}
                                        onChange={e => setSecEmail(s => ({ ...s, newEmail: e.target.value, error: '' }))}
                                        placeholder="newaddress@gmail.com" style={inputStyle}
                                        onFocus={focusGreen} onBlur={blurGray} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Current Password (to verify it's you)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type="password" value={secEmail.password}
                                            onChange={e => setSecEmail(s => ({ ...s, password: e.target.value, error: '' }))}
                                            placeholder="Enter your current password" style={pwInputStyle}
                                            onFocus={focusGreen} onBlur={blurGray} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={handleEmailChange} disabled={secEmail.loading} style={btnStyle(secEmail.loading)}>
                                    {secEmail.loading ? <><RefreshCw size={15} className="animate-spin" /> Saving…</> : '📧 Update Email'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Change Password ── */}
                <div style={cardStyle}>
                    <div style={headerStyle(secPass.open)} onClick={() => setSecPass(s => ({ ...s, open: !s.open, error: '', success: '' }))}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 800, color: '#111827' }}>
                            <Lock size={17} color="#2E7D32" /> Change Password
                        </span>
                        <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600 }}>{secPass.open ? '▲' : '▼'}</span>
                    </div>
                    {secPass.open && (
                        <div style={{ padding: '20px 22px', borderTop: '1px solid #F3F4F6' }}>
                            {secPass.success && <div style={msgStyle(true)}>✅ {secPass.success}</div>}
                            {secPass.error && <div style={msgStyle(false)}>⚠️ {secPass.error}</div>}
                            <div style={{ display: 'grid', gap: '14px' }}>
                                {/* Current password */}
                                <div>
                                    <label style={labelStyle}>Current Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={secPass.showCurrent ? 'text' : 'password'}
                                            value={secPass.currentPassword}
                                            onChange={e => setSecPass(s => ({ ...s, currentPassword: e.target.value, error: '' }))}
                                            placeholder="Enter current password" style={pwInputStyle}
                                            onFocus={focusGreen} onBlur={blurGray} />
                                        <button type="button" onClick={() => setSecPass(s => ({ ...s, showCurrent: !s.showCurrent }))}
                                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
                                            {secPass.showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                {/* New password */}
                                <div>
                                    <label style={labelStyle}>New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={secPass.showNew ? 'text' : 'password'}
                                            value={secPass.newPassword}
                                            onChange={e => setSecPass(s => ({ ...s, newPassword: e.target.value, error: '' }))}
                                            placeholder="Min. 6 characters" style={pwInputStyle}
                                            onFocus={focusGreen} onBlur={blurGray} />
                                        <button type="button" onClick={() => setSecPass(s => ({ ...s, showNew: !s.showNew }))}
                                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
                                            {secPass.showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                {/* Confirm new password */}
                                <div>
                                    <label style={labelStyle}>Confirm New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={secPass.showConfirm ? 'text' : 'password'}
                                            value={secPass.confirmPassword}
                                            onChange={e => setSecPass(s => ({ ...s, confirmPassword: e.target.value, error: '' }))}
                                            placeholder="Re-enter new password" style={pwInputStyle}
                                            onFocus={focusGreen} onBlur={blurGray} />
                                        <button type="button" onClick={() => setSecPass(s => ({ ...s, showConfirm: !s.showConfirm }))}
                                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
                                            {secPass.showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={handlePasswordChange} disabled={secPass.loading} style={btnStyle(secPass.loading)}>
                                    {secPass.loading ? <><RefreshCw size={15} className="animate-spin" /> Saving…</> : '🔒 Update Password'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Delete Account ── */}
            <div style={{ marginTop: '20px', border: '2px solid #FEE2E2', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 22px', background: '#FEF2F2', borderBottom: '1px solid #FEE2E2' }}>
                    <span style={{ fontSize: '18px' }}>🗑️</span>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#B91C1C', flex: 1 }}>Danger Zone — Delete My Account</span>
                </div>
                <div style={{ padding: '20px 22px' }}>
                    <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px', lineHeight: 1.7 }}>
                        ⚠️ Permanently deletes your account, all your equipment listings, bookings, and data from Krishi Astra Setu.
                        <strong style={{ color: '#B91C1C' }}> This action cannot be undone.</strong>
                    </p>
                    {!showDeleteModal ? (
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px', borderRadius: '10px', background: '#FEF2F2', border: '2px solid #EF4444', color: '#B91C1C', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#B91C1C'; }}
                        >
                            🗑️ Delete My Account
                        </button>
                    ) : (
                        <div style={{ background: '#FFF1F2', borderRadius: '12px', padding: '18px', border: '1.5px solid #FECDD3' }}>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#B91C1C', marginBottom: '12px' }}>
                                ⚠️ Confirm your password to permanently delete your account:
                            </p>
                            {deleteAccMsg && <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', background: deleteAccMsg.includes('✅') ? '#F0FDF4' : '#FEF2F2', color: deleteAccMsg.includes('✅') ? '#15803D' : '#B91C1C', fontSize: '13px', fontWeight: 600 }}>{deleteAccMsg}</div>}
                            <input
                                type="password"
                                value={deleteAccPassword}
                                onChange={e => { setDeleteAccPassword(e.target.value); setDeleteAccMsg(''); }}
                                placeholder="Enter your current password"
                                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '2px solid #FECDD3', fontSize: '14px', outline: 'none', boxSizing: 'border-box', marginBottom: '14px', fontFamily: 'inherit' }}
                                onFocus={e => e.target.style.borderColor = '#EF4444'}
                                onBlur={e => e.target.style.borderColor = '#FECDD3'}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => { setShowDeleteModal(false); setDeleteAccPassword(''); setDeleteAccMsg(''); }}
                                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid #D1D5DB', background: '#fff', color: '#374151', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
                                    Cancel
                                </button>
                                <button onClick={handleDeleteAccount} disabled={deleteAccLoading}
                                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: deleteAccLoading ? '#6B7280' : '#DC2626', color: '#fff', fontWeight: 700, cursor: deleteAccLoading ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
                                    {deleteAccLoading ? 'Deleting...' : '🗑️ Yes, Delete My Account'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}


// ── Module-level sub-components (MUST be outside Profile to avoid 'Illegal constructor') ──
function SectionCard({ icon: Icon, title, children, editSection, openEditModal }) {
    return (
        <div style={{ background: '#fff', borderRadius: '18px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 24px', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #2E7D32, #8BC34A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color="#fff" />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', margin: 0, flex: 1 }}>{title}</h3>
                {editSection && (
                    <button onClick={openEditModal} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', border: '1.5px solid #2E7D32', background: 'transparent', color: '#2E7D32', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                        <Edit3 size={13} /> Edit
                    </button>
                )}
            </div>
            <div style={{ padding: '20px 24px' }}>{children}</div>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F9FAFB' }}>
            <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600, minWidth: '150px' }}>{label}</span>
            <span style={{ fontSize: '14px', color: '#111827', fontWeight: 700, textAlign: 'right' }}>{value || '—'}</span>
        </div>
    );
}

function DocBox({ label, url, icon: Icon }) {
    return (
        <div style={{ border: `2px dashed ${url ? '#2E7D32' : '#D1D5DB'}`, borderRadius: '12px', padding: '20px', textAlign: 'center', background: url ? '#F0FDF4' : '#F9FAFB' }}>
            {url
                ? <img src={url} alt={label} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', margin: '0 auto 8px' }} />
                : <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}><Icon size={22} color="#9CA3AF" /></div>
            }
            <p style={{ fontSize: '12px', fontWeight: 700, color: url ? '#15803D' : '#6B7280', margin: 0 }}>{url ? '✅ ' + label : label}</p>
            <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '4px 0 0' }}>{url ? 'Submitted' : 'Not uploaded'}</p>
        </div>
    );
}

export default function Profile() {
    const { user, token: authToken, refreshUser, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'rentals' | 'equipment'
    const [showAccount, setShowAccount] = useState(false);

    const [rentals, setRentals] = useState([]);
    const [myEquipment, setMyEquipment] = useState([]);
    const [lenderRentals, setLenderRentals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Review State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    // QR Code upload
    const [qrUploading, setQrUploading] = useState(false);
    const qrFileRef = useRef();
    const [qrPreview, setQrPreview] = useState(null); // local preview before confirming

    async function handleQrUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        setQrPreview(URL.createObjectURL(file));
        setQrUploading(true);
        try {
            const fd = new FormData();
            fd.append('qrCodeImage', file);
            const res = await fetch('http://localhost:5000/api/user/update-qr', {
                method: 'PATCH',
                headers: { 'x-auth-token': authToken },
                body: fd
            });
            const data = await res.json();
            if (res.ok) {
                await refreshUser();
                await kasAlert('✅ QR Code updated successfully!');
            } else {
                await kasAlert(data.message || 'Upload failed.');
                setQrPreview(null);
            }
        } catch {
            await kasAlert('Network error. Please try again.');
            setQrPreview(null);
        } finally {
            setQrUploading(false);
        }
    }

    useEffect(() => {
        if (authToken) {
            fetchDashboardData();
            refreshUser(); // Always sync full profile from server
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

    const submitReview = async (e) => {
        e.preventDefault();
        setSubmittingReview(true);
        try {
            const res = await fetch('http://localhost:5000/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': authToken
                },
                body: JSON.stringify({
                    bookingId: selectedBooking._id,
                    rating,
                    comment
                })
            });

            if (res.ok) {
                setShowReviewModal(false);
                setRating(5);
                setComment('');
                fetchDashboardData();
            } else {
                const d = await res.json();
                await kasAlert(d.message || 'Failed to submit review');
            }
        } catch (err) {
            await kasAlert('Error submitting review');
        } finally {
            setSubmittingReview(false);
        }
    };

    // ── Edit Profile State ───────────────────────────────────
    const [showEditModal, setShowEditModal] = useState(false);
    const [editSaving, setEditSaving] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [editFiles, setEditFiles] = useState({});
    const [editPreviews, setEditPreviews] = useState({});
    const editPassportRef = useRef();
    const editPassbookRef = useRef();

    function openEditModal() {
        setEditForm({
            firstName: user.name?.first || '',
            middleName: user.name?.middle || '',
            lastName: user.name?.last || '',
            gender: user.gender || '',
            dob: user.dob ? new Date(user.dob).toISOString().slice(0, 10) : '',
            mobile: user.mobile || '',
            email: user.email || '',
            // address
            houseNo: user.address?.houseNo || '',
            village: user.address?.village || '',
            postOffice: user.address?.postOffice || '',
            gpWard: user.address?.gpWard || '',
            block: user.address?.block || '',
            policeStation: user.address?.policeStation || '',
            landmark: user.address?.landmark || '',
            district: user.address?.district || '',
            pinCode: user.address?.pinCode || '',
            state: user.address?.state || 'Maharashtra',
            // bank
            bankName: user.finance?.bankName || '',
            branchName: user.finance?.branchName || '',
            accountNo: user.finance?.accountNo || '',
            ifscCode: user.finance?.ifscCode || '',
            upiId: user.finance?.upiId || '',
        });
        setEditFiles({});
        setEditPreviews({});
        setShowEditModal(true);
    }

    function setEF(k, v) { setEditForm(f => ({ ...f, [k]: v })); }

    function handleEditFile(k, e, ref) {
        const file = e.target.files[0];
        if (!file) return;
        setEditFiles(f => ({ ...f, [k]: file }));
        setEditPreviews(p => ({ ...p, [k]: URL.createObjectURL(file) }));
    }

    async function handleEditSave() {
        setEditSaving(true);
        try {
            const fd = new FormData();
            fd.append('firstName', editForm.firstName);
            fd.append('middleName', editForm.middleName);
            fd.append('lastName', editForm.lastName);
            fd.append('gender', editForm.gender);
            fd.append('dob', editForm.dob);
            fd.append('mobile', editForm.mobile);
            fd.append('email', editForm.email);
            fd.append('address', JSON.stringify({
                houseNo: editForm.houseNo, village: editForm.village,
                postOffice: editForm.postOffice, gpWard: editForm.gpWard,
                block: editForm.block, policeStation: editForm.policeStation,
                landmark: editForm.landmark, district: editForm.district,
                pinCode: editForm.pinCode, state: editForm.state
            }));
            fd.append('finance', JSON.stringify({
                bankName: editForm.bankName, branchName: editForm.branchName,
                accountNo: editForm.accountNo, ifscCode: editForm.ifscCode,
                upiId: editForm.upiId
            }));
            if (editFiles.passportPhoto) fd.append('passportPhoto', editFiles.passportPhoto);
            if (editFiles.passbookImage) fd.append('passbookImage', editFiles.passbookImage);

            const res = await fetch('http://localhost:5000/api/user/edit-profile', {
                method: 'PATCH',
                headers: { 'x-auth-token': authToken },
                body: fd
            });
            const data = await res.json();
            if (res.ok) {
                await refreshUser();
                setShowEditModal(false);
                await kasAlert('✅ Profile updated successfully!');
            } else {
                await kasAlert(data.message || 'Update failed.');
            }
        } catch {
            await kasAlert('Network error. Please try again.');
        } finally {
            setEditSaving(false);
        }
    }

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
    const StatusIcon = status.icon; // Must be capitalized — JSX requires component names to start with capital letter
    const canEdit = user.kycStatus !== 'Verified';



    return (
        <div style={{ minHeight: '100vh', background: '#F5F7F5', fontFamily: "'Inter', sans-serif", paddingBottom: '60px' }}>

            {/* ── Profile Header ─────────────────────────── */}
            <div style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', padding: '40px 20px 80px' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    {user.documents?.passportPhoto
                        ? <img src={user.documents.passportPhoto} alt="" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.5)', flexShrink: 0 }} />
                        : <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 900, color: '#fff', border: '3px solid rgba(255,255,255,0.5)', flexShrink: 0 }}>
                            {(user.name?.first || user.role || 'A')[0].toUpperCase()}
                        </div>
                    }
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', margin: '0 0 4px', fontFamily: "'Poppins', sans-serif" }}>
                            {user.name?.first || ''} {user.name?.middle || ''} {user.name?.last || user.role || ''}
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
                            <button
                                type="button"
                                onClick={() => downloadIdCard(user)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '11px 22px', borderRadius: '14px', border: '1.5px solid rgba(255,255,255,0.35)',
                                    cursor: 'pointer',
                                    background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 40%, #FCD34D 65%, #D97706 100%)',
                                    color: '#7C2D12', fontSize: '13px', fontWeight: 800,
                                    boxShadow: '0 4px 18px rgba(251,191,36,0.5), inset 0 1px 0 rgba(255,255,255,0.5)',
                                    position: 'relative', overflow: 'hidden', letterSpacing: '0.02em',
                                    transition: 'transform 0.18s, box-shadow 0.18s'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)';
                                    e.currentTarget.style.boxShadow = '0 8px 28px rgba(251,191,36,0.65), inset 0 1px 0 rgba(255,255,255,0.5)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = '';
                                    e.currentTarget.style.boxShadow = '0 4px 18px rgba(251,191,36,0.5), inset 0 1px 0 rgba(255,255,255,0.5)';
                                }}
                            >
                                <span style={{ fontSize: '17px', lineHeight: 1 }}>🪪</span>
                                <span>{t('profile.download_id')}</span>
                                <Download size={14} strokeWidth={2.5} />
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
                        { id: 'analytics', icon: Star, label: '📊 ' + t('profile.tabs.analytics') },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px',
                                border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 700, transition: 'all 0.2s',
                                background: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.15)',
                                color: activeTab === tab.id ? '#2E7D32' : '#fff',
                                backdropFilter: activeTab === tab.id ? 'none' : 'blur(4px)',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ maxWidth: '900px', margin: '-32px auto 0', padding: '0 20px' }}>
                {activeTab === 'profile' && (
                    <>
                        {/* ── KYC Status Banner ─────────────────────── */}
                        <div style={{ background: status.bg, border: `2px solid ${status.border}`, borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <StatusIcon size={28} color={status.color} strokeWidth={2} style={{ flexShrink: 0, marginTop: '2px' }} />
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

                        <SectionCard icon={User} title={t('profile.identity_title')} editSection openEditModal={openEditModal}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0 40px' }}>
                                <div>
                                    <Row label={t('profile.identity.name')} value={`${user.name?.first || ''} ${user.name?.middle || ''} ${user.name?.last || ''}`.trim() || user.role} />
                                    <Row label={t('profile.identity.gender')} value={user.gender} />
                                    <Row label={t('profile.identity.aadhaar')} value={maskAadhaar(user.aadhaarNo)} />
                                </div>
                                <div>
                                    <Row label={t('profile.identity.mobile')} value={user.mobile ? `+91 ${user.mobile}` : '—'} />
                                    <Row label={t('profile.identity.email')} value={user.email} />
                                    <Row label={t('profile.identity.role')} value={user.role} />
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard icon={MapPin} title={t('profile.address_title')} editSection openEditModal={openEditModal}>
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

                        <SectionCard icon={Building2} title="Bank & Payments" editSection openEditModal={openEditModal}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0 40px' }}>
                                <div>
                                    <Row label="Bank Name" value={user.finance?.bankName} />
                                    <Row label="Account No." value={user.finance?.accountNo ? maskAccount(user.finance.accountNo) : '—'} />
                                    <Row label="IFSC Code" value={user.finance?.ifscCode} />
                                </div>
                                <div>
                                    <Row label="Branch Name" value={user.finance?.branchName} />
                                    <Row label="UPI ID" value={user.finance?.upiId} />
                                </div>
                            </div>

                            {/* ── QR Code section ── */}
                            <div style={{ marginTop: '20px', borderTop: '1px solid #F3F4F6', paddingTop: '20px', display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
                                {/* Thumbnail */}
                                <div
                                    onClick={() => !qrUploading && qrFileRef.current?.click()}
                                    style={{
                                        width: '130px', height: '130px', borderRadius: '14px', flexShrink: 0,
                                        border: `2px dashed ${(qrPreview || user.finance?.qrCodeUrl) ? '#2E7D32' : '#D1D5DB'}`,
                                        background: (qrPreview || user.finance?.qrCodeUrl) ? '#F0FDF4' : '#F9FAFB',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: qrUploading ? 'wait' : 'pointer', overflow: 'hidden', position: 'relative'
                                    }}
                                >
                                    {(qrPreview || user.finance?.qrCodeUrl) ? (
                                        <img
                                            src={qrPreview || user.finance.qrCodeUrl}
                                            alt="QR Code"
                                            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px', boxSizing: 'border-box' }}
                                        />
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '10px' }}>
                                            <QrCode size={36} color="#9CA3AF" style={{ margin: '0 auto 6px' }} />

                                            {user.finance?.upiId ? (
                                                <div style={{ textAlign: 'center' }}>
                                                    <img
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('upi://pay?pa=' + user.finance.upiId + '&pn=' + encodeURIComponent([user.name?.first, user.name?.last].filter(Boolean).join(' ') || 'User') + '&cu=INR')}`}
                                                        alt="Auto UPI QR"
                                                        style={{ width: '80px', height: '80px', borderRadius: '8px', border: '2px solid #E5E7EB', padding: '3px', background: '#fff' }}
                                                    />
                                                    <p style={{ fontSize: '10px', color: '#10B981', margin: '6px 0 0', fontWeight: 700 }}>Auto-generated</p>
                                                </div>
                                            ) : (
                                                <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>No QR uploaded</p>
                                            )}
                                        </div>
                                    )}
                                    {qrUploading && (
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <RefreshCw size={24} color="#2E7D32" className="animate-spin" />
                                        </div>
                                    )}
                                </div>

                                {/* Info + button */}
                                <div style={{ flex: 1, minWidth: '180px' }}>
                                    <p style={{ fontSize: '13px', fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>📷 UPI Payment QR Code</p>
                                    <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 14px', lineHeight: 1.5 }}>
                                        Upload your PhonePe / GPay / Paytm QR image so renters can pay you easily.
                                    </p>
                                    <input
                                        ref={qrFileRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={handleQrUpload}
                                    />
                                    <button
                                        disabled={qrUploading}
                                        onClick={() => qrFileRef.current?.click()}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                                            padding: '10px 20px', borderRadius: '10px', border: 'none',
                                            background: qrUploading ? '#E5E7EB' : 'linear-gradient(135deg, #2E7D32, #388E3C)',
                                            color: qrUploading ? '#9CA3AF' : '#fff',
                                            fontWeight: 700, fontSize: '13px', cursor: qrUploading ? 'wait' : 'pointer',
                                            boxShadow: qrUploading ? 'none' : '0 4px 14px rgba(46,125,50,0.3)'
                                        }}
                                    >
                                        <QrCode size={15} />
                                        {qrUploading ? 'Uploading…' : user.finance?.qrCodeUrl ? 'Update QR Code' : 'Upload QR Code'}
                                    </button>
                                    {(qrPreview || user.finance?.qrCodeUrl) && (
                                        <p style={{ fontSize: '11px', color: '#15803D', marginTop: '8px', fontWeight: 600 }}>✅ QR uploaded — click to update</p>
                                    )}
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard icon={FileText} title={t('profile.documents_title')}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                                <DocBox label={t('profile.documents.photo')} url={user.documents?.passportPhoto} icon={User} />
                                <DocBox label={t('profile.documents.aadhaar_f')} url={user.documents?.aadhaarImage} icon={ShieldCheck} />
                                <DocBox label={t('profile.documents.aadhaar_b')} url={user.documents?.voterIdImage} icon={ShieldCheck} />
                                <DocBox label="Bank Passbook" url={user.documents?.passbookImage} icon={Building2} />
                                {user.finance?.qrCodeUrl && (
                                    <DocBox label="UPI QR Code" url={user.finance.qrCodeUrl} icon={QrCode} />
                                )}
                            </div>
                        </SectionCard>

                    </>
                )}

                {/* ── EDIT PROFILE MODAL ───────────────────────────────── */}
                {showEditModal && (
                    <div
                        onClick={e => e.target === e.currentTarget && setShowEditModal(false)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto', backdropFilter: 'blur(4px)' }}
                    >
                        <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '720px', boxShadow: '0 24px 80px rgba(0,0,0,0.35)', overflow: 'hidden', marginBottom: '20px' }}>

                            {/* Modal Header */}
                            <div style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Edit3 size={20} color="#fff" />
                                    </div>
                                    <div>
                                        <p style={{ color: '#fff', fontWeight: 800, fontSize: '18px', margin: 0 }}>Edit Profile</p>
                                        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', margin: 0 }}>Aadhaar Number &amp; ID documents are locked for security</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowEditModal(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                            </div>

                            <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

                                {/* ── Section: Personal Info ── */}
                                <div>
                                    <p style={{ fontSize: '12px', fontWeight: 800, color: '#2E7D32', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <User size={13} /> Personal Information
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                        {[['firstName', 'First Name'], ['middleName', 'Middle Name'], ['lastName', 'Last Name']].map(([k, lbl]) => (
                                            <div key={k}>
                                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: '4px' }}>{lbl}</label>
                                                <input value={editForm[k]} onChange={e => setEF(k, e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = '#2E7D32'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '12px' }}>
                                        <div>
                                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Gender</label>
                                            <select value={editForm.gender} onChange={e => setEF('gender', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', background: '#F9FAFB' }}>
                                                <option value="">Select...</option>
                                                <option>Male</option><option>Female</option><option>Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Date of Birth</label>
                                            <input type="date" value={editForm.dob} onChange={e => setEF('dob', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Aadhaar No. <span style={{ color: '#EF4444' }}>🔒 Locked</span></label>
                                            <input value={maskAadhaar(user.aadhaarNo)} disabled style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', background: '#F3F4F6', color: '#9CA3AF', boxSizing: 'border-box', cursor: 'not-allowed' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                                        {[['mobile', 'Mobile Number'], ['email', 'Email Address']].map(([k, lbl]) => (
                                            <div key={k}>
                                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: '4px' }}>{lbl}</label>
                                                <input type={k === 'email' ? 'email' : 'text'} value={editForm[k]} onChange={e => setEF(k, e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = '#2E7D32'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ── Section: Address ── */}
                                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '24px' }}>
                                    <p style={{ fontSize: '12px', fontWeight: 800, color: '#2E7D32', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MapPin size={13} /> Residential Address
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                        {[['houseNo', 'House / Plot No.'], ['village', 'Village / Town'], ['postOffice', 'Post Office'], ['gpWard', 'GP / Ward No.'], ['block', 'Block / Taluka'], ['policeStation', 'Police Station'], ['landmark', 'Landmark'], ['district', 'District'], ['pinCode', 'PIN Code']].map(([k, lbl]) => (
                                            <div key={k}>
                                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: '4px' }}>{lbl}</label>
                                                <input value={editForm[k]} onChange={e => setEF(k, e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = '#2E7D32'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                                            </div>
                                        ))}
                                        <div>
                                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: '4px' }}>State</label>
                                            <input value={editForm.state} onChange={e => setEF('state', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = '#2E7D32'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                                        </div>
                                    </div>
                                </div>

                                {/* ── Section: Bank & Payments ── */}
                                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '24px' }}>
                                    <p style={{ fontSize: '12px', fontWeight: 800, color: '#2E7D32', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Building2 size={13} /> Bank & Payments
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                        {[['bankName', 'Bank Name'], ['branchName', 'Branch Name'], ['accountNo', 'Account Number'], ['ifscCode', 'IFSC Code'], ['upiId', 'UPI ID']].map(([k, lbl]) => (
                                            <div key={k}>
                                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: '4px' }}>{lbl}</label>
                                                <input value={editForm[k]} onChange={e => setEF(k, e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = '#2E7D32'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ── Section: Documents ── */}
                                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '24px' }}>
                                    <p style={{ fontSize: '12px', fontWeight: 800, color: '#2E7D32', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FileText size={13} /> Documents
                                    </p>
                                    <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 14px' }}>Aadhaar Card &amp; Voter ID are locked. You can update Passport Photo and Bank Passbook.</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                                        {/* Passport Photo — editable */}
                                        {[{ k: 'passportPhoto', ref: editPassportRef, label: 'Passport Photo', current: user.documents?.passportPhoto },
                                        { k: 'passbookImage', ref: editPassbookRef, label: 'Bank Passbook', current: user.documents?.passbookImage }].map(({ k, ref, label, current }) => (
                                            <div key={k} onClick={() => ref.current?.click()} style={{ border: `2px dashed ${editPreviews[k] ? '#2E7D32' : '#D1D5DB'}`, borderRadius: '12px', padding: '16px', textAlign: 'center', cursor: 'pointer', background: editPreviews[k] ? '#F0FDF4' : '#F9FAFB', transition: 'all 0.2s' }}>
                                                <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleEditFile(k, e, ref)} />
                                                {(editPreviews[k] || current) ? (
                                                    <img src={editPreviews[k] || current} alt={label} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', margin: '0 auto 6px', display: 'block' }} />
                                                ) : (
                                                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                                                        <FileText size={20} color="#9CA3AF" />
                                                    </div>
                                                )}
                                                <p style={{ fontSize: '11px', fontWeight: 700, color: editPreviews[k] ? '#15803D' : '#6B7280', margin: 0 }}>{editPreviews[k] ? '✅ ' : ''}{label}</p>
                                                <p style={{ fontSize: '10px', color: '#9CA3AF', margin: '2px 0 0' }}>{editPreviews[k] ? 'New image selected' : current ? 'Click to update' : 'Click to upload'}</p>
                                            </div>
                                        ))}
                                        {/* Aadhaar — locked */}
                                        {[{ label: 'Aadhaar Card', url: user.documents?.aadhaarImage }, { label: 'Voter ID', url: user.documents?.voterIdImage }].map(({ label, url }) => (
                                            <div key={label} style={{ border: '2px dashed #E5E7EB', borderRadius: '12px', padding: '16px', textAlign: 'center', background: '#F9FAFB', opacity: 0.6 }}>
                                                {url ? <img src={url} alt={label} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', margin: '0 auto 6px', display: 'block' }} />
                                                    : <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}><ShieldCheck size={20} color="#9CA3AF" /></div>}
                                                <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', margin: 0 }}>{label}</p>
                                                <p style={{ fontSize: '10px', color: '#EF4444', margin: '2px 0 0', fontWeight: 700 }}>🔒 Locked</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ── Save Button ── */}
                                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button onClick={() => setShowEditModal(false)} style={{ padding: '12px 24px', borderRadius: '12px', border: '1.5px solid #E5E7EB', background: '#F9FAFB', color: '#6B7280', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                                    <button
                                        disabled={editSaving}
                                        onClick={handleEditSave}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 32px', borderRadius: '12px', border: 'none', background: editSaving ? '#9CA3AF' : 'linear-gradient(135deg, #2E7D32, #388E3C)', color: '#fff', fontWeight: 800, fontSize: '14px', cursor: editSaving ? 'wait' : 'pointer', boxShadow: editSaving ? 'none' : '0 4px 18px rgba(46,125,50,0.4)' }}
                                    >
                                        {editSaving ? <><RefreshCw size={16} className="animate-spin" /> Saving…</> : <><CheckCircle2 size={16} /> Save Changes</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── 🔐 Security & Login Section ─────────────── */}
                {activeTab === 'profile' && (
                    <SecuritySection user={user} authToken={authToken} refreshUser={refreshUser} 
                    onAccountDeleted={() => { logout?.(); navigate('/'); }}
                />
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
                                <div key={b._id} style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                                    {/* ── Card Header ── */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E7D32' }}>
                                                <Tractor size={32} />
                                            </div>
                                            <div>
                                                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>{b.equipment?.name || '—'}</h4>
                                                <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>{formatDate(b.rentalDates?.start)} → {formatDate(b.rentalDates?.end)}</p>
                                                {b.status === 'Rental_Started' && (() => {
                                                    const start = new Date(b.rentalDates?.start);
                                                    const end = new Date(b.rentalDates?.end);
                                                    const total = Math.max(1, Math.ceil((end - start) / 86400000));
                                                    const current = Math.min(total, Math.max(1, Math.ceil((Date.now() - start) / 86400000)));
                                                    return <span style={{ display: 'inline-block', marginTop: '4px', background: '#FEF3C7', color: '#92400E', fontSize: '11px', fontWeight: 800, padding: '2px 10px', borderRadius: '99px' }}>📅 Day {current} of {total}</span>;
                                                })()}
                                                <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#E0F2F1', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, color: '#00695C' }}>
                                                    <Zap size={12} /> {t('profile.rentals.token')}: {b.handoverToken}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <p style={{ fontSize: '16px', fontWeight: 900, color: '#2E7D32', margin: '0 0 4px' }}>₹{(b.totalAmount || 0).toLocaleString()}</p>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                {b.status === 'Completed' && (
                                                    <button
                                                        onClick={() => { setSelectedBooking(b); setShowReviewModal(true); }}
                                                        style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #2E7D32', background: 'transparent', color: '#2E7D32', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                                    >
                                                        ⭐ {t('profile.rentals.rate_machine')}
                                                    </button>
                                                )}
                                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', background: b.status === 'Completed' ? '#F0FDF4' : b.status === 'Rental_Started' ? '#E0F2F1' : '#FFFBEB', color: b.status === 'Completed' ? '#15803D' : b.status === 'Rental_Started' ? '#00796B' : '#92400E' }}>
                                                    {b.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Geo-Tagged Photo Upload (only for Rental_Started) ── */}
                                    {b.status === 'Rental_Started' && (
                                        <GeoPhotoUploader bookingId={b._id} existingPhotos={b.rentalPhotos || []} authToken={authToken} onUploaded={fetchDashboardData} />
                                    )}

                                    {/* ── Cancel Booking Panel (only for Confirmed) ── */}
                                    {b.status === 'Confirmed' && (
                                        <div style={{ marginTop: '14px', borderTop: '1px solid #FEE2E2', paddingTop: '14px' }}>
                                            <button
                                                onClick={async () => {
                                                    const reason = await kasPrompt('Reason for cancellation (optional — press OK to confirm):');
                                                    if (reason === null) return; // user pressed Cancel in prompt
                                                    const res = await fetch(`http://localhost:5000/api/bookings/${b._id}/cancel`, {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json', 'x-auth-token': authToken },
                                                        body: JSON.stringify({ reason: reason || 'Cancelled by renter' })
                                                    });
                                                    const data = await res.json();
                                                    if (res.ok) { fetchDashboardData(); }
                                                    else { await kasAlert(data.message || 'Cancellation failed.'); }
                                                }}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #FCA5A5', background: '#FFF7F7', color: '#DC2626', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                                            >
                                                ✕ Cancel Booking
                                            </button>
                                        </div>
                                    )}

                                    {/* ── Return Confirmation Panel (Rental_Started only) ── */}
                                    {b.status === 'Rental_Started' && (
                                        <div style={{ marginTop: '14px', borderTop: '1px solid #F3F4F6', paddingTop: '14px' }}>
                                            {b.returnConfirmedByRenter ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '10px', padding: '10px 14px' }}>
                                                    <span style={{ fontSize: '16px' }}>✅</span>
                                                    <div>
                                                        <p style={{ fontSize: '12px', fontWeight: 800, color: '#15803D', margin: 0 }}>You confirmed equipment return</p>
                                                        <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>{new Date(b.returnConfirmedAt).toLocaleString('en-IN')}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={async () => {
                                                        const confirmed = await kasPrompt('Confirm that you have physically returned the equipment to the lender? (Type YES to confirm)');
                                                        if (!confirmed || confirmed.trim().toLowerCase() !== 'yes') return;
                                                        const res = await fetch(`http://localhost:5000/api/bookings/${b._id}/confirm-return`, {
                                                            method: 'PATCH', headers: { 'x-auth-token': authToken }
                                                        });
                                                        if (res.ok) { fetchDashboardData(); }
                                                        else { const d = await res.json(); await kasAlert(d.message || 'Failed.'); }
                                                    }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1D4ED8', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}
                                                >
                                                    🏁 I've Returned the Equipment
                                                </button>
                                            )}
                                            {/* Damage report warning */}
                                            {b.damageReport?.filed && (
                                                <div style={{ marginTop: '10px', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '10px', padding: '10px 14px' }}>
                                                    <p style={{ fontSize: '12px', fontWeight: 800, color: '#92400E', margin: '0 0 4px' }}>⚠️ Lender filed a {b.damageReport.severity} Damage Report</p>
                                                    <p style={{ fontSize: '11px', color: '#78350F', margin: 0 }}>{b.damageReport.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ── Completed: show proof photos + damage report if any ── */}
                                    {b.status === 'Completed' && (b.rentalPhotos?.length > 0 || b.damageReport?.filed) && (
                                        <div style={{ marginTop: '16px', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
                                            {b.rentalPhotos?.length > 0 && (
                                                <>
                                                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', marginBottom: '8px' }}>📸 RENTAL PROOF PHOTOS ({b.rentalPhotos.length})</p>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: b.damageReport?.filed ? '12px' : 0 }}>
                                                        {b.rentalPhotos.map((ph, i) => (
                                                            <img key={i} src={ph.url} alt={`proof-${i}`} onClick={() => window.open(ph.url, '_blank')} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px', cursor: 'zoom-in', border: '2px solid #E5E7EB' }} />
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                            {b.damageReport?.filed && (
                                                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '10px 14px' }}>
                                                    <p style={{ fontSize: '12px', fontWeight: 800, color: '#991B1B', margin: '0 0 4px' }}>⚠️ Damage Report — {b.damageReport.severity}</p>
                                                    <p style={{ fontSize: '11px', color: '#7F1D1D', margin: 0 }}>{b.damageReport.description}</p>
                                                    {b.damageReport.photos?.length > 0 && (
                                                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                                                            {b.damageReport.photos.map((ph, i) => (
                                                                <img key={i} src={ph.url} alt={`dmg-${i}`} onClick={() => window.open(ph.url, '_blank')} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', cursor: 'zoom-in', border: '2px solid #FECACA' }} />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
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
                                    <p style={{ fontSize: '24px', fontWeight: 900 }}>{lenderRentals.filter(r => r.status === 'Confirmed' || r.status === 'Rental_Started').length}</p>
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
                                                    <p style={{ fontSize: '14px', fontWeight: 800, color: '#111827', margin: 0 }}>{r.renter?.name?.first} {r.renter?.name?.last}</p>
                                                    <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>{r.renter?.mobile} · {r.equipment?.name}</p>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '999px', background: r.status === 'Rental_Started' ? '#E0F2F1' : '#F9FAFB', color: r.status === 'Rental_Started' ? '#00796B' : '#6B7280' }}>
                                                {r.status.toUpperCase()}
                                            </span>
                                        </div>

                                        {['Confirmed', 'Lender_Paid', 'Admin_Paid_Pending', 'Admin_Approved'].includes(r.status) ? (
                                            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                                                {/* ── Renter Details ── */}
                                                <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <p style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>👤 Renter Details</p>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                        <div>
                                                            <p style={{ fontSize: '10px', color: '#9CA3AF', margin: '0 0 2px' }}>Full Name</p>
                                                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: 0 }}>{r.renter?.name?.first} {r.renter?.name?.middle || ''} {r.renter?.name?.last}</p>
                                                        </div>
                                                        <div>
                                                            <p style={{ fontSize: '10px', color: '#9CA3AF', margin: '0 0 2px' }}>Mobile</p>
                                                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: 0 }}>{r.renter?.mobile || '—'}</p>
                                                        </div>
                                                        <div>
                                                            <p style={{ fontSize: '10px', color: '#9CA3AF', margin: '0 0 2px' }}>Email</p>
                                                            <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', margin: 0 }}>{r.renter?.email || '—'}</p>
                                                        </div>
                                                        <div>
                                                            <p style={{ fontSize: '10px', color: '#9CA3AF', margin: '0 0 2px' }}>Village / District</p>
                                                            <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', margin: 0 }}>{[r.renter?.address?.village, r.renter?.address?.district].filter(Boolean).join(', ') || '—'}</p>
                                                        </div>
                                                        {r.renter?.address?.state && (
                                                            <div>
                                                                <p style={{ fontSize: '10px', color: '#9CA3AF', margin: '0 0 2px' }}>State</p>
                                                                <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', margin: 0 }}>{r.renter?.address?.state}</p>
                                                            </div>
                                                        )}
                                                        {r.renter?.address?.pincode && (
                                                            <div>
                                                                <p style={{ fontSize: '10px', color: '#9CA3AF', margin: '0 0 2px' }}>Pincode</p>
                                                                <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', margin: 0 }}>{r.renter?.address?.pincode}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* ── Bank / Payment Details ── */}
                                                {r.renter?.finance?.bankAccount?.accountNumber && (
                                                    <div style={{ background: '#EFF6FF', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <p style={{ fontSize: '11px', fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>🏦 Bank Details</p>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                            <div>
                                                                <p style={{ fontSize: '10px', color: '#93C5FD', margin: '0 0 2px' }}>Account No.</p>
                                                                <p style={{ fontSize: '13px', fontWeight: 700, color: '#1E3A5F', margin: 0 }}>{r.renter?.finance?.bankAccount?.accountNumber}</p>
                                                            </div>
                                                            <div>
                                                                <p style={{ fontSize: '10px', color: '#93C5FD', margin: '0 0 2px' }}>IFSC</p>
                                                                <p style={{ fontSize: '13px', fontWeight: 700, color: '#1E3A5F', margin: 0 }}>{r.renter?.finance?.bankAccount?.ifsc || '—'}</p>
                                                            </div>
                                                            <div>
                                                                <p style={{ fontSize: '10px', color: '#93C5FD', margin: '0 0 2px' }}>Bank Name</p>
                                                                <p style={{ fontSize: '12px', fontWeight: 600, color: '#1E3A5F', margin: 0 }}>{r.renter?.finance?.bankAccount?.bankName || '—'}</p>
                                                            </div>
                                                            {r.renter?.finance?.upiId && (
                                                                <div style={{ gridColumn: '1 / -1' }}>
                                                                    <p style={{ fontSize: '10px', color: '#93C5FD', margin: '0 0 4px' }}>UPI ID</p>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#1E3A5F', margin: 0 }}>{r.renter?.finance?.upiId}</p>
                                                                        <img
                                                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('upi://pay?pa=' + r.renter.finance.upiId + '&pn=' + encodeURIComponent([r.renter.name?.first, r.renter.name?.last].filter(Boolean).join(' ') || 'Renter') + '&cu=INR')}`}
                                                                            alt="Renter UPI QR"
                                                                            style={{ width: '80px', height: '80px', borderRadius: '8px', border: '2px solid #BFDBFE', background: '#fff', padding: '3px', boxSizing: 'border-box' }}
                                                                            onError={e => { e.target.style.display = 'none'; }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* ── Payment Breakdown ── */}
                                                <div style={{ background: '#F0FDF4', borderRadius: '12px', padding: '14px' }}>
                                                    <p style={{ fontSize: '11px', fontWeight: 800, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>💰 Payment Breakdown</p>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                        {[
                                                            { label: 'Equipment', value: r.equipment?.name },
                                                            { label: 'Rental Dates', value: `${formatDate(r.rentalDates?.start)} → ${formatDate(r.rentalDates?.end)}` },
                                                            { label: 'Price/hr', value: `₹${(r.equipment?.priceHr || 0).toLocaleString('en-IN')}` },
                                                            { label: 'Purpose', value: r.purpose || '—' },
                                                        ].map(({ label, value }) => (
                                                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                                                <span style={{ color: '#6B7280' }}>{label}</span>
                                                                <span style={{ fontWeight: 600, color: '#111827' }}>{value}</span>
                                                            </div>
                                                        ))}
                                                        <div style={{ borderTop: '1px solid #BBF7D0', marginTop: '6px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#15803D' }}>Total Amount</span>
                                                            <span style={{ fontSize: '16px', fontWeight: 900, color: '#15803D' }}>₹{(r.totalAmount || 0).toLocaleString('en-IN')}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#7C3AED', margin: 0 }}>🔑 {t('profile.lender.ask_token')}</p>
                                                    <button
                                                        onClick={async () => {
                                                            const tok = await kasPrompt('Enter the 6-digit Handover Token from Renter:');
                                                            if (tok) {
                                                                fetch('http://localhost:5000/api/bookings/verify-handover', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json', 'x-auth-token': authToken },
                                                                    body: JSON.stringify({ bookingId: r._id, enteredToken: tok })
                                                                }).then(async res => res.ok ? fetchDashboardData() : await kasAlert('Invalid Token. Please check and try again.'));
                                                            }
                                                        }}
                                                        style={{ background: '#2E7D32', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                                                    >
                                                        ✅ {t('profile.lender.verify_start')}
                                                    </button>
                                                </div>


                                                {/* ── Cancel (Lender) ── */}
                                                <button
                                                    onClick={async () => {
                                                        const reason = await kasPrompt('Reason for cancellation (optional — press OK to confirm):');
                                                        if (reason === null) return;
                                                        const res = await fetch(`http://localhost:5000/api/bookings/${r._id}/cancel`, {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json', 'x-auth-token': authToken },
                                                            body: JSON.stringify({ reason: reason || 'Cancelled by lender' })
                                                        });
                                                        const data = await res.json();
                                                        if (res.ok) { fetchDashboardData(); }
                                                        else { await kasAlert(data.message || 'Cancellation failed.'); }
                                                    }}
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #FCA5A5', background: '#FFF7F7', color: '#DC2626', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                                                >
                                                    ✕ Cancel This Booking
                                                </button>

                                                {/* ── Download Bill ── */}
                                                <button
                                                    onClick={() => generateLenderBill(r, authToken)}
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #2E7D32, #388E3C)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(46,125,50,0.3)' }}
                                                >
                                                    <Download size={15} /> 📄 Download Bill PDF
                                                </button>
                                            </div>

                                        ) : r.status === 'Rental_Started' ? (
                                            <div style={{ background: '#F0FDF4', borderRadius: '12px', padding: '12px' }}>
                                                {/* ── Day counter + Return Status ── */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontSize: '13px', fontWeight: 700 }}>
                                                        <ShieldCheck size={16} /> {t('profile.lender.started_success')}
                                                        {(() => {
                                                            const start = new Date(r.rentalDates?.start);
                                                            const end = new Date(r.rentalDates?.end);
                                                            const total = Math.max(1, Math.ceil((end - start) / 86400000));
                                                            const current = Math.min(total, Math.max(1, Math.ceil((Date.now() - start) / 86400000)));
                                                            return <span style={{ marginLeft: '8px', background: '#FEF3C7', color: '#92400E', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '99px' }}>📅 Day {current}/{total}</span>;
                                                        })()}
                                                    </div>
                                                    {/* Return Status Badge */}
                                                    {r.returnConfirmedByRenter ? (
                                                        <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            ✅ Renter confirmed return · {new Date(r.returnConfirmedAt).toLocaleDateString('en-IN')}
                                                        </span>
                                                    ) : (
                                                        <span style={{ background: '#FEF9C3', color: '#854D0E', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '999px' }}>
                                                            ⏳ Awaiting renter return confirmation
                                                        </span>
                                                    )}
                                                </div>

                                                {/* ── Renter's uploaded proof photos ── */}
                                                {r.rentalPhotos?.length > 0 ? (
                                                    <div style={{ borderTop: '1px solid #BBF7D0', paddingTop: '10px', marginBottom: '12px' }}>
                                                        <p style={{ fontSize: '11px', fontWeight: 700, color: '#15803D', marginBottom: '8px' }}>📸 Proof Photos from Renter ({r.rentalPhotos.length})</p>
                                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                            {r.rentalPhotos.map((ph, i) => {
                                                                const start = new Date(r.rentalDates?.start);
                                                                const dayNum = Math.max(1, Math.ceil((new Date(ph.takenAt) - start) / 86400000));
                                                                return (
                                                                    <div key={i} style={{ position: 'relative' }}>
                                                                        <img src={ph.url} alt={`proof-${i}`} onClick={() => window.open(ph.url, '_blank')}
                                                                            style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '10px', cursor: 'zoom-in', border: '2px solid #BBF7D0', display: 'block' }} />
                                                                        <span style={{ position: 'absolute', bottom: '2px', left: '3px', fontSize: '8px', color: '#fff', background: 'rgba(0,0,0,0.6)', borderRadius: '3px', padding: '1px 4px', fontWeight: 700 }}>Day {dayNum}</span>
                                                                        <span style={{ position: 'absolute', top: '2px', right: '3px', fontSize: '8px', color: '#fff', background: 'rgba(46,125,50,0.8)', borderRadius: '3px', padding: '1px 4px' }}>{new Date(ph.takenAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p style={{ fontSize: '11px', color: '#6B7280', margin: '0 0 12px', fontStyle: 'italic' }}>⏳ No proof photos uploaded by renter yet.</p>
                                                )}

                                                {/* ── Damage Report Section ── */}
                                                {r.damageReport?.filed ? (
                                                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px' }}>
                                                        <p style={{ fontSize: '12px', fontWeight: 800, color: '#991B1B', margin: '0 0 4px' }}>⚠️ Damage Report Filed — {r.damageReport.severity}</p>
                                                        <p style={{ fontSize: '11px', color: '#7F1D1D', margin: 0 }}>{r.damageReport.description}</p>
                                                        {r.damageReport.photos?.length > 0 && (
                                                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                                                                {r.damageReport.photos.map((ph, i) => (
                                                                    <img key={i} src={ph.url} alt={`dmg-${i}`} onClick={() => window.open(ph.url, '_blank')} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', cursor: 'zoom-in', border: '2px solid #FECACA' }} />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <DamageReportForm bookingId={r._id} authToken={authToken} onReported={fetchDashboardData} />
                                                )}

                                                {/* ── Mark as Complete ── */}
                                                <button
                                                    onClick={async () => {
                                                        const confirmMsg = r.damageReport?.filed
                                                            ? 'Complete this rental with an active damage report?'
                                                            : 'Mark this rental as Completed? The equipment will become available again.';
                                                        const ok = await kasPrompt(`${confirmMsg} (Type YES to confirm)`);
                                                        if (!ok || ok.trim().toLowerCase() !== 'yes') return;
                                                        fetch(`http://localhost:5000/api/bookings/${r._id}/complete`, {
                                                            method: 'PATCH',
                                                            headers: { 'x-auth-token': authToken }
                                                        }).then(async res => res.ok ? fetchDashboardData() : await kasAlert('Failed to complete booking.'));
                                                    }}
                                                    style={{ background: r.damageReport?.filed ? '#B91C1C' : '#2E7D32', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', width: '100%', marginTop: '4px' }}
                                                >
                                                    {r.damageReport?.filed ? '⚠️ Complete with Damage Report' : '✅ Mark as Complete'}
                                                </button>
                                            </div>
                                        ) : r.status === 'Completed' ? (
                                            <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '12px' }}>
                                                {/* Download bill for completed rentals */}
                                                <button
                                                    onClick={() => generateLenderBill(r, authToken)}
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #2E7D32, #388E3C)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(46,125,50,0.3)', marginBottom: '12px' }}
                                                >
                                                    <Download size={15} /> 📄 Download Bill PDF
                                                </button>
                                                {r.rentalPhotos?.length > 0 && (
                                                    <>
                                                        <p style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>📸 Rental Proof Photos ({r.rentalPhotos.length})</p>
                                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: r.damageReport?.filed ? '12px' : 0 }}>
                                                            {r.rentalPhotos.map((ph, i) => {
                                                                const start = new Date(r.rentalDates?.start);
                                                                const dayNum = Math.max(1, Math.ceil((new Date(ph.takenAt) - start) / 86400000));
                                                                return (
                                                                    <div key={i} style={{ position: 'relative' }}>
                                                                        <img src={ph.url} alt={`proof-${i}`} onClick={() => window.open(ph.url, '_blank')}
                                                                            style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '10px', cursor: 'zoom-in', border: '2px solid #E5E7EB', display: 'block' }} />
                                                                        <span style={{ position: 'absolute', bottom: '2px', left: '3px', fontSize: '8px', color: '#fff', background: 'rgba(0,0,0,0.6)', borderRadius: '3px', padding: '1px 4px', fontWeight: 700 }}>Day {dayNum}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </>
                                                )}
                                                {r.damageReport?.filed && (
                                                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '10px 14px' }}>
                                                        <p style={{ fontSize: '11px', fontWeight: 800, color: '#991B1B', margin: '0 0 4px' }}>⚠️ Damage Report — {r.damageReport.severity}</p>
                                                        <p style={{ fontSize: '11px', color: '#7F1D1D', margin: 0 }}>{r.damageReport.description}</p>
                                                    </div>
                                                )}
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

            {/* ── Review Modal ───────────────────────────────── */}
            {
                showReviewModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '450px', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>{t('profile.rentals.review_modal.title')}</h3>
                            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                                {t('profile.rentals.review_modal.desc').replace('{machine}', selectedBooking?.equipment?.name || selectedBooking?.equipmentId?.name || 'this equipment')}
                            </p>

                            <form onSubmit={submitReview}>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                        >
                                            <Star size={36} fill={star <= rating ? '#FBBF24' : 'none'} color={star <= rating ? '#FBBF24' : '#D1D5DB'} strokeWidth={2} />
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={t('profile.rentals.review_modal.placeholder')}
                                    style={{ width: '100%', height: '100px', borderRadius: '12px', border: '1px solid #D1D5DB', padding: '12px', fontSize: '14px', resize: 'none', marginBottom: '24px', outline: 'none' }}
                                    onFocus={e => e.target.style.borderColor = '#2E7D32'}
                                    onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                                />

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowReviewModal(false)}
                                        style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', background: '#fff', color: '#4B5563', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        {t('profile.rentals.review_modal.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingReview}
                                        style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#2E7D32', color: '#fff', fontWeight: 700, cursor: submittingReview ? 'not-allowed' : 'pointer', opacity: submittingReview ? 0.7 : 1 }}
                                    >
                                        {submittingReview ? t('profile.rentals.review_modal.submitting') : t('profile.rentals.review_modal.submit')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* ══ ANALYTICS TAB ════════════════ */}
            {activeTab === 'analytics' && (
                <div style={{ maxWidth: '900px', margin: '0 auto', paddingTop: '32px', paddingLeft: '16px', paddingRight: '16px' }}>
                    <UserAnalytics authToken={authToken} userName={[user?.name?.first, user?.name?.last].filter(Boolean).join(' ') || user?.role || 'User'} />
                </div>
            )}

        </div >
    );
}
