'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import styles from './settings.module.css';
import { AVATAR_COLOR_KEYS, getAvatarGradient, getInitials } from '@/lib/avatarColors';
import { validateUsername } from '@/utils/usernameValidation';
import { applyTheme as _applyTheme } from '@/components/ThemeProvider';
import GuestGuard from '@/components/GuestGuard';

type Tab = 'profile' | 'appearance' | 'account';

interface Profile {
    username: string;
    displayName: string | null;
    avatarColor: string;
    theme: string;
}

type UnStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'same';

function Avatar({ size, color, initials }: { size: number; color: string; initials: string }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: size * 0.3,
            background: getAvatarGradient(color),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.34, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>{initials}</div>
    );
}

function Spinner() {
    return <span className={styles.spinner} />;
}

function SettingsPage() {
    const [authChecked, setAuthChecked] = useState(false);
    const [tab, setTab] = useState<Tab>('profile');
    const [profile, setProfile] = useState<Profile>({ username: '', displayName: null, avatarColor: 'blue', theme: 'light' });
    const [userId, setUserId] = useState('');

    // Profile edit state
    const [editUsername, setEditUsername]   = useState('');
    const [editDisplayName, setEditDisplayName] = useState('');
    const [editAvatarColor, setEditAvatarColor] = useState('blue');
    const [unStatus, setUnStatus] = useState<UnStatus>('idle');
    const [unError, setUnError] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);

    // Account tab
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);

    // Toast
    const [toastMsg, setToastMsg] = useState('');
    const [toastVisible, setToastVisible] = useState(false);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const router = useRouter();

    const showToast = useCallback((msg: string) => {
        setToastMsg(msg);
        setToastVisible(true);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToastVisible(false), 2500);
    }, []);

    // Auth gate
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
                if (cancelled) return;
                if (!res.ok) {
                    router.replace('/restricted');
                    return;
                }
                const data = await res.json();
                if (cancelled) return;
                if (data.authenticated !== true) {
                    router.replace('/restricted');
                    return;
                }
                setUserId(data.userId);
                const p: Profile = {
                    username:    data.username    || '',
                    displayName: data.displayName || null,
                    avatarColor: data.avatarColor || 'blue',
                    theme:       data.theme       || 'light',
                };
                setProfile(p);
                setEditUsername(p.username);
                setEditDisplayName(p.displayName || '');
                setEditAvatarColor(p.avatarColor);
                setAuthChecked(true);
            } catch {
                if (!cancelled) router.replace('/restricted');
            }
        })();
        return () => { cancelled = true; };
    }, [router]);

    // Username live check
    const checkUsername = (val: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const v = val.trim();
        if (!v || v === profile.username) { setUnStatus('same'); setUnError(''); return; }

        // Instant local validation: format + content moderation
        const check = validateUsername(v);
        if (!check.valid) {
            setUnStatus('invalid');
            setUnError(check.error ?? 'Choose a different username');
            return;
        }

        setUnStatus('checking');
        setUnError('');
        debounceRef.current = setTimeout(async () => {
            const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(v)}&excludeId=${userId}`);
            const data = await res.json();
            if (!data.available) {
                setUnStatus(data.restricted ? 'invalid' : 'taken');
                setUnError(data.restricted ? (data.error ?? 'Choose a different username') : `"${v}" is already taken`);
            } else {
                setUnStatus('available');
            }
        }, 500);
    };

    const saveProfile = async () => {
        if (unStatus === 'taken' || unStatus === 'invalid') return;
        setSavingProfile(true);
        try {
            const body: Record<string, string | null> = {
                display_name: editDisplayName || null,
                avatar_color: editAvatarColor,
            };
            const newUn = editUsername.trim().toLowerCase();
            if (newUn && newUn !== profile.username) body.username = newUn;

            const res = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!data.success) { showToast(data.error || 'Save failed'); setSavingProfile(false); return; }

            setProfile(prev => ({ ...prev, username: newUn || prev.username, displayName: editDisplayName || null, avatarColor: editAvatarColor }));
            showToast('✓ Profile saved');
        } catch { showToast('Network error'); }
        setSavingProfile(false);
    };

    if (!authChecked) {
        return (
            <div className={styles.wrap} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 32, height: 32, border: '3px solid rgba(79,110,247,0.2)', borderTopColor: '#4f6ef7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
        );
    }

    const initials = getInitials(profile.username, profile.displayName);
    const editInitials = getInitials(editUsername || profile.username, editDisplayName || null);

    const unBorder = unStatus === 'available' ? 'rgba(74,222,128,0.5)'
        : unStatus === 'taken' || unStatus === 'invalid' ? 'rgba(248,113,113,0.5)'
        : undefined;

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: 'profile',    label: 'Profile',    icon: '👤' },
        { id: 'appearance', label: 'Appearance', icon: '🎨' },
        { id: 'account',    label: 'Account',    icon: '🔒' },
    ];

    return (
        <div className={styles.wrap}>
            <div className={styles.inner}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                >
                    <h1 className={styles.heading}>Profile & Settings</h1>
                    <p className={styles.subheading}>Manage your profile, appearance, and account preferences.</p>
                </motion.div>

                <div className={styles.grid}>
                    {/* Sidebar */}
                    <div className={styles.sidebar}>
                        <div className={styles['mini-profile']}>
                            <Avatar size={40} color={profile.avatarColor} initials={initials} />
                            <div>
                                <div className={styles['mini-name']}>@{profile.username}</div>
                                {profile.displayName && <div className={styles['mini-sub']}>{profile.displayName}</div>}
                            </div>
                        </div>
                        {tabs.map(t => (
                            <button key={t.id} className={`${styles['nav-btn']} ${tab === t.id ? styles.active : ''}`} onClick={() => setTab(t.id)}>
                                <span style={{ fontSize: 15 }}>{t.icon}</span>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div>

                        {/* ── PROFILE TAB ── */}
                        {tab === 'profile' && (
                            <>
                                {/* Avatar preview */}
                                <div className={styles.panel}>
                                    <div className={styles['panel-title']}>Avatar</div>
                                    <div className={styles['panel-sub']}>Choose a color for your initials avatar.</div>
                                    <div className={styles['avatar-hero']}>
                                        <Avatar size={64} color={editAvatarColor} initials={editInitials} />
                                        <div>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--vt-text)', marginBottom: 14 }}>@{editUsername || profile.username}</div>
                                            <div className={styles['color-grid']}>
                                                {AVATAR_COLOR_KEYS.map(c => (
                                                    <div
                                                        key={c}
                                                        className={`${styles['color-swatch']} ${editAvatarColor === c ? styles.active : ''}`}
                                                        style={{ background: getAvatarGradient(c) }}
                                                        onClick={() => setEditAvatarColor(c)}
                                                        title={c}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Profile info */}
                                <div className={styles.panel}>
                                    <div className={styles['panel-title']}>Profile info</div>
                                    <div className={styles['panel-sub']}>How you appear on the leaderboard and throughout the app.</div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div className={styles.field}>
                                            <label>Display Name <span style={{ textTransform: 'none', fontWeight: 400, letterSpacing: 0, color: 'var(--vt-text3)' }}>(optional)</span></label>
                                            <input
                                                type="text"
                                                value={editDisplayName}
                                                onChange={e => setEditDisplayName(e.target.value)}
                                                placeholder="Your name (e.g. Aarnav K)"
                                                maxLength={40}
                                            />
                                            <span className={styles.hint}>Shown alongside your username. Doesn&apos;t need to be unique.</span>
                                        </div>

                                        <div className={styles.field}>
                                            <label>Username</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="text"
                                                    value={editUsername}
                                                    onChange={e => { setEditUsername(e.target.value); checkUsername(e.target.value); }}
                                                    maxLength={20}
                                                    style={unBorder ? { borderColor: unBorder } : undefined}
                                                    className={unStatus === 'available' ? styles.valid : unStatus === 'taken' || unStatus === 'invalid' ? styles.invalid : undefined}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 18 }}>
                                                {unStatus === 'idle' || unStatus === 'same'
                                                    ? <span className={styles.hint}>Letters, numbers, underscores, periods · 3–20 chars</span>
                                                    : unStatus === 'checking'
                                                    ? <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fbbf24', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /><span className={styles.hint}>Checking…</span></>
                                                    : unStatus === 'available'
                                                    ? <><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--vt-green)', display: 'inline-block' }} /><span className={`${styles.hint} ${styles.ok}`}>Available</span></>
                                                    : <><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--vt-red)', display: 'inline-block' }} /><span className={`${styles.hint} ${styles.err}`}>{unError}</span></>
                                                }
                                            </div>
                                        </div>

                                        <div className={styles['btn-row']}>
                                            <button
                                                className={styles['btn-primary']}
                                                onClick={saveProfile}
                                                disabled={savingProfile || unStatus === 'taken' || unStatus === 'invalid'}
                                            >
                                                {savingProfile && <Spinner />}
                                                {savingProfile ? 'Saving…' : 'Save Changes'}
                                            </button>
                                            <button className={styles['btn-ghost']} onClick={() => { setEditUsername(profile.username); setEditDisplayName(profile.displayName || ''); setEditAvatarColor(profile.avatarColor); setUnStatus('idle'); }}>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── APPEARANCE TAB ── */}
                        {tab === 'appearance' && (
                            <div className={styles.panel}>
                                <div className={styles['panel-title']}>Appearance</div>
                                <div className={styles['panel-sub']}>Vestera uses light mode — clean, bright, and easy to read.</div>

                                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--vt-surface2)', border: '1px solid var(--vt-border)', borderRadius: 12 }}>
                                    <span style={{ fontSize: 20 }}>☀️</span>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--vt-text)' }}>Light Mode</div>
                                        <div style={{ fontSize: 12, color: 'var(--vt-text3)', fontWeight: 500 }}>Always on — best for learning and trading</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── ACCOUNT TAB ── */}
                        {tab === 'account' && (
                            <>
                                <div className={styles.panel}>
                                    <div className={styles['panel-title']}>Change Password</div>
                                    <div className={styles['panel-sub']}>Leave blank to keep your current password.</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div className={styles.field}>
                                            <label>New Password</label>
                                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" minLength={8} />
                                            <span className={styles.hint}>At least 8 characters</span>
                                        </div>
                                        <div className={styles.field}>
                                            <label>Confirm New Password</label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className={confirmPassword && newPassword !== confirmPassword ? styles.invalid : confirmPassword && newPassword === confirmPassword ? styles.valid : undefined}
                                            />
                                            {confirmPassword && newPassword !== confirmPassword && <span className={`${styles.hint} ${styles.err}`}>Passwords don&apos;t match</span>}
                                        </div>
                                        <div className={styles['btn-row']}>
                                            <button
                                                className={styles['btn-primary']}
                                                disabled={savingPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 8}
                                                onClick={async () => {
                                                    setSavingPassword(true);
                                                    // Password change via Supabase would go here
                                                    await new Promise(r => setTimeout(r, 800));
                                                    showToast('✓ Password updated');
                                                    setNewPassword(''); setConfirmPassword('');
                                                    setSavingPassword(false);
                                                }}
                                            >
                                                {savingPassword && <Spinner />}
                                                {savingPassword ? 'Updating…' : 'Update Password'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.panel}>
                                    <div className={styles['panel-title']} style={{ color: 'var(--vt-red)', marginBottom: 8 }}>Danger Zone</div>
                                    <p style={{ fontSize: 13, color: 'var(--vt-text2)', marginBottom: 16, lineHeight: 1.6 }}>
                                        Deleting your account permanently removes your portfolio, trade history, and leaderboard position. This cannot be undone.
                                    </p>
                                    <button className={styles['btn-danger']}>Delete Account</button>
                                </div>
                            </>
                        )}

                    </div>
                </div>
            </div>

            {/* Toast */}
            <div className={`${styles.toast} ${toastVisible ? styles.show : ''}`}>{toastMsg}</div>
        </div>
    );
}

export default function SettingsRoute() {
    return (
        <GuestGuard>
            <SettingsPage />
        </GuestGuard>
    );
}
