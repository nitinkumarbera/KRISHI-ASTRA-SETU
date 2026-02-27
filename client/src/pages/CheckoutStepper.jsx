/**
 * CheckoutStepper.jsx
 * ─────────────────────────────────────────────────────────────
 * 3-Step Payment Flow for the Renter after booking is created.
 *
 * Step 1 → Pay Lender (UPI), upload Screenshot #1
 * Step 2 → View 6-digit Handover Code + Download PDF
 * Step 3 → Pay Platform Fee + GST to Admin UPI, upload Screenshot #2
 *
 * Route: /checkout/:bookingId
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    CheckCircle2, Upload, Download, Copy, ArrowRight,
    ArrowLeft, IndianRupee, ShieldCheck, Zap, RefreshCw,
    AlertTriangle, Eye, Building2, QrCode
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { kasAlert } from '../components/KasDialog';
import jsPDF from 'jspdf';
import _autoTable from 'jspdf-autotable';

const autoTable = typeof _autoTable === 'function' ? _autoTable : (_autoTable?.default ?? _autoTable);

// ── Admin bank/UPI details (hardcoded per brief) ────────────
const ADMIN_UPI = 'nkbera04-2@okhdfcbank';
const ADMIN_NAME = 'Nitin Kumar Nobo Kumar Bera';
const ADMIN_BANK = 'Union Bank Of India';
const ADMIN_ACC = '04552 20100 02476';
const ADMIN_IFSC = 'UBIN0904554';

// ── Helpers ──────────────────────────────────────────────────
function fmt(n) { return `₹${Number(n || 0).toLocaleString('en-IN')}`; }
function formatDate(d) {
    return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
}

// ────────────────────────────────────────────────────────────
// Step Indicator (module-level to avoid Illegal constructor)
// ────────────────────────────────────────────────────────────
function StepBubble({ num, label, active, done }) {
    const bg = done ? '#16a34a' : active ? '#2E7D32' : '#E5E7EB';
    const clr = (done || active) ? '#fff' : '#9CA3AF';
    const lClr = done ? '#16a34a' : active ? '#111827' : '#9CA3AF';
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{
                width: '40px', height: '40px', borderRadius: '50%', background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '15px', fontWeight: 900, color: clr,
                boxShadow: active ? '0 0 0 4px rgba(46,125,50,0.2)' : 'none',
                transition: 'all 0.3s'
            }}>
                {done ? <CheckCircle2 size={20} /> : num}
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: lClr, textAlign: 'center', maxWidth: '80px' }}>{label}</span>
        </div>
    );
}

function StepLine({ done }) {
    return (
        <div style={{
            flex: 1, height: '3px', borderRadius: '2px',
            background: done ? '#16a34a' : '#E5E7EB',
            marginTop: '-20px', transition: 'background 0.4s'
        }} />
    );
}

// Payment Detail Row helper
function PayRow({ label, value, bold, green, big }) {
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 0', borderBottom: '1px solid #F3F4F6',
            fontSize: big ? '16px' : '14px',
            fontWeight: bold ? 800 : 600,
            color: green ? '#15803D' : '#111827'
        }}>
            <span style={{ color: '#6B7280', fontWeight: 600, fontSize: big ? '15px' : '13px' }}>{label}</span>
            <span>{value}</span>
        </div>
    );
}

// Upload Box helper
function UploadBox({ file, onChange, uploading, label }) {
    const [preview, setPreview] = useState(null);
    function handleChange(e) {
        const f = e.target.files[0];
        if (!f) return;
        setPreview(URL.createObjectURL(f));
        onChange(f);
    }
    return (
        <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                {label}
            </label>
            <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                border: `2px dashed ${file ? '#2E7D32' : '#D1D5DB'}`,
                borderRadius: '12px', padding: '20px', cursor: 'pointer',
                background: file ? '#F0FDF4' : '#F9FAFB', transition: 'all 0.2s'
            }}>
                {preview
                    ? <img src={preview} alt="preview" style={{ maxHeight: '180px', borderRadius: '8px', objectFit: 'contain' }} />
                    : <><Upload size={28} color={file ? '#2E7D32' : '#9CA3AF'} /><span style={{ fontSize: '13px', color: '#6B7280' }}>Tap to choose screenshot</span></>
                }
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleChange} disabled={uploading} />
            </label>
            {file && <p style={{ fontSize: '12px', color: '#15803D', fontWeight: 700, marginTop: '6px' }}>✅ {file.name}</p>}
        </div>
    );
}

// UPI QR helper — generates a scannable QR URL from UPI pay deep link
function upiQrUrl(upiId, name, amount) {
    const upiDeepLink = encodeURIComponent(
        `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name || 'Recipient')}&am=${amount || ''}&cu=INR`
    );
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${upiDeepLink}`;
}

// UPI Card helper
function UpiCard({ name, upi, bank, acc, ifsc, amount, label }) {
    const [copied, setCopied] = useState(false);
    const [qrLoaded, setQrLoaded] = useState(false);
    const [qrError, setQrError] = useState(false);
    function copy() {
        navigator.clipboard.writeText(upi).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    }
    const qrSrc = upi ? upiQrUrl(upi, name, amount) : null;
    return (
        <div style={{ background: 'linear-gradient(135deg,#1B5E20,#2E7D32)', borderRadius: '16px', padding: '20px', color: '#fff', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.65)', marginBottom: '6px' }}>{label}</div>
            <div style={{ fontSize: '20px', fontWeight: 900, marginBottom: '4px' }}>{fmt(amount)}</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '14px' }}>{name}</div>

            {/* QR + UPI details row */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                {/* QR Code */}
                {qrSrc && !qrError ? (
                    <div style={{
                        background: '#fff', borderRadius: '10px', padding: '6px',
                        flexShrink: 0, width: '100px', height: '100px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                    }}>
                        <img
                            src={qrSrc}
                            alt={`QR for ${upi}`}
                            width={88} height={88}
                            onLoad={() => setQrLoaded(true)}
                            onError={() => setQrError(true)}
                            style={{ display: qrLoaded ? 'block' : 'none', borderRadius: '4px' }}
                        />
                        {!qrLoaded && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ width: '20px', height: '20px', border: '2px solid #2E7D32', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 4px' }} />
                                <div style={{ fontSize: '9px', color: '#9CA3AF' }}>Loading QR…</div>
                            </div>
                        )}
                    </div>
                ) : null}

                {/* UPI details */}
                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '12px 14px', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, letterSpacing: '0.1em' }}>UPI ID</div>
                            <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.03em', wordBreak: 'break-all' }}>{upi}</div>
                        </div>
                        <button onClick={copy} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '6px 12px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0, marginLeft: '8px' }}>
                            {copied ? '✅ Copied' : <><Copy size={12} style={{ marginRight: '4px' }} />Copy</>}
                        </button>
                    </div>
                    {bank && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{bank} · A/C: {acc} · IFSC: {ifsc}</div>}
                    {qrSrc && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', marginTop: '6px' }}>📷 Scan QR to pay instantly via any UPI app</div>}
                </div>
            </div>
        </div>
    );
}


// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────
export default function CheckoutStepper() {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { token: authToken } = useAuth();

    const [step, setStep] = useState(1);
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Step 1 state
    const [lenderFile, setLenderFile] = useState(null);
    const [uploading1, setUploading1] = useState(false);

    // Step 3 state
    const [adminFile, setAdminFile] = useState(null);
    const [uploading3, setUploading3] = useState(false);

    // ── Load booking ─────────────────────────────────────────
    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('http://localhost:5000/api/bookings/my', {
                    headers: { 'x-auth-token': authToken }
                });
                const data = await res.json();
                if (!data.success) { setError('Could not load booking.'); setLoading(false); return; }
                const b = (data.data || []).find(b => b._id === bookingId);
                if (!b) { setError('Booking not found.'); setLoading(false); return; }
                setBooking(b);

                // Restore step from booking status
                if (['Lender_Paid'].includes(b.status)) setStep(2);
                if (['Admin_Paid_Pending', 'Admin_Approved', 'Rental_Started', 'Completed'].includes(b.status)) setStep(3);
            } catch { setError('Network error.'); }
            setLoading(false);
        }
        if (authToken && bookingId) load();
    }, [authToken, bookingId]);

    // ── PDF: generate initial TAX INVOICE ────────────────────
    function downloadPDF() {
        if (!booking) return;
        const b = booking;
        const eq = b.equipment || {};
        const own = b.owner || {};
        const lFin = own.finance || {};
        const lAddr = own.address || {};

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const W = doc.internal.pageSize.getWidth();
        const H = doc.internal.pageSize.getHeight();

        // ── ASCII-safe helpers (no Unicode/Indian-locale chars) ──
        const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        function fmtD(d) {
            if (!d) return 'N/A';
            const dt = new Date(d);
            if (isNaN(dt)) return 'N/A';
            return `${String(dt.getDate()).padStart(2, '0')} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
        }
        function fmtT(d) {
            const dt = d ? new Date(d) : new Date();
            const h = dt.getHours(), m = dt.getMinutes();
            return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
        }
        function rs(n) { return `Rs. ${Number(n || 0).toLocaleString()}`; }

        // ── Tractor logo drawing helper ───────────────────────
        function drawLogo(ox, oy, s) {
            doc.setFillColor(240, 255, 240); doc.setDrawColor(139, 195, 74); doc.setLineWidth(0.4);
            doc.circle(ox, oy, 10 * s, 'FD');
            doc.setFillColor(46, 125, 50); doc.setDrawColor(46, 125, 50);
            doc.roundedRect(ox - 4.5 * s, oy - 1.5 * s, 6 * s, 4 * s, 0.5 * s, 0.5 * s, 'F');
            doc.setFillColor(27, 94, 32);
            doc.roundedRect(ox - 1.2 * s, oy - 4.5 * s, 4 * s, 3.2 * s, 0.4 * s, 0.4 * s, 'F');
            doc.setFillColor(46, 125, 50); doc.rect(ox - 0.4 * s, oy - 6.5 * s, 0.8 * s, 2.2 * s, 'F');
            doc.setFillColor(27, 94, 32); doc.circle(ox - 3 * s, oy + 3.2 * s, 3.2 * s, 'F');
            doc.setFillColor(240, 255, 240); doc.circle(ox - 3 * s, oy + 3.2 * s, 1.5 * s, 'F');
            doc.setFillColor(27, 94, 32); doc.circle(ox + 3.2 * s, oy + 3.2 * s, 2.2 * s, 'F');
            doc.setFillColor(240, 255, 240); doc.circle(ox + 3.2 * s, oy + 3.2 * s, 1 * s, 'F');
        }

        const now = new Date();
        const billNo = `KAS-INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${b.handoverToken || 'XXXX'}`;

        // ── PAGE 1 HEADER ─────────────────────────────────────
        doc.setFillColor(27, 94, 32); doc.rect(0, 0, W, 44, 'F');
        doc.setFillColor(46, 125, 50); doc.triangle(0, 0, 50, 0, 0, 44, 'F');
        drawLogo(18, 21, 0.9);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
        doc.text('Krishi Astra Setu', 33, 13);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(180, 230, 170);
        doc.text('Farm Equipment Rental Platform  |  www.krishiastrasetu.in', 33, 19);
        doc.text('Email: support@krishiastrasetu.in  |  Phone: +91 800 000 1234', 33, 24);
        doc.text('GST No: 27AABCK1234M1Z5  |  Regd. in Maharashtra, India', 33, 29);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
        doc.text('TAX INVOICE', W - 14, 12, { align: 'right' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(200, 240, 195);
        doc.text(`Bill No : ${billNo}`, W - 14, 20, { align: 'right' });
        doc.text(`Date    : ${fmtD(now)}`, W - 14, 26, { align: 'right' });
        doc.text(`Time    : ${fmtT(now)}`, W - 14, 32, { align: 'right' });
        doc.setFillColor(139, 195, 74); doc.rect(0, 40, W, 4, 'F');

        // Status badge
        doc.setFillColor(240, 253, 244); doc.setDrawColor(187, 247, 208);
        doc.roundedRect(14, 48, W - 28, 8, 2, 2, 'FD');
        doc.setTextColor(21, 128, 61); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text(`[ BOOKING ${(b.status || 'PENDING').replace(/_/g, ' ').toUpperCase()} ]   Platform: Krishi Astra Setu`, W / 2, 54, { align: 'center' });

        // Handover Token box
        doc.setFillColor(46, 125, 50); doc.roundedRect(14, 60, W - 28, 16, 3, 3, 'F');
        doc.setTextColor(197, 225, 165); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.text('HANDOVER TOKEN  --  Show this code to the Equipment Owner during pickup', W / 2, 66, { align: 'center' });
        doc.setTextColor(255, 255, 255); doc.setFontSize(20); doc.setFont('helvetica', 'bold');
        doc.text(b.handoverToken || '------', W / 2, 74, { align: 'center' });

        // ── Section helpers ───────────────────────────────────
        let y = 82;
        const secHead = (label, rgb = [46, 125, 50]) => {
            doc.setFillColor(...rgb); doc.rect(14, y, W - 28, 7, 'F');
            doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
            doc.text(label, W / 2, y + 5, { align: 'center' }); y += 7;
        };
        const subHead = (label) => {
            doc.setFillColor(232, 245, 233); doc.setDrawColor(187, 247, 208);
            doc.roundedRect(14, y, W - 28, 5.5, 1, 1, 'FD');
            doc.setTextColor(27, 94, 32); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
            doc.text(`-- ${label} --`, W / 2, y + 4, { align: 'center' }); y += 5.5;
        };
        const drawRows = (data) => {
            const bw = W - 28;
            data.forEach((row, i) => {
                if (y > H - 28) { doc.addPage(); y = 14; }
                doc.setFillColor(i % 2 === 0 ? 249 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 251 : 255);
                doc.rect(14, y, bw, 6.5, 'F');
                doc.setDrawColor(229, 231, 235); doc.rect(14, y, bw, 6.5, 'S');
                doc.setTextColor(107, 114, 128); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
                doc.text(String(row[0]), 16, y + 4.5);
                doc.setTextColor(17, 24, 39); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
                doc.text(String(row[1] ?? 'N/A'), 14 + bw - 2, y + 4.5, { align: 'right', maxWidth: bw - 55 });
                y += 6.5;
            });
            y += 2;
        };

        // ── LENDER (EQUIPMENT OWNER) DETAILS ─────────────────
        secHead('LENDER (EQUIPMENT OWNER) DETAILS', [21, 101, 192]);
        subHead('Personal Information');
        drawRows([
            ['Full Name', [own.name?.first, own.name?.middle, own.name?.last].filter(Boolean).join(' ') || 'N/A'],
            ['Email ID', own.email || 'N/A'],
            ['Mobile No.', own.mobile || 'N/A'],
            ['KYC Status', own.kycStatus || 'Verified'],
        ]);
        subHead('Address');
        drawRows([
            ['Village / Town', lAddr.village || 'N/A'],
            ['District', lAddr.district || 'N/A'],
            ['State', lAddr.state || 'N/A'],
            ['PIN Code', lAddr.pincode || lAddr.pinCode || 'N/A'],
        ]);
        subHead('Bank & Payment Details');
        drawRows([
            ['Bank Name', lFin.bankName || lFin.bankAccount?.bankName || 'N/A'],
            ['Account Number', lFin.accountNo || lFin.bankAccount?.accountNumber || 'N/A'],
            ['IFSC Code', lFin.ifscCode || lFin.bankAccount?.ifsc || 'N/A'],
            ['UPI ID', lFin.upiId || 'N/A'],
        ]);

        // ── PAGE 2: Equipment & Price ─────────────────────────
        doc.addPage(); y = 14;
        // Mini header page 2
        doc.setFillColor(27, 94, 32); doc.rect(0, 0, W, 16, 'F');
        drawLogo(11, 8, 0.55);
        doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
        doc.text('Krishi Astra Setu  |  Tax Invoice', W / 2, 11, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(200, 240, 195);
        doc.text(`Bill No: ${billNo}  |  Date: ${fmtD(now)}`, W / 2, 15.5, { align: 'center' });
        doc.setFillColor(139, 195, 74); doc.rect(0, 15.5, W, 1.5, 'F');
        y = 22;

        secHead('EQUIPMENT & RENTAL DETAILS', [27, 94, 32]);
        drawRows([
            ['Equipment Name', eq.name || 'N/A'],
            ['Category', eq.category || 'N/A'],
            ['Price Per Hour', rs(b.pricePerHour || eq.priceHr)],
            ['Total Hours', `${b.hours || 0} hrs`],
            ['Rental Start', fmtD(b.rentalDates?.start)],
            ['Rental End', fmtD(b.rentalDates?.end)],
            ['Purpose', b.purpose || 'N/A'],
            ['Payment Status', (b.status || 'N/A').replace(/_/g, ' ')],
        ]);

        secHead('PRICE BREAKDOWN');
        autoTable(doc, {
            startY: y,
            head: [['Description', 'Amount (INR)']],
            body: [
                ['Rental Charge (Lender Amount)', rs(b.subtotal)],
                ['Platform Commission (5%)', rs(b.platformFee)],
                ['GST @ 18% on Platform Fee', rs(b.gst)],
            ],
            foot: [['GRAND TOTAL', rs(b.totalAmount)]],
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3.5, textColor: [17, 24, 39] },
            headStyles: { fillColor: [46, 125, 50], textColor: 255, fontStyle: 'bold', fontSize: 9.5 },
            footStyles: { fillColor: [21, 128, 61], textColor: 255, fontStyle: 'bold', fontSize: 10 },
            columnStyles: {
                0: { cellWidth: 125, fontStyle: 'bold', fillColor: [249, 250, 251] },
                1: { halign: 'right', fontStyle: 'bold' }
            },
            margin: { left: 14, right: 14 },
        });
        y = (doc.lastAutoTable?.finalY ?? y + 55) + 10;

        // Admin payment box
        doc.setFillColor(255, 251, 235); doc.setDrawColor(253, 230, 138);
        doc.roundedRect(14, y, W - 28, 28, 3, 3, 'FD');
        doc.setTextColor(146, 64, 14); doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
        doc.text('PAY PLATFORM FEE + GST TO KAS ADMIN', W / 2, y + 8, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(92, 45, 10);
        doc.text(`UPI: ${ADMIN_UPI}`, 20, y + 16);
        doc.text(`Bank: ${ADMIN_BANK}  |  A/C: ${ADMIN_ACC}  |  IFSC: ${ADMIN_IFSC}`, 20, y + 22);
        doc.text(`Amount Due to Admin: ${rs((b.platformFee || 0) + (b.gst || 0))}`, 20, y + 28);
        y += 34;

        // ── TERMS & CONDITIONS ────────────────────────────────
        if (y > H - 90) { doc.addPage(); y = 14; }
        secHead('TERMS, CONDITIONS & PLATFORM POLICY', [75, 85, 99]);
        const TC = [
            ['1. Rental Agreement',
                'This invoice is a legally binding rental agreement between the Renter and Lender facilitated by Krishi Astra Setu (KAS). Both parties agree to the terms herein.'],
            ['2. Payment Flow',
                'Renter pays Lender directly (rental amount). Platform Fee + GST paid separately to KAS Admin. KAS is not liable for direct peer-to-peer payment disputes.'],
            ['3. Handover Token',
                'The Handover Token must be verified at pickup. Rental officially starts only after Lender confirms the code in the KAS system. Token is valid for one-time use only.'],
            ['4. Cancellation Policy',
                'Cancellations before handover: full refund of Platform Fee. After handover, no refund of rental amount. Platform Fee refund subject to admin review within 7 days.'],
            ['5. Equipment Condition',
                'Renter must return equipment in its original condition. Damage must be reported immediately via KAS app. Lender may file a Damage Report with photographs.'],
            ['6. Liability Disclaimer',
                'KAS is a marketplace facilitator only. KAS is not liable for equipment malfunction, injury, crop loss, or disputes arising from the rental. Use at your own risk.'],
            ['7. Dispute Resolution',
                'Disputes must be raised within 7 days of rental completion via support@krishiastrasetu.in. KAS decision in disputes is final and binding on both parties.'],
            ['8. Governing Law',
                'This agreement is governed by the laws of the Republic of India. Legal disputes shall fall under jurisdiction of courts in Maharashtra, India.'],
        ];
        TC.forEach(([title, body], i) => {
            if (y > H - 24) { doc.addPage(); y = 14; }
            const h = 7 + Math.ceil(body.length / 90) * 4.5;
            doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 249 : 255, i % 2 === 0 ? 250 : 255);
            doc.rect(14, y, W - 28, h, 'F');
            doc.setDrawColor(225, 230, 235); doc.rect(14, y, W - 28, h, 'S');
            doc.setTextColor(55, 65, 81); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
            doc.text(title, 17, y + 4.5);
            doc.setFont('helvetica', 'normal'); doc.setTextColor(75, 85, 99);
            doc.text(doc.splitTextToSize(body, W - 50), 17, y + 8.5);
            y += h + 1;
        });

        // ── FOOTER ON EVERY PAGE ──────────────────────────────
        const np = doc.getNumberOfPages();
        for (let p = 1; p <= np; p++) {
            doc.setPage(p);
            doc.setFillColor(27, 94, 32); doc.rect(0, H - 14, W, 14, 'F');
            doc.setFillColor(139, 195, 74); doc.rect(0, H - 14, W, 1.5, 'F');
            doc.setTextColor(255, 255, 255); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
            doc.text('Krishi Astra Setu Pvt. Ltd.  |  Bridging Tools, Empowering Farmers', W / 2, H - 8, { align: 'center' });
            doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(180, 230, 170);
            doc.text(`Computer-generated invoice. No signature required.  |  www.krishiastrasetu.in  |  Page ${p} of ${np}`, W / 2, H - 3.5, { align: 'center' });
        }

        doc.save(`KAS-Invoice-${b.handoverToken || b._id?.slice(-6) || 'INV'}.pdf`);
    }


    // ── Phase 1: Upload Lender Proof ─────────────────────────
    async function handleLenderUpload() {
        if (!lenderFile) { await kasAlert('Please select a screenshot first.'); return; }
        setUploading1(true);
        const fd = new FormData(); fd.append('screenshot', lenderFile);
        try {
            const res = await fetch(`http://localhost:5000/api/payments/lender-proof/${bookingId}`, {
                method: 'POST', headers: { 'x-auth-token': authToken }, body: fd
            });
            const data = await res.json();
            if (!data.success) { await kasAlert(data.message || 'Upload failed.'); setUploading1(false); return; }
            setBooking(b => ({ ...b, status: data.status, lenderPaymentProofUrl: data.lenderPaymentProofUrl }));
            setStep(2);
        } catch { await kasAlert('Network error. Please try again.'); }
        setUploading1(false);
    }

    // ── Phase 3: Upload Admin Proof ──────────────────────────
    async function handleAdminUpload() {
        if (!adminFile) { await kasAlert('Please select a screenshot first.'); return; }
        setUploading3(true);
        const fd = new FormData(); fd.append('screenshot', adminFile);
        try {
            const res = await fetch(`http://localhost:5000/api/payments/admin-proof/${bookingId}`, {
                method: 'POST', headers: { 'x-auth-token': authToken }, body: fd
            });
            const data = await res.json();
            if (!data.success) { await kasAlert(data.message || 'Upload failed.'); setUploading3(false); return; }
            setBooking(b => ({ ...b, status: data.status, adminPaymentProofUrl: data.adminPaymentProofUrl }));
        } catch { await kasAlert('Network error. Please try again.'); }
        setUploading3(false);
    }

    // ─────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────
    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F7F5' }}>
            <div style={{ textAlign: 'center' }}>
                <RefreshCw size={40} color="#2E7D32" className="animate-spin" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 700, color: '#374151' }}>Loading your booking…</p>
            </div>
        </div>
    );

    if (error) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F7F5' }}>
            <div style={{ background: '#fff', borderRadius: '18px', padding: '40px', textAlign: 'center', maxWidth: '400px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                <AlertTriangle size={40} color="#DC2626" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 700, color: '#111827', marginBottom: '16px' }}>{error}</p>
                <Link to="/profile" style={{ color: '#2E7D32', fontWeight: 700 }}>← Back to Profile</Link>
            </div>
        </div>
    );

    const b = booking;
    const eq = b?.equipment || {};
    const owner = b?.owner || {};
    const lender = owner.finance || {};
    const platformAmt = (b?.platformFee || 0) + (b?.gst || 0);
    const done3 = ['Admin_Paid_Pending', 'Admin_Approved', 'Rental_Started', 'Completed'].includes(b?.status);

    return (
        <div style={{ minHeight: '100vh', background: '#F5F7F5', fontFamily: "'Inter', sans-serif", paddingBottom: '60px' }}>

            {/* ── Header ─────────────────────────────── */}
            <div style={{ background: 'linear-gradient(135deg,#1B5E20,#2E7D32)', padding: '24px 20px 60px' }}>
                <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                    <Link to="/profile" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                        <ArrowLeft size={14} /> Back to Profile
                    </Link>
                    <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', margin: 0, fontFamily: "'Poppins', sans-serif" }}>
                        Complete Your Booking Payment
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', marginTop: '6px' }}>
                        {eq.name || 'Equipment'} · Handover Code: <strong style={{ color: '#A5D6A7', letterSpacing: '0.15em' }}>{b?.handoverToken}</strong>
                    </p>
                </div>
            </div>

            <div style={{ maxWidth: '720px', margin: '-36px auto 0', padding: '0 20px' }}>

                {/* ── Step Indicator ────────────────────── */}
                <div style={{ background: '#fff', borderRadius: '18px', padding: '24px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                        <StepBubble num="1" label="Pay Lender" active={step === 1} done={step > 1} />
                        <StepLine done={step > 1} />
                        <StepBubble num="2" label="Get Code + PDF" active={step === 2} done={step > 2} />
                        <StepLine done={step > 2} />
                        <StepBubble num="3" label="Pay Platform" active={step === 3} done={done3} />
                    </div>
                </div>

                {/* ══════════════════════════════════════ */}
                {/* STEP 1 — Pay Lender                   */}
                {/* ══════════════════════════════════════ */}
                {step === 1 && (
                    <div style={{ background: '#fff', borderRadius: '18px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#2E7D32,#8BC34A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IndianRupee size={18} color="#fff" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#111827', margin: 0 }}>Step 1 — Pay the Equipment Owner</h2>
                                <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Transfer the rental amount directly to the lender</p>
                            </div>
                        </div>

                        <UpiCard
                            label="LENDER PAYMENT — RENTAL AMOUNT"
                            name={`${owner.name?.first || ''} ${owner.name?.last || ''}`.trim() || 'Equipment Owner'}
                            upi={lender.upiId || 'Contact lender for UPI'}
                            bank={lender.bankName}
                            acc={lender.accountNo}
                            ifsc={lender.ifscCode}
                            amount={b?.subtotal || 0}
                        />

                        <div style={{ background: '#F0FDF4', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid #BBF7D0' }}>
                            <PayRow label="Rental Hours" value={`${b?.hours || 0} hrs × ${fmt(b?.pricePerHour)}`} />
                            <PayRow label="Rental Amount to Pay Lender" value={fmt(b?.subtotal)} bold green />
                        </div>

                        <div style={{ background: '#FFFBEB', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', border: '1px solid #FDE68A', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <AlertTriangle size={16} color="#92400E" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ fontSize: '13px', color: '#92400E', fontWeight: 600, margin: 0 }}>
                                After paying the lender via UPI, take a screenshot of the successful payment and upload it below. Do NOT pay the platform fee yet — that's Step 3.
                            </p>
                        </div>

                        <UploadBox
                            file={lenderFile}
                            onChange={setLenderFile}
                            uploading={uploading1}
                            label="Upload Payment Screenshot (to Lender) *"
                        />

                        <button
                            onClick={handleLenderUpload}
                            disabled={!lenderFile || uploading1}
                            style={{
                                marginTop: '20px', width: '100%', padding: '14px',
                                borderRadius: '12px', border: 'none',
                                background: (!lenderFile || uploading1) ? '#E5E7EB' : 'linear-gradient(135deg,#2E7D32,#388E3C)',
                                color: (!lenderFile || uploading1) ? '#9CA3AF' : '#fff',
                                fontWeight: 800, fontSize: '15px', cursor: (!lenderFile || uploading1) ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                boxShadow: (!lenderFile || uploading1) ? 'none' : '0 4px 14px rgba(46,125,50,0.35)',
                                transition: 'all 0.2s'
                            }}
                        >
                            {uploading1 ? <><RefreshCw size={16} className="animate-spin" /> Uploading…</> : <><Upload size={16} /> Submit Lender Payment Proof</>}
                        </button>
                    </div>
                )}

                {/* ══════════════════════════════════════ */}
                {/* STEP 2 — Handover Code + Download PDF */}
                {/* ══════════════════════════════════════ */}
                {step === 2 && (
                    <div style={{ background: '#fff', borderRadius: '18px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#2E7D32,#8BC34A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ShieldCheck size={18} color="#fff" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#111827', margin: 0 }}>Step 2 — Your Handover Code</h2>
                                <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Save this code — you'll give it to the lender in person</p>
                            </div>
                        </div>

                        {/* Handover Token Box */}
                        <div style={{
                            background: 'linear-gradient(135deg,#1B5E20,#2E7D32)',
                            borderRadius: '16px', padding: '28px', textAlign: 'center', marginBottom: '20px'
                        }}>
                            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', margin: '0 0 10px' }}>
                                🔐 HANDOVER TOKEN
                            </p>
                            <div style={{ fontSize: '42px', fontWeight: 900, color: '#fff', letterSpacing: '0.25em', fontFamily: 'monospace' }}>
                                {b?.handoverToken || '------'}
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: '10px 0 0' }}>
                                Show this to the equipment owner during pickup
                            </p>
                        </div>

                        <div style={{ background: '#F0FDF4', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #BBF7D0' }}>
                            <p style={{ fontSize: '13px', fontWeight: 800, color: '#15803D', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <CheckCircle2 size={15} /> Lender payment proof received ✅
                            </p>
                            <PayRow label="Rental Amount (paid to owner)" value={fmt(b?.subtotal)} />
                            <PayRow label="Platform Fee (5%)" value={fmt(b?.platformFee)} />
                            <PayRow label="GST (18%)" value={fmt(b?.gst)} />
                            <PayRow label="Total Booking Value" value={fmt(b?.totalAmount)} bold green />
                        </div>

                        <button
                            onClick={downloadPDF}
                            style={{
                                width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #2E7D32',
                                background: 'transparent', color: '#2E7D32', fontWeight: 800, fontSize: '15px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                marginBottom: '14px'
                            }}
                        >
                            <Download size={16} /> Download Initial Tax Invoice (PDF)
                        </button>

                        <button
                            onClick={() => setStep(3)}
                            style={{
                                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                                background: 'linear-gradient(135deg,#2E7D32,#388E3C)',
                                color: '#fff', fontWeight: 800, fontSize: '15px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                boxShadow: '0 4px 14px rgba(46,125,50,0.35)'
                            }}
                        >
                            Proceed to Pay Platform Fee <ArrowRight size={16} />
                        </button>
                    </div>
                )}

                {/* ══════════════════════════════════════ */}
                {/* STEP 3 — Pay Platform Fee to Admin    */}
                {/* ══════════════════════════════════════ */}
                {step === 3 && (
                    <div style={{ background: '#fff', borderRadius: '18px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#2E7D32,#8BC34A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Building2 size={18} color="#fff" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#111827', margin: 0 }}>Step 3 — Pay Platform Fee to KAS</h2>
                                <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Pay the platform commission + GST to the admin</p>
                            </div>
                        </div>

                        {done3 ? (
                            <div style={{ background: '#F0FDF4', borderRadius: '14px', padding: '24px', textAlign: 'center', border: '2px solid #BBF7D0' }}>
                                <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 12px' }} />
                                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>
                                    {b?.status === 'Admin_Paid_Pending' ? '⏳ Awaiting Admin Approval' :
                                        b?.status === 'Admin_Approved' ? '✅ Payments Approved!' :
                                            b?.status === 'Rental_Started' ? '🚜 Rental In Progress!' :
                                                '✅ Completed!'}
                                </h3>
                                <p style={{ fontSize: '14px', color: '#6B7280' }}>
                                    {b?.status === 'Admin_Paid_Pending'
                                        ? 'Admin is reviewing your payment screenshots. You will be notified once approved.'
                                        : b?.status === 'Admin_Approved'
                                            ? `Go meet the lender and share your Handover Code: ${b?.handoverToken}`
                                            : 'Your rental is active. Enjoy the equipment!'}
                                </p>
                                {(b?.status === 'Admin_Approved' || b?.status === 'Rental_Started') && (
                                    <div style={{ marginTop: '16px', fontSize: '36px', fontWeight: 900, letterSpacing: '0.25em', color: '#2E7D32', fontFamily: 'monospace' }}>
                                        {b?.handoverToken}
                                    </div>
                                )}
                                <button onClick={downloadPDF} style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '10px', border: '2px solid #2E7D32', background: 'transparent', color: '#2E7D32', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                                    <Download size={14} /> Download Invoice PDF
                                </button>
                            </div>
                        ) : (
                            <>
                                <UpiCard
                                    label="PLATFORM FEE + GST — PAY TO KAS ADMIN"
                                    name={ADMIN_NAME}
                                    upi={ADMIN_UPI}
                                    bank={ADMIN_BANK}
                                    acc={ADMIN_ACC}
                                    ifsc={ADMIN_IFSC}
                                    amount={platformAmt}
                                />

                                <div style={{ background: '#F0FDF4', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid #BBF7D0' }}>
                                    <PayRow label="Platform Fee (5% of rent)" value={fmt(b?.platformFee)} />
                                    <PayRow label="GST (18% of rent)" value={fmt(b?.gst)} />
                                    <PayRow label="Total to Pay Admin" value={fmt(platformAmt)} bold green big />
                                </div>

                                <div style={{ background: '#FFFBEB', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', border: '1px solid #FDE68A', display: 'flex', gap: '10px' }}>
                                    <AlertTriangle size={16} color="#92400E" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <p style={{ fontSize: '13px', color: '#92400E', fontWeight: 600, margin: 0 }}>
                                        Pay exactly <strong>{fmt(platformAmt)}</strong> to the admin UPI above, then upload the screenshot. Admin will verify and approve your booking.
                                    </p>
                                </div>

                                <UploadBox
                                    file={adminFile}
                                    onChange={setAdminFile}
                                    uploading={uploading3}
                                    label="Upload Payment Screenshot (to KAS Admin) *"
                                />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
                                    <button
                                        onClick={() => setStep(2)}
                                        style={{ padding: '13px', borderRadius: '12px', border: '2px solid #E5E7EB', background: 'transparent', color: '#374151', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                                    >
                                        ← Back to Code
                                    </button>
                                    <button
                                        onClick={handleAdminUpload}
                                        disabled={!adminFile || uploading3}
                                        style={{
                                            padding: '13px', borderRadius: '12px', border: 'none',
                                            background: (!adminFile || uploading3) ? '#E5E7EB' : 'linear-gradient(135deg,#2E7D32,#388E3C)',
                                            color: (!adminFile || uploading3) ? '#9CA3AF' : '#fff',
                                            fontWeight: 800, fontSize: '14px', cursor: (!adminFile || uploading3) ? 'not-allowed' : 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                            boxShadow: (!adminFile || uploading3) ? 'none' : '0 4px 14px rgba(46,125,50,0.35)'
                                        }}
                                    >
                                        {uploading3 ? <><RefreshCw size={14} className="animate-spin" />Uploading…</> : <><Upload size={14} />Submit & Await Approval</>}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ── Booking Summary sidebar card ─────────────── */}
                <div style={{ background: '#fff', borderRadius: '18px', padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginTop: '20px', border: '1px solid #F3F4F6' }}>
                    <p style={{ fontSize: '13px', fontWeight: 800, color: '#374151', margin: '0 0 12px' }}>📋 Booking Summary</p>
                    <PayRow label="Equipment" value={eq.name || '—'} />
                    <PayRow label="Rental Start" value={formatDate(b?.rentalDates?.start)} />
                    <PayRow label="Rental End" value={formatDate(b?.rentalDates?.end)} />
                    <PayRow label="Rent Amount" value={fmt(b?.subtotal)} />
                    <PayRow label="Platform Fee" value={fmt(b?.platformFee)} />
                    <PayRow label="GST" value={fmt(b?.gst)} />
                    <PayRow label="Grand Total" value={fmt(b?.totalAmount)} bold green />
                    <div style={{ background: '#F0FDF4', borderRadius: '8px', padding: '10px 12px', marginTop: '12px', textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#15803D' }}>Status: {b?.status?.replace(/_/g, ' ') || '—'}</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
