'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import styles from '@/app/stats/stats.module.css';
import PortfolioChart, { type HistoryPoint } from '@/components/PortfolioChart';
import GuestGuard from '@/components/GuestGuard';
import { isTutorialActive } from '@/lib/onboarding';

interface HoldingEntry {
    stock: string;
    shares: number;
    current_price: number;
    value: number;
    buy_price?: number;
    gain_loss?: number;
    gain_loss_pct?: number;
}

const ALLOC_COLORS = [
    '#4576E7', '#3A66D0', '#4ade80', '#fbbf24',
    '#f87171', '#06b6d4', '#4576E7', '#f97316',
];

function PortfolioPage() {
    const [cash, setCash] = useState(0);
    const [portfolioValue, setPortfolioValue] = useState(0);
    const [pl, setPl] = useState(0);
    const [pct, setPct] = useState(0);
    const [holdings, setHoldings] = useState<HoldingEntry[]>([]);
    const [myRank, setMyRank] = useState<number | undefined>();
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const [portfolioHistory, setPortfolioHistory] = useState<HistoryPoint[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
                if (cancelled) return;
                if (!res.ok) { router.replace('/restricted'); return; }
                const data = await res.json();
                if (cancelled) return;
                if (data.authenticated === true) setAuthChecked(true);
                else router.replace('/restricted');
            } catch {
                if (!cancelled) router.replace('/restricted');
            }
        })();
        return () => { cancelled = true; };
    }, [router]);

    const refresh = useCallback(async () => {
        try {
            const lbUrl = isTutorialActive() ? '/api/leaderboard?tutorial=1' : '/api/leaderboard';
            const [hd, lbData] = await Promise.all([
                fetch('/api/holdings', { credentials: 'same-origin' }).then(r => (r.ok ? r.json() : null)),
                fetch(lbUrl, { credentials: 'same-origin' }).then(r => r.json()),
            ]);
            if (hd) {
                setCash(hd.cash);
                setPortfolioValue(hd.portfolio_value);
                setPl(hd.pl);
                setPct(hd.pct);
                setHoldings(hd.holdings || []);
            }
            if (lbData?.leaderboard) {
                const me = lbData.leaderboard.find((u: { isCurrentUser: boolean; rank: number }) => u.isCurrentUser);
                if (me) setMyRank(me.rank);
            }
        } catch { /* ignore */ }
    }, []);

    const refreshHistory = useCallback(async () => {
        try {
            const data = await fetch('/api/portfolio-history', { credentials: 'same-origin' })
                .then(r => (r.ok ? r.json() : { history: [] }));
            setPortfolioHistory(data.history || []);
        } catch { /* ignore */ }
        finally { setHistoryLoading(false); }
    }, []);

    useEffect(() => {
        if (!authChecked) return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            await refresh();
            if (!cancelled) setLoading(false);
            await refreshHistory();
        })();
        const id = setInterval(() => { void refresh(); void refreshHistory(); }, 15_000);
        const onFocus = () => { void refresh(); void refreshHistory(); };
        window.addEventListener('focus', onFocus);
        return () => { cancelled = true; clearInterval(id); window.removeEventListener('focus', onFocus); };
    }, [authChecked, refresh, refreshHistory]);

    if (!authChecked || loading) {
        return (
            <div className={styles.statsWrap} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className={styles.spinner} />
            </div>
        );
    }

    const totalAccount = cash + portfolioValue;
    const isUp = pl >= 0;
    const allocTotal = totalAccount > 0 ? totalAccount : 1;
    const holdingBars = holdings.map((h, i) => ({
        label: h.stock,
        value: h.value,
        color: ALLOC_COLORS[i % ALLOC_COLORS.length],
        pct: (h.value / allocTotal) * 100,
    }));
    const cashPct = (cash / allocTotal) * 100;
    const allocationBars = [
        ...holdingBars,
        { label: 'Cash', value: cash, color: 'var(--vt-border)', pct: cashPct },
    ];
    const bestHolding = holdings.reduce<HoldingEntry | null>(
        (best, h) => !best || h.value > best.value ? h : best, null
    );

    return (
        <div className={styles.statsWrap}>
            <div className={styles.statsInner}>
                <motion.div
                    className={styles.pageHeader}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                    <h1 className={styles.pageTitle}>Portfolio</h1>
                    <p className={styles.pageSubtitle}>Track your holdings, performance, and allocation</p>
                </motion.div>

                <div className={styles.statCards}>
                    <div className={styles.statCard}>
                        <div className={styles.statCardTop}>
                            <span className={styles.statCardLabel}>Total Portfolio Value</span>
                        </div>
                        <div className={styles.statCardValue} style={{ color: 'var(--vt-text)' }}>
                            ${totalAccount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={styles.statCardSub}>Starting capital: $100,000.00</div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statCardTop}>
                            <span className={styles.statCardLabel}>Total Gain / Loss</span>
                        </div>
                        <div className={styles.statCardValue} style={{ color: isUp ? 'var(--vt-green)' : 'var(--vt-red)' }}>
                            {isUp ? '+' : ''}{pct.toFixed(1)}%
                        </div>
                        <div className={styles.statCardSub} style={{ color: isUp ? 'var(--vt-green)' : 'var(--vt-red)' }}>
                            {isUp ? '+' : ''}${pl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statCardTop}>
                            <span className={styles.statCardLabel}>Available Cash</span>
                        </div>
                        <div className={styles.statCardValue} style={{ color: 'var(--vt-text)' }}>
                            ${cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={styles.statCardSub}>
                            {totalAccount > 0 ? ((cash / totalAccount) * 100).toFixed(1) : '100.0'}% of portfolio
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statCardTop}>
                            <span className={styles.statCardLabel}>Positions Held</span>
                        </div>
                        <div className={styles.statCardValue} style={{ color: 'var(--vt-text)' }}>
                            {holdings.length}
                        </div>
                        <div className={styles.statCardSub}>
                            {holdings.length === 1 ? '1 stock position' : `${holdings.length} stock positions`}
                        </div>
                    </div>
                </div>

                <div className={styles.card} style={{ marginBottom: 16 }}>
                    <div className={styles.cardHeader}>
                        <div>
                            <h2 className={styles.cardTitle}>Portfolio Performance</h2>
                            <p className={styles.cardSub}>
                                {portfolioHistory.length >= 2
                                    ? `${portfolioHistory.length} data points from ${portfolioHistory[0].date} to ${portfolioHistory[portfolioHistory.length - 1].date}`
                                    : 'Trade history over time'}
                            </p>
                        </div>
                        {portfolioHistory.length >= 2 && (
                            <span style={{
                                fontSize: 13, fontWeight: 700,
                                color: isUp ? 'var(--vt-green)' : 'var(--vt-red)',
                                background: isUp ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                                padding: '4px 12px', borderRadius: '100px',
                            }}>
                                {isUp ? '+' : ''}{pct.toFixed(1)}%
                            </span>
                        )}
                    </div>
                    <PortfolioChart data={portfolioHistory} loading={historyLoading} chartHeight={240} />
                </div>

                <div className={styles.midGrid}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div>
                                <h2 className={styles.cardTitle}>Portfolio Allocation</h2>
                                <p className={styles.cardSub}>How your capital is distributed across positions</p>
                            </div>
                        </div>
                        <div className={styles.allocBar}>
                            {allocationBars.map((seg, i) => (
                                <div
                                    key={i}
                                    className={styles.allocSeg}
                                    style={{
                                        flexGrow: Math.max(seg.pct, 0.5),
                                        flexShrink: 0,
                                        flexBasis: 0,
                                        background: seg.color,
                                    }}
                                    title={`${seg.label}: ${seg.pct.toFixed(1)}%`}
                                />
                            ))}
                        </div>
                        <div className={styles.allocLegend}>
                            {holdingBars.map((seg, i) => (
                                <div key={i} className={styles.allocLegendItem}>
                                    <div className={styles.allocDot} style={{ background: seg.color }} />
                                    <div className={styles.allocInfo}>
                                        <div className={styles.allocLabel}>{seg.label}</div>
                                        <div className={styles.allocMeta}>
                                            {seg.pct.toFixed(1)}% · ${seg.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                        </div>
                                    </div>
                                    <div className={styles.allocPct}>{seg.pct.toFixed(1)}%</div>
                                </div>
                            ))}
                            <div className={styles.allocLegendItem}>
                                <div className={styles.allocDot} style={{ background: 'var(--vt-border2)', border: '1px solid var(--vt-border)' }} />
                                <div className={styles.allocInfo}>
                                    <div className={styles.allocLabel}>Cash</div>
                                    <div className={styles.allocMeta}>
                                        {cashPct.toFixed(1)}% · ${cash.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                                <div className={styles.allocPct}>{cashPct.toFixed(1)}%</div>
                            </div>
                            {holdings.length === 0 && (
                                <div className={styles.emptyState} style={{ paddingTop: 16 }}>
                                    <p className={styles.emptyText}>No holdings yet.</p>
                                    <a href="/trade" className={styles.link}>Start trading →</a>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div>
                                <h2 className={styles.cardTitle}>Quick Stats</h2>
                                <p className={styles.cardSub}>Key performance metrics</p>
                            </div>
                        </div>
                        <div className={styles.quickStats}>
                            {[
                                { label: 'Net P&L', value: `${isUp ? '+' : ''}$${Math.abs(pl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: isUp ? 'var(--vt-green)' : 'var(--vt-red)' },
                                { label: 'Return %', value: `${isUp ? '+' : ''}${pct.toFixed(1)}%`, color: isUp ? 'var(--vt-green)' : 'var(--vt-red)' },
                                { label: 'Invested Value', value: `$${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'var(--vt-text)' },
                                { label: 'Cash Available', value: `$${cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'var(--vt-text)' },
                                { label: 'Open Positions', value: `${holdings.length}`, color: 'var(--vt-text)' },
                                { label: 'Largest Position', value: bestHolding ? bestHolding.stock : '—', color: bestHolding ? '#4576E7' : 'var(--vt-text3)' },
                                { label: 'Leaderboard Rank', value: myRank ? `#${myRank}` : 'Unranked', color: myRank ? '#fbbf24' : 'var(--vt-text3)' },
                            ].map((row, i) => (
                                <div key={i} className={styles.quickStatRow}>
                                    <span className={styles.quickStatLabel}>{row.label}</span>
                                    <span className={styles.quickStatValue} style={{ color: row.color }}>{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div>
                            <h2 className={styles.cardTitle}>Current Holdings</h2>
                            <p className={styles.cardSub}>
                                {holdings.length > 0
                                    ? `${holdings.length} active position${holdings.length !== 1 ? 's' : ''}`
                                    : 'No positions open'}
                            </p>
                        </div>
                        <a href="/trade" className={styles.ctaLink}>+ New Trade</a>
                    </div>

                    {holdings.length > 0 ? (
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Stock</th>
                                        <th>Shares</th>
                                        <th>Avg Cost</th>
                                        <th>Current Price</th>
                                        <th>Market Value</th>
                                        <th>Unrealized P/L</th>
                                        <th>Allocation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {holdings.map((h, i) => {
                                        const alloc = totalAccount > 0 ? (h.value / totalAccount) * 100 : 0;
                                        const hColor = ALLOC_COLORS[i % ALLOC_COLORS.length];
                                        return (
                                            <tr key={h.stock} className={styles.tableRow}>
                                                <td>
                                                    <div className={styles.stockCell}>
                                                        <div className={styles.stockDot} style={{ background: hColor }} />
                                                        <span className={styles.stockTicker}>{h.stock}</span>
                                                    </div>
                                                </td>
                                                <td className={styles.tdMuted}>{h.shares.toLocaleString()}</td>
                                                <td className={styles.tdMuted}>${(h.buy_price ?? 0).toFixed(2)}</td>
                                                <td className={styles.tdMuted}>${h.current_price?.toFixed(2)}</td>
                                                <td className={styles.tdBlue}>
                                                    ${h.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td
                                                    className={styles.tdMuted}
                                                    style={{
                                                        color: (h.gain_loss ?? 0) >= 0 ? 'var(--vt-green)' : 'var(--vt-red)',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {(h.gain_loss ?? 0) >= 0 ? '+' : ''}$
                                                    {(h.gain_loss ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                                                    <span style={{ opacity: 0.85 }}>
                                                        ({(h.gain_loss ?? 0) >= 0 ? '+' : ''}{(h.gain_loss_pct ?? 0).toFixed(1)}%)
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className={styles.allocCell}>
                                                        <div className={styles.miniBar}>
                                                            <div className={styles.miniBarFill} style={{ width: `${alloc}%`, background: hColor }} />
                                                        </div>
                                                        <span className={styles.allocText}>{alloc.toFixed(1)}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <p className={styles.emptyTitle}>No holdings yet</p>
                            <p className={styles.emptyText}>Start trading to build your portfolio.</p>
                            <a href="/trade" className={styles.link}>Go to trading →</a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PortfolioRoute() {
    return (
        <GuestGuard>
            <PortfolioPage />
        </GuestGuard>
    );
}
