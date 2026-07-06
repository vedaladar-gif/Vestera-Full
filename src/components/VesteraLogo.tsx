/**
 * Vestera wordmark — blue rounded-square mark + "Vestera" Baloo 2 text.
 * Redesign 2026: flat blue square + navy text, no gradient.
 */

interface VesteraLogoProps {
    height?: number;
}

export default function VesteraLogo({ height = 36 }: VesteraLogoProps) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
                width: Math.round(height * 0.95),
                height: Math.round(height * 0.95),
                borderRadius: Math.round(height * 0.3),
                background: '#4C8DFF',
                flexShrink: 0,
            }} />
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
