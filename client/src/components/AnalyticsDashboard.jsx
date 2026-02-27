/**
 * AnalyticsDashboard.jsx
 * ─────────────────────────────────────────────────────────────
 * Full analytics view for KAS Admin.
 * Drop this into AdminDashboard.jsx analytics tab.
 *
 * Features:
 *  • 5 time filters: Weekly / Monthly / Quarterly / Half-Yearly / Annual
 *  • Area chart  — Revenue over time
 *  • Bar chart   — Bookings over time
 *  • Composed    — Revenue + Bookings combined
 *  • Pie/Donut   — Category Revenue breakdown
 *  • Radial Bar  — Platform vs Lender earnings split
 *  • KPI summary cards (12 metrics)
 *  • Top Lenders table
 *  • Top Renters table
 *  • Export to PDF (jsPDF)
 *  • Export to CSV (native)
 */

import { useState, useMemo } from 'react';
import {
    AreaChart, Area, BarChart, Bar, ComposedChart, Line,
    PieChart, Pie, Cell, RadialBarChart, RadialBar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer
} from 'recharts';
import {
    TrendingUp, BarChart3, Users, Package, Download,
    FileText, RefreshCw, IndianRupee, ShieldCheck,
    CheckCircle2, XCircle, PieChart as PieIcon, Award
} from 'lucide-react';
import jsPDF from 'jspdf';
import _autoTable from 'jspdf-autotable';
const autoTable = typeof _autoTable === 'function' ? _autoTable : (_autoTable?.default ?? _autoTable);

// ── Palette ──────────────────────────────────────────────────
const P = {
    green: '#2E7D32', lime: '#8BC34A', teal: '#00796B',
    blue: '#1565C0', purple: '#6A1B9A', orange: '#E65100',
    red: '#C62828', gold: '#F9A825', sky: '#0288D1',
    pink: '#AD1457',
};
const CHART_COLORS = [P.green, P.blue, P.orange, P.purple, P.teal, P.pink, P.gold, P.sky];

// ── Helpers ──────────────────────────────────────────────────
function fmtRs(n) {
    if (!n) return '₹0';
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${Math.round(n).toLocaleString('en-IN')}`;
}
function fmtFull(n) { return `₹${Number(n || 0).toLocaleString('en-IN')}`; }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ── Time-period grouping ─────────────────────────────────────
const PERIODS = [
    { id: 'weekly', label: 'Weekly', days: 7 },
    { id: 'monthly', label: 'Monthly', days: 30 },
    { id: 'quarterly', label: 'Quarterly', days: 90 },
    { id: 'half', label: '6-Monthly', days: 180 },
    { id: 'annual', label: 'Annual', days: 365 },
];

/**
 * Group dailyData into buckets depending on period.
 * Returns array of { label, revenue, bookings, platformFee, gst, lenderEarnings, completed, cancelled }
 */
function groupData(dailyData, periodId) {
    const now = new Date();
    const cutoff = {
        weekly: 7,
        monthly: 30,
        quarterly: 90,
        half: 180,
        annual: 365,
    }[periodId] || 30;

    const cutDate = new Date(now - cutoff * 86400000);
    const filtered = dailyData.filter(d => new Date(d.date) >= cutDate);

    if (periodId === 'weekly') {
        // Group by day-of-week
        const map = {};
        filtered.forEach(d => {
            const dt = new Date(d.date);
            const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dt.getDay()];
            if (!map[dt.toISOString().slice(0, 10)]) map[dt.toISOString().slice(0, 10)] = { label: `${dow} ${dt.getDate()}/${dt.getMonth() + 1}`, ...d };
        });
        return Object.values(map).slice(-7);
    }

    if (periodId === 'monthly') {
        // Group by week number within last 30 days
        const weeks = {};
        filtered.forEach(d => {
            const dt = new Date(d.date);
            const diff = Math.floor((now - dt) / (7 * 86400000));
            const key = `Week -${diff}`;
            if (!weeks[key]) weeks[key] = { label: key, revenue: 0, bookings: 0, platformFee: 0, gst: 0, lenderEarnings: 0, completed: 0, cancelled: 0 };
            weeks[key].revenue += d.revenue;
            weeks[key].bookings += d.bookings;
            weeks[key].platformFee += d.platformFee;
            weeks[key].gst += d.gst;
            weeks[key].lenderEarnings += d.lenderEarnings;
            weeks[key].completed += d.completed;
            weeks[key].cancelled += d.cancelled;
        });
        const entries = Object.entries(weeks).sort((a, b) => a[0] < b[0] ? 1 : -1).slice(0, 4).reverse();
        return entries.map(([k, v]) => ({ ...v, label: v.label.replace('Week -0', 'This Week').replace('Week -1', 'Last Week').replace('Week -2', '2 Wks Ago').replace('Week -3', '3 Wks Ago') }));
    }

    if (periodId === 'quarterly' || periodId === 'half') {
        // Group by month
        const months = {};
        filtered.forEach(d => {
            const dt = new Date(d.date);
            const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
            const label = `${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
            if (!months[key]) months[key] = { label, revenue: 0, bookings: 0, platformFee: 0, gst: 0, lenderEarnings: 0, completed: 0, cancelled: 0 };
            months[key].revenue += d.revenue;
            months[key].bookings += d.bookings;
            months[key].platformFee += d.platformFee;
            months[key].gst += d.gst;
            months[key].lenderEarnings += d.lenderEarnings;
            months[key].completed += d.completed;
            months[key].cancelled += d.cancelled;
        });
        return Object.entries(months).sort((a, b) => a[0] > b[0] ? 1 : -1).map(([, v]) => v);
    }

    // Annual — group into bi-months
    const bim = {};
    filtered.forEach(d => {
        const dt = new Date(d.date);
        const bimIdx = Math.floor(dt.getMonth() / 2);
        const key = `${dt.getFullYear()}-${bimIdx}`;
        const label = `${MONTHS[bimIdx * 2]}-${MONTHS[bimIdx * 2 + 1]} ${dt.getFullYear()}`;
        if (!bim[key]) bim[key] = { label, revenue: 0, bookings: 0, platformFee: 0, gst: 0, lenderEarnings: 0, completed: 0, cancelled: 0 };
        bim[key].revenue += d.revenue;
        bim[key].bookings += d.bookings;
        bim[key].platformFee += d.platformFee;
        bim[key].gst += d.gst;
        bim[key].lenderEarnings += d.lenderEarnings;
        bim[key].completed += d.completed;
        bim[key].cancelled += d.cancelled;
    });
    return Object.entries(bim).sort((a, b) => a[0] > b[0] ? 1 : -1).map(([, v]) => v);
}

// ── Custom tooltip ────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minWidth: '180px' }}>
            <p style={{ fontWeight: 800, color: '#111827', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
            {payload.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '4px' }}>
                    <span style={{ color: p.color, fontWeight: 700 }}>{p.name}</span>
                    <span style={{ fontWeight: 800, color: '#111827' }}>
                        {p.name.toLowerCase().includes('revenue') || p.name.toLowerCase().includes('earning') || p.name.toLowerCase().includes('fee') || p.name.toLowerCase().includes('gst')
                            ? fmtFull(p.value) : p.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ── KPI card ─────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color, bg }) {
    return (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `5px solid ${color}`, display: 'flex', gap: '14px', alignItems: 'flex-start', minWidth: '0' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} color={color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{label}</p>
                <p style={{ fontSize: '22px', fontWeight: 900, color: '#111827', margin: '0 0 2px', wordBreak: 'break-all' }}>{value}</p>
                {sub && <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>{sub}</p>}
            </div>
        </div>
    );
}

// ── Chart wrapper ─────────────────────────────────────────────
function ChartCard({ title, children, onExpand }) {
    return (
        <div style={{ background: '#fff', borderRadius: '18px', padding: '22px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <p style={{ fontSize: '15px', fontWeight: 800, color: '#111827', margin: 0 }}>{title}</p>
                {onExpand && <button onClick={onExpand} style={{ fontSize: '11px', color: P.green, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Expand ↗</button>}
            </div>
            {children}
        </div>
    );
}

// ── Leaderboard row ───────────────────────────────────────────
function LBRow({ rank, name, value, sub }) {
    const medals = ['🥇', '🥈', '🥉'];
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{medals[rank - 1] || `#${rank}`}</span>
            <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: 0 }}>{name || '—'}</p>
                {sub && <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>{sub}</p>}
            </div>
            <span style={{ fontSize: '14px', fontWeight: 800, color: P.green }}>{value}</span>
        </div>
    );
}

// ────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────
export default function AnalyticsDashboard({ analytics, onRefresh, loading }) {
    const [period, setPeriod] = useState('monthly');
    const [chartType, setChartType] = useState('area');

    const d = analytics || {};

    // ── Grouped time-series data ─────────────────────────────
    const timeData = useMemo(() => {
        if (!d.dailyData?.length) return [];
        return groupData(d.dailyData, period);
    }, [d.dailyData, period]);

    // ── Category pie data ─────────────────────────────────────
    const catData = useMemo(() => (d.categoryRevenue || []).map(c => ({
        name: c._id || 'Unknown', value: c.revenue || 0, bookings: c.bookings || 0
    })), [d.categoryRevenue]);

    // ── Radial: platform vs lender split ─────────────────────
    const radialData = [
        { name: 'Platform Income', value: d.platformRevenue || 0, fill: P.blue },
        { name: 'Lender Earnings', value: d.totalSubtotal || 0, fill: P.green },
    ];

    // ── Period summary totals ─────────────────────────────────
    const periodTotals = useMemo(() => timeData.reduce((acc, r) => ({
        revenue: acc.revenue + (r.revenue || 0),
        bookings: acc.bookings + (r.bookings || 0),
        completed: acc.completed + (r.completed || 0),
        cancelled: acc.cancelled + (r.cancelled || 0),
        fee: acc.fee + (r.platformFee || 0),
        gst: acc.gst + (r.gst || 0),
    }), { revenue: 0, bookings: 0, completed: 0, cancelled: 0, fee: 0, gst: 0 }),
        [timeData]);

    // ════════════════════════════════════════════════════════
    // CSV EXPORT
    // ════════════════════════════════════════════════════════
    function exportCSV() {
        const rows = [
            ['Period Label', 'Revenue (₹)', 'Lender Earnings (₹)', 'Platform Fee (₹)', 'GST (₹)', 'Bookings', 'Completed', 'Cancelled'],
            ...timeData.map(r => [
                r.label, r.revenue || 0, r.lenderEarnings || 0, r.platformFee || 0, r.gst || 0,
                r.bookings || 0, r.completed || 0, r.cancelled || 0
            ])
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `KAS-Analytics-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click(); URL.revokeObjectURL(url);
    }

    // ════════════════════════════════════════════════════════
    // PDF EXPORT  —  fixed: Rs. instead of rupee symbol, logo, proper layout
    // ════════════════════════════════════════════════════════
    function exportPDF() {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const W = doc.internal.pageSize.getWidth();   // 297 mm
        const H = doc.internal.pageSize.getHeight();  // 210 mm
        const now = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
        const pLabel = PERIODS.find(p => p.id === period)?.label || period;

        // ── PDF-safe currency formatter (no Unicode ₹) ───────
        function pdfRs(n) {
            const v = Number(n || 0);
            if (v >= 10000000) return `Rs. ${(v / 10000000).toFixed(2)} Cr`;
            if (v >= 100000) return `Rs. ${(v / 100000).toFixed(2)} L`;
            if (v >= 1000) return `Rs. ${(v / 1000).toFixed(2)} K`;
            return `Rs. ${v.toLocaleString('en-IN')}`;
        }
        function pdfRsFull(n) {
            return `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;
        }

        // ── Draw KAS Tractor Logo ────────────────────────────
        function drawLogo(doc, ox, oy, s) {
            // Outer circle (badge)
            doc.setFillColor(240, 255, 240);
            doc.setDrawColor(46, 125, 50);
            doc.setLineWidth(0.6);
            doc.circle(ox, oy, 10 * s, 'FD');
            // Tractor body
            doc.setFillColor(46, 125, 50);
            doc.setDrawColor(46, 125, 50);
            doc.roundedRect(ox - 4.5 * s, oy - 1.5 * s, 6 * s, 4 * s, 0.5, 0.5, 'F');
            // Cabin
            doc.setFillColor(27, 94, 32);
            doc.roundedRect(ox - 1.5 * s, oy - 4.5 * s, 4 * s, 3.2 * s, 0.4, 0.4, 'F');
            // Big rear wheel
            doc.setFillColor(27, 94, 32);
            doc.circle(ox - 3 * s, oy + 3.2 * s, 3.2 * s, 'F');
            doc.setFillColor(240, 255, 240);
            doc.circle(ox - 3 * s, oy + 3.2 * s, 1.5 * s, 'F');
            // Small front wheel
            doc.setFillColor(27, 94, 32);
            doc.circle(ox + 3.2 * s, oy + 3.2 * s, 2.2 * s, 'F');
            doc.setFillColor(240, 255, 240);
            doc.circle(ox + 3.2 * s, oy + 3.2 * s, 1 * s, 'F');
            // Exhaust
            doc.setFillColor(46, 125, 50);
            doc.rect(ox - 0.5 * s, oy - 6.5 * s, 1 * s, 2.5 * s, 'F');
        }

        // ── PAGE 1 HEADER ────────────────────────────────────
        const HDR = 46;
        // Dark green banner
        doc.setFillColor(27, 94, 32);
        doc.rect(0, 0, W, HDR, 'F');
        // Subtle diagonal stripe accent
        doc.setFillColor(46, 125, 50);
        doc.triangle(0, 0, 60, 0, 0, HDR, 'F');

        // Logo
        drawLogo(doc, 20, HDR / 2, 0.85);

        // Company name + tagline
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('Krishi Astra Setu', 36, 16);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(180, 230, 180);
        doc.text('BRIDGING TOOLS, EMPOWERING FARMERS', 36, 22);

        // Report title (centre)
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Platform Analytics Report', W / 2, 18, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(200, 240, 200);
        doc.text(`Period: ${pLabel}`, W / 2, 26, { align: 'center' });

        // Right meta block
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Generated:', W - 14, 14, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.text(now, W - 14, 20, { align: 'right' });
        doc.text(`Total Bookings: ${d.totalBookings || 0}`, W - 14, 28, { align: 'right' });
        doc.text(`Total Revenue:  ${pdfRs(d.totalRevenue)}`, W - 14, 34, { align: 'right' });
        doc.text(`Platform Income: ${pdfRs(d.platformRevenue)}`, W - 14, 40, { align: 'right' });

        // ── KPI Summary (2-column layout) ────────────────────
        const kpiData = [
            ['Total Bookings', String(d.totalBookings || 0)],
            ['Completed', String(d.completedBookings || 0)],
            ['Cancelled', String(d.cancelledBookings || 0)],
            ['Cancellation Rate', `${d.cancellationRate || 0}%`],
            ['Total Revenue', pdfRsFull(d.totalRevenue)],
            ['Lender Earnings', pdfRsFull(d.totalSubtotal)],
            ['Platform Fee (5%)', pdfRsFull(d.totalFee)],
            ['GST Collected', pdfRsFull(d.totalGst)],
            ['Platform Income', pdfRsFull(d.platformRevenue)],
            ['Active Equipment', String(d.activeEquipment || 0)],
            ['Total Members', String(d.totalUsers || 0)],
            ['Pending KYC', String(d.pendingKyc || 0)],
        ];

        // Left KPI table
        autoTable(doc, {
            startY: HDR + 6,
            head: [['Metric', 'Value']],
            body: kpiData.slice(0, 6),
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [46, 125, 50], fontStyle: 'bold', fontSize: 9 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 52 }, 1: { cellWidth: 42 } },
            margin: { left: 14 },
            tableWidth: 94,
        });

        // Right KPI table (same startY)
        autoTable(doc, {
            startY: HDR + 6,
            head: [['Metric', 'Value']],
            body: kpiData.slice(6),
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [46, 125, 50], fontStyle: 'bold', fontSize: 9 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 52 }, 1: { cellWidth: 42 } },
            margin: { left: 113 },
            tableWidth: 94,
        });

        // ── Time-series Breakdown Table ──────────────────────
        const afterKpi = Math.max(doc.lastAutoTable.finalY, HDR + 6 + (kpiData.length / 2) * 8) + 8;

        const tSeriesBody = timeData.length > 0
            ? timeData.map(r => [
                r.label,
                pdfRsFull(r.revenue),
                pdfRsFull(r.lenderEarnings),
                pdfRsFull(r.platformFee),
                pdfRsFull(r.gst),
                String(r.bookings || 0),
                String(r.completed || 0),
                String(r.cancelled || 0),
            ])
            : [['No data for this period', '—', '—', '—', '—', '—', '—', '—']];

        const tSeriesFoot = timeData.length > 0
            ? [['TOTAL',
                pdfRsFull(periodTotals.revenue), '—',
                pdfRsFull(periodTotals.fee),
                pdfRsFull(periodTotals.gst),
                String(periodTotals.bookings),
                String(periodTotals.completed),
                String(periodTotals.cancelled)]]
            : [];

        autoTable(doc, {
            startY: afterKpi,
            head: [['Period', 'Revenue', 'Lender Earnings', 'Platform Fee', 'GST', 'Bookings', 'Completed', 'Cancelled']],
            body: tSeriesBody,
            foot: tSeriesFoot,
            styles: { fontSize: 8, cellPadding: 2.5 },
            headStyles: { fillColor: [46, 125, 50], fontStyle: 'bold' },
            footStyles: { fillColor: [27, 94, 32], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 253, 244] },
            columnStyles: { 0: { fontStyle: 'bold' } },
            margin: { left: 14, right: 14 },
        });

        // ── PAGE 2: Category + Leaderboards ─────────────────
        doc.addPage();

        // Page 2 header strip
        doc.setFillColor(27, 94, 32);
        doc.rect(0, 0, W, 18, 'F');
        drawLogo(doc, 12, 9, 0.6);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Category Revenue & Leaderboards', W / 2, 12, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(200, 240, 200);
        doc.text(`Krishi Astra Setu  |  ${pLabel}  |  ${now}`, W / 2, 16, { align: 'center' });

        const startY2 = 24;

        // Category table (left third)
        autoTable(doc, {
            startY: startY2,
            head: [['Equipment Category', 'Revenue', 'Bookings']],
            body: catData.length > 0
                ? catData.map(c => [c.name, pdfRsFull(c.value), String(c.bookings)])
                : [['No category data yet', '—', '—']],
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [46, 125, 50] },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 38 }, 2: { cellWidth: 22 } },
            margin: { left: 14 },
            tableWidth: 110,
        });

        // Top Lenders (middle)
        autoTable(doc, {
            startY: startY2,
            head: [['#', 'Lender Name', 'Earnings', 'Jobs']],
            body: (d.topLenders || []).length > 0
                ? d.topLenders.map((l, i) => [`#${i + 1}`, l.name?.trim() || '—', pdfRsFull(l.subtotal), String(l.count)])
                : [['—', 'No lender data', '—', '—']],
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [21, 101, 192] },
            columnStyles: { 0: { cellWidth: 10 }, 1: { fontStyle: 'bold', cellWidth: 38 }, 2: { cellWidth: 34 }, 3: { cellWidth: 12 } },
            margin: { left: 132 },
            tableWidth: 94,
        });

        // Top Renters (right area, below lenders)
        const afterLenders = doc.lastAutoTable.finalY + 8;
        autoTable(doc, {
            startY: afterLenders,
            head: [['#', 'Renter Name', 'Total Spend', 'Jobs']],
            body: (d.topRenters || []).length > 0
                ? d.topRenters.map((r, i) => [`#${i + 1}`, r.name?.trim() || '—', pdfRsFull(r.spend), String(r.count)])
                : [['—', 'No renter data', '—', '—']],
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [106, 27, 154] },
            columnStyles: { 0: { cellWidth: 10 }, 1: { fontStyle: 'bold', cellWidth: 38 }, 2: { cellWidth: 34 }, 3: { cellWidth: 12 } },
            margin: { left: 132 },
            tableWidth: 94,
        });

        // ── Footer on every page ─────────────────────────────
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            // Footer bar
            doc.setFillColor(244, 248, 244);
            doc.rect(0, H - 10, W, 10, 'F');
            doc.setDrawColor(200, 230, 200);
            doc.setLineWidth(0.3);
            doc.line(0, H - 10, W, H - 10);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(100, 130, 100);
            doc.text('Krishi Astra Setu Pvt Ltd  |  Confidential Analytics Report  |  Not for external distribution', 14, H - 4);
            doc.setFont('helvetica', 'bold');
            doc.text(`Page ${i} of ${totalPages}`, W - 14, H - 4, { align: 'right' });
        }

        doc.save(`KAS-Analytics-${period}-${new Date().toISOString().slice(0, 10)}.pdf`);
    }

    // ════════════════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════════════════
    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', flexDirection: 'column', gap: '16px' }}>
            <RefreshCw size={36} color={P.green} className="animate-spin" />
            <p style={{ color: '#6B7280', fontWeight: 700 }}>Loading Analytics…</p>
        </div>
    );

    if (!analytics) return (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>
            <BarChart3 size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontWeight: 700 }}>No analytics data yet.</p>
        </div>
    );

    const chartH = 260;

    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Header ────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#111827', margin: 0 }}>📊 Platform Analytics</h2>
                    <p style={{ color: '#6B7280', fontSize: '13px', margin: '4px 0 0' }}>Real-time KAS performance metrics</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', border: `1.5px solid ${P.green}`, background: 'transparent', color: P.green, fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', border: 'none', background: '#EFF6FF', color: '#1565C0', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                        <FileText size={14} /> Export CSV
                    </button>
                    <button onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#1B5E20,#2E7D32)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', boxShadow: '0 3px 10px rgba(46,125,50,0.3)' }}>
                        <Download size={14} /> Export PDF
                    </button>
                </div>
            </div>

            {/* ── 12 KPI Cards ──────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '14px', marginBottom: '28px' }}>
                <KpiCard icon={BarChart3} label="Total Bookings" value={d.totalBookings || 0} sub={`${d.completedBookings || 0} completed`} color={P.blue} bg="#EFF6FF" />
                <KpiCard icon={CheckCircle2} label="Completed" value={d.completedBookings || 0} sub={`${Math.round(((d.completedBookings || 0) / (d.totalBookings || 1)) * 100)}% success`} color={P.green} bg="#F0FDF4" />
                <KpiCard icon={XCircle} label="Cancelled" value={d.cancelledBookings || 0} sub={`${d.cancellationRate || 0}% rate`} color={P.red} bg="#FEF2F2" />
                <KpiCard icon={IndianRupee} label="Total Revenue" value={fmtRs(d.totalRevenue)} sub="all-time gross" color={P.gold} bg="#FFFBEB" />
                <KpiCard icon={TrendingUp} label="Lender Earnings" value={fmtRs(d.totalSubtotal)} sub="rental amounts paid" color={P.green} bg="#F0FDF4" />
                <KpiCard icon={ShieldCheck} label="Platform Income" value={fmtRs(d.platformRevenue)} sub="fee + GST collected" color={P.blue} bg="#EFF6FF" />
                <KpiCard icon={IndianRupee} label="Platform Fee " value={fmtRs(d.totalFee)} sub="5% commission" color={P.teal} bg="#F0FDFA" />
                <KpiCard icon={IndianRupee} label="GST Collected" value={fmtRs(d.totalGst)} sub="18% on rent" color={P.purple} bg="#F5F3FF" />
                <KpiCard icon={Package} label="Equipment Listed" value={d.activeEquipment || 0} sub="active listings" color={P.orange} bg="#FFF7ED" />
                <KpiCard icon={Users} label="Total Members" value={d.totalUsers || 0} sub={`${d.pendingKyc || 0} pending KYC`} color={P.sky} bg="#F0F9FF" />
                <KpiCard icon={PieIcon} label="Period Revenue" value={fmtRs(periodTotals.revenue)} sub={`${PERIODS.find(x => x.id === period)?.label}`} color={P.green} bg="#F0FDF4" />
                <KpiCard icon={Award} label="Period Bookings" value={periodTotals.bookings} sub={`${periodTotals.completed} completed`} color={P.blue} bg="#EFF6FF" />
            </div>

            {/* ── Period + Chart Type Filters ── */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '14px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '24px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                    <p style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Time Period</p>
                    <div style={{ display: 'flex', gap: '6px', background: '#F3F4F6', borderRadius: '10px', padding: '4px' }}>
                        {PERIODS.map(p => (
                            <button key={p.id} onClick={() => setPeriod(p.id)} style={{ padding: '7px 14px', borderRadius: '7px', border: 'none', background: period === p.id ? P.green : 'transparent', color: period === p.id ? '#fff' : '#6B7280', fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <p style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Chart Type</p>
                    <div style={{ display: 'flex', gap: '6px', background: '#F3F4F6', borderRadius: '10px', padding: '4px' }}>
                        {[['area', 'Area Revenue'], ['bar', 'Bar Bookings'], ['composed', 'Combined']].map(([t, l]) => (
                            <button key={t} onClick={() => setChartType(t)} style={{ padding: '7px 14px', borderRadius: '7px', border: 'none', background: chartType === t ? '#1565C0' : 'transparent', color: chartType === t ? '#fff' : '#6B7280', fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s' }}>
                                {l}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Main Time-Series Chart ────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <ChartCard title={`📈 Revenue & Bookings — ${PERIODS.find(x => x.id === period)?.label}`}>
                    {timeData.length === 0 ? (
                        <div style={{ height: chartH, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', flexDirection: 'column', gap: '8px' }}>
                            <BarChart3 size={32} style={{ opacity: 0.3 }} />
                            <p style={{ fontSize: '13px', fontWeight: 600 }}>No data for this period yet</p>
                        </div>
                    ) : chartType === 'area' ? (
                        <ResponsiveContainer width="100%" height={chartH}>
                            <AreaChart data={timeData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                                <defs>
                                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={P.green} stopOpacity={0.25} />
                                        <stop offset="95%" stopColor={P.green} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gFee" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={P.blue} stopOpacity={0.25} />
                                        <stop offset="95%" stopColor={P.blue} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                                <YAxis tickFormatter={v => fmtRs(v)} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" iconSize={8} />
                                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={P.green} fill="url(#gRev)" strokeWidth={2.5} dot={false} />
                                <Area type="monotone" dataKey="lenderEarnings" name="Lender Earnings" stroke={P.lime} fill="url(#gRev)" strokeWidth={2} dot={false} />
                                <Area type="monotone" dataKey="platformFee" name="Platform Fee" stroke={P.blue} fill="url(#gFee)" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : chartType === 'bar' ? (
                        <ResponsiveContainer width="100%" height={chartH}>
                            <BarChart data={timeData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="square" iconSize={10} />
                                <Bar yAxisId="left" dataKey="bookings" name="Bookings" fill={P.blue} radius={[4, 4, 0, 0]} />
                                <Bar yAxisId="left" dataKey="completed" name="Completed" fill={P.green} radius={[4, 4, 0, 0]} />
                                <Bar yAxisId="left" dataKey="cancelled" name="Cancelled" fill={P.red} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <ResponsiveContainer width="100%" height={chartH}>
                            <ComposedChart data={timeData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                                <YAxis yAxisId="rev" tickFormatter={v => fmtRs(v)} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                                <YAxis yAxisId="cnt" orientation="right" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconSize={10} />
                                <Bar yAxisId="cnt" dataKey="bookings" name="Bookings" fill={P.blue} radius={[3, 3, 0, 0]} opacity={0.85} />
                                <Bar yAxisId="cnt" dataKey="completed" name="Completed" fill={P.green} radius={[3, 3, 0, 0]} opacity={0.85} />
                                <Line yAxisId="rev" dataKey="revenue" name="Revenue" stroke={P.gold} strokeWidth={2.5} dot={false} type="monotone" />
                                <Line yAxisId="rev" dataKey="platformFee" name="Platform Fee" stroke={P.purple} strokeWidth={2} dot={false} type="monotone" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* ── Pie — Category Revenue ───── */}
                <ChartCard title="🥧 Revenue by Category">
                    {catData.length === 0 ? (
                        <div style={{ height: chartH, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}><p style={{ fontWeight: 600 }}>No category data yet</p></div>
                    ) : (
                        <ResponsiveContainer width="100%" height={chartH}>
                            <PieChart>
                                <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''} labelLine={false}>
                                    {catData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(v) => fmtFull(v)} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>
            </div>

            {/* ── Radial + Leaderboards ─────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>

                {/* Radial: platform vs lender */}
                <ChartCard title="💰 Earnings Split">
                    <ResponsiveContainer width="100%" height={220}>
                        <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270}>
                            <RadialBar minAngle={15} dataKey="value" cornerRadius={6} label={{ position: 'insideStart', fill: '#fff', fontWeight: 800, fontSize: 11 }} />
                            <Legend iconType="circle" iconSize={10} />
                            <Tooltip formatter={(v) => fmtFull(v)} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Top Lenders */}
                <ChartCard title="🏆 Top Lenders by Earnings">
                    {(d.topLenders || []).length === 0
                        ? <p style={{ color: '#9CA3AF', textAlign: 'center', marginTop: '30px', fontSize: '13px' }}>No lender data yet</p>
                        : (d.topLenders || []).map((l, i) => (
                            <LBRow key={i} rank={i + 1} name={l.name?.trim() || '—'} value={fmtFull(l.subtotal)} sub={`${l.count} booking${l.count !== 1 ? 's' : ''}`} />
                        ))
                    }
                </ChartCard>

                {/* Top Renters */}
                <ChartCard title="🛒 Top Renters by Spend">
                    {(d.topRenters || []).length === 0
                        ? <p style={{ color: '#9CA3AF', textAlign: 'center', marginTop: '30px', fontSize: '13px' }}>No renter data yet</p>
                        : (d.topRenters || []).map((r, i) => (
                            <LBRow key={i} rank={i + 1} name={r.name?.trim() || '—'} value={fmtFull(r.spend)} sub={`${r.count} booking${r.count !== 1 ? 's' : ''}`} />
                        ))
                    }
                </ChartCard>
            </div>

            {/* ── Period Summary Table ──────── */}
            <ChartCard title={`📋 ${PERIODS.find(x => x.id === period)?.label} Breakdown Table`}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: '#F9FAFB' }}>
                                {['Period', 'Revenue', 'Lender Earnings', 'Platform Fee', 'GST', 'Bookings', 'Completed', 'Cancelled'].map(h => (
                                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {timeData.length === 0
                                ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#9CA3AF', fontWeight: 600 }}>No data for this period</td></tr>
                                : timeData.map((r, i) => (
                                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#111827', border: 'none', borderBottom: '1px solid #F3F4F6' }}>{r.label}</td>
                                        <td style={{ padding: '10px 14px', fontWeight: 800, color: P.green, borderBottom: '1px solid #F3F4F6' }}>{fmtFull(r.revenue)}</td>
                                        <td style={{ padding: '10px 14px', color: '#374151', borderBottom: '1px solid #F3F4F6' }}>{fmtFull(r.lenderEarnings)}</td>
                                        <td style={{ padding: '10px 14px', color: '#374151', borderBottom: '1px solid #F3F4F6' }}>{fmtFull(r.platformFee)}</td>
                                        <td style={{ padding: '10px 14px', color: '#374151', borderBottom: '1px solid #F3F4F6' }}>{fmtFull(r.gst)}</td>
                                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1565C0', borderBottom: '1px solid #F3F4F6' }}>{r.bookings}</td>
                                        <td style={{ padding: '10px 14px', color: P.green, fontWeight: 700, borderBottom: '1px solid #F3F4F6' }}>{r.completed}</td>
                                        <td style={{ padding: '10px 14px', color: P.red, fontWeight: 700, borderBottom: '1px solid #F3F4F6' }}>{r.cancelled}</td>
                                    </tr>
                                ))
                            }
                        </tbody>
                        {timeData.length > 0 && (
                            <tfoot>
                                <tr style={{ background: 'linear-gradient(135deg,#1B5E20,#2E7D32)' }}>
                                    {['TOTAL', fmtFull(periodTotals.revenue), '—', fmtFull(periodTotals.fee), fmtFull(periodTotals.gst), periodTotals.bookings, periodTotals.completed, periodTotals.cancelled].map((v, i) => (
                                        <td key={i} style={{ padding: '10px 14px', color: '#fff', fontWeight: 900, fontSize: '13px' }}>{v}</td>
                                    ))}
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </ChartCard>

        </div>
    );
}
