'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import VesteraLogo from './VesteraLogo';
import './organization.css';

const groups = [
  { title: 'About', links: [['Mission & Leadership', '/about#team'], ['Impact, Awards & Press', '/about#impact']] },
  { title: 'Programs & Partners', links: [['Partner Schools & Chapters', '/programs#partners'], ['Bring Vestera to Your School', '/programs#schools'], ['Start a Chapter', '/programs#chapters']] },
];
const quick = [['Mission & Team','/about#team'],['Impact & Gallery','/about#impact'],['Partner Schools','/programs#partners'],['Start a Chapter','/programs#chapters'],['Sponsors','/sponsors']];

export default function OrganizationFrame({children}: {children: React.ReactNode}) {
  const instagram = 'vesteratrading';
  const [mobile, setMobile] = useState(false);
  const [open, setOpen] = useState('');
  const header = useRef<HTMLElement>(null);
  const close = () => { setMobile(false); setOpen(''); };
  return <div className="org-site">
    <header ref={header} className="org-head" onBlur={e => {if (!e.currentTarget.contains(e.relatedTarget)) close();}} onKeyDown={e => {
      if (e.key === 'Escape') {
        header.current?.querySelector<HTMLButtonElement>(open ? '[data-dropdown][aria-expanded=true]' : '.org-toggle')?.focus();
        if (open) setOpen(''); else close();
      }
    }}>
      <div className="org-bar"><Link href="/" aria-label="Vestera home" onClick={close}><VesteraLogo height={32}/></Link>
      <button className="org-toggle" aria-expanded={mobile} aria-controls="org-nav" onClick={() => setMobile(!mobile)}>Menu ☰</button>
      <nav id="org-nav" aria-label="Organization" className={mobile ? 'expanded' : ''}>
        {groups.map(group => <div className="org-group" key={group.title}
          onPointerEnter={e => {if (e.pointerType === 'mouse') setOpen(group.title);}}
          onPointerLeave={e => {if (e.pointerType === 'mouse' && !e.currentTarget.contains(document.activeElement)) setOpen('');}}>
          <button data-dropdown aria-expanded={open === group.title} onClick={e => setOpen(e.detail && !mobile ? group.title : open === group.title ? '' : group.title)}>{group.title} <span aria-hidden>⌄</span></button>
          {open === group.title && <div className="org-dropdown">{group.links.map(([name,href]) => <Link key={href} href={href} onClick={close}>{name}</Link>)}</div>}
        </div>)}
        <Link href="/sponsors" onClick={close}>Sponsors</Link>
      </nav><Link className="org-launch" href="/games" onClick={close}>Launch App →</Link></div>
    </header>
    {children}
    <footer className="org-foot"><div><VesteraLogo height={31}/><p>A student-led financial literacy organization equipping elementary and middle school students with real-world money and investing skills.</p><small>© {new Date().getFullYear()} Vestera</small></div>
      <div><strong>Quick links</strong>{quick.map(([name,href]) => <Link key={href} href={href}>{name}</Link>)}</div>
      <div><strong>Contact</strong><a href="mailto:vesteratrading@gmail.com">vesteratrading@gmail.com</a>{instagram && <a href={'https://www.instagram.com/'+encodeURIComponent(instagram)+'/'} target="_blank" rel="noopener noreferrer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1"/></svg> @{instagram}</a>}<p>Based in Wake County, North Carolina</p></div>
    </footer>
  </div>;
}
