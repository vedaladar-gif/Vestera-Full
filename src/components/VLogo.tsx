interface VLogoProps {
    /** Height/width in px. Defaults to 32. */
    size?: number;
    style?: React.CSSProperties;
}

/** Vestera mark — bold blue "V", no background box. */
export default function VLogo({ size = 32, style }: VLogoProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            style={{ display: 'block', flexShrink: 0, ...style }}
        >
            <path
                d="M5 7L16 27L27 7"
                stroke="#4C8DFF"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
