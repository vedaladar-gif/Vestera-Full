'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import styles from './stats.module.css';
import { getAvatarGradient, getInitials } from '@/lib/avatarColors';
import GuestGuard from '@/components/GuestGuard';
import { isTutorialActive } from '@/lib/onboarding';

interface LeaderboardEntry {
    rank: number;
    username: string;
    displayName: string | null;
    avatarColor: string;
    cash: number;
    holdingsValue: number;
    totalValue: number;
    pl: number;
    pct: number;
    isCurrentUser: boolean;
}

const RANK_META: Record<number, { label: string; color: string; glow: string; borderColor: string; icon: string }> = {
    1: { label: '1st Place', color: '#fbbf24', glow: 'rgba(251,191,36,0.15)', borderColor: 'rgba(251,191,36,0.5)', icon: '1' },
    2: { label: '2nd Place', color: '#9ca3af', glow: 'rgba(156,163,175,0.15)', borderColor: 'rgba(156,163,175,0.4)', icon: '2' },
    3: { label: '3rd Place', color: '#cd7c2f', glow: 'rgba(180,83,9,0.15)', borderColor: 'rgba(180,83,9,0.4)', icon: '3' },
};

function RankingsPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
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
            const lbData = await fetch(lbUrl, { credentials: 'same-origin' }).then(r => r.json());
            if (lbData?.leaderboard) setLeaderboard(lbData.leaderboard);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (!authChecked) return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            await refresh();
            if (!cancelled) setLoading(false);
        })();
        const id = setInterval(() => void refresh(), 15_000);
        const onFocus = () => void refresh();
        window.addEventListener('focus', onFocus);
        return () => { cancelled = true; clearInterval(id); window.removeEventListener('focus', onFocus); };
    }, [authChecked, refresh]);

    if (!authChecked || loading) {
        return (
            <div className={styles.statsWrap} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className={styles.spinner} />
            </div>
        );
    }

    const myRank = leaderboard.find(u => u.isCurrentUser)?.rank;
    const top3 = leaderboard.slice(0, 3);
    const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean) as LeaderboardEntry[];

    return (
        <div className={styles.statsWrap}>
            <div className={styles.statsInner}>
                <motion.div
                    className={styles.pageHeader}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                    <h1 className={styles.pageTitle}>Rankings</h1>
                    <p className={styles.pageSubtitle}>See where you stand among all traders</p>
                </motion.div>

                {leaderboard.length === 0 ? (
                    <div className={styles.emptyState} style={{ paddingTop: 80, paddingBottom: 80 }}>
                        <p className={styles.emptyTitle}>No rankings yet</p>
                        <p className={styles.emptyText}>Complete your username setup to appear on the leaderboard.</p>
                        <a href="/setup-username" className={styles.link}>Set up your profile →</a>
                    </div>
                ) : (
                    <>
                        {top3.length > 0 && (
                            <div className={styles.podiumSection}>
                                <div className={styles.podiumGrid}>
                                    {podiumOrder.map((entry) => {
                                        const meta = RANK_META[entry.rank];
                                        const initials = getInitials(entry.username, entry.displayName);
                                        return (
                                            <div
                                                key={entry.rank}
                                                data-tour={entry.isCurrentUser ? 'lb-me' : undefined}
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
                                                    ${entry.totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} portfolio
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
                                                        ${entry.totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
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
            </div>
        </div>
    );
}

export default function StatsRoute() {
    return (
        <GuestGuard>
            <RankingsPage />
        </GuestGuard>
    );
}
