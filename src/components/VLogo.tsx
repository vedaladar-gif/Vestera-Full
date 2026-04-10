interface VLogoProps {
    /** Icon box size in px. Defaults to 32. */
    size?: number;
    style?: React.CSSProperties;
}

/**
 * Vestera V-mark — a rounded square with a blue→purple gradient
 * and a white chevron "V" SVG. Scales cleanly from 22px to 64px.
 */
export default function VLogo({ size = 32, style }: VLogoProps) {
    const radius = Math.round(size * 0.265); // ~9px @ 34px
    const iconSize = Math.round(size * 0.52);

    return (
        <span
            aria-hidden="true"
            style={{
                width: size,
                height: size,
                borderRadius: radius,
                background: 'linear-gradient(135deg, #4f6ef7 0%, #9b5de5 100%)',
                /* Edge definition only; outer glow comes from .logo-glow drop-shadow */
                boxShadow: '0 0 0 1px rgba(79,110,247,0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                ...style,
            }}
        >
            <svg
                width={iconSize}
                height={iconSize}
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M4 5L10 16L16 5"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </span>
    );
}
