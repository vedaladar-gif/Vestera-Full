'use client';

import styles from './aiForecastComponents.module.css';
import type { HorizonForecastData } from './types';

const DIRECTION_META: Record<string, { color: string; label: string }> = {
    bullish: { color: '#4576E7', label: 'Bullish' },
    bearish: { color: '#E0637A', label: 'Bearish' },
    neutral: { color: '#8b90b0', label: 'Neutral' },
};

export default function HorizonForecastSection({
    title,
    subtitle,
    horizons,
}: {
    title: string;
    subtitle: string;
    horizons: HorizonForecastData[];
}) {
    return (
        <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{title}</h2>
                <p className={styles.sectionSubtitle}>{subtitle}</p>
            </div>
            <div className={styles.horizonGrid}>
                {horizons.map(h => {
                    const meta = DIRECTION_META[h.direction];
                    return (
                        <div key={h.key} className={styles.horizonCard}>
                            <div className={styles.horizonLabel}>{h.label}</div>
                            <div className={styles.horizonDirection} style={{ color: meta.color }}>{meta.label}</div>
                            <div className={styles.horizonRange}>
                                Expected range: ${h.priceLow.toFixed(2)} – ${h.priceHigh.toFixed(2)}
                            </div>
                            <div className={styles.horizonBarRow}>
                                <span className={styles.horizonBarLabel}>Bull probability</span>
                                <span className={styles.horizonBarValue}>{Math.round(h.probabilityUp * 100)}%</span>
                            </div>
                            <div className={styles.horizonBarTrack}>
                                <div className={styles.horizonBarFill} style={{ width: `${h.probabilityUp * 100}%`, background: meta.color }} />
                            </div>
                            <div className={styles.horizonBarRow}>
                                <span className={styles.horizonBarLabel}>Confidence</span>
                                <span className={styles.horizonBarValue}>{Math.round(h.confidence * 100)}%</span>
                            </div>
                            <div className={styles.horizonBarTrack}>
                                <div className={styles.horizonBarFillMuted} style={{ width: `${h.confidence * 100}%` }} />
                            </div>
                            {h.keyFactors.length > 0 && (
                                <ul className={styles.horizonFactors}>
                                    {h.keyFactors.map((f, i) => <li key={i}>{f}</li>)}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
