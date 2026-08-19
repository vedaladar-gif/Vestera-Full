'use client';

import { useEffect, useState } from 'react';
import styles from './aiForecastComponents.module.css';
import type { BacktestResponse } from './types';

const HORIZON_LABEL: Record<string, string> = { '1D': '1D Direction Accuracy', '1W': '1W Direction Accuracy', '1M': '1M Direction Accuracy' };

export default function ModelPerformance({ symbol }: { symbol: string }) {
    const [data, setData] = useState<BacktestResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        setData(null);
        fetch(`/api/ai-forecast/${encodeURIComponent(symbol)}/backtest`)
            .then(async r => {
                const json = await r.json();
                if (cancelled) return;
                if (!r.ok) { setError(json.error || 'Insufficient data to generate a reliable forecast.'); return; }
                setData(json);
            })
            .catch(() => { if (!cancelled) setError('Unable to retrieve model performance right now.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [symbol]);

    return (
        <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Model Performance</h2>
                <p className={styles.sectionSubtitle}>Backtested against real historical price data using a walk-forward methodology (no look-ahead)</p>
            </div>

            {loading && (
                <div className={styles.performanceLoading}>
                    <div className={styles.spinner} />
                    <span>Running walk-forward backtest…</span>
                </div>
            )}

            {!loading && error && <p className={styles.errorText}>{error}</p>}

            {!loading && data && (
                <>
                    <div className={styles.performanceGrid}>
                        {data.accuracy.map(a => (
                            <div key={a.horizon} className={styles.performanceCard}>
                                <div className={styles.performanceLabel}>{HORIZON_LABEL[a.horizon] ?? `${a.horizon} Direction Accuracy`}</div>
                                <div className={styles.performanceValue}>
                                    {a.directionAccuracyPct !== null ? `${a.directionAccuracyPct.toFixed(0)}%` : 'N/A'}
                                </div>
                                <div className={styles.performanceSub}>
                                    {a.sampleCount} simulated predictions · avg error {a.avgAbsErrorPct !== null ? `${a.avgAbsErrorPct.toFixed(1)}%` : '—'}
                                </div>
                                <div className={styles.performanceSub}>
                                    Bullish acc. {a.bullishAccuracyPct !== null ? `${a.bullishAccuracyPct.toFixed(0)}%` : '—'} · Bearish acc. {a.bearishAccuracyPct !== null ? `${a.bearishAccuracyPct.toFixed(0)}%` : '—'}
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className={styles.methodologyNote}>
                        Testing period: {data.periodStart} to {data.periodEnd} ({data.sampleCount} total samples across all horizons). {data.methodology}
                    </p>
                </>
            )}
        </div>
    );
}
