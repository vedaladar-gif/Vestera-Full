'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AVATAR_COLOR_KEYS, getAvatarGradient, getInitials, isEmailUsername } from '@/lib/avatarColors';
import { validateUsername } from '@/utils/usernameValidation';

const STEP_COUNT = 3;

export default function SetupUsernamePage() {
    const [step, setStep] = useState(1);
    const [username, setUsername] = useState('');
    const [avatarColor, setAvatarColor] = useState('blue');
    const [unStatus, setUnStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error'>('idle');
    const [unError, setUnError] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [authChecked, setAuthChecked] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const router = useRouter();

    // Auth gate: redirect if not logged in or already has a real username
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
                if (cancelled) return;
                if (!res.ok) {
                    router.replace('/login');
                    return;
                }
                const data = await res.json();
                if (cancelled) return;
                if (data.authenticated !== true) {
                    router.replace('/login');
                    return;
                }
                if (!isEmailUsername(data.username)) {
                    window.location.assign('/trade');
                    return;
                }
                setAuthChecked(true);
            } catch {
                if (!cancelled) router.replace('/login');
            }
        })();
        return () => { cancelled = true; };
    }, [router]);

    const checkUsername = (val: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!val) { setUnStatus('idle'); setUnError(''); return; }

        // Instant local validation: format + content moderation
        const check = validateUsername(val);
        if (!check.valid) {
            setUnStatus('invalid');
            setUnError(check.error ?? 'Choose a different username');
            return;
        }

        setUnStatus('checking');
        setUnError('');
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

    const handleSave = async () => {
        if (!username || unStatus !== 'available') return;
        setSaving(true);
        setError('');
        try {
            const res = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, avatar_color: avatarColor }),
            });
            const data = await res.json();
            if (!data.success) { setError(data.error || 'Failed to save'); setSaving(false); return; }
            window.location.assign('/trade');
        } catch {
            setError('Network error. Please try again.');
            setSaving(false);
        }
    };

    if (!authChecked) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--vt-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 32, height: 32, border: '3px solid rgba(79,110,247,0.2)', borderTopColor: '#4f6ef7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
        );
    }

    const canProceed1 = unStatus === 'available';
    const initials = username ? getInitials(username) : '?';

    const progressDots = Array.from({ length: STEP_COUNT }, (_, i) => (
        <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < step ? '#4f6ef7' : 'var(--vt-border)', transition: 'background 0.3s' }} />
    ));

    const inputStyle: React.CSSProperties = {
        padding: '11px 14px',
        background: 'var(--vt-input-bg)',
        borderRadius: '9px',
        color: 'var(--vt-text)',
        fontSize: '14px',
        outline: 'none',
        width: '100%',
        fontFamily: 'Inter, sans-serif',
        transition: 'border-color 0.2s',
    };

    const unBorderColor = unStatus === 'available' ? 'rgba(74,222,128,0.5)'
        : unStatus === 'taken' || unStatus === 'invalid' ? 'rgba(248,113,113,0.5)'
        : unStatus === 'error' ? 'rgba(251,191,36,0.5)'
        : 'var(--vt-border)';

    return (
        <div style={{ minHeight: '100vh', background: 'var(--vt-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', margin: '-48px -24px 0', padding: '24px' }}>
            <div style={{ width: '100%', maxWidth: '440px', background: 'var(--vt-surface)', border: '1px solid var(--vt-border)', borderRadius: '20px', padding: '40px' }}>
                {/* Progress */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>{progressDots}</div>

                {/* Step 1: Choose username */}
                {step === 1 && (
                    <>
                        <div style={{ marginBottom: 28 }}>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--vt-text)', margin: '0 0 8px', letterSpacing: '-0.5px' }}>One quick thing</h1>
                            <p style={{ fontSize: 14, color: 'var(--vt-text2)', margin: 0, lineHeight: 1.6 }}>
                                Choose a public username. This is how you&apos;ll appear on the leaderboard — your email stays private.
                            </p>
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--vt-text2)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => { setUsername(e.target.value); checkUsername(e.target.value); }}
                                placeholder="e.g. aarnav_trades"
                                maxLength={20}
                                autoFocus
                                style={{ ...inputStyle, border: `1px solid ${unBorderColor}` }}
                            />
                            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, minHeight: 18 }}>
                                {unStatus === 'idle' && <span style={{ fontSize: 12, color: 'var(--vt-text2)' }}>Letters, numbers, underscores, periods · 3–20 chars</span>}
                                {unStatus === 'checking' && <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fbbf24', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /><span style={{ fontSize: 12, color: 'var(--vt-text2)' }}>Checking availability…</span></>}
                                {unStatus === 'available' && <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /><span style={{ fontSize: 12, color: '#4ade80' }}>&quot;{username}&quot; is available</span></>}
                                {(unStatus === 'taken' || unStatus === 'invalid') && <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f87171', display: 'inline-block' }} /><span style={{ fontSize: 12, color: '#f87171' }}>{unError}</span></>}
                                {unStatus === 'error' && <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} /><span style={{ fontSize: 12, color: '#d97706' }}>{unError}</span></>}
                            </div>
                        </div>
                        <button
                            onClick={() => setStep(2)}
                            disabled={!canProceed1}
                            style={{ width: '100%', padding: '12px', background: '#4f6ef7', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: canProceed1 ? 'pointer' : 'not-allowed', opacity: canProceed1 ? 1 : 0.5, fontFamily: 'inherit' }}
                        >
                            Continue →
                        </button>
                    </>
                )}

                {/* Step 2: Choose avatar color */}
                {step === 2 && (
                    <>
                        <div style={{ marginBottom: 28 }}>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--vt-text)', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Pick an avatar</h1>
                            <p style={{ fontSize: 14, color: 'var(--vt-text2)', margin: 0, lineHeight: 1.6 }}>
                                Your initials will show in this color next to your name on the leaderboard.
                            </p>
                        </div>

                        {/* Preview */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: 'rgba(79,110,247,0.06)', border: '1px solid rgba(79,110,247,0.15)', borderRadius: 12, marginBottom: 24 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 14, background: getAvatarGradient(avatarColor), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                                {initials}
                            </div>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--vt-text)' }}>@{username}</div>
                                <div style={{ fontSize: 12, color: 'var(--vt-text2)', marginTop: 2 }}>Vestera Paper Trader</div>
                            </div>
                        </div>

                        {/* Color grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
                            {AVATAR_COLOR_KEYS.map(color => (
                                <div
                                    key={color}
                                    onClick={() => setAvatarColor(color)}
                                    style={{
                                        height: 44, borderRadius: 12,
                                        background: getAvatarGradient(color),
                                        cursor: 'pointer',
                                        border: `2px solid ${avatarColor === color ? '#fff' : 'transparent'}`,
                                        boxShadow: avatarColor === color ? `0 0 0 2px #4f6ef7` : 'none',
                                        transition: 'transform 0.1s, border-color 0.15s',
                                        transform: avatarColor === color ? 'scale(1.06)' : 'scale(1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {avatarColor === color ? '✓' : ''}
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setStep(1)} style={{ flex: 1, padding: '11px', background: 'var(--vt-input-bg)', border: '1px solid var(--vt-border)', borderRadius: '10px', fontSize: '14px', fontWeight: 600, color: 'var(--vt-text2)', cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                            <button onClick={() => setStep(3)} style={{ flex: 2, padding: '12px', background: '#4f6ef7', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Continue →</button>
                        </div>
                    </>
                )}

                {/* Step 3: Confirm */}
                {step === 3 && (
                    <>
                        <div style={{ marginBottom: 28 }}>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--vt-text)', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Looks good!</h1>
                            <p style={{ fontSize: 14, color: 'var(--vt-text2)', margin: 0, lineHeight: 1.6 }}>
                                Here&apos;s how you&apos;ll appear. You can always change this later in Settings.
                            </p>
                        </div>

                        <div style={{ padding: '24px', background: 'var(--vt-input-bg)', border: '1px solid var(--vt-border2)', borderRadius: 14, marginBottom: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ width: 64, height: 64, borderRadius: 18, background: getAvatarGradient(avatarColor), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                                    {initials}
                                </div>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--vt-text)' }}>@{username}</div>
                                    <div style={{ fontSize: 13, color: 'var(--vt-text2)', marginTop: 4 }}>Rank will appear after your first trade</div>
                                </div>
                            </div>
                        </div>

                        {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', padding: '10px 14px', marginBottom: 16, fontSize: '13px', color: '#f87171' }}>{error}</div>}

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setStep(2)} style={{ flex: 1, padding: '11px', background: 'var(--vt-input-bg)', border: '1px solid var(--vt-border)', borderRadius: '10px', fontSize: '14px', fontWeight: 600, color: 'var(--vt-text2)', cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{ flex: 2, padding: '12px', background: '#4f6ef7', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                            >
                                {saving && <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
                                {saving ? 'Saving…' : 'Go to Dashboard →'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
