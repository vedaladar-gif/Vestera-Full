'use client';

/** The V mark used throughout the approved Vestera design. */
export function VesteraMark({ size = 32, style }: { size?: number; style?: React.CSSProperties }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            style={{ flexShrink: 0, ...style }}
        >
            <circle cx="20" cy="20" r="20" fill="#1B2850" />
            <text x="18.5" y="29" fill="white" fontFamily="Georgia, serif" fontSize="29" fontWeight="700" fontStyle="italic" textAnchor="middle">V</text>
            <path d="M29 8c4 0 5 3 4 6-3 0-5-2-4-6Z" fill="#A9C3FF" />
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
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontWeight: 700,
                fontSize: Math.round(height * 0.7),
                color: light ? '#FFFFFF' : '#1B2850',
                letterSpacing: '-0.8px',
                lineHeight: 1,
            }}>
                Vestera
            </span>
        </div>
    );
}
