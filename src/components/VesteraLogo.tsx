/**
 * Vestera wordmark — gradient V mark + "Vestera" gradient text.
 * Both use the brand blue gradient so the letterforms appear cut out
 * against whatever background sits behind them (dark nav or light nav).
 * No background box; no external image.
 */

interface VesteraLogoProps {
    height?: number;
}

export default function VesteraLogo({ height = 38 }: VesteraLogoProps) {
    const textSize   = Math.round(height * 0.72);
    const vMarkSize  = Math.round(height * 0.92);
    const gradientId = 'vl-grad';

    const gradientTextStyle: React.CSSProperties = {
        background: 'linear-gradient(135deg, #60b4ff 0%, #3b82f6 45%, #1d4ed8 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip:  'text',
        display: 'inline-block',
        lineHeight: 1,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 800,
        letterSpacing: '-0.5px',
        fontSize: textSize,
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1 }}>
            {/* V mark — SVG chevron with gradient fill */}
            <svg
                width={vMarkSize}
                height={vMarkSize}
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                style={{ flexShrink: 0 }}
            >
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%"   stopColor="#60b4ff" />
                        <stop offset="50%"  stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                </defs>
                {/* Bold V letterform */}
                <path
                    d="M6 8L20 34L34 8"
                    stroke={`url(#${gradientId})`}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>

            {/* Wordmark */}
            <span style={gradientTextStyle}>Vestera</span>
        </div>
    );
}
