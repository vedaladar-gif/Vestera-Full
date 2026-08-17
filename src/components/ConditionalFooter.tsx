'use client';
import { usePathname } from 'next/navigation';
import Footer from './Footer';

/** Render the global footer on every page EXCEPT the homepage (which has its own) and admin mode (standalone page) */
export default function ConditionalFooter() {
    const path = usePathname();
    if (path === '/' || path.startsWith('/admin')) return null;
    return <Footer />;
}
