'use client';

import styles from './aiForecastComponents.module.css';
import type { QuoteData } from './types';

function formatBig(n: number | null): string {
    if (n === null) return '—';
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    return `$${n.toLocaleString()}`;
}

const STATUS_META: Record<QuoteData['marketStatus'], { label: string; color: string }> = {
    OPEN: { label: 'Market Open', color: '#3CA787' },
    CLOSED: { label: 'Market Closed', color: '#8b90b0' },
    PRE_MARKET: { label: 'Pre-Market', color: '#FFB84C' },
    AFTER_HOURS: { label: 'After-Hours', color: '#FFB84C' },
};

export default function StockHeader({ quote, dataUpdatedAt }: { quote: QuoteData; dataUpdatedAt: number }) {
    const up = quote.change >= 0;
    const status = STATUS_META[quote.marketStatus];
    const updated = new Date(dataUpdatedAt * 1000);

    return (
        <div className={styles.headerCard}>
            <div className={styles.headerTop}>
                <div>
                    <div className={styles.headerSymbolRow}>
                        <h1 className={styles.headerSymbol}>{quote.symbol}</h1>
                        <span className={styles.statusPill} style={{ background: `${status.color}22`, color: status.color }}>
                            <span className={styles.statusDot} style={{ background: status.color }} />
                            {status.label}
                        </span>
                    </div>
                    <div className={styles.headerName}>{quote.name}</div>
                </div>
                <div className={styles.headerPriceBlock}>
                    <div className={styles.headerPrice}>${quote.price.toFixed(2)}</div>
                    <div className={up ? styles.textGreenLg : styles.textRedLg}>
                        {up ? '▲' : '▼'} ${Math.abs(quote.change).toFixed(2)} ({up ? '+' : ''}{quote.changePct.toFixed(2)}%)
                    </div>
                </div>
            </div>

            <div className={styles.headerStatsGrid}>
                <div className={styles.headerStat}><div className={styles.headerStatLabel}>Market Cap</div><div className={styles.headerStatValue}>{formatBig(quote.marketCap)}</div></div>
                <div className={styles.headerStat}><div className={styles.headerStatLabel}>Volume</div><div className={styles.headerStatValue}>{quote.volume.toLocaleString()}</div></div>
                <div className={styles.headerStat}><div className={styles.headerStatLabel}>Avg Volume (3M)</div><div className={styles.headerStatValue}>{quote.avgVolume3m ? quote.avgVolume3m.toLocaleString() : '—'}</div></div>
                <div className={styles.headerStat}><div className={styles.headerStatLabel}>Day Range</div><div className={styles.headerStatValue}>${quote.dayLow.toFixed(2)} – ${quote.dayHigh.toFixed(2)}</div></div>
                <div className={styles.headerStat}><div className={styles.headerStatLabel}>52-Week Low</div><div className={styles.headerStatValue}>${quote.fiftyTwoWeekLow.toFixed(2)}</div></div>
                <div className={styles.headerStat}><div className={styles.headerStatLabel}>52-Week High</div><div className={styles.headerStatValue}>${quote.fiftyTwoWeekHigh.toFixed(2)}</div></div>
            </div>

            <div className={styles.dataUpdatedRow}>
                Data updated {updated.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · {updated.toLocaleDateString()}
                {quote.marketStatus !== 'OPEN' && ' · showing latest available data'}
            </div>
        </div>
    );
}
