'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { validateUsername } from '@/utils/usernameValidation';
import { startTour } from '@/lib/onboarding';
import VesteraLogo from '@/components/VesteraLogo';

const inputBase: React.CSSProperties = {
    padding: '13px 16px',
    background: '#F8FAFC',
    border: '1.5px solid #E8ECF3',
    borderRadius: '14px',
    color: '#111827',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    transition: 'border-color 0.18s, box-shadow 0.18s',
};
const DIVIDER: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10,
    color: '#94A3B8', fontSize: '11px', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.5px',
};

type UnStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error';

export default function RegisterPage() {
    const [email, setEmail]       = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);
    const router = useRouter();
    const [unStatus, setUnStatus] = useState<UnStatus>('idle');
    const [unError, setUnError]   = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const checkUsername = (val: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!val) { setUnStatus('idle'); setUnError(''); return; }
        const check = validateUsername(val);
        if (!check.valid) { setUnStatus('invalid'); setUnError(check.error ?? 'Choose a different username'); return; }
        setUnStatus('checking'); setUnError('');
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(val)}`);
                const data = await res.json();
                if (!res.ok || data.checkFailed) {
                    setUnStatus('error');
                    setUnError(data.error ?? 'Could not verify username. Try again.');
                    return;
                }
                if (!data.available) {
                    setUnStatus(data.restricted ? 'invalid' : 'taken');
                    setUnError(data.restricted ? (data.error ?? 'Choose a different username') : `"${val}" is already taken`);
                } else {
                    setUnStatus('available');
                    setUnError('');
                }
            } catch {
                setUnStatus('error');
                setUnError('Could not verify username. Try again.');
            }
        }, 500);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setError('');
        const usernameCheck = validateUsername(username);
        if (!usernameCheck.valid) { setError(usernameCheck.error ?? 'Please choose a valid username.'); return; }
        if (unStatus === 'taken') { setError('That username is already taken.'); return; }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
                credentials: 'same-origin',
            });
            const data = await res.json();
            if (data.success) {
                startTour();
                const q = new URLSearchParams({ registered: '1' });
                if (data.emailConfirmationRequired) q.set('pending', '1');
                router.replace(`/check-email?${q.toString()}`);
                return;
            }
            setError(data.error || 'Registration failed');
        } catch { setError('Network error. Please try again.'); }
        setLoading(false);
    };

    const unBorder = unStatus === 'available' ? 'rgba(34,197,94,0.5)'
        : (unStatus === 'taken' || unStatus === 'invalid') ? 'rgba(239,68,68,0.5)'
        : unStatus === 'error' ? 'rgba(245,158,11,0.5)'
        : '#E8ECF3';

    const focusIn = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.style.borderColor = '#5B8EFF';
        e.target.style.boxShadow = '0 0 0 3px rgba(79,124,255,0.12)';
    };
    const focusOut = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.style.borderColor = '#E8ECF3';
        e.target.style.boxShadow = 'none';
    };

    const features = [
        { icon: '💸', text: 'Start with $100,000 virtual portfolio' },
        { icon: '📈', text: 'Trade 500+ real stocks with live data' },
        { icon: '🤖', text: 'AI coach explains every market move' },
        { icon: '🏆', text: 'Climb the leaderboard against friends' },
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--vt-bg)',
            display: 'flex',
            margin: '-32px -24px 0',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
            {/* ── LEFT PANEL ── */}
            <div style={{
                flex: '1',
                background: 'linear-gradient(145deg, #3B5CF0 0%, #5B8EFF 50%, #10B981 100%)',
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
                <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: 380 }}>
                    <div style={{ marginBottom: 40 }}>
                        <VesteraLogo height={36} />
                    </div>
                    <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: -1.8, lineHeight: 1.1, margin: '0 0 16px' }}>
                        Your investing<br />journey starts here.
                    </h1>
                    <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: '0 0 40px' }}>
                        Join thousands of learners mastering the stock market — completely free.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {features.map((f, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{f.icon}</div>
                                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── RIGHT PANEL — Form ── */}
            <div style={{
                width: 500,
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
                <div style={{ width: '100%', maxWidth: 400 }}>
                    <div style={{ display: 'none', marginBottom: 32, justifyContent: 'center' }} className="auth-mobile-logo">
                        <VesteraLogo height={32} />
                    </div>

                    <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 800, color: '#111827', margin: '0 0 6px', letterSpacing: -0.8 }}>
                        Create your account
                    </h2>
                    <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 28px' }}>
                        Free forever · No credit card required
                    </p>

                    {error && (
                        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#DC2626', fontWeight: 500 }}>{error}</div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 8 }}>Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inputBase} onFocus={focusIn} onBlur={focusOut} />
                        </div>

                        <div style={DIVIDER}>
                            <div style={{ flex: 1, height: 1, background: '#E8ECF3' }} />
                            <span>Username</span>
                            <div style={{ flex: 1, height: 1, background: '#E8ECF3' }} />
                        </div>

                        <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 8 }}>Username</label>
                            <input
                                type="text" value={username}
                                onChange={e => { setUsername(e.target.value); checkUsername(e.target.value); }}
                                placeholder="e.g. aarnav_trades" maxLength={20} required
                                style={{ ...inputBase, borderColor: unBorder }}
                                onFocus={e => { e.target.style.borderColor = unBorder !== '#E8ECF3' ? unBorder : '#5B8EFF'; e.target.style.boxShadow = '0 0 0 3px rgba(79,124,255,0.12)'; }}
                                onBlur={e => { e.target.style.borderColor = unBorder; e.target.style.boxShadow = 'none'; }}
                            />
                            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, minHeight: 18 }}>
                                {unStatus === 'idle' && <span style={{ fontSize: 12, color: '#94A3B8' }}>Letters, numbers, underscores · 3–20 chars</span>}
                                {unStatus === 'checking' && <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', display: 'inline-block', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} /><span style={{ fontSize: 12, color: '#6B7280' }}>Checking…</span></>}
                                {unStatus === 'available' && <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block', flexShrink: 0 }} /><span style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>&quot;{username}&quot; is available</span></>}
                                {(unStatus === 'taken' || unStatus === 'invalid') && <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444', display: 'inline-block', flexShrink: 0 }} /><span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>{unError}</span></>}
                                {unStatus === 'error' && <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', display: 'inline-block', flexShrink: 0 }} /><span style={{ fontSize: 12, color: '#B45309', fontWeight: 600 }}>{unError}</span></>}
                            </div>
                        </div>

                        <div style={DIVIDER}>
                            <div style={{ flex: 1, height: 1, background: '#E8ECF3' }} />
                            <span>Password</span>
                            <div style={{ flex: 1, height: 1, background: '#E8ECF3' }} />
                        </div>

                        <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 8 }}>Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} style={inputBase} onFocus={focusIn} onBlur={focusOut} />
                            <span style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginTop: 5 }}>At least 8 characters</span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || unStatus === 'taken' || unStatus === 'invalid'}
                            style={{
                                padding: '14px',
                                background: 'linear-gradient(135deg, #5B8EFF 0%, #4F7CFF 100%)',
                                color: '#fff', border: 'none', borderRadius: '50px',
                                fontSize: '15px', fontWeight: 800,
                                cursor: (loading || unStatus === 'taken' || unStatus === 'invalid') ? 'not-allowed' : 'pointer',
                                opacity: (loading || unStatus === 'taken' || unStatus === 'invalid') ? 0.6 : 1,
                                marginTop: 6,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                boxShadow: '0 4px 18px rgba(139,92,246,0.3)',
                                letterSpacing: '-0.2px',
                            }}
                        >
                            {loading && <span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />}
                            {loading ? 'Creating…' : 'Create Free Account →'}
                        </button>
                    </form>

                    <div style={{ marginTop: 24, padding: '16px 20px', background: '#F8FAFC', borderRadius: 14, textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: 14, color: '#6B7280' }}>
                            Already have an account?{' '}
                            <Link href="/login" style={{ color: '#4F7CFF', textDecoration: 'none', fontWeight: 700 }}>Sign in →</Link>
                        </p>
                    </div>
                    <p style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: '#94A3B8' }}>
                        For educational purposes only. Not financial advice.
                    </p>
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
