'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import GuestGuard from '@/components/GuestGuard';
import styles from '@/app/stats/stats.module.css';
import { getAvatarGradient, getInitials } from '@/lib/avatarColors';

type HoldingRow = {
    stock: string;
    shares: number;
    buy_price: number;
    current_price: number;
    value: number;
    gain_loss: number;
    gain_loss_pct: number;
    company_name?: string | null;
};

type PortfolioPayload = {
    friend: {
        id: string;
        username: string;
        display_name: string | null;
        avatar_color: string | null;
    };
    cash: number;
    portfolio_value: number;
    total_account_value: number;
    pl: number;
    pct: number;
    starting_cash: number;
    holdings: HoldingRow[];
};

function fmtMoney(n: number) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function FriendPortfolioContent() {
    const params = useParams();
    const raw = typeof params?.username === 'string' ? params.username : '';
    const username = decodeURIComponent(raw);

    const [data, setData] = useState<PortfolioPayload | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!username) {
            setError('Missing username');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `/api/friends/username/${encodeURIComponent(username)}/portfolio`,
                { credentials: 'same-origin' }
            );
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                setData(null);
                setError(typeof body.error === 'string' ? body.error : 'Could not load portfolio');
                return;
            }
            setData(body as PortfolioPayload);
        } catch {
            setError('Could not load portfolio');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [username]);

    useEffect(() => {
        void load();
    }, [load]);

    const f = data?.friend;
    const plUp = (data?.pl ?? 0) >= 0;

    return (
        <div className={styles.friendPageWrap}>
            <div className={styles.friendPageInner}>
                <Link href={`/friends/${encodeURIComponent(username)}`} className={styles.friendBackLink}>
                    ← Back to @{username}
                </Link>

                {loading && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                        <div className={styles.spinner} />
                    </div>
                )}

                {!loading && error && (
                    <div
                        className={`${styles.friendsBanner} ${styles.friendsBannerErr}`}
                        style={{ marginBottom: 16 }}
                    >
                        {error}
                    </div>
                )}

                {!loading && data && f && (
                    <>
                        <div className={styles.friendProfileCard} style={{ marginBottom: 16 }}>
                            <div className={styles.friendPortfolioHeader} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                <div
                                    className={styles.friendAvatar}
                                    style={{
                                        width: 48,
                                        height: 48,
                                        fontSize: 15,
                                        background: getAvatarGradient(f.avatar_color || 'blue'),
                                    }}
                                >
                                    {getInitials(f.username, f.display_name)}
                                </div>
                                <div>
                                    <h1 className={styles.friendPortfolioTitle}>@{f.username}&apos;s portfolio</h1>
                                    <p className={styles.friendPortfolioSub}>Read-only view · Friend sharing</p>
                                </div>
                            </div>

                            <div className={styles.friendPortfolioSummary}>
                                <div className={styles.statCard} style={{ margin: 0 }}>
                                    <div className={styles.statCardLabel}>Total account value</div>
                                    <div className={styles.statCardValue}>${fmtMoney(data.total_account_value)}</div>
                                </div>
                                <div className={styles.statCard} style={{ margin: 0 }}>
                                    <div className={styles.statCardLabel}>Total P/L</div>
                                    <div
                                        className={styles.statCardValue}
                                        style={{ color: plUp ? 'var(--vt-green)' : '#f87171' }}
                                    >
                                        {plUp ? '+' : ''}${fmtMoney(data.pl)}
                                    </div>
                                </div>
                                <div className={styles.statCard} style={{ margin: 0 }}>
                                    <div className={styles.statCardLabel}>Return</div>
                                    <div
                                        className={styles.statCardValue}
                                        style={{ color: plUp ? 'var(--vt-green)' : '#f87171' }}
                                    >
                                        {plUp ? '+' : ''}
                                        {data.pct.toFixed(2)}%
                                    </div>
                                </div>
                            </div>

                            <p className={styles.cardSub} style={{ marginBottom: 12 }}>
                                Cash ${fmtMoney(data.cash)} · Holdings value ${fmtMoney(data.portfolio_value)} · Started
                                with ${fmtMoney(data.starting_cash)}
                            </p>
                        </div>

                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Holdings</h2>
                            <p className={styles.cardSub}>Positions and performance</p>
                            {data.holdings.length === 0 ? (
                                <p className={styles.emptyText} style={{ marginTop: 16 }}>
                                    No open positions.
                                </p>
                            ) : (
                                <div className={styles.tableWrap} style={{ marginTop: 16 }}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Ticker</th>
                                                <th>Name</th>
                                                <th>Shares</th>
                                                <th>Avg cost</th>
                                                <th>Price</th>
                                                <th>Value</th>
                                                <th>Gain / loss</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.holdings.map(h => {
                                                const up = h.gain_loss >= 0;
                                                return (
                                                    <tr key={h.stock} className={styles.tableRow}>
                                                        <td className={styles.tdBlue}>{h.stock}</td>
                                                        <td className={styles.tdMuted}>
                                                            {h.company_name || '—'}
                                                        </td>
                                                        <td className={styles.tdMuted}>{h.shares.toLocaleString()}</td>
                                                        <td className={styles.tdMuted}>${fmtMoney(h.buy_price)}</td>
                                                        <td className={styles.tdMuted}>${fmtMoney(h.current_price)}</td>
                                                        <td className={styles.tdBlue}>${fmtMoney(h.value)}</td>
                                                        <td
                                                            className={styles.tdMuted}
                                                            style={{
                                                                color: up ? 'var(--vt-green)' : 'var(--vt-red)',
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {up ? '+' : ''}${fmtMoney(h.gain_loss)} ({up ? '+' : ''}
                                                            {h.gain_loss_pct.toFixed(1)}%)
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function FriendPortfolioPage() {
    return (
        <GuestGuard>
            <FriendPortfolioContent />
        </GuestGuard>
    );
}
