'use client';

import { useEffect, useState } from 'react';
import styles from './predictAI.module.css';
import type { PredictAIBacktestResponse } from './types';

const HORIZON_LABEL: Record<string, string> = { TODAY: 'Today Direction Accuracy', '1W': '1W Direction Accuracy', '1M': '1M Direction Accuracy' };

export default function PredictAIPerformance({ symbol }: { symbol: string }) {
    const [data, setData] = useState<PredictAIBacktestResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        setData(null);
        fetch(`/api/predict-ai/${encodeURIComponent(symbol)}/backtest`)
            .then(async r => {
                const json = await r.json();
                if (cancelled) return;
                if (!r.ok) { setError(json.error || 'Insufficient data to backtest this symbol.'); return; }
                setData(json);
            })
            .catch(() => { if (!cancelled) setError('Unable to retrieve model performance right now.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [symbol]);

    return (
        <div className={styles.card}>
            <div className={styles.headerRow}>
                <div className={styles.titleBlock}>
                    <h2 className={styles.title}>Vestera Predict AI — Model Performance</h2>
                    <p className={styles.subtitle}>Walk-forward backtest, no look-ahead bias</p>
                </div>
                {data && <span className={styles.versionBadge}><span className={styles.versionDot} />Model {data.modelVersion}</span>}
            </div>

            {loading && <div className={styles.loadingRow}><div className={styles.spinner} /><span>Running walk-forward backtest…</span></div>}
            {!loading && error && <p className={styles.errorText}>{error}</p>}

            {!loading && data && (
                <>
                    <div className={styles.horizonStrip}>
                        {data.accuracy.map(a => (
                            <div key={a.horizon} className={styles.horizonChip}>
                                <div className={styles.horizonChipLabel}>{HORIZON_LABEL[a.horizon] ?? a.horizon}</div>
                                <div className={styles.horizonChipValue}>{a.directionAccuracyPct !== null ? `${a.directionAccuracyPct.toFixed(0)}%` : 'N/A'}</div>
                            </div>
                        ))}
                    </div>
                    <p className={styles.methodologyNote}>
                        Testing period: {data.periodStart} to {data.periodEnd} ({data.sampleCount} total samples).
                    </p>
                    <p className={styles.disclosureNote}>{data.methodology}</p>
                </>
            )}
        </div>
    );
}
