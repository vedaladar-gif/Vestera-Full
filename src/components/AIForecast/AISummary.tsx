'use client';

import styles from './aiForecastComponents.module.css';

export default function AISummary({ summary }: { summary: string }) {
    return (
        <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>AI Summary</div>
            <p className={styles.summaryText}>{summary}</p>
        </div>
    );
}
