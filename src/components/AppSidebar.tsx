'use client';

/**
 * AppFrame — decides the top-level chrome for every route:
 * - "No shell" routes (auth/onboarding screens) render their own full-screen layout.
 * - Authenticated app routes get the dark-navy left Sidebar + light TopBar.
 * - Everything else (logged-out marketing/public pages) keeps the existing
 * top Navbar.
 *
 * This replaces the old pattern where /trade and /learn each rendered their
 * own <DashNav/> header — navigation is now consistent across every
 * authenticated page in one place.
 */

import OrganizationFrame, { OrganizationFooter, SiteHeader } from './OrganizationFrame';
import { platformLinks } from './platformLinks';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import VesteraLogo from '@/components/VesteraLogo';
import { UserAvatar } from '@/components/UserAvatar';
import {
    ChaptersIcon,
    PartnersIcon,
    AiAssistantIcon,
    SettingsIcon,
    LogoutIcon,
    ChevronDownIcon,
    BellIcon,
} from '@/components/icons/SidebarIcons';
import styles from './AppSidebar.module.css';

/** Routes that render their own full-screen chrome — no sidebar, no public navbar. */
const NO_SHELL_PREFIXES = [
    '/login',
    '/register',
    '/setup-username',
    '/check-email',
    '/reset-password',
    '/admin',
    '/games/wall-street-challenge',
];

const NAV_ITEMS: Array<{ href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
    ...platformLinks,
    { href: '/about', label: 'About', icon: PartnersIcon },
    { href: '/programs', label: 'Programs', icon: ChaptersIcon },
    { href: '/sponsors', label: 'Sponsors', icon: PartnersIcon },
];

interface Me {
    username: string;
    displayName: string | null;
    avatarColor: string;
    avatarUrl: string | null;
}

function openVesta() {
    window.dispatchEvent(new CustomEvent('openVestaChat', { detail: { message: '' } }));
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
    const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
    return (
        <>
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    aria-current={isActive(href) ? 'page' : undefined}
                    className={`${styles.navItem} ${isActive(href) ? styles.navItemActive : ''}`}
                >
                    <Icon size={17} />
                    {label}
                </Link>
            ))}
        </>
    );
}

function BottomLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
    const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
    return (
        <>
            <button type="button" className={styles.navItemButton} onClick={() => { openVesta(); onNavigate?.(); }}>
                <AiAssistantIcon size={17} />
                AI Assistant
            </button>
            <Link
                href="/settings"
                onClick={onNavigate}
                className={`${styles.navItem} ${isActive('/settings') ? styles.navItemActive : ''}`}
            >
                <SettingsIcon size={17} />
                Settings
            </Link>
        </>
    );
}

export default function AppFrame({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);
    const [me, setMe] = useState<Me>({ username: '', displayName: null, avatarColor: 'blue', avatarUrl: null });
    const [profileOpen, setProfileOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const organizationSidebar = ['/about', '/programs', '/sponsors'].includes(pathname);
    const organizationPage = ['/', '/about', '/programs', '/sponsors', '/partners', '/chapters', '/privacy', '/terms'].includes(pathname);
    const noShell = NO_SHELL_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));

    useEffect(() => {
        if (noShell) return;
        let current = true;
        fetch('/api/auth/me', { credentials: 'same-origin' })
            .then(r => r.json())
            .then(data => {
                if (!current) return;
                if (data.authenticated && data.needsUsername && !organizationPage && pathname !== '/settings') {
                    router.replace('/setup-username');
                }
                setAuthenticated(Boolean(data.authenticated));
                if (data.authenticated) {
                    setMe({
                        username: data.username || '',
                        displayName: data.displayName || null,
                        avatarColor: data.avatarColor || 'blue',
                        avatarUrl: data.avatarUrl ?? null,
                    });
                }
            })
            .catch(() => { if (current) setAuthenticated(false); });
        return () => { current = false; };
    }, [pathname, noShell, organizationPage, router]);

    useEffect(() => { setDrawerOpen(false); setProfileOpen(false); }, [pathname]);

    useEffect(() => {
        if (!profileOpen) return;
        const onClick = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [profileOpen]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        try { localStorage.removeItem('vestera_learn_progress'); } catch { /* ignore */ }
        setProfileOpen(false);
        setDrawerOpen(false);
        router.push('/');
    };

    // Onboarding/auth screens render their own complete layout.
    if (organizationPage && !organizationSidebar) return <OrganizationFrame authenticated={authenticated}>{children}</OrganizationFrame>;
    if (noShell) return <>{children}</>;

    if (!authenticated && !organizationSidebar) {
        return (
            <>
                <SiteHeader authenticated={authenticated}/>
                {children}
                {footer}
            </>
        );
    }

    return (
        <div className={styles.shellRoot}>
            {/* ── Desktop sidebar ── */}
            <aside className={styles.sidebar}>
                <Link href="/" className={styles.sidebarBrand}>
                    <VesteraLogo height={27} light />
                </Link>
                <div className={styles.sidebarDivider} />
                <nav className={styles.sidebarNav} aria-label="Main navigation">
                    <NavLinks pathname={pathname} />
                </nav>
                {authenticated && <div className={styles.sidebarBottom}>
                    <BottomLinks pathname={pathname} />
                </div>}
            </aside>

            {/* ── Mobile top bar ── */}
            <div className={styles.mobileTopBar}>
                <button
                    type="button"
                    className={styles.mobileIconBtn}
                    onClick={() => setDrawerOpen(true)}
                    aria-label="Open menu"
                >
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M4 7h16M4 12h16M4 17h16" />
                    </svg>
                </button>
                <Link href="/" className={styles.mobileBrand}>
                    <VesteraLogo height={25} light />
                </Link>
                {authenticated ? <Link href="/settings" className={styles.mobileIconBtn} aria-label="Profile">
                    <UserAvatar size={26} avatarUrl={me.avatarUrl} avatarColor={me.avatarColor} username={me.username} displayName={me.displayName} borderRadius={7} />
                </Link> : <Link href="/login" className={styles.mobileLogin}>Log in</Link>}
            </div>
            <div
                className={`${styles.mobileOverlay} ${drawerOpen ? styles.mobileOverlayShow : ''}`}
                onClick={() => setDrawerOpen(false)}
                aria-hidden="true"
            />
            <div className={`${styles.mobileDrawer} ${drawerOpen ? styles.mobileDrawerOpen : ''}`} aria-hidden={!drawerOpen} inert={!drawerOpen}>
                <div className={styles.sidebarBrand}>
                    <VesteraLogo height={27} light />
                </div>
                <div className={styles.sidebarDivider} />
                <nav className={styles.sidebarNav} aria-label="Main navigation">
                    <NavLinks pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
                </nav>
                {authenticated ? <div className={styles.sidebarBottom}>
                    <BottomLinks pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
                    <button type="button" className={styles.navItemButton} onClick={handleLogout}>
                        <LogoutIcon size={17} />
                        Logout
                    </button>
                </div> : <Link href="/register" className={styles.navItem}>Get started</Link>}
            </div>

            {/* ── Content column ── */}
            <div className={styles.contentCol}>
                <div className={`${styles.topBar} ${organizationSidebar ? styles.organizationTopBar : ''}`}>
                    {authenticated ? <>
                    <button type="button" className={styles.iconBtn} aria-label="Notifications">
                        <BellIcon size={18} />
                    </button>
                    <div className={styles.profileMenu} ref={profileRef}>
                        <button
                            type="button"
                            className={`${styles.profileTrigger} ${profileOpen ? styles.profileMenuOpen : ''}`}
                            onClick={() => setProfileOpen(o => !o)}
                        >
                            <UserAvatar size={28} avatarUrl={me.avatarUrl} avatarColor={me.avatarColor} username={me.username} displayName={me.displayName} borderRadius={8} />
                            <span className={styles.profileName}>{me.displayName || (me.username ? `@${me.username}` : 'Account')}</span>
                            <ChevronDownIcon size={14} className={styles.profileChevron} />
                        </button>
                        {profileOpen && (
                            <div className={styles.profileDropdown}>
                                <Link href="/settings" className={styles.dropdownItem} onClick={() => setProfileOpen(false)}>
                                    <SettingsIcon size={16} />
                                    Profile &amp; Settings
                                </Link>
                                <div className={styles.dropdownDivider} />
                                <button type="button" className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`} onClick={handleLogout}>
                                    <LogoutIcon size={16} />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                    </> : <><Link href="/login" className={styles.guestLink}>Log in</Link><Link href="/register" className={styles.guestLink}>Get started</Link></>}
                </div>
                <div className={`${styles.contentInner} ${organizationSidebar ? 'org-site org-with-sidebar' : ''}`}>
                    {children}
                </div>
                {organizationSidebar ? <OrganizationFooter/> : footer}
            </div>
        </div>
    );
}
