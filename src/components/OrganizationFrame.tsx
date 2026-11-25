'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import VesteraLogo from './VesteraLogo';
import { useGuestMode } from '@/hooks/useGuestMode';
import { platformLinks } from './platformLinks';
import './organization.css';

const groups = [
  { title: 'About', href: '/about', links: [['Mission & Leadership', '/about#team'], ['Impact, Awards & Press', '/about#impact']] },
  { title: 'Programs', href: '/programs', links: [['Partner Schools & Chapters', '/programs#partners'], ['Bring Vestera to Your School', '/programs#schools'], ['Start a Chapter', '/programs#chapters']] },
];
const quick = [['Mission & Team','/about#team'],['Impact & Gallery','/about#impact'],['Partner Schools','/programs#partners'],['Start a Chapter','/programs#chapters'],['Sponsors','/sponsors']];

export function SiteHeader({authenticated}: {authenticated: boolean | null}) {
  const { isGuest, clearGuestMode } = useGuestMode();
  const pathname = usePathname();
  const [open, setOpen] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const close = () => { setOpen(''); setMenuOpen(false); };
  return <header ref={header} className="org-head" onBlur={e => {if (!e.currentTarget.contains(e.relatedTarget)) close();}} onKeyDown={e => {
      if (e.key === 'Escape' && open) {
        header.current?.querySelector<HTMLButtonElement>('[data-dropdown][aria-expanded=true]')?.focus();
        setOpen('');
      } else if (e.key === 'Escape' && menuOpen) {
        close();
        menuButton.current?.focus();
      }
    }}>
      <div className="org-bar"><Link href="/" aria-label="Vestera home" onClick={close}><VesteraLogo height={32}/></Link>
      <button type="button" className="org-menu-toggle" ref={menuButton} aria-controls="org-nav" aria-expanded={menuOpen}
        onClick={() => { setOpen(''); setMenuOpen(!menuOpen); }}>Menu</button>
      <nav id="org-nav" aria-label="Main navigation" data-open={menuOpen}>
        {platformLinks.map(({href, label}) => <Link key={href} href={href} onClick={close}
          aria-current={pathname === href || pathname.startsWith(href + '/') ? 'page' : undefined}>{label}</Link>)}
        {groups.map(group => <div className="org-group" key={group.title}
          onPointerEnter={e => {if (e.pointerType === 'mouse') setOpen(group.title);}}
          onPointerLeave={e => {if (e.pointerType === 'mouse' && !e.currentTarget.contains(document.activeElement)) setOpen('');}}>
          <Link href={group.href} aria-current={pathname === group.href ? 'page' : undefined} onClick={close}>{group.title}</Link>
          <button data-dropdown aria-label={group.title + ' sections'} aria-expanded={open === group.title} onClick={() => setOpen(open === group.title ? '' : group.title)}><span aria-hidden>⌄</span></button>
          {open === group.title && <div className="org-dropdown">{group.links.map(([name,href]) => <Link key={href} href={href} onClick={close}>{name}</Link>)}</div>}
        </div>)}
        <Link href="/sponsors" aria-current={pathname === '/sponsors' ? 'page' : undefined} onClick={close}>Sponsors</Link>
          <span className="account-tabs">
            {authenticated ? <Link href="/settings" onClick={close}>Profile</Link> : <><Link href="/login" onClick={close}>Log in</Link><Link href="/register" onClick={close}>Get started</Link></>}
            {isGuest && pathname === '/learn' && <Link href="/" onClick={clearGuestMode}>Exit preview</Link>}
          </span>
      </nav>
      <Link className="org-launch" href="/games" onClick={close}>Launch App →</Link></div>
    </header>;
}

export default function OrganizationFrame({children, authenticated}: {children: React.ReactNode; authenticated: boolean | null}) {
  return <div className="org-site">
    <SiteHeader authenticated={authenticated}/>
    {children}
    <OrganizationFooter/>
  </div>;
}

export function OrganizationFooter() {
  const instagram = 'vesteratrading';
  return <footer className="org-foot"><div><VesteraLogo height={31}/><p>A student-led financial literacy organization equipping elementary and middle school students with real-world money and investing skills.</p><small>© {new Date().getFullYear()} Vestera</small></div>
      <div><strong>Quick links</strong>{quick.map(([name,href]) => <Link key={href} href={href}>{name}</Link>)}</div>
      <div><strong>Contact</strong><a href="mailto:vesteratrading@gmail.com">vesteratrading@gmail.com</a>{instagram && <a href={'https://www.instagram.com/'+encodeURIComponent(instagram)+'/'} target="_blank" rel="noopener noreferrer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1"/></svg> @{instagram}</a>}<p>Based in Wake County, North Carolina</p></div>
    </footer>;
}
