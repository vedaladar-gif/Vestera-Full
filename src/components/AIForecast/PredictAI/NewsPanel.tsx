'use client';

import styles from './predictAI.module.css';
import type { NewsAnalysisData, NewsEventType } from './types';

const EVENT_LABEL: Record<NewsEventType, string> = {
    EARNINGS: 'Earnings',
    GUIDANCE: 'Guidance',
    ANALYST_UPGRADE: 'Analyst Upgrade',
    ANALYST_DOWNGRADE: 'Analyst Downgrade',
    LEADERSHIP: 'Leadership',
    MERGER_ACQUISITION: 'M&A',
    PRODUCT: 'Product',
    LEGAL_REGULATORY: 'Legal/Regulatory',
    SEC_FILING: 'SEC Filing',
    MACRO: 'Macro',
    MARKET_WIDE: 'Market-Wide',
    GENERAL: 'General',
};

function timeAgo(hoursAgo: number): string {
    if (hoursAgo < 1) return `${Math.max(1, Math.round(hoursAgo * 60))}m ago`;
    if (hoursAgo < 24) return `${Math.round(hoursAgo)}h ago`;
    return `${Math.round(hoursAgo / 24)}d ago`;
}

export default function NewsPanel({ news, available }: { news: NewsAnalysisData[]; available: boolean }) {
    return (
        <div className={styles.card}>
            <div className={styles.headerRow}>
                <div className={styles.titleBlock}>
                    <h2 className={styles.title}>Live News Analysis</h2>
                    <p className={styles.subtitle}>Real headlines, structurally analyzed for sentiment, importance, and recency — not an LLM guess</p>
                </div>
            </div>

            {!available && <p className={styles.newsEmpty}>News data is temporarily unavailable — forecasts currently rely on market/technical/fundamental signals only.</p>}
            {available && news.length === 0 && <p className={styles.newsEmpty}>No recent news found for this symbol.</p>}

            {available && news.length > 0 && (
                <div className={styles.newsList}>
                    {news.map(n => {
                        const timeBadgeClass =
                            n.timeRelevance === 'BREAKING' ? styles.badgeBreaking : n.timeRelevance === 'RECENT' ? styles.badgeRecent : styles.badgeStale;
                        const sentimentClass = n.sentiment > 0.08 ? styles.sentimentPositive : n.sentiment < -0.08 ? styles.sentimentNegative : styles.sentimentNeutral;
                        const impactColor = n.estimatedImpact > 0 ? '#4576E7' : n.estimatedImpact < 0 ? '#E0637A' : '#b8bdd8';
                        return (
                            <div key={n.item.uuid} className={styles.newsItem}>
                                <div className={styles.newsTopRow}>
                                    <a href={n.item.url} target="_blank" rel="noopener noreferrer" className={styles.newsTitleLink}>
                                        {n.item.title}
                                    </a>
                                    <span className={sentimentClass}>
                                        {n.sentiment > 0 ? '+' : ''}{(n.sentiment * 100).toFixed(0)}
                                    </span>
                                </div>
                                <div className={styles.newsMetaRow}>
                                    <span className={styles.newsSource}>{n.item.source}</span>
                                    <span className={styles.newsTime}>· {timeAgo(n.hoursAgo)}</span>
                                    <span className={`${styles.badge} ${styles.badgeEvent}`}>{EVENT_LABEL[n.eventType]}</span>
                                    <span className={`${styles.badge} ${timeBadgeClass}`}>{n.timeRelevance}</span>
                                </div>
                                <div className={styles.impactBarTrack}>
                                    <div
                                        className={styles.impactBarFill}
                                        style={{ width: `${Math.round(Math.abs(n.estimatedImpact) * 100)}%`, background: impactColor }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
