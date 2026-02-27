import { useEffect, useState } from 'react';
import logo from '../assets/logo.svg';

export default function SplashScreen({ onDone }) {
    const [dots, setDots] = useState('');
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        // Animate dots
        const dotInterval = setInterval(() => {
            setDots(d => d.length >= 4 ? '' : d + '.');
        }, 380);

        // After 2.2s, fade out and call onDone
        const fadeTimer = setTimeout(() => setFadeOut(true), 2200);
        const doneTimer = setTimeout(() => onDone?.(), 2750);

        return () => {
            clearInterval(dotInterval);
            clearTimeout(fadeTimer);
            clearTimeout(doneTimer);
        };
    }, []);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0',
            opacity: fadeOut ? 0 : 1,
            transition: 'opacity 0.5s ease',
            pointerEvents: fadeOut ? 'none' : 'all',
        }}>
            {/* Logo */}
            <img
                src={logo}
                alt="Krishi Astra Setu Logo"
                style={{
                    width: '110px',
                    height: '110px',
                    objectFit: 'contain',
                    animation: 'kasSplashPulse 1.8s ease-in-out infinite',
                    marginBottom: '16px',
                }}
            />

            {/* Project Name */}
            <h1 style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: '30px',
                fontWeight: '900',
                color: '#2E7D32',
                margin: '0 0 6px',
                letterSpacing: '0.01em',
                lineHeight: 1.2,
            }}>
                Krishi Astra Setu
            </h1>

            {/* Tagline */}
            <p style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '12px',
                fontWeight: '700',
                color: '#4CAF50',
                margin: '0 0 28px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
            }}>
                Bridging Tools, Empowering Farmers
            </p>

            {/* Loading bar */}
            <div style={{
                width: '160px',
                height: '4px',
                background: '#E8F5E9',
                borderRadius: '99px',
                overflow: 'hidden',
            }}>
                <div style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #2E7D32, #81C784)',
                    borderRadius: '99px',
                    animation: 'kasLoadBar 2.2s ease forwards',
                }} />
            </div>

            {/* Loading text */}
            <p style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '12px',
                color: '#9CA3AF',
                marginTop: '12px',
                letterSpacing: '0.02em',
            }}>
                Loading{dots}
            </p>

            <style>{`
                @keyframes kasSplashPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.06); }
                }
                @keyframes kasLoadBar {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
            `}</style>
        </div>
    );
}
