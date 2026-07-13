/**
 * Vestera wordmark — blue rounded-square mark + "Vestera" Baloo 2 text.
 * Redesign 2026: flat blue square + navy text, no gradient.
 */

interface VesteraLogoProps {
    height?: number;
}

export default function VesteraLogo({ height = 36 }: VesteraLogoProps) {
    const box = Math.round(height * 0.95);
    const chevron = Math.round(box * 0.58);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
                width: box,
                height: box,
                borderRadius: Math.round(height * 0.3),
                background: '#4C8DFF',
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
                fontFamily: "'Baloo 2', sans-serif",
                fontWeight: 800,
                fontSize: Math.round(height * 0.6),
                color: '#20264D',
                letterSpacing: '-0.3px',
                lineHeight: 1,
            }}>
                Vestera
            </span>
        </div>
    );
}
