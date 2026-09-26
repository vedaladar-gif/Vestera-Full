'use client';

import styles from './predictAI.module.css';
import type { HorizonPredictionData } from './types';

const COLOR: Record<string, string> = { UP: '#4576E7', DOWN: '#E0637A', NEUTRAL: '#8b90b0' };

export default function HorizonStrip({ horizons }: { horizons: HorizonPredictionData[] }) {
    return (
        <div className={styles.card}>
            <div className={styles.headerRow}>
                <div className={styles.titleBlock}>
                    <h2 className={styles.title}>Predict AI — Multi-Timeframe Outlook</h2>
                    <p className={styles.subtitle}>A separate projected trajectory generated for each timeframe — not the same range stretched out</p>
                </div>
            </div>
            <div className={styles.horizonStrip}>
                {horizons.map(h => (
                    <div key={h.key} className={styles.horizonChip}>
                        <div className={styles.horizonChipLabel}>{h.label}</div>
                        <div className={styles.horizonChipValue} style={{ color: COLOR[h.direction] }}>
                            {h.direction === 'UP' ? '↑' : h.direction === 'DOWN' ? '↓' : '→'} {h.predictedChangePct >= 0 ? '+' : ''}{h.predictedChangePct.toFixed(1)}%
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
