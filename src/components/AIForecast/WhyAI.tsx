'use client';

import styles from './aiForecastComponents.module.css';

export default function WhyAI({ positive, negative }: { positive: string[]; negative: string[] }) {
    return (
        <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Why is the AI predicting this?</h2>
                <p className={styles.sectionSubtitle}>The strongest factors behind the current outlook, in plain English</p>
            </div>
            <div className={styles.factorsGrid}>
                <div>
                    <div className={styles.factorsColLabel} style={{ color: '#4576E7' }}>Positive Factors</div>
                    {positive.length > 0 ? (
                        <ul className={styles.factorsList}>
                            {positive.map((f, i) => <li key={i} className={styles.factorItemPositive}>{f}</li>)}
                        </ul>
                    ) : <p className={styles.factorsEmpty}>No strong positive factors identified.</p>}
                </div>
                <div>
                    <div className={styles.factorsColLabel} style={{ color: '#E0637A' }}>Negative Factors</div>
                    {negative.length > 0 ? (
                        <ul className={styles.factorsList}>
                            {negative.map((f, i) => <li key={i} className={styles.factorItemNegative}>{f}</li>)}
                        </ul>
                    ) : <p className={styles.factorsEmpty}>No strong negative factors identified.</p>}
                </div>
            </div>
        </div>
    );
}
