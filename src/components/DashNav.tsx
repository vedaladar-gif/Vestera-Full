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
import VLogo from '@/components/VLogo';
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
    const pathname = usePathname();
    const router = useRouter();

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
        try {
            localStorage.removeItem('vestera_learn_progress');
        } catch {
            /* ignore */
        }
        onLogout?.();
        router.push('/');
    };

    const initials = getInitials(username, displayName);
    const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

    const linkStyle = (href: string): React.CSSProperties => ({
        color: isActive(href) ? 'var(--vt-text)' : 'var(--vt-text2)',
        fontWeight: isActive(href) ? 600 : 500,
        background: isActive(href) ? 'var(--vt-hover)' : 'transparent',
    });

    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 32px',
            height: 58,
            background: 'var(--vt-nav-bg)',
            borderBottom: '1px solid var(--vt-border2)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            flexShrink: 0,
        }}>
            {/* Brand */}
            <Link href="/" style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 17,
                fontWeight: 800,
                color: 'var(--vt-text)',
                textDecoration: 'none',
                letterSpacing: '-0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                lineHeight: 1,
                transition: 'opacity 0.2s',
            }}>
                <VLogo size={30} />
                Vestera
            </Link>

            {/* Links — preview users go straight to /restricted for locked areas (no /login hop) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {[
                    { href: previewMode ? '/restricted' : '/trade', label: 'Trade', activePath: '/trade' },
                    { href: previewMode ? '/restricted' : '/stats', label: 'Stats', activePath: '/stats' },
                    { href: '/learn', label: 'Learn', activePath: '/learn' },
                    { href: '/founders', label: 'Founders', activePath: '/founders' },
                ].map(({ href, label, activePath }) => (
                    <Link
                        key={label}
                        href={href}
                        style={{
                            textDecoration: 'none',
                            fontSize: 14,
                            padding: '8px 16px',
                            borderRadius: 8,
                            transition: 'all 0.2s',
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
                                textDecoration: 'none',
                                fontSize: 14,
                                fontWeight: 600,
                                padding: '8px 16px',
                                borderRadius: 8,
                                background: '#4f6ef7',
                                color: '#fff',
                                transition: 'background 0.2s',
                            }}
                        >
                            Log In / Sign Up
                        </Link>
                        {onExitPreview && (
                            <button
                                type="button"
                                onClick={onExitPreview}
                                style={{
                                    background: 'none',
                                    border: '1px solid var(--vt-border)',
                                    color: 'var(--vt-text2)',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    padding: '8px 14px',
                                    fontFamily: 'inherit',
                                    borderRadius: 8,
                                }}
                            >
                                Exit guest
                            </button>
                        )}
                    </>
                ) : (
                    <>
                        {/* Settings link with avatar */}
                        <Link
                            href="/settings"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 7,
                                padding: '5px 10px 5px 6px',
                                borderRadius: 10,
                                textDecoration: 'none',
                                transition: 'background 0.2s',
                                background: isActive('/settings') ? 'var(--vt-hover)' : 'transparent',
                            }}
                        >
                            <div style={{
                                width: 30,
                                height: 30,
                                borderRadius: 8,
                                background: getAvatarGradient(avatarColor),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#fff',
                                flexShrink: 0,
                                border: isActive('/settings') ? '2px solid rgba(79,110,247,0.5)' : '2px solid transparent',
                                transition: 'border-color 0.15s',
                            }}>
                                {initials}
                            </div>
                            <span style={{
                                fontSize: 13,
                                fontWeight: isActive('/settings') ? 600 : 500,
                                color: isActive('/settings') ? 'var(--vt-text)' : 'var(--vt-text2)',
                            }}>
                                Settings
                            </span>
                        </Link>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--vt-text2)',
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: 'pointer',
                                padding: '8px 16px',
                                fontFamily: 'inherit',
                                borderRadius: 8,
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => {
                                (e.target as HTMLElement).style.color = '#f87171';
                                (e.target as HTMLElement).style.background = 'rgba(248,113,113,0.08)';
                            }}
                            onMouseLeave={e => {
                                (e.target as HTMLElement).style.color = 'var(--vt-text2)';
                                (e.target as HTMLElement).style.background = 'none';
                            }}
                        >
                            Logout
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}
