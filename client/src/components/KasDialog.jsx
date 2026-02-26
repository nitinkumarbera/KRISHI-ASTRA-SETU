/**
 * KasDialog — Branded replacement for window.alert / confirm / prompt
 *
 * Usage:
 *   1. Mount <KasDialogProvider /> once in App.jsx (or Root)
 *   2. Import and call kasAlert / kasConfirm / kasPrompt anywhere
 *
 *   await kasAlert('Something went wrong.');
 *   const ok = await kasConfirm('Delete this booking?');
 *   const reason = await kasPrompt('Enter reason for cancellation:');
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Singleton event bus ─────────────────────────────────────
let _resolve = null;
const _listeners = new Set();
let _pending = null;

function emit(dialog) {
    _pending = dialog;
    _listeners.forEach(fn => fn(dialog));
}

// ── Public API ──────────────────────────────────────────────
export function kasAlert(message, title = 'Krishi Astra Setu') {
    return new Promise(resolve => {
        _resolve = resolve;
        emit({ type: 'alert', title, message });
    });
}

export function kasConfirm(message, title = 'Krishi Astra Setu') {
    return new Promise(resolve => {
        _resolve = resolve;
        emit({ type: 'confirm', title, message });
    });
}

export function kasPrompt(message, title = 'Krishi Astra Setu', defaultValue = '') {
    return new Promise(resolve => {
        _resolve = resolve;
        emit({ type: 'prompt', title, message, defaultValue });
    });
}

// ── Provider component ──────────────────────────────────────
export function KasDialogProvider() {
    const [dialog, setDialog] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef(null);

    const handler = useCallback(d => {
        setInputValue(d.defaultValue || '');
        setDialog(d);
    }, []);

    useEffect(() => {
        _listeners.add(handler);
        if (_pending) handler(_pending);
        return () => _listeners.delete(handler);
    }, [handler]);

    useEffect(() => {
        if (dialog?.type === 'prompt' && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 80);
        }
    }, [dialog]);

    function settle(value) {
        setDialog(null);
        _pending = null;
        if (_resolve) {
            _resolve(value);
            _resolve = null;
        }
    }

    if (!dialog) return null;

    const isAlert = dialog.type === 'alert';
    const isConfirm = dialog.type === 'confirm';
    const isPrompt = dialog.type === 'prompt';

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '420px',
                boxShadow: '0 24px 80px rgba(0,0,0,0.35)', overflow: 'hidden',
                animation: 'kas-pop 0.18s ease'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #1B5E20, #2E7D32)',
                    padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                    {/* Mini logo mark */}
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '20px', flexShrink: 0
                    }}>🌾</div>
                    <div>
                        <p style={{ color: '#fff', fontWeight: 800, fontSize: '15px', margin: 0 }}>
                            {dialog.title}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', margin: 0 }}>
                            Bridging Tools, Empowering Farmers
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '24px 24px 16px' }}>
                    <p style={{ fontSize: '14px', color: '#374151', margin: '0 0 16px', lineHeight: 1.6 }}>
                        {dialog.message}
                    </p>
                    {isPrompt && (
                        <input
                            ref={inputRef}
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') settle(inputValue); if (e.key === 'Escape') settle(null); }}
                            style={{
                                width: '100%', padding: '10px 14px',
                                border: '1.5px solid #D1D5DB', borderRadius: '10px',
                                fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                                fontFamily: 'inherit', color: '#111827'
                            }}
                            onFocus={e => { e.target.style.borderColor = '#2E7D32'; }}
                            onBlur={e => { e.target.style.borderColor = '#D1D5DB'; }}
                            placeholder="Type here…"
                        />
                    )}
                </div>

                {/* Footer Buttons */}
                <div style={{
                    padding: '0 24px 20px',
                    display: 'flex', gap: '10px', justifyContent: 'flex-end'
                }}>
                    {(isConfirm || isPrompt) && (
                        <button
                            onClick={() => settle(isPrompt ? null : false)}
                            style={{
                                padding: '10px 22px', borderRadius: '10px',
                                border: '1.5px solid #E5E7EB', background: '#F9FAFB',
                                color: '#6B7280', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={() => settle(isAlert ? true : isConfirm ? true : inputValue)}
                        style={{
                            padding: '10px 24px', borderRadius: '10px', border: 'none',
                            background: 'linear-gradient(135deg, #2E7D32, #388E3C)',
                            color: '#fff', fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(46,125,50,0.35)'
                        }}
                    >
                        {isAlert ? 'OK' : isConfirm ? 'Confirm' : 'Submit'}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes kas-pop {
                    from { transform: scale(0.92); opacity: 0; }
                    to   { transform: scale(1);    opacity: 1; }
                }
            `}</style>
        </div>
    );
}
