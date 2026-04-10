'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './stats.module.css';
import { getAvatarGradient, getInitials } from '@/lib/avatarColors';
import PortfolioChart, { type HistoryPoint } from '@/components/PortfolioChart';
import GuestGuard from '@/components/GuestGuard';

type Tab = 'portfolio' | 'leaderboard';

interface HoldingEntry {
    stock: string;
    shares: number;
    current_price: number;
    value: number;
    buy_price?: number;
    gain_loss?: number;
    gain_loss_pct?: number;
}

interface LeaderboardEntry {
    rank: number;
    username: string;
    displayName: string | null;
    avatarColor: string;
    /** Liquid cash only */
    cash: number;
    /** Market value of open positions */
    holdingsValue: number;
    /** cash + holdingsValue — ranking uses this */
    totalValue: number;
    pl: number;
    pct: number;
    isCurrentUser: boolean;
}

const ALLOC_COLORS = [
    '#4f6ef7', '#9b5de5', '#4ade80', '#fbbf24',
    '#f87171', '#06b6d4', '#a855f7', '#f97316',
];

const RANK_META: Record<number, { label: string; color: string; glow: string; borderColor: string; icon: string }> = {
    1: { label: '1st Place', color: '#fbbf24', glow: 'rgba(251,191,36,0.15)', borderColor: 'rgba(251,191,36,0.5)', icon: '🥇' },
    2: { label: '2nd Place', color: '#9ca3af', glow: 'rgba(156,163,175,0.15)', borderColor: 'rgba(156,163,175,0.4)', icon: '🥈' },
    3: { label: '3rd Place', color: '#cd7c2f', glow: 'rgba(180,83,9,0.15)', borderColor: 'rgba(180,83,9,0.4)', icon: '🥉' },
};

function StatsPage() {
    const [tab, setTab] = useState<Tab>('portfolio');
    const [cash, setCash] = useState(0);
    const [portfolioValue, setPortfolioValue] = useState(0);
    const [pl, setPl] = useState(0);
    const [pct, setPct] = useState(0);
    const [holdings, setHoldings] = useState<HoldingEntry[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
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
                if (!res.ok) {
                    router.replace('/restricted');
                    return;
                }
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

    const refreshPortfolioAndLeaderboard = useCallback(async () => {
        try {
            const [hd, lbData] = await Promise.all([
                fetch('/api/holdings', { credentials: 'same-origin' }).then(r => (r.ok ? r.json() : null)),
                fetch('/api/leaderboard', { credentials: 'same-origin' }).then(r => r.json()),
            ]);
            if (hd) {
                setCash(hd.cash);
                setPortfolioValue(hd.portfolio_value);
                setPl(hd.pl);
                setPct(hd.pct);
                setHoldings(hd.holdings || []);
            }
            if (lbData?.leaderboard) setLeaderboard(lbData.leaderboard);
        } catch {
            /* ignore */
        }
    }, []);

    const refreshPortfolioHistory = useCallback(async () => {
        try {
            const data = await fetch('/api/portfolio-history', { credentials: 'same-origin' })
                .then(r => (r.ok ? r.json() : { history: [] }));
            setPortfolioHistory(data.history || []);
        } catch {
            /* ignore */
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authChecked) return;

        let cancelled = false;

        (async () => {
            setLoading(true);
            await refreshPortfolioAndLeaderboard();
            if (!cancelled) setLoading(false);
            await refreshPortfolioHistory();
        })();

        const pollMs = 15_000;
        const intervalId = setInterval(() => {
            void refreshPortfolioAndLeaderboard();
            void refreshPortfolioHistory();
        }, pollMs);

        const onFocus = () => {
            void refreshPortfolioAndLeaderboard();
            void refreshPortfolioHistory();
        };
        window.addEventListener('focus', onFocus);

        return () => {
            cancelled = true;
            clearInterval(intervalId);
            window.removeEventListener('focus', onFocus);
        };
    }, [authChecked, refreshPortfolioAndLeaderboard, refreshPortfolioHistory]);

    if (!authChecked || loading) {
        return (
            <div className={styles.statsWrap} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className={styles.spinner} />
            </div>
        );
    }

    const totalAccount = cash + portfolioValue;
    const isUp = pl >= 0;
    const myRank = leaderboard.find(u => u.isCurrentUser)?.rank;
    const top3 = leaderboard.slice(0, 3);

    // Portfolio allocation bars
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

    // Podium order: 2nd, 1st, 3rd (visual podium)
    const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean) as LeaderboardEntry[];

    return (
        <div className={styles.statsWrap}>
            <div className={styles.statsInner}>

                {/* ── Page Header ── */}
                <div className={styles.pageHeader}>
                    <div>
                        <h1 className={styles.pageTitle}>Stats & Leaderboard</h1>
                        <p className={styles.pageSubtitle}>Track your portfolio and compete with other traders</p>
                    </div>
                    <div className={styles.tabToggle}>
                        <button
                            className={`${styles.tabBtn} ${tab === 'portfolio' ? styles.tabBtnActive : ''}`}
                            onClick={() => setTab('portfolio')}
                        >
                            📊 Portfolio
                        </button>
                        <button
                            className={`${styles.tabBtn} ${tab === 'leaderboard' ? styles.tabBtnActive : ''}`}
                            onClick={() => setTab('leaderboard')}
                        >
                            🏆 Leaderboard
                            {myRank && <span className={styles.rankPill}>#{myRank}</span>}
                        </button>
                    </div>
                </div>

                {/* ══════════════════════════════
                    PORTFOLIO TAB
                ══════════════════════════════ */}
                {tab === 'portfolio' && (
                    <>
                        {/* 4 Stat Cards */}
                        <div className={styles.statCards}>
                            <div className={styles.statCard}>
                                <div className={styles.statCardTop}>
                                    <span className={styles.statCardLabel}>Total Portfolio Value</span>
                                    <div className={styles.statCardIcon} style={{ background: 'rgba(79,110,247,0.1)' }}>💼</div>
                                </div>
                                <div className={styles.statCardValue} style={{ color: 'var(--vt-text)' }}>
                                    ${totalAccount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className={styles.statCardSub}>Starting capital: $100,000.00</div>
                            </div>

                            <div className={styles.statCard}>
                                <div className={styles.statCardTop}>
                                    <span className={styles.statCardLabel}>Total Gain / Loss</span>
                                    <div className={styles.statCardIcon} style={{ background: isUp ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)' }}>
                                        {isUp ? '📈' : '📉'}
                                    </div>
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
                                    <div className={styles.statCardIcon} style={{ background: 'rgba(34,197,94,0.1)' }}>💵</div>
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
                                    <div className={styles.statCardIcon} style={{ background: 'rgba(155,93,229,0.1)' }}>📋</div>
                                </div>
                                <div className={styles.statCardValue} style={{ color: 'var(--vt-text)' }}>
                                    {holdings.length}
                                </div>
                                <div className={styles.statCardSub}>
                                    {holdings.length === 1 ? '1 stock position' : `${holdings.length} stock positions`}
                                </div>
                            </div>
                        </div>

                        {/* ── Portfolio Performance chart (full-width) ── */}
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
                            {/* The chart uses ResizeObserver so it fills whatever width the card gives it */}
                            <PortfolioChart
                                data={portfolioHistory}
                                loading={historyLoading}
                                chartHeight={240}
                            />
                        </div>

                        {/* Middle: Allocation + Quick Stats */}
                        <div className={styles.midGrid}>

                            {/* Portfolio Allocation */}
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <h2 className={styles.cardTitle}>Portfolio Allocation</h2>
                                        <p className={styles.cardSub}>How your capital is distributed across positions</p>
                                    </div>
                                </div>

                                {/* Stacked bar — fixed: use only flex proportions, no conflicting width */}
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

                                {/* Legend */}
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

                            {/* Quick Stats */}
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <h2 className={styles.cardTitle}>Quick Stats</h2>
                                        <p className={styles.cardSub}>Key performance metrics</p>
                                    </div>
                                </div>
                                <div className={styles.quickStats}>
                                    {[
                                        {
                                            label: 'Net P&L',
                                            value: `${isUp ? '+' : ''}$${Math.abs(pl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                                            color: isUp ? 'var(--vt-green)' : 'var(--vt-red)',
                                        },
                                        {
                                            label: 'Return %',
                                            value: `${isUp ? '+' : ''}${pct.toFixed(1)}%`,
                                            color: isUp ? 'var(--vt-green)' : 'var(--vt-red)',
                                        },
                                        {
                                            label: 'Invested Value',
                                            value: `$${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                                            color: 'var(--vt-text)',
                                        },
                                        {
                                            label: 'Cash Available',
                                            value: `$${cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                                            color: 'var(--vt-text)',
                                        },
                                        {
                                            label: 'Open Positions',
                                            value: `${holdings.length}`,
                                            color: 'var(--vt-text)',
                                        },
                                        {
                                            label: 'Largest Position',
                                            value: bestHolding ? bestHolding.stock : '—',
                                            color: bestHolding ? '#4f6ef7' : 'var(--vt-text3)',
                                        },
                                        {
                                            label: 'Leaderboard Rank',
                                            value: myRank ? `#${myRank}` : 'Unranked',
                                            color: myRank ? '#fbbf24' : 'var(--vt-text3)',
                                        },
                                    ].map((row, i) => (
                                        <div key={i} className={styles.quickStatRow}>
                                            <span className={styles.quickStatLabel}>{row.label}</span>
                                            <span className={styles.quickStatValue} style={{ color: row.color }}>{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Holdings Table — full width */}
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
                                                        <td className={styles.tdMuted}>
                                                            ${(h.buy_price ?? 0).toFixed(2)}
                                                        </td>
                                                        <td className={styles.tdMuted}>${h.current_price?.toFixed(2)}</td>
                                                        <td className={styles.tdBlue}>
                                                            ${h.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td
                                                            className={styles.tdMuted}
                                                            style={{
                                                                color:
                                                                    (h.gain_loss ?? 0) >= 0 ? 'var(--vt-green)' : 'var(--vt-red)',
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {(h.gain_loss ?? 0) >= 0 ? '+' : ''}$
                                                            {(h.gain_loss ?? 0).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}{' '}
                                                            <span style={{ opacity: 0.85 }}>
                                                                ({(h.gain_loss ?? 0) >= 0 ? '+' : ''}
                                                                {(h.gain_loss_pct ?? 0).toFixed(1)}%)
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className={styles.allocCell}>
                                                                <div className={styles.miniBar}>
                                                                    <div
                                                                        className={styles.miniBarFill}
                                                                        style={{ width: `${alloc}%`, background: hColor }}
                                                                    />
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
                                    <div className={styles.emptyIcon}>📋</div>
                                    <p className={styles.emptyTitle}>No holdings yet</p>
                                    <p className={styles.emptyText}>Start trading to build your portfolio.</p>
                                    <a href="/trade" className={styles.link}>Go to trading →</a>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ══════════════════════════════
                    LEADERBOARD TAB
                ══════════════════════════════ */}
                {tab === 'leaderboard' && (
                    <>
                        {leaderboard.length === 0 ? (
                            <div className={styles.emptyState} style={{ paddingTop: 80, paddingBottom: 80 }}>
                                <div className={styles.emptyIcon}>🏆</div>
                                <p className={styles.emptyTitle}>No rankings yet</p>
                                <p className={styles.emptyText}>Complete your username setup to appear on the leaderboard.</p>
                                <a href="/setup-username" className={styles.link}>Set up your profile →</a>
                            </div>
                        ) : (
                            <>
                                {/* Top 3 Podium */}
                                {top3.length > 0 && (
                                    <div className={styles.podiumSection}>
                                        <div className={styles.podiumGrid}>
                                            {podiumOrder.map((entry) => {
                                                const meta = RANK_META[entry.rank];
                                                const initials = getInitials(entry.username, entry.displayName);
                                                return (
                                                    <div
                                                        key={entry.rank}
                                                        className={`${styles.podiumCard} ${entry.rank === 1 ? styles.podiumFirst : ''} ${entry.isCurrentUser ? styles.podiumMe : ''}`}
                                                        style={meta ? { borderColor: meta.borderColor } : {}}
                                                    >
                                                        <div className={styles.podiumMedal}>{meta?.icon ?? `#${entry.rank}`}</div>
                                                        <div
                                                            className={styles.podiumAvatar}
                                                            style={{ background: getAvatarGradient(entry.avatarColor) }}
                                                        >
                                                            {initials}
                                                        </div>
                                                        <div className={styles.podiumName}>{entry.displayName || entry.username}</div>
                                                        {entry.displayName && (
                                                            <div className={styles.podiumHandle}>@{entry.username}</div>
                                                        )}
                                                        {entry.isCurrentUser && (
                                                            <div className={styles.youChip}>You</div>
                                                        )}
                                                        <div
                                                            className={styles.podiumReturn}
                                                            style={{ color: entry.pct >= 0 ? 'var(--vt-green)' : 'var(--vt-red)' }}
                                                        >
                                                            {entry.pct >= 0 ? '+' : ''}{entry.pct.toFixed(1)}%
                                                        </div>
                                                        <div className={styles.podiumPortfolio}>
                                                            $
                                                            {entry.totalValue.toLocaleString('en-US', {
                                                                maximumFractionDigits: 0,
                                                            })}{' '}
                                                            portfolio
                                                        </div>
                                                        {meta && (
                                                            <div className={styles.podiumRankLabel} style={{ color: meta.color }}>
                                                                {meta.label}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Global Rankings Table */}
                                <div className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <div>
                                            <h2 className={styles.cardTitle}>Global Rankings</h2>
                                            <p className={styles.cardSub}>
                                                {leaderboard.length} ranked trader{leaderboard.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        {myRank && (
                                            <span className={styles.myRankBadge}>Your rank: #{myRank}</span>
                                        )}
                                    </div>

                                    <div className={styles.tableWrap}>
                                        <table className={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: 56 }}>Rank</th>
                                                    <th>Trader</th>
                                                    <th>Return</th>
                                                    <th>Portfolio Value</th>
                                                    <th style={{ width: 60 }}>Badge</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {leaderboard.map((entry) => {
                                                    const meta = RANK_META[entry.rank];
                                                    const initials = getInitials(entry.username, entry.displayName);
                                                    return (
                                                        <tr
                                                            key={entry.rank}
                                                            className={`${styles.tableRow} ${entry.isCurrentUser ? styles.tableRowMe : ''}`}
                                                        >
                                                            <td>
                                                                <div
                                                                    className={styles.rankBubble}
                                                                    style={{
                                                                        background: meta ? meta.glow : 'var(--vt-input-bg)',
                                                                        color: meta ? meta.color : 'var(--vt-text3)',
                                                                    }}
                                                                >
                                                                    {entry.rank}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className={styles.traderCell}>
                                                                    <div
                                                                        className={styles.traderAvatar}
                                                                        style={{ background: getAvatarGradient(entry.avatarColor) }}
                                                                    >
                                                                        {initials}
                                                                    </div>
                                                                    <div>
                                                                        <div className={styles.traderName}>
                                                                            {entry.displayName || entry.username}
                                                                            {entry.isCurrentUser && (
                                                                                <span className={styles.youTag}>you</span>
                                                                            )}
                                                                        </div>
                                                                        {entry.displayName && (
                                                                            <div className={styles.traderHandle}>@{entry.username}</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span
                                                                    className={styles.returnChip}
                                                                    style={{
                                                                        color: entry.pct >= 0 ? 'var(--vt-green)' : 'var(--vt-red)',
                                                                        background: entry.pct >= 0 ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                                                                    }}
                                                                >
                                                                    {entry.pct >= 0 ? '+' : ''}{entry.pct.toFixed(1)}%
                                                                </span>
                                                            </td>
                                                            <td className={styles.tdBlue}>
                                                                $
                                                                {entry.totalValue.toLocaleString('en-US', {
                                                                    maximumFractionDigits: 0,
                                                                })}
                                                            </td>
                                                            <td className={styles.tdCenter}>
                                                                {meta
                                                                    ? <span className={styles.medalText}>{meta.icon}</span>
                                                                    : <span style={{ color: 'var(--vt-text3)', fontSize: 13 }}>—</span>
                                                                }
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

            </div>
        </div>
    );
}

export default function StatsRoute() {
    return (
        <GuestGuard>
            <StatsPage />
        </GuestGuard>
    );
}
