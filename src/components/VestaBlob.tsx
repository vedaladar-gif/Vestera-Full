/**
 * VestaBlob — Vestera's AI mascot.
 * Full SVG mascot: 3 cloud bumps + party hat + goggle eyes + green dot.
 * Mini mode: simple blue circle with two dot eyes (for nav icon).
 */

interface VestaBlobProps {
    size?: number;
    showDot?: boolean;
    animate?: boolean;
    showLabel?: boolean;
    mini?: boolean;
}

export default function VestaBlob({
    size = 66,
    showDot = true,
    animate = false,
    showLabel = false,
    mini = false,
}: VestaBlobProps) {
    if (mini) {
        // Simple mini icon: blue circle + two navy dot eyes
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                style={{ flexShrink: 0, display: 'inline-block' }}
            >
                <circle cx="11" cy="11" r="11" fill="#4C8DFF" />
                <circle cx="7" cy="9" r="2" fill="#20264D" />
                <circle cx="15" cy="9" r="2" fill="#20264D" />
            </svg>
        );
    }

    // Full mascot — viewBox 0 0 76 95
    // Body circle: cx=38 cy=58 r=33
    // Bumps above body; hat on top
    const svgH = Math.round(size * 95 / 76);

    return (
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <svg
                    width={size}
                    height={svgH}
                    viewBox="0 0 76 95"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    style={{
                        display: 'block',
                        animation: animate ? 'vestaBob 2.4s ease-in-out infinite' : undefined,
                        overflow: 'visible',
                    }}
                >
                    {/* ── Left bump ── */}
                    <circle cx="19" cy="25" r="10.5" fill="#4C8DFF" />
                    {/* ── Center bump ── */}
                    <circle cx="38" cy="22" r="12" fill="#4C8DFF" />
                    {/* ── Right bump ── */}
                    <circle cx="57" cy="25" r="10.5" fill="#4C8DFF" />

                    {/* ── Body circle ── */}
                    <circle cx="38" cy="58" r="33" fill="#4C8DFF" />

                    {/* ── Party hat (gold triangle) ── */}
                    <polygon points="38,3 43,12 33,12" fill="#FFB84C" />

                    {/* ── Left eye (white goggle + navy pupil) ── */}
                    <circle cx="22" cy="40" r="8.5" fill="white" stroke="#20264D" strokeWidth="3" />
                    <circle cx="22" cy="40" r="2.5" fill="#20264D" />

                    {/* ── Eye bridge ── */}
                    <rect x="31" y="38" width="6" height="3" rx="1.5" fill="#20264D" />

                    {/* ── Right eye (white goggle + navy pupil) ── */}
                    <circle cx="54" cy="40" r="8.5" fill="white" stroke="#20264D" strokeWidth="3" />
                    <circle cx="54" cy="40" r="2.5" fill="#20264D" />

                    {/* ── Green online dot ── */}
                    {showDot && (
                        <circle cx="64" cy="26" r="7" fill="#5FD068" stroke="#EEF2FB" strokeWidth="3" />
                    )}
                </svg>

                {animate && (
                    <style>{`
                        @keyframes vestaBob {
                            0%, 100% { transform: translateY(0); }
                            50%       { transform: translateY(-6px); }
                        }
                    `}</style>
                )}
            </div>

            {showLabel && (
                <div style={{
                    marginTop: 6,
                    background: '#20264D',
                    color: '#fff',
                    fontFamily: "'Baloo 2', sans-serif",
                    fontWeight: 700,
                    fontSize: 12,
                    padding: '3px 10px',
                    borderRadius: 999,
                    lineHeight: 1.4,
                    whiteSpace: 'nowrap',
                }}>
                    Vesta
                </div>
            )}
        </div>
    );
}
