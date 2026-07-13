'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import GuestGuard from '@/components/GuestGuard';
import styles from '@/app/stats/stats.module.css';
import { getAvatarGradient, getInitials } from '@/lib/avatarColors';

type ShareMode = 'all_friends' | 'no_one' | 'selected_friends';

type ProfilePayload = {
    friend: {
        id: string;
        username: string;
        display_name: string | null;
        avatar_color: string | null;
    };
    isSelf: boolean;
    canViewPortfolio: boolean;
};

function FriendProfileContent() {
    const params = useParams();
    const router = useRouter();
    const raw = typeof params?.username === 'string' ? params.username : '';
    const username = decodeURIComponent(raw);

    const [data, setData] = useState<ProfilePayload | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [removeBusy, setRemoveBusy] = useState(false);

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

    const onRemoveFriend = async () => {
        if (!data?.friend?.id || data.isSelf) return;
        setRemoveBusy(true);
        try {
            const res = await fetch(`/api/friends/${encodeURIComponent(data.friend.id)}`, {
                method: 'DELETE',
                credentials: 'same-origin',
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setError(typeof body.error === 'string' ? body.error : 'Could not remove friend');
                return;
            }
            router.push('/friends');
        } finally {
            setRemoveBusy(false);
        }
    };

    const f = data?.friend;

    return (
        <div className={styles.friendPageWrap}>
            <div className={styles.friendPageInner}>
                <Link href="/friends" className={styles.friendBackLink}>
                    ← Back to Friends
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

                {!loading && f && (
                    <div className={styles.friendProfileCard}>
                        <div className={styles.friendProfileGrid}>
                            <div className={styles.friendProfileHero}>
                                <div
                                    className={styles.friendProfileHeroAvatar}
                                    style={{ background: getAvatarGradient(f.avatar_color || 'blue') }}
                                >
                                    {getInitials(f.username, f.display_name)}
                                </div>
                                <h1 className={styles.friendProfileHeroHandle}>@{f.username}</h1>
                                <p className={styles.friendProfileHeroSub}>Vestera friend</p>
                            </div>

                            <div className={styles.friendProfileActions}>
                                {data.isSelf ? (
                                    <p className={styles.friendsShareHelper} style={{ margin: 0 }}>
                                        This is you. Portfolio sharing settings are in Stats → Friends → Portfolio
                                        Share Settings.
                                    </p>
                                ) : data.canViewPortfolio ? (
                                    <Link
                                        href={`/friends/${encodeURIComponent(f.username)}/portfolio`}
                                        className={styles.friendProfilePrimaryBtn}
                                    >
                                        View portfolio
                                    </Link>
                                ) : (
                                    <div className={styles.friendProfileLocked}>
                                        <span aria-hidden>🔒</span>
                                        <span>This portfolio is not shared with you.</span>
                                    </div>
                                )}

                                {!data.isSelf && (
                                    <button
                                        type="button"
                                        className={styles.friendProfileDangerBtn}
                                        disabled={removeBusy}
                                        onClick={() => void onRemoveFriend()}
                                    >
                                        {removeBusy ? 'Removing…' : 'Remove friend'}
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

export default function FriendProfilePage() {
    return (
        <GuestGuard>
            <FriendProfileContent />
        </GuestGuard>
    );
}
