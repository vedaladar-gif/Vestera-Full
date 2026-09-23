'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { clearGuestMode } from '@/lib/guestMode';
import { hasSeenTour, startTour } from '@/lib/onboarding';
import VesteraLogo from '@/components/VesteraLogo';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [successBanner, setSuccessBanner] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('registered') === '1') {
            setSuccessBanner('Account created! Please sign in.');
            window.history.replaceState({}, '', '/login');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setInfo(''); setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'same-origin',
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) { setError((data as { error?: string }).error || 'Login failed'); setLoading(false); return; }
            if (data.success === true) {
                clearGuestMode();
                if (data.needsUsername) {
                    window.location.assign('/setup-username');
                } else if (!hasSeenTour()) {
                    // First sign-in on this device → run the guided tutorial from the Market
                    startTour();
                    window.location.assign('/trade');
                } else {
                    window.location.assign('/trade');
                }
                return;
            }
            setError('Login failed');
        } catch { setError('Network error. Please try again.'); }
        setLoading(false);
    };

    const handleForgotPassword = async () => {
        setError(''); setInfo('');
        if (!username.trim()) { setError('Enter your email first.'); return; }
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: username.trim() }),
                credentials: 'same-origin',
            });
            const data = await res.json();
            if (!res.ok) setError(data.error || 'Failed to send reset email');
            else setInfo(data.message || 'Password reset email sent if the account exists.');
        } catch { setError('Network error.'); }
    };

    const inputBase: React.CSSProperties = {
        padding: '12px 15px',
        background: '#F8FAFC',
        border: '1px solid #E4E9F0',
        borderRadius: '10px',
        color: '#111827',
        fontSize: '14.5px',
        outline: 'none',
        width: '100%',
        fontFamily: "'Inter', sans-serif",
        transition: 'border-color 0.18s, box-shadow 0.18s',
    };

    const features = [
        { icon: '📊', text: 'Real-time stock prices from Yahoo Finance' },
        { icon: '🤖', text: 'Vesta AI explains every trade decision' },
        { icon: '🏆', text: 'Compete on global leaderboards' },
        { icon: '🎓', text: '30+ structured investing lessons' },
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--vt-bg)',
            display: 'flex',
            margin: '-32px -24px 0',
            fontFamily: "'Inter', sans-serif",
        }}>
            {/* ── LEFT PANEL — Illustration ── */}
            <div style={{
                flex: '1',
                background: 'linear-gradient(160deg, #0B1C33 0%, #0F2340 55%, #123454 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                padding: '60px 64px',
                position: 'relative',
                overflow: 'hidden',
                minWidth: 0,
            }}
                className="auth-left-panel"
            >
                {/* Background circles */}
                <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: 380 }}>
                    <div style={{ marginBottom: 40 }}>
                        <VesteraLogo height={36} />
                    </div>

                    <h1 style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 40, fontWeight: 800, color: '#fff',
                        letterSpacing: -1.8, lineHeight: 1.1, margin: '0 0 16px',
                    }}>
                        Invest smarter.<br />Risk nothing.
                    </h1>
                    <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: '0 0 40px' }}>
                        Practice with $100,000 in virtual cash. Real market data, zero real risk.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {features.map((f, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                                    background: 'rgba(52,211,153,0.16)',
                                    border: '1px solid rgba(52,211,153,0.25)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 15,
                                }}>{f.icon}</div>
                                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── RIGHT PANEL — Form ── */}
            <div style={{
                width: 480,
                flexShrink: 0,
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '48px 48px',
                borderLeft: '1px solid #E8ECF3',
                overflowY: 'auto',
            }}>
                <div style={{ width: '100%', maxWidth: 380 }}>
                    {/* Mobile logo */}
                    <div style={{ display: 'none', marginBottom: 32, justifyContent: 'center' }} className="auth-mobile-logo">
                        <VesteraLogo height={32} />
                    </div>

                    <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 26, fontWeight: 800, color: '#111827', margin: '0 0 6px', letterSpacing: -0.8 }}>
                        Welcome back
                    </h2>
                    <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 32px' }}>
                        Sign in to your Vestera account
                    </p>

                    {successBanner && (
                        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#16A34A', fontWeight: 500 }}>{successBanner}</div>
                    )}
                    {error && (
                        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#DC2626', fontWeight: 500 }}>{error}</div>
                    )}
                    {info && (
                        <div style={{ background: 'rgba(18,166,105,0.07)', border: '1px solid rgba(18,166,105,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#12A669', fontWeight: 500 }}>{info}</div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 8 }}>Email address</label>
                            <input
                                type="text" value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="you@example.com" required autoComplete="email"
                                style={inputBase}
                                onFocus={e => { e.target.style.borderColor = '#12A669'; e.target.style.boxShadow = '0 0 0 3px rgba(18,166,105,0.12)'; }}
                                onBlur={e => { e.target.style.borderColor = '#E8ECF3'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 8 }}>Password</label>
                            <input
                                type="password" value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••" required autoComplete="current-password"
                                style={inputBase}
                                onFocus={e => { e.target.style.borderColor = '#12A669'; e.target.style.boxShadow = '0 0 0 3px rgba(18,166,105,0.12)'; }}
                                onBlur={e => { e.target.style.borderColor = '#E8ECF3'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>

                        <button
                            type="submit" disabled={loading}
                            style={{
                                padding: '13px',
                                background: '#12A669',
                                color: '#fff', border: 'none', borderRadius: '10px',
                                fontSize: '14.5px', fontWeight: 700,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.85 : 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                fontFamily: "'Inter', sans-serif",
                                boxShadow: '0 2px 10px rgba(18,166,105,0.22)',
                                letterSpacing: '-0.1px',
                            }}
                        >
                            {loading && <span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />}
                            {loading ? 'Signing in…' : 'Sign In →'}
                        </button>
                    </form>

                    <button
                        type="button" onClick={handleForgotPassword}
                        style={{ width: '100%', marginTop: 10, padding: '11px', background: 'none', border: '1px solid #E4E9F0', borderRadius: '10px', color: '#6B7280', fontSize: '13.5px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
                    >Forgot password?</button>

                    <div style={{ marginTop: 26, padding: '16px 18px', background: '#F8FAFC', border: '1px solid #E4E9F0', borderRadius: 10, textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: 14, color: '#6B7280' }}>
                            Don&apos;t have an account?{' '}
                            <Link href="/register" style={{ color: '#12A669', textDecoration: 'none', fontWeight: 700 }}>Create one free →</Link>
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .auth-left-panel { display: none !important; }
                    .auth-mobile-logo { display: flex !important; }
                }
            `}</style>
        </div>
    );
}
