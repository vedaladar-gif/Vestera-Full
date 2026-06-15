'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import VesteraLogo from './VesteraLogo';
import { getAvatarGradient, getInitials } from '@/lib/avatarColors';

// Pages that render their own full-screen nav (trade, learn)
const SELF_NAV = ['/trade', '/learn'];
// Pages where we never auto-redirect even if needsUsername
const NO_REDIRECT = ['/setup-username', '/settings', '/login', '/register'];

export default function Navbar() {
    const [authenticated, setAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [avatarColor, setAvatarColor] = useState('blue');
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const hasSelfNav = SELF_NAV.some(p => pathname === p || pathname.startsWith(p + '/'));

    // Close drawer on route change
    useEffect(() => { setMobileOpen(false); }, [pathname]);

    useEffect(() => {
        fetch('/api/auth/me', { credentials: 'same-origin' })
            .then(res => res.json())
            .then(data => {
                setAuthenticated(data.authenticated);
                if (data.authenticated) {
                    setUsername(data.username || '');
                    setDisplayName(data.displayName || null);
                    setAvatarColor(data.avatarColor || 'blue');

                    if (data.needsUsername && !NO_REDIRECT.some(p => pathname.startsWith(p))) {
                        router.replace('/setup-username');
                    }
                }
            })
            .catch(() => setAuthenticated(false));
    }, [pathname, router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setAuthenticated(false);
        try { localStorage.removeItem('vestera_learn_progress'); } catch { /* ignore */ }
        router.push('/');
    };

    if (hasSelfNav) return null;

    const initials = getInitials(username, displayName);
    const avatarStyle: React.CSSProperties = {
        width: 32, height: 32,
        background: getAvatarGradient(avatarColor),
        borderRadius: 9,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, color: '#fff',
        cursor: 'pointer', flexShrink: 0,
        border: '2px solid transparent',
        transition: 'border-color 0.15s',
    };

    const close = () => setMobileOpen(false);

    return (
        <>
            <nav className="navbar">
                <Link href="/" className="nav-brand" onClick={close}>
                    <VesteraLogo height={38} />
                </Link>

                {/* ── Desktop links (hidden on mobile via CSS) ── */}
                <div className="nav-links">
                    {authenticated ? (
                        <>
                            <Link href="/trade">Trade</Link>
                            <Link href="/stats">Stats</Link>
                            <Link href="/learn">Learn</Link>
                            <Link href="/founders">Founders</Link>
                            <Link href="/settings" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px 5px 6px', borderRadius: 10 }}>
                                <div style={avatarStyle} title={`@${username}`}>{initials}</div>
                                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--vt-text2)' }}>Settings</span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: '#fca5a5', fontSize: '14px', fontWeight: 500,
                                    padding: '8px 14px', fontFamily: 'inherit',
                                }}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/restricted">Trade</Link>
                            <Link href="/restricted">Stats</Link>
                            <Link href="/learn">Learn</Link>
                            <Link href="/founders">Founders</Link>
                            <Link href="/login">Login</Link>
                            <Link href="/register">Register</Link>
                        </>
                    )}
                </div>

                {/* ── Hamburger (mobile only) ── */}
                <button
                    className={`nav-hamburger${mobileOpen ? ' nav-hamburger-open' : ''}`}
                    onClick={() => setMobileOpen(o => !o)}
                    aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={mobileOpen}
                >
                    <span />
                    <span />
                    <span />
                </button>
            </nav>

            {/* ── Overlay ── */}
            <div
                className={`nav-mobile-overlay${mobileOpen ? ' nav-mobile-overlay-show' : ''}`}
                onClick={close}
                aria-hidden="true"
            />

            {/* ── Slide-out drawer ── */}
            <div
                className={`nav-mobile-drawer${mobileOpen ? ' nav-mobile-drawer-open' : ''}`}
                aria-hidden={!mobileOpen}
            >
                {authenticated ? (
                    <>
                        <div className="nav-mobile-profile">
                            <div style={{ ...avatarStyle, width: 40, height: 40, borderRadius: 11, fontSize: 14 }}>
                                {initials}
                            </div>
                            <div className="nav-mobile-username">@{username}</div>
                        </div>
                        <div className="nav-mobile-divider" />
                        <Link href="/trade" className="nav-mobile-link" onClick={close} data-active={pathname.startsWith('/trade') ? 'true' : 'false'}>Trade</Link>
                        <Link href="/stats" className="nav-mobile-link" onClick={close} data-active={pathname.startsWith('/stats') ? 'true' : 'false'}>Stats</Link>
                        <Link href="/learn" className="nav-mobile-link" onClick={close} data-active={pathname.startsWith('/learn') ? 'true' : 'false'}>Learn</Link>
                        <Link href="/founders" className="nav-mobile-link" onClick={close} data-active={pathname.startsWith('/founders') ? 'true' : 'false'}>Founders</Link>
                        <div className="nav-mobile-divider" />
                        <Link href="/settings" className="nav-mobile-link" onClick={close} data-active={pathname.startsWith('/settings') ? 'true' : 'false'}>Settings</Link>
                        <button className="nav-mobile-link nav-mobile-logout" onClick={() => { handleLogout(); close(); }}>
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link href="/restricted" className="nav-mobile-link" onClick={close}>Trade</Link>
                        <Link href="/restricted" className="nav-mobile-link" onClick={close}>Stats</Link>
                        <Link href="/learn" className="nav-mobile-link" onClick={close} data-active={pathname.startsWith('/learn') ? 'true' : 'false'}>Learn</Link>
                        <Link href="/founders" className="nav-mobile-link" onClick={close} data-active={pathname.startsWith('/founders') ? 'true' : 'false'}>Founders</Link>
                        <div className="nav-mobile-divider" />
                        <Link href="/login" className="nav-mobile-link" onClick={close}>Login</Link>
                        <Link href="/register" className="nav-mobile-link nav-mobile-cta" onClick={close}>Register</Link>
                    </>
                )}
            </div>
        </>
    );
}
