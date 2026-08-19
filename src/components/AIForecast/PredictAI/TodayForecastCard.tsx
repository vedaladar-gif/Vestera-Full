'use client';

import { useCurrentDate } from '@/hooks/useCurrentDate';
import styles from './predictAI.module.css';
import type { Direction, TodayForecastData } from './types';

const DIRECTION_META: Record<Direction, { arrow: string; label: string; className: string; verb: string }> = {
    UP: { arrow: '↑', label: 'UP', className: styles.directionUp, verb: 'move upward' },
    DOWN: { arrow: '↓', label: 'DOWN', className: styles.directionDown, verb: 'move downward' },
    NEUTRAL: { arrow: '→', label: 'NEUTRAL', className: styles.directionNeutral, verb: 'stay roughly flat' },
};

export default function TodayForecastCard({ forecast, symbol, modelVersion }: { forecast: TodayForecastData; symbol: string; modelVersion: string }) {
    const meta = DIRECTION_META[forecast.direction];
    const sign = forecast.predictedChangePct >= 0 ? '+' : '';
    const { formatted: todayFormatted } = useCurrentDate();

    return (
        <div className={styles.todayCard}>
            <div className={styles.headerRow}>
                <div className={styles.titleBlock}>
                    <h2 className={styles.title}>⚡ Vestera Predict AI — Today&apos;s Forecast</h2>
                    <p className={styles.subtitle}>{todayFormatted} · A separate, real-time market + breaking-news prediction engine</p>
                </div>
                <span className={styles.versionBadge}><span className={styles.versionDot} />Model {modelVersion}</span>
            </div>

            <div className={styles.directionRow}>
                <span className={`${styles.directionBadge} ${meta.className}`}>
                    <span className={styles.directionArrow}>{meta.arrow}</span> {meta.label}
                </span>
            </div>
            <p className={styles.todayNarrative}>
                Vestera Predict AI expects {symbol} to {meta.verb} today, based on live market data, technicals, and the latest news.
            </p>

            <div className={styles.todayStatsGrid}>
                <div className={styles.todayStat}>
                    <div className={styles.todayStatLabel}>AI Predicted Price</div>
                    <div className={styles.todayStatValue}>${forecast.predictedPrice.toFixed(2)}</div>
                </div>
                <div className={styles.todayStat}>
                    <div className={styles.todayStatLabel}>Current Price</div>
                    <div className={styles.todayStatValue}>${forecast.currentPrice.toFixed(2)}</div>
                </div>
                <div className={styles.todayStat}>
                    <div className={styles.todayStatLabel}>Predicted Movement</div>
                    <div className={styles.todayStatValue} style={{ color: forecast.predictedChangePct >= 0 ? '#3CA787' : '#E0637A' }}>
                        {sign}{forecast.predictedChangePct.toFixed(2)}%
                    </div>
                </div>
                <div className={styles.todayStat}>
                    <div className={styles.todayStatLabel}>Confidence</div>
                    <div className={styles.todayStatValue}>{forecast.confidence}%</div>
                </div>
            </div>
        </div>
    );
}
