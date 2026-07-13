'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import VesteraLogo from './VesteraLogo';
import { UserAvatar } from './UserAvatar';

const SELF_NAV = ['/trade', '/learn'];
const NO_REDIRECT = ['/setup-username', '/settings', '/login', '/register'];

export default function Navbar() {
    const [authenticated, setAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [avatarColor, setAvatarColor] = useState('blue');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const hasSelfNav = SELF_NAV.some(p => pathname === p || pathname.startsWith(p + '/'));

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

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

    const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
    const close = () => setMobileOpen(false);

    const linkStyle = (href: string): React.CSSProperties => ({
        color: isActive(href) ? '#20264D' : 'var(--vt-text2)',
        fontWeight: isActive(href) ? 700 : 600,
        background: isActive(href) ? 'rgba(76,141,255,0.10)' : 'transparent',
        fontFamily: "'Nunito', 'Plus Jakarta Sans', sans-serif",
    });

    return (
        <>
            <nav className={`navbar${scrolled ? ' nav-scrolled' : ''}`}>
                {/* ── Brand: Logo ── */}
                <Link href="/" className="nav-brand" onClick={close} style={{ gap: 10 }}>
                    <VesteraLogo height={32} />
                </Link>

                {/* ── Desktop links ── */}
                <div className="nav-links">
                    {authenticated ? (
                        <>
                            <Link href="/trade"      style={{ ...linkStyle('/trade'),      textDecoration: 'none', padding: '7px 14px', borderRadius: 12, fontSize: 14, transition: 'all 0.18s' }}>Market</Link>
                            <Link href="/stats"      style={{ ...linkStyle('/stats'),      textDecoration: 'none', padding: '7px 14px', borderRadius: 12, fontSize: 14, transition: 'all 0.18s' }}>Rankings</Link>
                            <Link href="/portfolio"  style={{ ...linkStyle('/portfolio'),  textDecoration: 'none', padding: '7px 14px', borderRadius: 12, fontSize: 14, transition: 'all 0.18s' }}>Portfolio</Link>
                            <Link href="/friends"    style={{ ...linkStyle('/friends'),    textDecoration: 'none', padding: '7px 14px', borderRadius: 12, fontSize: 14, transition: 'all 0.18s' }}>Friends</Link>
                            <Link href="/learn"      style={{ ...linkStyle('/learn'),      textDecoration: 'none', padding: '7px 14px', borderRadius: 12, fontSize: 14, transition: 'all 0.18s' }}>Academy</Link>

                            <div style={{ width: 1, height: 20, background: 'var(--vt-border)', margin: '0 6px', flexShrink: 0 }} />

                            <Link
                                href="/settings"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '5px 12px 5px 7px', borderRadius: 50,
                                    textDecoration: 'none',
                                    background: isActive('/settings') ? 'rgba(76,141,255,0.10)' : 'rgba(32,38,77,0.04)',
                                    border: '1.5px solid var(--vt-border)',
                                    transition: 'all 0.18s',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(76,141,255,0.35)'; (e.currentTarget as HTMLElement).style.background = 'rgba(76,141,255,0.08)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--vt-border)'; (e.currentTarget as HTMLElement).style.background = isActive('/settings') ? 'rgba(76,141,255,0.10)' : 'rgba(32,38,77,0.04)'; }}
                            >
                                <UserAvatar size={26} avatarUrl={avatarUrl} avatarColor={avatarColor} username={username} displayName={displayName} borderRadius={50} />
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--vt-text2)', fontFamily: "'Nunito', sans-serif", letterSpacing: '-0.1px' }}>
                                    {username ? `@${username}` : 'Profile'}
                                </span>
                            </Link>

                            <button
                                onClick={handleLogout}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vt-text3)', fontSize: 13, fontWeight: 600, padding: '7px 12px', fontFamily: "'Nunito', sans-serif", borderRadius: 12, transition: 'all 0.18s' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--vt-red)'; (e.currentTarget as HTMLElement).style.background = 'rgba(224,99,122,0.08)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--vt-text3)'; (e.currentTarget as HTMLElement).style.background = 'none'; }}
                            >Logout</button>
                        </>
                    ) : (
                        <>
                            <Link href="/learn"    style={{ ...linkStyle('/learn'),    textDecoration: 'none', padding: '7px 14px', borderRadius: 12, fontSize: 14, transition: 'all 0.18s' }}>Learn</Link>
                            <Link href="/stats"    style={{ ...linkStyle('/stats'),    textDecoration: 'none', padding: '7px 14px', borderRadius: 12, fontSize: 14, transition: 'all 0.18s' }}>Rankings</Link>
                            <Link
                                href="/login"
                                style={{ textDecoration: 'none', padding: '7px 16px', borderRadius: 12, fontSize: 14, fontWeight: 700, color: 'var(--vt-text2)', fontFamily: "'Nunito', sans-serif", transition: 'all 0.18s' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--vt-text)'; (e.currentTarget as HTMLElement).style.background = 'var(--vt-hover)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--vt-text2)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >Log in</Link>
                            <Link href="/register" className="nav-pill-cta">Get Started →</Link>
                        </>
                    )}
                </div>

                {/* ── Hamburger ── */}
                <button
                    className={`nav-hamburger${mobileOpen ? ' nav-hamburger-open' : ''}`}
                    onClick={() => setMobileOpen(o => !o)}
                    aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={mobileOpen}
                >
                    <span /><span /><span />
                </button>
            </nav>

            <div className={`nav-mobile-overlay${mobileOpen ? ' nav-mobile-overlay-show' : ''}`} onClick={close} aria-hidden="true" />

            <div className={`nav-mobile-drawer${mobileOpen ? ' nav-mobile-drawer-open' : ''}`} aria-hidden={!mobileOpen}>
                {authenticated ? (
                    <>
                        <div className="nav-mobile-profile">
                            <UserAvatar size={40} avatarUrl={avatarUrl} avatarColor={avatarColor} username={username} displayName={displayName} borderRadius={50} />
                            <div>
                                <div className="nav-mobile-username">@{username}</div>
                                {displayName && <div style={{ fontSize: 12, color: 'var(--vt-text3)' }}>{displayName}</div>}
                            </div>
                        </div>
                        <div className="nav-mobile-divider" />
                        <Link href="/trade"     className="nav-mobile-link" onClick={close} data-active={isActive('/trade')     ? 'true' : 'false'}>📊 Market</Link>
                        <Link href="/stats"     className="nav-mobile-link" onClick={close} data-active={isActive('/stats')     ? 'true' : 'false'}>🏆 Rankings</Link>
                        <Link href="/portfolio" className="nav-mobile-link" onClick={close} data-active={isActive('/portfolio') ? 'true' : 'false'}>💼 Portfolio</Link>
                        <Link href="/friends"   className="nav-mobile-link" onClick={close} data-active={isActive('/friends')   ? 'true' : 'false'}>👥 Friends</Link>
                        <Link href="/learn"     className="nav-mobile-link" onClick={close} data-active={isActive('/learn')     ? 'true' : 'false'}>🎓 Academy</Link>
                        <div className="nav-mobile-divider" />
                        <Link href="/settings" className="nav-mobile-link" onClick={close} data-active={isActive('/settings') ? 'true' : 'false'}>👤 Profile</Link>
                        <button className="nav-mobile-link nav-mobile-logout" onClick={() => { handleLogout(); close(); }}>Logout</button>
                    </>
                ) : (
                    <>
                        <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <VesteraLogo height={28} />
                        </div>
                        <div className="nav-mobile-divider" />
                        <Link href="/learn"    className="nav-mobile-link" onClick={close} data-active={isActive('/learn')    ? 'true' : 'false'}>🎓 Academy</Link>
                        <div className="nav-mobile-divider" />
                        <Link href="/login"    className="nav-mobile-link" onClick={close}>Log In</Link>
                        <Link href="/register" className="nav-mobile-link nav-mobile-cta" onClick={close}>Get Started Free →</Link>
                    </>
                )}
            </div>
        </>
    );
}


