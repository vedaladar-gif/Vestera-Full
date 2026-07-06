'use client';
import { usePathname } from 'next/navigation';
import Footer from './Footer';

/** Render the global footer on every page EXCEPT the homepage (which has its own) */
export default function ConditionalFooter() {
    const path = usePathname();
    if (path === '/') return null;
    return <Footer />;
}
