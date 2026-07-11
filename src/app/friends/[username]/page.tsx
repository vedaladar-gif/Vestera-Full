'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import GuestGuard from '@/components/GuestGuard';
import styles from '@/app/stats/stats.module.css';
import { getAvatarGradient, getInitials } from '@/lib/avatarColors';
import { useFriendsSocial } from '@/hooks/useFriendsSocial';
import type { SearchRelation } from '@/hooks/useFriendsSocial';

type ProfilePayload = {
    friend: {
        id: string;
        username: string;
        display_name: string | null;
        avatar_color: string | null;
    };
    isSelf: boolean;
    relation: SearchRelation | 'self';
    incomingRequestId?: number;
    canViewPortfolio: boolean;
    stats: {
        rank: number | null;
        pl: number;
        pct: number;
        totalValue: number;
        startingCash: number;
    };
};

function fmtMoney(n: number) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function UserProfileContent() {
    const params = useParams();
    const raw = typeof params?.username === 'string' ? params.username : '';
    const username = decodeURIComponent(raw);

    const { sendRequest, acceptRequest, removeFriend, showBanner } = useFriendsSocial();

    const [data, setData] = useState<ProfilePayload | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionBusy, setActionBusy] = useState(false);

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
                `/api/friends/username/${encodeURIComponent(username)}/profile`,
                { credentials: 'same-origin' }
            );
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                setData(null);
                setError(typeof body.error === 'string' ? body.error : 'Could not load profile');
                return;
            }
            setData(body as ProfilePayload);
        } catch {
            setError('Could not load profile');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [username]);

    useEffect(() => {
        void load();
    }, [load]);

    const onSendRequest = async () => {
        if (!data?.friend) return;
        setActionBusy(true);
        try {
            const ok = await sendRequest({ username: data.friend.username, recipientUserId: data.friend.id });
            if (ok) await load();
        } finally {
            setActionBusy(false);
        }
    };

    const onAcceptRequest = async () => {
        if (data?.incomingRequestId == null) return;
        setActionBusy(true);
        try {
            const ok = await acceptRequest(data.incomingRequestId);
            if (ok) await load();
        } finally {
            setActionBusy(false);
        }
    };

    const onRemoveFriend = async () => {
        if (!data?.friend?.id || data.isSelf) return;
        setActionBusy(true);
        try {
            const ok = await removeFriend(data.friend.id);
            if (ok) {
                showBanner('ok', 'Removed from friends');
                await load();
            }
        } finally {
            setActionBusy(false);
        }
    };

    const f = data?.friend;
    const stats = data?.stats;
    const plUp = (stats?.pl ?? 0) >= 0;

    const relationLabel =
        data?.isSelf
            ? 'Your profile'
            : data?.relation === 'friend'
              ? 'Vestera friend'
              : data?.relation === 'outgoing_pending'
                ? 'Friend request sent'
                : data?.relation === 'incoming_pending'
                  ? 'Wants to be friends'
                  : 'Vestera trader';

    return (
        <div className={styles.friendPageWrap}>
            <div className={styles.friendPageInner}>
                <Link href="/stats" className={styles.friendBackLink}>
                    ← Back to Rankings
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

                {!loading && f && stats && (
                    <div className={styles.friendProfileCard}>
                        <div className={styles.friendProfileGrid}>
                            <div className={styles.friendProfileHero}>
                                <div
                                    className={styles.friendProfileHeroAvatar}
                                    style={{ background: getAvatarGradient(f.avatar_color || 'blue') }}
                                >
                                    {getInitials(f.username, f.display_name)}
                                </div>
                                {f.display_name && (
                                    <div className={styles.friendProfileDisplayName}>{f.display_name}</div>
                                )}
                                <h1 className={styles.friendProfileHeroHandle}>@{f.username}</h1>
                                <p className={styles.friendProfileHeroSub}>{relationLabel}</p>
                                {stats.rank != null && (
                                    <div className={styles.friendProfileRankBadge}>Rank #{stats.rank}</div>
                                )}
                            </div>

                            <div className={styles.friendProfileActions}>
                                <div className={styles.friendPortfolioSummary}>
                                    <div className={styles.statCard} style={{ margin: 0 }}>
                                        <div className={styles.statCardLabel}>Portfolio value</div>
                                        <div className={styles.statCardValue}>
                                            ${fmtMoney(stats.totalValue)}
                                        </div>
                                    </div>
                                    <div className={styles.statCard} style={{ margin: 0 }}>
                                        <div className={styles.statCardLabel}>Total P/L</div>
                                        <div
                                            className={styles.statCardValue}
                                            style={{ color: plUp ? 'var(--vt-green)' : '#f87171' }}
                                        >
                                            {plUp ? '+' : ''}${fmtMoney(stats.pl)}
                                        </div>
                                    </div>
                                    <div className={styles.statCard} style={{ margin: 0 }}>
                                        <div className={styles.statCardLabel}>Return</div>
                                        <div
                                            className={styles.statCardValue}
                                            style={{ color: plUp ? 'var(--vt-green)' : '#f87171' }}
                                        >
                                            {plUp ? '+' : ''}
                                            {stats.pct.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>

                                <p className={styles.friendProfileStatsNote}>
                                    Started with ${fmtMoney(stats.startingCash)} · Stock holdings are private
                                </p>

                                {data.isSelf ? (
                                    <div className={styles.friendProfileActionRow}>
                                        <Link href="/portfolio" className={styles.friendProfilePrimaryBtn}>
                                            View your portfolio
                                        </Link>
                                        <Link href="/settings" className={styles.friendProfileSecondaryBtn}>
                                            Edit profile
                                        </Link>
                                    </div>
                                ) : data.relation === 'friend' ? (
                                    <>
                                        {data.canViewPortfolio ? (
                                            <Link
                                                href={`/friends/${encodeURIComponent(f.username)}/portfolio`}
                                                className={styles.friendProfilePrimaryBtn}
                                            >
                                                View shared portfolio
                                            </Link>
                                        ) : (
                                            <div className={styles.friendProfileLocked}>
                                                <span aria-hidden>🔒</span>
                                                <span>This trader has not shared their stock holdings with you.</span>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            className={styles.friendProfileDangerBtn}
                                            disabled={actionBusy}
                                            onClick={() => void onRemoveFriend()}
                                        >
                                            {actionBusy ? 'Removing…' : 'Remove friend'}
                                        </button>
                                    </>
                                ) : data.relation === 'outgoing_pending' ? (
                                    <span className={`${styles.friendsRowBtn} ${styles.friendsRowBtnMuted}`}>
                                        Friend request sent
                                    </span>
                                ) : data.relation === 'incoming_pending' ? (
                                    <div className={styles.friendProfileActionRow}>
                                        <button
                                            type="button"
                                            className={`${styles.friendsRowBtn} ${styles.friendsRowBtnAccept}`}
                                            disabled={actionBusy}
                                            onClick={() => void onAcceptRequest()}
                                        >
                                            {actionBusy ? '…' : 'Accept friend request'}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className={`${styles.friendsRowBtn} ${styles.friendsRowBtnPrimary}`}
                                        disabled={actionBusy}
                                        onClick={() => void onSendRequest()}
                                    >
                                        {actionBusy ? '…' : 'Add friend'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function UserProfilePage() {
    return (
        <GuestGuard>
            <UserProfileContent />
        </GuestGuard>
    );
}
