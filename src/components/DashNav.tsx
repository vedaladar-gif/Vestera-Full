'use client';

/**
 * Shared navigation bar used by the Trade and Learn pages (which render their
 * own full-screen layouts and suppress the global Navbar).
 *
 * Shows: Logo · Trade · Stats · Learn · [Avatar] Settings · Logout
 * Highlights the active page. Fetches user profile data independently.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import VesteraLogo from '@/components/VesteraLogo';
import { getAvatarGradient, getInitials } from '@/lib/avatarColors';

interface DashNavProps {
    /** Optional: pass onLogout handler if the parent page needs to react (e.g. clear state) */
    onLogout?: () => void;
    /** Learn preview without account: trade/stats still linked; auth CTAs instead of settings/logout */
    previewMode?: boolean;
    /** Clear guest cookie/localStorage and leave preview (e.g. back to home) */
    onExitPreview?: () => void;
}

export default function DashNav({ onLogout, previewMode, onExitPreview }: DashNavProps) {
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [avatarColor, setAvatarColor] = useState('blue');
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    // Close drawer on route change
    useEffect(() => { setMobileOpen(false); }, [pathname]);

    useEffect(() => {
        if (previewMode) return;
        fetch('/api/auth/me', { credentials: 'same-origin' })
            .then(r => r.json())
            .then(data => {
                if (data.authenticated) {
                    setUsername(data.username || '');
                    setDisplayName(data.displayName || null);
                    setAvatarColor(data.avatarColor || 'blue');
                }
            })
            .catch(() => { /* non-critical — avatar just stays blank */ });
    }, [previewMode]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        try { localStorage.removeItem('vestera_learn_progress'); } catch { /* ignore */ }
        onLogout?.();
        router.push('/');
    };

    const initials = getInitials(username, displayName);
    const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

    const linkStyle = (href: string): React.CSSProperties => ({
        color: isActive(href) ? '#20264D' : '#5c628a',
        fontWeight: isActive(href) ? 700 : 600,
        background: 'transparent',
    });

    const close = () => setMobileOpen(false);

    const navLinks = [
        { href: previewMode ? '/restricted' : '/trade', label: 'Market', activePath: '/trade', tour: 'nav-market' },
        { href: previewMode ? '/restricted' : '/stats', label: 'Rankings', activePath: '/stats', tour: 'nav-rankings' },
        { href: previewMode ? '/restricted' : '/portfolio', label: 'Portfolio', activePath: '/portfolio', tour: 'nav-portfolio' },
        { href: previewMode ? '/restricted' : '/friends', label: 'Friends', activePath: '/friends', tour: 'nav-friends' },
        { href: '/learn', label: 'Academy', activePath: '/learn', tour: 'nav-academy' },
        { href: '/partners', label: 'Partnerships', activePath: '/partners', tour: 'nav-partnerships' },
        { href: '/chapters', label: 'Start a Chapter', activePath: '/chapters', tour: 'nav-chapters' },
    ];

    return (
        <>
            {/* ── Nav bar ── */}
            <nav style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 40px',
                height: 64,
                background: '#ffffff',
                borderBottom: '1px solid #E4E9F7',
                position: 'sticky',
                top: 0,
                zIndex: 200,
                flexShrink: 0,
                fontFamily: "'Nunito', sans-serif",
            }}>
                {/* Brand */}
                <Link
                    href="/"
                    className="brand-link"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
                >
                    <VesteraLogo height={36} />
                </Link>

                {/* Desktop links — hidden on mobile via .dashnav-links CSS class */}
                <div className="dashnav-links" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {navLinks.map(({ href, label, activePath, tour }) => (
                        <Link
                            key={label}
                            href={href}
                            data-tour={tour}
                            style={{
                                textDecoration: 'none',
                                fontSize: 14,
                                padding: '8px 14px',
                                borderRadius: 8,
                                transition: 'color 0.15s',
                                ...linkStyle(activePath),
                            }}
                        >
                            {label}
                        </Link>
                    ))}

                    {previewMode ? (
                        <>
                            <Link
                                href="/login"
                                style={{
                                    textDecoration: 'none', fontSize: 14, fontWeight: 700,
                                    padding: '8px 18px', borderRadius: 999,
                                    background: '#4C8DFF', color: '#fff', transition: 'filter 0.2s',
                                }}
                            >
                                Log In / Sign Up
                            </Link>
                            {onExitPreview && (
                                <button
                                    type="button"
                                    onClick={onExitPreview}
                                    style={{
                                        background: 'none', border: '1px solid #E4E9F7',
                                        color: '#5c628a', fontSize: 13, fontWeight: 600,
                                        cursor: 'pointer', padding: '8px 14px',
                                        fontFamily: 'inherit', borderRadius: 8,
                                    }}
                                >
                                    Exit guest
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <Link
                                href="/settings"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 7,
                                    padding: '5px 10px 5px 6px', borderRadius: 10,
                                    textDecoration: 'none', transition: 'background 0.2s',
                                    background: isActive('/settings') ? '#F4F6FC' : 'transparent',
                                }}
                            >
                                <div style={{
                                    width: 30, height: 30, borderRadius: 8,
                                    background: getAvatarGradient(avatarColor),
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
                                }}>
                                    {initials}
                                </div>
                            </Link>

                            <button
                                onClick={handleLogout}
                                style={{
                                    background: 'none', border: 'none', color: '#5c628a',
                                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                    padding: '8px 14px', fontFamily: 'inherit',
                                    borderRadius: 8, transition: 'color 0.2s',
                                }}
                                onMouseEnter={e => {
                                    (e.target as HTMLElement).style.color = '#f87171';
                                }}
                                onMouseLeave={e => {
                                    (e.target as HTMLElement).style.color = '#5c628a';
                                }}
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>

                {/* ── Hamburger button (mobile only) ── */}
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
                {!previewMode && username && (
                    <>
                        <div className="nav-mobile-profile">
                            <div style={{
                                width: 40, height: 40, borderRadius: 11,
                                background: getAvatarGradient(avatarColor),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
                            }}>
                                {initials}
                            </div>
                            <div className="nav-mobile-username">@{username}</div>
                        </div>
                        <div className="nav-mobile-divider" />
                    </>
                )}

                {navLinks.map(({ href, label, activePath }) => (
                    <Link
                        key={label}
                        href={href}
                        className="nav-mobile-link"
                        onClick={close}
                        data-active={isActive(activePath) ? 'true' : 'false'}
                    >
                        {label}
                    </Link>
                ))}

                <div className="nav-mobile-divider" />

                {previewMode ? (
                    <>
                        <Link href="/login" className="nav-mobile-link nav-mobile-cta" onClick={close}>
                            Log In / Sign Up
                        </Link>
                        {onExitPreview && (
                            <button className="nav-mobile-link" onClick={() => { onExitPreview(); close(); }}>
                                Exit guest
                            </button>
                        )}
                    </>
                ) : (
                    <>
                        <Link href="/settings" className="nav-mobile-link" onClick={close} data-active={isActive('/settings') ? 'true' : 'false'}>
                            👤 Profile
                        </Link>
                        <button className="nav-mobile-link nav-mobile-logout" onClick={() => { handleLogout(); close(); }}>
                            Logout
                        </button>
                    </>
                )}
            </div>
        </>
    );
}
