/**
 * Vestera wordmark — emerald rounded-square mark + "Vestera" text.
 * Fintech redesign 2026: flat emerald square + navy text, no gradient.
 */

interface VesteraLogoProps {
    height?: number;
    /** Use on dark backgrounds (navy nav/sidebar/auth panels) — renders white wordmark text. */
    light?: boolean;
}

export default function VesteraLogo({ height = 36, light = false }: VesteraLogoProps) {
    const box = Math.round(height * 0.95);
    const chevron = Math.round(box * 0.58);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
                width: box,
                height: box,
                borderRadius: Math.round(height * 0.3),
                background: '#12A669',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <svg
                    width={chevron}
                    height={chevron}
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <path
                        d="M4 5.5L10 15L16 5.5"
                        stroke="#fff"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
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
