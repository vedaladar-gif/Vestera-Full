/**
 * VestaBlob — Vestera's AI mascot.
 * Clean, friendly character: rounded body, big expressive eyes with highlights,
 * soft cheeks, a gentle smile, and a little gold "spark" antenna.
 * Mini mode: a compact face for nav icons and chat avatars.
 */

interface VestaBlobProps {
    size?: number;
    showDot?: boolean;
    animate?: boolean;
    showLabel?: boolean;
    mini?: boolean;
}

const BLUE = '#4C8DFF';
const BLUE_DK = '#3A78E6';
const NAVY = '#20264D';
const GOLD = '#FFB84C';
const MINT = '#5FD068';

export default function VestaBlob({
    size = 66,
    showDot = true,
    animate = false,
    showLabel = false,
    mini = false,
}: VestaBlobProps) {
    if (mini) {
        // Compact face — readable down to ~18px
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                style={{ flexShrink: 0, display: 'inline-block' }}
            >
                <circle cx="12" cy="12.5" r="11" fill={BLUE} />
                <ellipse cx="12" cy="8.5" rx="6.5" ry="4" fill="#FFFFFF" opacity="0.16" />
                {/* eyes */}
                <ellipse cx="8.4" cy="11.4" rx="2.3" ry="2.7" fill="#fff" />
                <ellipse cx="15.6" cy="11.4" rx="2.3" ry="2.7" fill="#fff" />
                <circle cx="8.9" cy="11.9" r="1.25" fill={NAVY} />
                <circle cx="16.1" cy="11.9" r="1.25" fill={NAVY} />
                <circle cx="8.1" cy="10.8" r="0.5" fill="#fff" />
                <circle cx="15.3" cy="10.8" r="0.5" fill="#fff" />
                {/* smile */}
                <path d="M9.2 15.4 Q12 17.6 14.8 15.4" stroke={NAVY} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
        );
    }

    // Full mascot — viewBox 0 0 96 108
    const svgH = Math.round(size * 108 / 96);

    return (
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <svg
                    width={size}
                    height={svgH}
                    viewBox="0 0 96 108"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    style={{
                        display: 'block',
                        animation: animate ? 'vestaBob 2.6s ease-in-out infinite' : undefined,
                        overflow: 'visible',
                        filter: 'drop-shadow(0 5px 10px rgba(76,141,255,0.28))',
                    }}
                >
                    {/* ── Antenna + gold spark (behind the head) ── */}
                    <path d="M48 34 L48 15" stroke={BLUE} strokeWidth="4" strokeLinecap="round" />
                    <circle cx="48" cy="10" r="6" fill={GOLD} />
                    <circle cx="45.8" cy="8" r="1.7" fill="#FFF" opacity="0.85" />

                    {/* ── Body ── */}
                    <circle cx="48" cy="62" r="34" fill={BLUE} />
                    {/* soft bottom shade for roundness */}
                    <path d="M20 74 A34 34 0 0 0 76 74 A46 46 0 0 1 20 74 Z" fill={BLUE_DK} opacity="0.35" />
                    {/* top sheen */}
                    <ellipse cx="37" cy="45" rx="17" ry="11" fill="#FFFFFF" opacity="0.16" />

                    {/* ── Eyes ── */}
                    <ellipse cx="37" cy="59" rx="8.5" ry="10" fill="#fff" />
                    <ellipse cx="59" cy="59" rx="8.5" ry="10" fill="#fff" />
                    <circle cx="38.6" cy="61" r="4.3" fill={NAVY} />
                    <circle cx="60.6" cy="61" r="4.3" fill={NAVY} />
                    {/* eye sparkles */}
                    <circle cx="36.4" cy="58.4" r="1.7" fill="#fff" />
                    <circle cx="58.4" cy="58.4" r="1.7" fill="#fff" />

                    {/* ── Cheeks ── */}
                    <ellipse cx="26.5" cy="72" rx="5" ry="3" fill="#FF8FA8" opacity="0.5" />
                    <ellipse cx="69.5" cy="72" rx="5" ry="3" fill="#FF8FA8" opacity="0.5" />

                    {/* ── Smile ── */}
                    <path d="M40 74 Q48 82.5 56 74" stroke={NAVY} strokeWidth="3" strokeLinecap="round" fill="none" />

                    {/* ── Green online dot ── */}
                    {showDot && (
                        <circle cx="76" cy="38" r="7" fill={MINT} stroke="#fff" strokeWidth="3" />
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
                    background: NAVY,
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
