'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { USERNAME_REGEX } from '@/lib/avatarColors';

const inputStyle: React.CSSProperties = {
    padding: '11px 14px',
    background: 'var(--vt-input-bg)',
    border: '1px solid var(--vt-border)',
    borderRadius: '9px', color: 'var(--vt-text)',
    fontSize: '14px', outline: 'none', width: '100%',
    fontFamily: 'Inter, sans-serif', transition: 'border-color 0.2s',
};
const labelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: 600, color: 'var(--vt-text2)',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    display: 'block', marginBottom: '6px',
};
const dividerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10,
    color: 'var(--vt-text3)', fontSize: '11px', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.5px',
};

type UnStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [unStatus, setUnStatus] = useState<UnStatus>('idle');
    const [unError, setUnError] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const checkUsername = (val: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!val) { setUnStatus('idle'); setUnError(''); return; }
        if (!USERNAME_REGEX.test(val)) {
            setUnStatus('invalid');
            if (val.length < 3) setUnError('Too short — at least 3 characters');
            else if (val.length > 20) setUnError('Too long — max 20 characters');
            else setUnError('Only letters, numbers, underscores, and periods');
            return;
        }
        setUnStatus('checking');
        setUnError('');
        debounceRef.current = setTimeout(async () => {
            const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(val)}`);
            const data = await res.json();
            setUnStatus(data.available ? 'available' : 'taken');
            if (!data.available) setUnError(`"${val}" is already taken`);
        }, 600);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!USERNAME_REGEX.test(username)) {
            setError('Please choose a valid username (letters, numbers, underscores, periods · 3–20 chars).');
            return;
        }
        if (unStatus === 'taken') {
            setError('That username is already taken. Please choose another.');
            return;
        }

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
                const q = new URLSearchParams({ registered: '1' });
                if (data.emailConfirmationRequired) q.set('pending', '1');
                router.replace(`/check-email?${q.toString()}`);
                return;
            }
            setError(data.error || 'Registration failed');
        } catch {
            setError('Network error. Please try again.');
        }
        setLoading(false);
    };

    const unBorderColor = unStatus === 'available' ? 'rgba(74,222,128,0.5)'
        : unStatus === 'taken' || unStatus === 'invalid' ? 'rgba(248,113,113,0.5)'
        : 'var(--vt-border)';

    return (
        <div style={{ minHeight: '100vh', background: 'var(--vt-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', margin: '-48px -24px 0', padding: '24px' }}>
            <div style={{ width: '100%', maxWidth: '440px', background: 'var(--vt-surface)', border: '1px solid var(--vt-border)', borderRadius: '20px', padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #4f6ef7, #9b5de5)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '18px', color: '#fff', fontWeight: 700 }}>V</div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--vt-text)', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Create your account</h1>
                    <p style={{ fontSize: '14px', color: 'var(--vt-text2)', margin: 0 }}>Start trading with $100K virtual cash</p>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#f87171' }}>{error}</div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Email */}
                    <div>
                        <label style={labelStyle}>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle} />
                    </div>

                    {/* Divider */}
                    <div style={dividerStyle}>
                        <div style={{ flex: 1, height: 1, background: 'var(--vt-border2)' }} />
                        Choose a username
                        <div style={{ flex: 1, height: 1, background: 'var(--vt-border2)' }} />
                    </div>

                    {/* Username */}
                    <div>
                        <label style={labelStyle}>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => { setUsername(e.target.value); checkUsername(e.target.value); }}
                            placeholder="e.g. aarnav_trades"
                            maxLength={20}
                            required
                            style={{ ...inputStyle, borderColor: unBorderColor }}
                        />
                        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: 6, minHeight: 18 }}>
                            {unStatus === 'idle' && <span style={{ fontSize: '12px', color: 'var(--vt-text2)' }}>Letters, numbers, underscores, periods · 3–20 chars</span>}
                            {unStatus === 'checking' && <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fbbf24', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /><span style={{ fontSize: '12px', color: 'var(--vt-text2)' }}>Checking…</span></>}
                            {unStatus === 'available' && <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /><span style={{ fontSize: '12px', color: '#4ade80' }}>&quot;{username}&quot; is available</span></>}
                            {(unStatus === 'taken' || unStatus === 'invalid') && <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f87171', display: 'inline-block' }} /><span style={{ fontSize: '12px', color: '#f87171' }}>{unError}</span></>}
                        </div>
                    </div>

                    {/* Divider */}
                    <div style={dividerStyle}>
                        <div style={{ flex: 1, height: 1, background: 'var(--vt-border2)' }} />
                        Set a password
                        <div style={{ flex: 1, height: 1, background: 'var(--vt-border2)' }} />
                    </div>

                    {/* Password */}
                    <div>
                        <label style={labelStyle}>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} style={inputStyle} />
                        <span style={{ fontSize: '12px', color: 'var(--vt-text2)', display: 'block', marginTop: 5 }}>At least 8 characters</span>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || unStatus === 'taken' || unStatus === 'invalid'}
                        style={{ padding: '12px', background: '#4f6ef7', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: (loading || unStatus === 'taken' || unStatus === 'invalid') ? 0.65 : 1, marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}
                    >
                        {loading && <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />}
                        {loading ? 'Creating…' : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--vt-text2)' }}>
                    Already have an account?{' '}
                    <Link href="/login" style={{ color: '#4f6ef7', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
                </p>
                <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: 'var(--vt-text3)' }}>
                    For educational purposes only. Not financial advice.
                </p>
            </div>
        </div>
    );
}
