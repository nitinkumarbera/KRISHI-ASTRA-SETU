import API_BASE from '../utils/api';
import { useEffect, useRef, useState } from 'react';

const API = `${API_BASE}`;

// Generate or retrieve a persistent session ID for this browser
function getSessionId() {
    let id = localStorage.getItem('kas_session_id');
    if (!id) {
        id = 'ks_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem('kas_session_id', id);
    }
    return id;
}

// Odometer digit display for the big total counter
function OdometerDigits({ total }) {
    const str = String(total).padStart(8, '0');
    return (
        <div style={{
            display: 'inline-flex', gap: '2px', background: '#111',
            borderRadius: '6px', padding: '4px 8px', fontFamily: 'monospace',
        }}>
            {str.split('').map((d, i) => (
                <span key={i} style={{
                    display: 'inline-block', width: '20px', textAlign: 'center',
                    fontSize: '22px', fontWeight: 900, color: '#fff',
                    background: '#1a1a1a', borderRadius: '4px', lineHeight: '30px',
                    borderBottom: '2px solid #444',
                }}>
                    {d}
                </span>
            ))}
        </div>
    );
}

const ROW_ICONS = ['👤', '👤', '👥', '👥', '👤', '👤', '📊'];
const ROW_LABELS = ['Today', 'Yesterday', 'This week', 'Last week', 'This month', 'Last month', 'All'];

export default function VisitorCounter() {
    const [stats, setStats] = useState(null);
    const [now, setNow] = useState(new Date());
    const sessionId = useRef(getSessionId());

    const fetchStats = async () => {
        try {
            const r = await fetch(`${API}/api/visits/stats`);
            const d = await r.json();
            if (d.success) setStats(d.data);
        } catch (_) { }
    };

    const pingServer = async () => {
        try {
            await fetch(`${API}/api/visits/ping`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: sessionId.current }),
            });
        } catch (_) { }
    };

    useEffect(() => {
        // Ping once on load, then every 60s
        pingServer();
        fetchStats();
        const pingInterval = setInterval(pingServer, 60000);
        // Refresh stats every 30s
        const statsInterval = setInterval(fetchStats, 30000);
        // Clock tick every second
        const clockInterval = setInterval(() => setNow(new Date()), 1000);
        return () => {
            clearInterval(pingInterval);
            clearInterval(statsInterval);
            clearInterval(clockInterval);
        };
    }, []);

    const rowValues = stats
        ? [stats.today, stats.yesterday, stats.thisWeek, stats.lastWeek, stats.thisMonth, stats.lastMonth, stats.total]
        : ['-', '-', '-', '-', '-', '-', '-'];

    const formatNow = () => now.toLocaleString('en-IN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });

    return (
        <div style={{
            background: 'linear-gradient(135deg, #1a3a2a 0%, #0d2218 100%)',
            border: '2px solid #2E7D32',
            borderRadius: '14px',
            padding: '16px 20px',
            minWidth: '230px',
            maxWidth: '260px',
            color: '#fff',
            fontFamily: 'system-ui, sans-serif',
            boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
        }}>
            {/* Header */}
            <div style={{
                background: '#2E7D32', borderRadius: '8px', padding: '6px 10px',
                textAlign: 'center', fontWeight: 800, fontSize: '13px',
                color: '#fff', marginBottom: '14px', letterSpacing: '0.04em',
            }}>
                🌐 Live Visitors Counter
            </div>

            {/* Odometer */}
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <OdometerDigits total={stats?.total ?? 0} />
            </div>

            {/* Stats Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
                {ROW_LABELS.map((label, i) => (
                    <div key={label} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        fontSize: '12px', padding: '3px 0',
                        borderBottom: i < ROW_LABELS.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                    }}>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                            {ROW_ICONS[i]} {label}
                        </span>
                        <span style={{
                            fontWeight: 700, color: '#8BC34A',
                            fontVariantNumeric: 'tabular-nums',
                        }}>
                            {rowValues[i]?.toLocaleString?.('en-IN') ?? rowValues[i]}
                        </span>
                    </div>
                ))}
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', marginBottom: '10px' }} />

            {/* Online + Clock */}
            <div style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
                <div>
                    <span style={{
                        display: 'inline-block', width: '8px', height: '8px',
                        borderRadius: '50%', background: '#4CAF50',
                        marginRight: '5px', animation: 'kasBlink 1.2s infinite',
                        verticalAlign: 'middle',
                    }} />
                    <strong style={{ color: '#8BC34A' }}>{stats?.online ?? 0}</strong> online now
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>{formatNow()}</div>
            </div>

            <style>{`
                @keyframes kasBlink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.2; }
                }
            `}</style>
        </div>
    );
}
