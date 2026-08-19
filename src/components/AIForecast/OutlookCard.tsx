'use client';

import styles from './aiForecastComponents.module.css';

const CATEGORY_META: Record<string, { color: string; glow: string }> = {
    'Strong Bullish': { color: '#3CA787', glow: 'rgba(60,167,135,0.15)' },
    'Bullish': { color: '#4C8DFF', glow: 'rgba(76,141,255,0.12)' },
    'Neutral': { color: '#8b90b0', glow: 'rgba(139,144,176,0.12)' },
    'Bearish': { color: '#FFB84C', glow: 'rgba(255,184,76,0.12)' },
    'Strong Bearish': { color: '#E0637A', glow: 'rgba(224,99,122,0.15)' },
};

export default function OutlookCard({
    category,
    compositeScore,
    confidence,
    price,
}: {
    category: string;
    compositeScore: number;
    confidence: number;
    price: number;
}) {
    const meta = CATEGORY_META[category] ?? CATEGORY_META.Neutral;
    const barPct = ((compositeScore + 100) / 200) * 100;

    return (
        <div className={styles.outlookCard} style={{ background: `linear-gradient(135deg, ${meta.glow}, transparent)` }}>
            <div className={styles.outlookLabel}>AI Outlook <span className={styles.aiTag}>AI-generated estimate</span></div>
            <div className={styles.outlookCategory} style={{ color: meta.color }}>{category.toUpperCase()}</div>

            <div className={styles.outlookScoreRow}>
                <div className={styles.outlookScoreBig} style={{ color: meta.color }}>
                    {compositeScore > 0 ? '+' : ''}{compositeScore}
                </div>
                <div className={styles.outlookScoreOutOf}>/ 100</div>
            </div>

            <div className={styles.outlookBarTrack}>
                <div className={styles.outlookBarFill} style={{ width: `${barPct}%`, background: meta.color }} />
                <div className={styles.outlookBarMid} />
            </div>
            <div className={styles.outlookBarLabels}>
                <span>Strong Bearish</span><span>Neutral</span><span>Strong Bullish</span>
            </div>

            <div className={styles.outlookMetaRow}>
                <div>
                    <div className={styles.outlookMetaLabel}>Confidence</div>
                    <div className={styles.outlookMetaValue}>{Math.round(confidence * 100)}%</div>
                </div>
                <div>
                    <div className={styles.outlookMetaLabel}>Current Price</div>
                    <div className={styles.outlookMetaValue}>${price.toFixed(2)}</div>
                </div>
            </div>
        </div>
    );
}
