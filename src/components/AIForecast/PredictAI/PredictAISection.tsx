'use client';

import HorizonStrip from './HorizonStrip';
import NewsPanel from './NewsPanel';
import PredictionTimeline from './PredictionTimeline';
import PredictAIPerformance from './PredictAIPerformance';
import styles from './predictAI.module.css';
import type { PredictAIResponse } from './types';

/** Renders everything except the "Today's Forecast" card, which is shown separately above the chart. */
export default function PredictAISection({ symbol, data, error }: { symbol: string; data: PredictAIResponse | null; error: string | null }) {
    if (error && !data) {
        return (
            <div className={styles.card}>
                <div className={styles.titleBlock}>
                    <h2 className={styles.title}>⚡ Vestera Predict AI</h2>
                </div>
                <p className={styles.errorText}>{error}</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className={styles.card}>
                <div className={styles.loadingRow}><div className={styles.spinner} /><span>Vestera Predict AI is analyzing live market data and news…</span></div>
            </div>
        );
    }

    return (
        <>
            <HorizonStrip horizons={data.horizons} />
            <NewsPanel news={data.news} available={data.dataAvailability.newsAvailable} />
            <PredictionTimeline symbol={symbol} />
            <PredictAIPerformance symbol={symbol} />
        </>
    );
}
