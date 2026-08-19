'use client';

import { useEffect, useState } from 'react';
import styles from './predictAI.module.css';
import type { HistoryLogEntry, HistoryLogResponse } from './types';

function formatTs(ts: string): string {
    const d = new Date(ts);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function PredictionTimeline({ symbol }: { symbol: string }) {
    const [entries, setEntries] = useState<HistoryLogEntry[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = () => {
            fetch(`/api/predict-ai/${encodeURIComponent(symbol)}/history-log`)
                .then(async r => {
                    const json: HistoryLogResponse = await r.json();
                    if (cancelled) return;
                    if (!r.ok) { setError('Unable to load prediction history.'); return; }
                    setEntries(json.entries);
                })
                .catch(() => { if (!cancelled) setError('Unable to load prediction history.'); });
        };
        load();
        const id = setInterval(load, 60_000);
        return () => { cancelled = true; clearInterval(id); };
    }, [symbol]);

    return (
        <div className={styles.card}>
            <div className={styles.headerRow}>
                <div className={styles.titleBlock}>
                    <h2 className={styles.title}>Prediction History</h2>
                    <p className={styles.subtitle}>How Vestera Predict AI has reacted to new information over time</p>
                </div>
            </div>

            {error && <p className={styles.errorText}>{error}</p>}
            {!error && entries === null && <div className={styles.loadingRow}><div className={styles.spinner} /><span>Loading timeline…</span></div>}
            {!error && entries !== null && entries.length === 0 && <p className={styles.timelineEmpty}>No updates logged yet — check back after the model recalculates.</p>}
            {!error && entries !== null && entries.length > 0 && (
                <div className={styles.timeline}>
                    {entries.map((e, i) => (
                        <div key={i} className={styles.timelineItem}>
                            <div className={styles.timelineDotWrap}>
                                <span className={`${styles.timelineDot} ${e.direction === 'UP' ? styles.timelineDotUp : e.direction === 'DOWN' ? styles.timelineDotDown : ''}`} />
                            </div>
                            <div className={styles.timelineContent}>
                                <div className={styles.timelineTime}>{formatTs(e.ts)}</div>
                                <div className={styles.timelineNote}>{e.note}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
