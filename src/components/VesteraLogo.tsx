'use client';

import { useId } from 'react';

/**
 * Vestera brand mark — bare two-tone "V" (no background box): a soft
 * blue-gray left stroke crossed by a mint→emerald gradient right stroke,
 * meeting at a point. Matches the official Vestera logo.
 */
export function VesteraMark({ size = 32, style }: { size?: number; style?: React.CSSProperties }) {
    const gradId = 'vestera-mark-grad-' + useId().replace(/[:]/g, '');
    const w = Math.round(size * 0.89);
    const h = size;
    return (
        <svg
            width={w}
            height={h}
            viewBox="0 0 34 38"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            style={{ flexShrink: 0, ...style }}
        >
            <defs>
                <linearGradient id={gradId} x1="30" y1="2" x2="14" y2="36" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#8FE9D8" />
                    <stop offset="100%" stopColor="#12A669" />
                </linearGradient>
            </defs>
            <path d="M4 2L18 36" stroke="#A9BEDD" strokeWidth="7" strokeLinecap="round" />
            <path d={`M30 2L18 36`} stroke={`url(#${gradId})`} strokeWidth="7" strokeLinecap="round" />
        </svg>
    );
}

interface VesteraLogoProps {
    height?: number;
    /** Use on dark backgrounds (navy nav/sidebar/auth panels) — renders white wordmark text. */
    light?: boolean;
    /** Render only the "V" mark, without the "Vestera" wordmark. */
    markOnly?: boolean;
}

export default function VesteraLogo({ height = 36, light = false, markOnly = false }: VesteraLogoProps) {
    const iconSize = Math.round(height * 0.95);

    if (markOnly) return <VesteraMark size={iconSize} />;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(height * 0.24) }}>
            <VesteraMark size={iconSize} />
            <span style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 800,
                fontSize: Math.round(height * 0.6),
                color: light ? '#FFFFFF' : '#20264D',
                letterSpacing: '-0.3px',
                lineHeight: 1,
            }}>
                Vestera
            </span>
        </div>
    );
}
