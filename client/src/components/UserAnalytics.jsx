/**
 * UserAnalytics.jsx
 * ─────────────────────────────────────────────────────────────
 * Per-user analytics dashboard for KAS Profile page.
 * Shows both RENTER (money spent) and LENDER (money earned) views.
 * Mirrors AnalyticsDashboard look but scoped to the current user.
 */

import API_BASE from '../utils/api';
import { useState, useEffect, useMemo } from 'react';
import {
    AreaChart, Area, BarChart, Bar, ComposedChart, Line,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    TrendingUp, ShoppingCart, Tractor, IndianRupee, BarChart3,
    Download, FileText, RefreshCw, CheckCircle2, XCircle, Package
} from 'lucide-react';
import jsPDF from 'jspdf';
import _autoTable from 'jspdf-autotable';
const autoTable = typeof _autoTable === 'function' ? _autoTable : (_autoTable?.default ?? _autoTable);

// ── palette ─────────────────────────────────────────────────
const G = '#2E7D32', B = '#1565C0', O = '#E65100', R = '#C62828', T = '#00796B', P = '#6A1B9A';
const COLORS = [G, B, O, P, T, R, '#F9A825', '#0288D1'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PERIODS = [
    { id: 'weekly', label: 'Weekly', days: 7 },
    { id: 'monthly', label: 'Monthly', days: 30 },
    { id: 'quarterly', label: 'Quarterly', days: 90 },
    { id: 'half', label: '6-Monthly', days: 180 },
    { id: 'annual', label: 'Annual', days: 365 },
];

// ── formatters ───────────────────────────────────────────────
function fmtRs(n) {
    if (!n) return '₹0';
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${Math.round(n).toLocaleString('en-IN')}`;
}
function fmtFull(n) { return `₹${Number(n || 0).toLocaleString('en-IN')}`; }
function pdfRs(n) {
    const v = Number(n || 0);
    if (v >= 10000000) return `Rs.${(v / 10000000).toFixed(2)}Cr`;
    if (v >= 100000) return `Rs.${(v / 100000).toFixed(2)}L`;
    if (v >= 1000) return `Rs.${(v / 1000).toFixed(2)}K`;
    return `Rs.${v.toLocaleString('en-IN')}`;
}
function pdfFull(n) { return `Rs.${Number(n || 0).toLocaleString('en-IN')}`; }

// ── group daily data by period ───────────────────────────────
function groupData(daily, periodId, valueKey) {
    const now = new Date();
    const days = { weekly: 7, monthly: 30, quarterly: 90, half: 180, annual: 365 }[periodId] || 30;
    const cutDate = new Date(now - days * 86400000);
    const filtered = daily.filter(d => new Date(d.date) >= cutDate);

    if (periodId === 'weekly') {
        const map = {};
        filtered.forEach(d => {
            const dt = new Date(d.date);
            const k = dt.toISOString().slice(0, 10);
            const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dt.getDay()];
            map[k] = { label: `${dow} ${dt.getDate()}/${dt.getMonth() + 1}`, ...d };
        });
        return Object.values(map).slice(-7);
    }
    if (periodId === 'monthly') {
        const weeks = {};
        filtered.forEach(d => {
            const dt = new Date(d.date);
            const diff = Math.floor((now - dt) / (7 * 86400000));
            const key = `w${diff}`;
            if (!weeks[key]) weeks[key] = { label: ['This Week', 'Last Week', '2 Wks Ago', '3 Wks Ago'][diff] || `Wk-${diff}`, bookings: 0, [valueKey]: 0, platformFee: 0, gst: 0, completed: 0, cancelled: 0 };
            weeks[key].bookings += d.bookings || 0;
            weeks[key][valueKey] += d[valueKey] || 0;
            weeks[key].platformFee += d.platformFee || 0;
            weeks[key].gst += d.gst || 0;
            weeks[key].completed += d.completed || 0;
            weeks[key].cancelled += d.cancelled || 0;
        });
        return Object.entries(weeks).sort((a, b) => a[0] > b[0] ? 1 : -1).slice(0, 4).reverse().map(([, v]) => v);
    }
    if (periodId === 'quarterly' || periodId === 'half') {
        const months = {};
        filtered.forEach(d => {
            const dt = new Date(d.date);
            const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
            const label = `${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
            if (!months[key]) months[key] = { label, bookings: 0, [valueKey]: 0, platformFee: 0, gst: 0, completed: 0, cancelled: 0 };
            months[key].bookings += d.bookings || 0;
            months[key][valueKey] += d[valueKey] || 0;
            months[key].platformFee += d.platformFee || 0;
            months[key].gst += d.gst || 0;
            months[key].completed += d.completed || 0;
            months[key].cancelled += d.cancelled || 0;
        });
        return Object.entries(months).sort((a, b) => a[0] > b[0] ? 1 : -1).map(([, v]) => v);
    }
    // annual — bi-monthly
    const bim = {};
    filtered.forEach(d => {
        const dt = new Date(d.date);
        const bIdx = Math.floor(dt.getMonth() / 2);
        const key = `${dt.getFullYear()}-${bIdx}`;
        const label = `${MONTHS[bIdx * 2]}-${MONTHS[bIdx * 2 + 1]} ${dt.getFullYear()}`;
        if (!bim[key]) bim[key] = { label, bookings: 0, [valueKey]: 0, platformFee: 0, gst: 0, completed: 0, cancelled: 0 };
        bim[key].bookings += d.bookings || 0;
        bim[key][valueKey] += d[valueKey] || 0;
        bim[key].platformFee += d.platformFee || 0;
        bim[key].gst += d.gst || 0;
        bim[key].completed += d.completed || 0;
        bim[key].cancelled += d.cancelled || 0;
    });
    return Object.entries(bim).sort((a, b) => a[0] > b[0] ? 1 : -1).map(([, v]) => v);
}

// ── sub-components (module-level to avoid "Illegal constructor") ──
function KCard({ icon: Icon, label, value, sub, color, bg }) {
    return (
        <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${color}`, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={18} color={color} /></div>
            <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>{label}</p>
                <p style={{ fontSize: '20px', fontWeight: 900, color: '#111827', margin: '0 0 2px', wordBreak: 'break-all' }}>{value}</p>
                {sub && <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>{sub}</p>}
            </div>
        </div>
    );
}

function ChartWrap({ title, children }) {
    return (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: '14px', fontWeight: 800, color: '#111827', margin: '0 0 16px' }}>{title}</p>
            {children}
        </div>
    );
}

function CustomTip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
            <p style={{ fontWeight: 800, color: '#111827', margin: '0 0 6px', textTransform: 'uppercase', fontSize: '11px' }}>{label}</p>
            {payload.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '3px' }}>
                    <span style={{ color: p.color, fontWeight: 700 }}>{p.name}</span>
                    <span style={{ fontWeight: 800, color: '#111827' }}>
                        {typeof p.value === 'number' && p.name.match(/spend|earn|fee|gst|revenue/i) ? fmtFull(p.value) : p.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ── PDF logo drawer ─────────────────────────────────────────
function drawPdfLogo(doc, ox, oy, s) {
    doc.setFillColor(240, 255, 240); doc.setDrawColor(46, 125, 50); doc.setLineWidth(0.5);
    doc.circle(ox, oy, 10 * s, 'FD');
    doc.setFillColor(46, 125, 50); doc.setDrawColor(46, 125, 50);
    doc.roundedRect(ox - 4.5 * s, oy - 1.5 * s, 6 * s, 4 * s, 0.5, 0.5, 'F');
    doc.setFillColor(27, 94, 32);
    doc.roundedRect(ox - 1.5 * s, oy - 4.5 * s, 4 * s, 3.2 * s, 0.4, 0.4, 'F');
    doc.circle(ox - 3 * s, oy + 3.2 * s, 3.2 * s, 'F');
    doc.setFillColor(240, 255, 240); doc.circle(ox - 3 * s, oy + 3.2 * s, 1.5 * s, 'F');
    doc.setFillColor(27, 94, 32); doc.circle(ox + 3.2 * s, oy + 3.2 * s, 2.2 * s, 'F');
    doc.setFillColor(240, 255, 240); doc.circle(ox + 3.2 * s, oy + 3.2 * s, 1 * s, 'F');
    doc.setFillColor(46, 125, 50); doc.rect(ox - 0.5 * s, oy - 6.5 * s, 1 * s, 2.5 * s, 'F');
}

// ── MAIN COMPONENT ───────────────────────────────────────────
export default function UserAnalytics({ authToken, userName }) {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('monthly');
    const [view, setView] = useState('renter'); // 'renter' | 'lender'

    useEffect(() => {
        if (!authToken) return;
        setLoading(true);
        fetch(`${API_BASE}/api/user/my-analytics`, { headers: { 'x-auth-token': authToken } })
            .then(r => r.json())
            .then(d => { if (d.success) setAnalytics(d.data); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [authToken]);

    const d = analytics || {};

    // ── choose which daily data to chart ─────────────────────
    const isLender = view === 'lender';
    const daily = isLender ? (d.lenderDailyData || []) : (d.renterDailyData || []);
    const valueKey = isLender ? 'earned' : 'spend';
    const catData = (isLender ? d.lenderCategoryBreakdown : d.renterCategoryBreakdown) || [];

    const timeData = useMemo(() => daily.length ? groupData(daily, period, valueKey) : [], [daily, period, valueKey]);

    const totals = useMemo(() => timeData.reduce((acc, r) => ({
        value: acc.value + (r[valueKey] || 0),
        bookings: acc.bookings + (r.bookings || 0),
        completed: acc.completed + (r.completed || 0),
        cancelled: acc.cancelled + (r.cancelled || 0),
        fee: acc.fee + (r.platformFee || 0),
        gst: acc.gst + (r.gst || 0),
    }), { value: 0, bookings: 0, completed: 0, cancelled: 0, fee: 0, gst: 0 }), [timeData, valueKey]);

    const chartH = 220;

    // ════════════ CSV ═══════════════════════════════════════
    function exportCSV() {
        const header = isLender
            ? ['Period', 'Earned (Rs)', 'Bookings', 'Completed', 'Cancelled']
            : ['Period', 'Spend (Rs)', 'Platform Fee (Rs)', 'GST (Rs)', 'Bookings', 'Completed', 'Cancelled'];
        const rows = [header, ...timeData.map(r => isLender
            ? [r.label, r[valueKey] || 0, r.bookings || 0, r.completed || 0, r.cancelled || 0]
            : [r.label, r[valueKey] || 0, r.platformFee || 0, r.gst || 0, r.bookings || 0, r.completed || 0, r.cancelled || 0]
        )];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `KAS-${view}-analytics-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click(); URL.revokeObjectURL(url);
    }

    // ════════════ PDF ═══════════════════════════════════════
    function exportPDF() {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const W = doc.internal.pageSize.getWidth();
        const H = doc.internal.pageSize.getHeight();
        const now = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
        const pLabel = PERIODS.find(x => x.id === period)?.label || period;
        const uName = userName || 'User';

        // ── Header ─────────────────────────────────────────
        doc.setFillColor(27, 94, 32); doc.rect(0, 0, W, 44, 'F');
        doc.setFillColor(46, 125, 50); doc.triangle(0, 0, 55, 0, 0, 44, 'F');
        drawPdfLogo(doc, 18, 22, 0.8);

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(17);
        doc.text('Krishi Astra Setu', 34, 15);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
        doc.setTextColor(180, 230, 180);
        doc.text('BRIDGING TOOLS, EMPOWERING FARMERS', 34, 21);

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
        doc.text(`My Analytics — ${isLender ? 'Lender Earnings' : 'Renter Spend'}`, W / 2, 16, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
        doc.setTextColor(200, 240, 200);
        doc.text(`${uName}  |  Period: ${pLabel}  |  Generated: ${now}`, W / 2, 24, { align: 'center' });

        doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text('KPIs:', W - 14, 13, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        if (isLender) {
            doc.text(`Total Earned: ${pdfRs(d.lenderTotalEarned)}`, W - 14, 19, { align: 'right' });
            doc.text(`Bookings (Lender): ${d.lenderBookings || 0}`, W - 14, 25, { align: 'right' });
            doc.text(`Equipment Listed: ${d.myEquipmentCount || 0}`, W - 14, 31, { align: 'right' });
        } else {
            doc.text(`Total Spent: ${pdfRs(d.renterTotalSpend)}`, W - 14, 19, { align: 'right' });
            doc.text(`Bookings (Renter): ${d.renterBookings || 0}`, W - 14, 25, { align: 'right' });
            doc.text(`Platform Fee + GST: ${pdfRs((d.renterFee || 0) + (d.renterGst || 0))}`, W - 14, 31, { align: 'right' });
        }

        // ── KPI table ──────────────────────────────────────
        const kpiBody = isLender ? [
            ['Total Lender Bookings', String(d.lenderBookings || 0)],
            ['Completed Rentals', String(d.lenderCompleted || 0)],
            ['Cancelled', String(d.lenderCancelled || 0)],
            ['Total Earned', pdfFull(d.lenderTotalEarned)],
            ['Equipment Listed', String(d.myEquipmentCount || 0)],
        ] : [
            ['Total Renter Bookings', String(d.renterBookings || 0)],
            ['Completed', String(d.renterCompleted || 0)],
            ['Cancelled', String(d.renterCancelled || 0)],
            ['Total Spent', pdfFull(d.renterTotalSpend)],
            ['Platform Fee Paid', pdfFull(d.renterFee)],
            ['GST Paid', pdfFull(d.renterGst)],
        ];

        autoTable(doc, {
            startY: 50,
            head: [['Metric', 'Value']],
            body: kpiBody,
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [46, 125, 50], fontStyle: 'bold' },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 45 } },
            margin: { left: 14 }, tableWidth: 105,
        });

        // ── Time-series breakdown table ────────────────────
        const seriesY = doc.lastAutoTable.finalY + 8;
        const cols = isLender
            ? ['Period', 'Earned', 'Bookings', 'Completed', 'Cancelled']
            : ['Period', 'Spend', 'Platform Fee', 'GST', 'Bookings', 'Completed', 'Cancelled'];
        const body = timeData.length > 0
            ? timeData.map(r => isLender
                ? [r.label, pdfFull(r[valueKey]), String(r.bookings || 0), String(r.completed || 0), String(r.cancelled || 0)]
                : [r.label, pdfFull(r[valueKey]), pdfFull(r.platformFee), pdfFull(r.gst), String(r.bookings || 0), String(r.completed || 0), String(r.cancelled || 0)]
            )
            : [['No data for this period', '—', '—', '—', '—', '—', '—'].slice(0, cols.length)];

        const foot = timeData.length > 0 ? [isLender
            ? ['TOTAL', pdfFull(totals.value), String(totals.bookings), String(totals.completed), String(totals.cancelled)]
            : ['TOTAL', pdfFull(totals.value), pdfFull(totals.fee), pdfFull(totals.gst), String(totals.bookings), String(totals.completed), String(totals.cancelled)]
        ] : [];

        autoTable(doc, {
            startY: seriesY,
            head: [cols], body, foot,
            styles: { fontSize: 8, cellPadding: 2.5 },
            headStyles: { fillColor: [46, 125, 50], fontStyle: 'bold' },
            footStyles: { fillColor: [27, 94, 32], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 253, 244] },
            columnStyles: { 0: { fontStyle: 'bold' } },
            margin: { left: 14, right: 14 },
        });

        // ── Category breakdown (page 2) ────────────────────
        if (catData.length) {
            doc.addPage();
            doc.setFillColor(27, 94, 32); doc.rect(0, 0, W, 16, 'F');
            drawPdfLogo(doc, 11, 8, 0.55);
            doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
            doc.text(`Category Breakdown — ${isLender ? 'Earnings' : 'Spend'}`, W / 2, 11, { align: 'center' });
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(200, 240, 200);
            doc.text(`${uName}  |  ${pLabel}  |  ${now}`, W / 2, 15, { align: 'center' });

            autoTable(doc, {
                startY: 22,
                head: [[isLender ? 'Category' : 'Category', isLender ? 'Total Earned' : 'Total Spent', 'Bookings']],
                body: catData.map(c => [c._id || 'Other', pdfFull(c[isLender ? 'earned' : 'spend']), String(c.bookings || 0)]),
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: [46, 125, 50] },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 }, 1: { cellWidth: 50 }, 2: { cellWidth: 22 } },
                margin: { left: 14 }, tableWidth: 142,
            });
        }

        // ── Footer ──────────────────────────────────────────
        const tp = doc.getNumberOfPages();
        for (let i = 1; i <= tp; i++) {
            doc.setPage(i);
            doc.setFillColor(244, 248, 244); doc.rect(0, H - 9, W, 9, 'F');
            doc.setDrawColor(200, 230, 200); doc.setLineWidth(0.3); doc.line(0, H - 9, W, H - 9);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(100, 130, 100);
            doc.text(`Krishi Astra Setu Pvt Ltd  |  Personal Analytics Report  |  ${uName}`, 14, H - 3);
            doc.setFont('helvetica', 'bold');
            doc.text(`Page ${i} of ${tp}`, W - 14, H - 3, { align: 'right' });
        }

        doc.save(`KAS-${view}-analytics-${period}-${new Date().toISOString().slice(0, 10)}.pdf`);
    }

    // ════════════ RENDER ════════════════════════════════════
    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', flexDirection: 'column', gap: '12px' }}>
            <RefreshCw size={32} color={G} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#6B7280', fontWeight: 700 }}>Loading your analytics…</p>
        </div>
    );

    return (
        <div style={{ fontFamily: "'Inter',sans-serif", background: '#F4F7F4', borderRadius: '20px', padding: '20px', minHeight: '200px' }}>


            {/* ── Header card ── */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#111827', margin: '0 0 2px' }}>📊 My Analytics</h2>
                    <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>Your personal rental &amp; lending performance</p>
                </div>
                <div style={{ display: 'flex', gap: '7px', alignItems: 'center', flexShrink: 0 }}>
                    <button onClick={() => { setLoading(true); fetch(`${API_BASE}/api/user/my-analytics`, { headers: { 'x-auth-token': authToken } }).then(r => r.json()).then(d => { if (d.success) setAnalytics(d.data) }).finally(() => setLoading(false)); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', border: `1.5px solid ${G}`, background: '#fff', color: G, fontWeight: 700, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <RefreshCw size={12} /> Refresh
                    </button>
                    <button onClick={exportCSV}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', border: 'none', background: '#EFF6FF', color: B, fontWeight: 700, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <FileText size={12} /> CSV
                    </button>
                    <button onClick={exportPDF}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', border: 'none', background: `linear-gradient(135deg,#1B5E20,${G})`, color: '#fff', fontWeight: 700, fontSize: '12px', cursor: 'pointer', boxShadow: '0 3px 10px rgba(46,125,50,0.3)', whiteSpace: 'nowrap' }}>
                        <Download size={12} /> Export PDF
                    </button>
                </div>
            </div>

            {/* ── View Toggle: Renter / Lender ── */}
            <div style={{ display: 'flex', gap: '0', background: '#E8F5E9', borderRadius: '12px', padding: '4px', marginBottom: '16px', width: 'fit-content', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {[['renter', '🛒 As Renter'], ['lender', '🚜 As Lender']].map(([v, l]) => (
                    <button key={v} onClick={() => setView(v)} style={{ padding: '9px 22px', borderRadius: '9px', border: 'none', background: view === v ? '#fff' : 'transparent', color: view === v ? G : '#6B7280', fontWeight: 800, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: view === v ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', whiteSpace: 'nowrap' }}>
                        {l}
                    </button>
                ))}
            </div>

            {/* ── KPI Cards ── */}
            {view === 'renter' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '12px', marginBottom: '22px' }}>
                    <KCard icon={ShoppingCart} label="My Bookings" value={d.renterBookings || 0} sub={`${d.renterCompleted || 0} completed`} color={B} bg="#EFF6FF" />
                    <KCard icon={CheckCircle2} label="Completed" value={d.renterCompleted || 0} sub={`${Math.round(((d.renterCompleted || 0) / (d.renterBookings || 1)) * 100)}% rate`} color={G} bg="#F0FDF4" />
                    <KCard icon={XCircle} label="Cancelled" value={d.renterCancelled || 0} sub="total cancelled" color={R} bg="#FEF2F2" />
                    <KCard icon={IndianRupee} label="Total Spent" value={fmtRs(d.renterTotalSpend)} sub="all-time" color="#F9A825" bg="#FFFBEB" />
                    <KCard icon={IndianRupee} label="Platform Fee" value={fmtRs(d.renterFee)} sub="5% commission paid" color={T} bg="#F0FDFA" />
                    <KCard icon={IndianRupee} label="GST Paid" value={fmtRs(d.renterGst)} sub="18% on rental" color={P} bg="#F5F3FF" />
                    <KCard icon={BarChart3} label="Period Bookings" value={totals.bookings} sub={PERIODS.find(x => x.id === period)?.label} color={B} bg="#EFF6FF" />
                    <KCard icon={TrendingUp} label="Period Spend" value={fmtRs(totals.value)} sub="for selected period" color={G} bg="#F0FDF4" />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '12px', marginBottom: '22px' }}>
                    <KCard icon={Tractor} label="Rentals Given" value={d.lenderBookings || 0} sub={`${d.lenderCompleted || 0} completed`} color={G} bg="#F0FDF4" />
                    <KCard icon={CheckCircle2} label="Completed" value={d.lenderCompleted || 0} sub={`${Math.round(((d.lenderCompleted || 0) / (d.lenderBookings || 1)) * 100)}% rate`} color={G} bg="#F0FDF4" />
                    <KCard icon={XCircle} label="Cancelled" value={d.lenderCancelled || 0} sub="total cancelled" color={R} bg="#FEF2F2" />
                    <KCard icon={IndianRupee} label="Total Earned" value={fmtRs(d.lenderTotalEarned)} sub="all-time gross" color="#F9A825" bg="#FFFBEB" />
                    <KCard icon={Package} label="Equipment Listed" value={d.myEquipmentCount || 0} sub="active tools" color={O} bg="#FFF7ED" />
                    <KCard icon={BarChart3} label="Period Bookings" value={totals.bookings} sub={PERIODS.find(x => x.id === period)?.label} color={B} bg="#EFF6FF" />
                    <KCard icon={TrendingUp} label="Period Earned" value={fmtRs(totals.value)} sub="for selected period" color={G} bg="#F0FDF4" />
                </div>
            )}

            {/* ── Filters ── */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '12px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <p style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, marginRight: '4px' }}>Period:</p>
                <div style={{ display: 'flex', gap: '5px', background: '#F3F4F6', borderRadius: '9px', padding: '3px' }}>
                    {PERIODS.map(p => (
                        <button key={p.id} onClick={() => setPeriod(p.id)} style={{ padding: '6px 12px', borderRadius: '7px', border: 'none', background: period === p.id ? G : 'transparent', color: period === p.id ? '#fff' : '#6B7280', fontWeight: 700, fontSize: '11px', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Charts Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '16px', marginBottom: '18px' }}>
                {/* Area chart */}
                <ChartWrap title={`📈 ${isLender ? 'Earnings' : 'Spend'} — ${PERIODS.find(x => x.id === period)?.label}`}>
                    {timeData.length === 0 ? (
                        <div style={{ height: chartH, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', color: '#9CA3AF' }}>
                            <BarChart3 size={28} style={{ opacity: 0.3 }} />
                            <p style={{ fontSize: '12px', fontWeight: 600 }}>No data for this period yet</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={chartH}>
                            <AreaChart data={timeData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                                <defs>
                                    <linearGradient id="ua1" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={G} stopOpacity={0.25} />
                                        <stop offset="95%" stopColor={G} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                <YAxis tickFormatter={v => fmtRs(v)} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                <Tooltip content={<CustomTip />} />
                                <Legend iconSize={8} iconType="circle" />
                                <Area type="monotone" dataKey={valueKey} name={isLender ? 'Earned' : 'Spent'} stroke={G} fill="url(#ua1)" strokeWidth={2.5} dot={false} />
                                {!isLender && <Area type="monotone" dataKey="platformFee" name="Platform Fee" stroke={B} fill="none" strokeWidth={1.8} dot={false} strokeDasharray="5 3" />}
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </ChartWrap>

                {/* Pie: category */}
                <ChartWrap title={`🥧 By Category`}>
                    {catData.length === 0 ? (
                        <div style={{ height: chartH, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}><p style={{ fontSize: '12px', fontWeight: 600 }}>No category data yet</p></div>
                    ) : (
                        <ResponsiveContainer width="100%" height={chartH}>
                            <PieChart>
                                <Pie data={catData} dataKey={isLender ? 'earned' : 'spend'} nameKey="_id" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}
                                    label={({ name, percent }) => percent > 0.08 ? `${name} ${(percent * 100).toFixed(0)}%` : ''} labelLine={false}>
                                    {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={v => fmtFull(v)} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </ChartWrap>
            </div>

            {/* ── Bar chart (bookings) ── */}
            <ChartWrap title={`📊 Booking Count — ${PERIODS.find(x => x.id === period)?.label}`}>
                {timeData.length === 0 ? (
                    <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}><p style={{ fontSize: '12px', fontWeight: 600 }}>No data for this period yet</p></div>
                ) : (
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={timeData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                            <Tooltip content={<CustomTip />} />
                            <Legend iconSize={9} />
                            <Bar dataKey="bookings" name="Total" fill={B} radius={[3, 3, 0, 0]} />
                            <Bar dataKey="completed" name="Completed" fill={G} radius={[3, 3, 0, 0]} />
                            <Bar dataKey="cancelled" name="Cancelled" fill={R} radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </ChartWrap>

            {/* ── Breakdown table ── */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginTop: '16px' }}>
                <p style={{ fontSize: '14px', fontWeight: 800, color: '#111827', margin: '0 0 14px' }}>
                    📋 {PERIODS.find(x => x.id === period)?.label} Breakdown Table
                </p>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                            <tr style={{ background: '#F9FAFB' }}>
                                {(isLender ? ['Period', 'Earned', 'Bookings', 'Completed', 'Cancelled'] : ['Period', 'Spend', 'Plat. Fee', 'GST', 'Bookings', 'Completed', 'Cancelled']).map(h => (
                                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#6B7280', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1.5px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {timeData.length === 0
                                ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF', fontWeight: 600 }}>No data for this period</td></tr>
                                : timeData.map((r, i) => (
                                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                                        <td style={{ padding: '9px 12px', fontWeight: 700, color: '#111827', borderBottom: '1px solid #F3F4F6' }}>{r.label}</td>
                                        <td style={{ padding: '9px 12px', fontWeight: 800, color: G, borderBottom: '1px solid #F3F4F6' }}>{fmtFull(r[valueKey])}</td>
                                        {!isLender && <td style={{ padding: '9px 12px', color: '#374151', borderBottom: '1px solid #F3F4F6' }}>{fmtFull(r.platformFee)}</td>}
                                        {!isLender && <td style={{ padding: '9px 12px', color: '#374151', borderBottom: '1px solid #F3F4F6' }}>{fmtFull(r.gst)}</td>}
                                        <td style={{ padding: '9px 12px', fontWeight: 700, color: B, borderBottom: '1px solid #F3F4F6' }}>{r.bookings}</td>
                                        <td style={{ padding: '9px 12px', color: G, fontWeight: 700, borderBottom: '1px solid #F3F4F6' }}>{r.completed}</td>
                                        <td style={{ padding: '9px 12px', color: R, fontWeight: 700, borderBottom: '1px solid #F3F4F6' }}>{r.cancelled}</td>
                                    </tr>
                                ))
                            }
                        </tbody>
                        {timeData.length > 0 && (
                            <tfoot>
                                <tr style={{ background: `linear-gradient(135deg,#1B5E20,${G})` }}>
                                    {(isLender
                                        ? ['TOTAL', fmtFull(totals.value), totals.bookings, totals.completed, totals.cancelled]
                                        : ['TOTAL', fmtFull(totals.value), fmtFull(totals.fee), fmtFull(totals.gst), totals.bookings, totals.completed, totals.cancelled]
                                    ).map((v, i) => (
                                        <td key={i} style={{ padding: '9px 12px', color: '#fff', fontWeight: 900, fontSize: '12px' }}>{v}</td>
                                    ))}
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

        </div>
    );
}
