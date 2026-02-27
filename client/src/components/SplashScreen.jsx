import { useEffect, useState } from 'react';
import logo from '../assets/logo.svg';

export default function SplashScreen({ onDone }) {
    const [dots, setDots] = useState('');
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        const dotInterval = setInterval(() => {
            setDots(d => d.length >= 4 ? '' : d + '.');
        }, 380);
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
            position: 'fixed', inset: 0, zIndex: 99999,
            background: '#fff',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            opacity: fadeOut ? 0 : 1,
            transition: 'opacity 0.5s ease',
            pointerEvents: fadeOut ? 'none' : 'all',
        }}>
            <img src={logo} alt="Krishi Astra Setu Logo" style={{
                width: '110px', height: '110px', objectFit: 'contain',
                animation: 'kasPulse 1.8s ease-in-out infinite',
                marginBottom: '18px',
            }} />
            <h1 style={{ fontFamily: "'Georgia', serif", fontSize: '30px', fontWeight: 900, color: '#2E7D32', margin: '0 0 6px' }}>
                Krishi Astra Setu
            </h1>
            <p style={{ fontFamily: 'system-ui', fontSize: '11px', fontWeight: 700, color: '#4CAF50', margin: '0 0 28px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                Bridging Tools, Empowering Farmers
            </p>
            <div style={{ width: '160px', height: '4px', background: '#E8F5E9', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg,#2E7D32,#81C784)', borderRadius: '99px', animation: 'kasBar 2.2s ease forwards' }} />
            </div>
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '12px' }}>Loading{dots}</p>
            <style>{`
                @keyframes kasPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
                @keyframes kasBar { 0%{width:0%} 100%{width:100%} }
            `}</style>
        </div>
    );
}
