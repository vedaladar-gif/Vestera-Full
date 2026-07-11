/**
 * Vestera wordmark — V-mark icon + "Vestera" Baloo 2 text.
 */

import VLogo from './VLogo';

interface VesteraLogoProps {
    height?: number;
}

export default function VesteraLogo({ height = 36 }: VesteraLogoProps) {
    const iconSize = Math.round(height * 0.95);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <VLogo size={iconSize} />
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
