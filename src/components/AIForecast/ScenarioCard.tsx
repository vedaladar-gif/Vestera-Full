'use client';

import styles from './aiForecastComponents.module.css';
import type { ScenarioSetData } from './types';

export default function ScenarioCard({ scenarios }: { scenarios: ScenarioSetData }) {
    const rows = [
        { label: 'Bull Case', color: '#3CA787', data: scenarios.bull },
        { label: 'Base Case', color: '#4C8DFF', data: scenarios.base },
        { label: 'Bear Case', color: '#E0637A', data: scenarios.bear },
    ];

    return (
        <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Bull / Base / Bear Scenarios</h2>
                <p className={styles.sectionSubtitle}>{scenarios.horizonLabel} price scenarios and their model-estimated probabilities</p>
            </div>
            <div className={styles.scenarioGrid}>
                {rows.map(r => (
                    <div key={r.label} className={styles.scenarioCard} style={{ borderTopColor: r.color }}>
                        <div className={styles.scenarioLabel} style={{ color: r.color }}>{r.label}</div>
                        <div className={styles.scenarioPrice}>${r.data.price.toFixed(2)}</div>
                        <div className={styles.scenarioProbLabel}>Probability</div>
                        <div className={styles.scenarioProbTrack}>
                            <div className={styles.scenarioProbFill} style={{ width: `${r.data.probability * 100}%`, background: r.color }} />
                        </div>
                        <div className={styles.scenarioProbValue}>{Math.round(r.data.probability * 100)}%</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
