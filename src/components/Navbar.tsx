'use client';

/**
 * Public marketing navbar — dark navy, shown on the logged-out marketing
 * pages and always on the homepage ("/"), even when logged in (AppFrame
 * renders the app sidebar everywhere else once authenticated). Clicking the
 * Vestera logo always returns here.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import VesteraLogo from './VesteraLogo';
import { UserAvatar } from './UserAvatar';

const SELF_NAV = ['/trade', '/learn', '/admin'];
const NO_REDIRECT = ['/setup-username', '/settings', '/login', '/register'];

const PUBLIC_LINKS = [
    { href: '/', label: 'Home' },
    { href: '/learn', label: 'Learn' },
    { href: '/trade', label: 'Trade' },
    { href: '/stats', label: 'Leaderboard' },
];

export default function Navbar() {
    const [authenticated, setAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [avatarColor, setAvatarColor] = useState('blue');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const hasSelfNav = SELF_NAV.some(p => pathname === p || pathname.startsWith(p + '/'));

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
                    setAvatarUrl(data.avatarUrl ?? null);
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

    const isActive = (href: string) => href === '/' ? pathname === '/' : (pathname === href || pathname.startsWith(href + '/'));
    const close = () => setMobileOpen(false);

    const linkStyle = (href: string): React.CSSProperties => ({
        color: isActive(href) ? '#fff' : 'var(--vt-navy-text)',
        fontWeight: isActive(href) ? 700 : 500,
        background: isActive(href) ? 'var(--vt-navy-active)' : 'transparent',
        fontFamily: "'Inter', sans-serif",
    });

    return (
        <>
            <nav className="navbar navy-navbar">
                {/* ── Brand: Logo ── */}
                <Link href="/" className="nav-brand" onClick={close} style={{ gap: 10 }}>
                    <VesteraLogo height={30} light />
                </Link>

                {/* ── Desktop links ── */}
                <div className="nav-links">
                    {PUBLIC_LINKS.map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            style={{ ...linkStyle(href), textDecoration: 'none', padding: '7px 14px', borderRadius: 8, fontSize: 14, transition: 'all 0.18s' }}
                        >
                            {label}
                        </Link>
                    ))}

                    <div style={{ width: 1, height: 20, background: 'var(--vt-navy-border)', margin: '0 6px', flexShrink: 0 }} />

                    {authenticated ? (
                        <>
                            <Link
                                href="/settings"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '5px 12px 5px 7px', borderRadius: 50,
                                    textDecoration: 'none',
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid var(--vt-navy-border)',
                                    transition: 'all 0.18s',
                                }}
                            >
                                <UserAvatar size={24} avatarUrl={avatarUrl} avatarColor={avatarColor} username={username} displayName={displayName} borderRadius={50} />
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: "'Inter', sans-serif", letterSpacing: '-0.1px' }}>
                                    {username ? `@${username}` : 'Profile'}
                                </span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vt-navy-text)', fontSize: 13, fontWeight: 600, padding: '7px 12px', fontFamily: "'Inter', sans-serif", borderRadius: 8, transition: 'all 0.18s' }}
                            >Logout</button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                style={{ textDecoration: 'none', padding: '7px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, color: 'var(--vt-navy-text)', fontFamily: "'Inter', sans-serif", transition: 'all 0.18s' }}
                            >Log in</Link>
                            <Link href="/register" className="nav-pill-cta">Get Started</Link>
                        </>
                    )}
                </div>

                {/* ── Hamburger ── */}
                <button
                    className={`nav-hamburger navy-hamburger${mobileOpen ? ' nav-hamburger-open' : ''}`}
                    onClick={() => setMobileOpen(o => !o)}
                    aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={mobileOpen}
                >
                    <span /><span /><span />
                </button>
            </nav>

            <div className={`nav-mobile-overlay${mobileOpen ? ' nav-mobile-overlay-show' : ''}`} onClick={close} aria-hidden="true" />

            <div className={`nav-mobile-drawer navy-drawer${mobileOpen ? ' nav-mobile-drawer-open' : ''}`} aria-hidden={!mobileOpen}>
                {authenticated ? (
                    <>
                        <div className="nav-mobile-profile">
                            <UserAvatar size={40} avatarUrl={avatarUrl} avatarColor={avatarColor} username={username} displayName={displayName} borderRadius={50} />
                            <div>
                                <div className="nav-mobile-username">@{username}</div>
                                {displayName && <div style={{ fontSize: 12, color: 'var(--vt-navy-text)' }}>{displayName}</div>}
                            </div>
                        </div>
                        <div className="nav-mobile-divider" />
                        {PUBLIC_LINKS.map(({ href, label }) => (
                            <Link key={href} href={href} className="nav-mobile-link" onClick={close} data-active={isActive(href) ? 'true' : 'false'}>{label}</Link>
                        ))}
                        <div className="nav-mobile-divider" />
                        <Link href="/settings" className="nav-mobile-link" onClick={close} data-active={isActive('/settings') ? 'true' : 'false'}>Profile &amp; Settings</Link>
                        <button className="nav-mobile-link nav-mobile-logout" onClick={() => { handleLogout(); close(); }}>Logout</button>
                    </>
                ) : (
                    <>
                        <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <VesteraLogo height={28} light />
                        </div>
                        <div className="nav-mobile-divider" />
                        {PUBLIC_LINKS.map(({ href, label }) => (
                            <Link key={href} href={href} className="nav-mobile-link" onClick={close} data-active={isActive(href) ? 'true' : 'false'}>{label}</Link>
                        ))}
                        <div className="nav-mobile-divider" />
                        <Link href="/login"    className="nav-mobile-link" onClick={close}>Log In</Link>
                        <Link href="/register" className="nav-mobile-link nav-mobile-cta" onClick={close}>Get Started Free →</Link>
                    </>
                )}
            </div>
        </>
    );
}
