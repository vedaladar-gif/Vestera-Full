'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import VLogo from './VLogo';
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
    const pathname = usePathname();
    const router = useRouter();

    const hasSelfNav = SELF_NAV.some(p => pathname === p || pathname.startsWith(p + '/'));

    useEffect(() => {
        fetch('/api/auth/me', { credentials: 'same-origin' })
            .then(res => res.json())
            .then(data => {
                setAuthenticated(data.authenticated);
                if (data.authenticated) {
                    setUsername(data.username || '');
                    setDisplayName(data.displayName || null);
                    setAvatarColor(data.avatarColor || 'blue');

                    // Redirect users who haven't chosen a real username yet
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
        try {
            localStorage.removeItem('vestera_learn_progress');
        } catch {
            /* ignore */
        }
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

    return (
        <nav className="navbar">
            <Link href="/" className="nav-brand">
                <VLogo size={30} />
                Vestera
            </Link>
            <div className="nav-links">
                {authenticated ? (
                    <>
                        <Link href="/trade">Trade</Link>
                        <Link href="/stats">Stats</Link>
                        <Link href="/learn">Learn</Link>
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
                        <Link href="/login">Login</Link>
                        <Link href="/register">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
}
