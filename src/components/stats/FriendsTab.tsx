'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/stats/stats.module.css';
import { getAvatarGradient, getInitials, isEmailUsername } from '@/lib/avatarColors';
import { useFriendsSocial, useUsernameSearch, type UserSearchResult } from '@/hooks/useFriendsSocial';

type MeState = {
    username: string;
    needsUsername: boolean;
};

type PortfolioShareMode = 'all_friends' | 'no_one' | 'selected_friends';

export function FriendsTab() {
    const router = useRouter();
    const [me, setMe] = useState<MeState | null>(null);
    const {
        friends,
        incoming,
        loading,
        banner,
        sendRequest,
        acceptRequest,
        declineRequest,
        removeFriend,
    } = useFriendsSocial();
    const search = useUsernameSearch();
    const [rowBusy, setRowBusy] = useState<string | null>(null);

    const [shareLoading, setShareLoading] = useState(true);
    const [shareSaving, setShareSaving] = useState(false);
    const [shareMode, setShareMode] = useState<PortfolioShareMode>('all_friends');
    const [allowedIds, setAllowedIds] = useState<Set<string>>(new Set());
    const [savedMode, setSavedMode] = useState<PortfolioShareMode>('all_friends');
    const [savedAllowedIds, setSavedAllowedIds] = useState<Set<string>>(new Set());
    const [shareNote, setShareNote] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    useEffect(() => {
        let c = false;
        (async () => {
            try {
                const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
                const data = await res.json().catch(() => ({}));
                if (c || !data.authenticated) return;
                setMe({
                    username: typeof data.username === 'string' ? data.username : '',
                    needsUsername: data.needsUsername === true,
                });
            } catch {
                /* ignore */
            }
        })();
        return () => {
            c = true;
        };
    }, []);

    useEffect(() => {
        let c = false;
        (async () => {
            setShareLoading(true);
            try {
                const res = await fetch('/api/portfolio-share', { credentials: 'same-origin' });
                const data = await res.json().catch(() => ({}));
                if (c || !res.ok) return;
                const mode = data.mode as PortfolioShareMode;
                const ids: string[] = Array.isArray(data.allowedFriendUserIds) ? data.allowedFriendUserIds : [];
                if (mode === 'all_friends' || mode === 'no_one' || mode === 'selected_friends') {
                    setShareMode(mode);
                    setSavedMode(mode);
                }
                const next = new Set(ids);
                setAllowedIds(next);
                setSavedAllowedIds(new Set(next));
            } catch {
                /* ignore */
            } finally {
                if (!c) setShareLoading(false);
            }
        })();
        return () => {
            c = true;
        };
    }, []);

    const shareDirty = useMemo(() => {
        if (shareMode !== savedMode) return true;
        if (shareMode !== 'selected_friends') return false;
        if (allowedIds.size !== savedAllowedIds.size) return true;
        for (const id of allowedIds) {
            if (!savedAllowedIds.has(id)) return true;
        }
        return false;
    }, [shareMode, savedMode, allowedIds, savedAllowedIds]);

    const toggleAllowed = useCallback((id: string) => {
        setAllowedIds(prev => {
            const n = new Set(prev);
            if (n.has(id)) n.delete(id);
            else n.add(id);
            return n;
        });
    }, []);

    const saveShareSettings = useCallback(async () => {
        setShareSaving(true);
        setShareNote(null);
        try {
            const body =
                shareMode === 'selected_friends'
                    ? {
                          mode: shareMode,
                          allowedFriendUserIds: [...allowedIds],
                      }
                    : { mode: shareMode };
            const res = await fetch('/api/portfolio-share', {
                method: 'PUT',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setShareNote({
                    type: 'err',
                    text: typeof data.error === 'string' ? data.error : 'Could not save settings',
                });
                return;
            }
            const mode = data.mode as PortfolioShareMode;
            const ids: string[] = Array.isArray(data.allowedFriendUserIds) ? data.allowedFriendUserIds : [];
            if (mode === 'all_friends' || mode === 'no_one' || mode === 'selected_friends') {
                setShareMode(mode);
                setSavedMode(mode);
            }
            const next = new Set(ids);
            setAllowedIds(next);
            setSavedAllowedIds(new Set(next));
            setShareNote({ type: 'ok', text: 'Portfolio share settings saved.' });
        } catch {
            setShareNote({ type: 'err', text: 'Could not save settings' });
        } finally {
            setShareSaving(false);
        }
    }, [shareMode, allowedIds]);

    const sortedFriends = useMemo(
        () => [...friends].sort((a, b) => a.username.localeCompare(b.username)),
        [friends]
    );

    const onAddFriend = useCallback(
        async (username: string, recipientUserId: string) => {
            const key = `add:${recipientUserId}`;
            setRowBusy(key);
            try {
                const ok = await sendRequest({ username, recipientUserId });
                if (ok) search.setQuery('');
            } finally {
                setRowBusy(null);
            }
        },
        [sendRequest, search]
    );

    const onAcceptFromSearch = useCallback(
        async (requestId: number | undefined) => {
            if (requestId == null) return;
            setRowBusy(`acc:${requestId}`);
            try {
                await acceptRequest(requestId);
                search.setQuery('');
            } finally {
                setRowBusy(null);
            }
        },
        [acceptRequest, search]
    );

    const renderSearchButton = (r: UserSearchResult) => {
        if (r.relation === 'friend') {
            return (
                <span className={`${styles.friendsRowBtn} ${styles.friendsRowBtnMuted}`}>Friends</span>
            );
        }
        if (r.relation === 'outgoing_pending') {
            return (
                <span className={`${styles.friendsRowBtn} ${styles.friendsRowBtnMuted}`}>Request sent</span>
            );
        }
        if (r.relation === 'incoming_pending' && r.incomingRequestId != null) {
            const busy = rowBusy === `acc:${r.incomingRequestId}`;
            return (
                <button
                    type="button"
                    disabled={busy}
                    className={`${styles.friendsRowBtn} ${styles.friendsRowBtnAccept}`}
                    onClick={() => void onAcceptFromSearch(r.incomingRequestId)}
                >
                    {busy ? '…' : 'Accept'}
                </button>
            );
        }
        const busy = rowBusy === `add:${r.id}`;
        return (
            <button
                type="button"
                disabled={busy}
                className={`${styles.friendsRowBtn} ${styles.friendsRowBtnPrimary}`}
                onClick={() => void onAddFriend(r.username, r.id)}
            >
                {busy ? '…' : 'Add friend'}
            </button>
        );
    };

    if (loading && friends.length === 0 && incoming.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                <div className={styles.spinner} />
            </div>
        );
    }

    const handle = me?.username && !isEmailUsername(me.username) ? `@${me.username}` : null;

    return (
        <div className={styles.friendsLayout}>
            <div className={styles.friendsMain}>
                {banner && (
                    <div
                        className={`${styles.friendsBanner} ${
                            banner.type === 'ok' ? styles.friendsBannerOk : styles.friendsBannerErr
                        }`}
                    >
                        {banner.text}
                    </div>
                )}

                <div className={styles.friendsIdentity}>
                    <div className={styles.friendsIdentityHandle}>
                        {handle || 'Set your username'}
                    </div>
                    <p className={styles.friendsIdentitySub}>
                        Manage your friends and connect with other Vestera users. Others can search for you by the
                        username above.
                    </p>
                    {me?.needsUsername && (
                        <p className={styles.friendsIdentityWarn}>
                            Complete username setup so people can find you.{' '}
                            <a href="/setup-username" className={styles.link}>
                                Set up profile →
                            </a>
                        </p>
                    )}
                </div>

                <div className={styles.card}>
                    <div className={styles.friendsListHeader}>
                        <div>
                            <h2 className={styles.cardTitle}>Your friends</h2>
                            <p className={styles.cardSub}>
                                {friends.length === 0
                                    ? 'People you connect with on Vestera'
                                    : `${friends.length} friend${friends.length !== 1 ? 's' : ''}`}
                            </p>
                        </div>
                    </div>

                    {friends.length === 0 ? (
                        <div className={styles.emptyState} style={{ padding: '28px 0' }}>
                            <p className={styles.emptyTitle}>No friends added yet</p>
                            <p className={styles.emptyText}>Search by @username on the right to send a request.</p>
                        </div>
                    ) : (
                        <div className={styles.friendsGrid}>
                            {friends.map(f => {
                                const initials = getInitials(f.username, f.display_name);
                                return (
                                    <div
                                        key={f.id}
                                        className={`${styles.friendCard} ${styles.friendCardClickable}`}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => {
                                            router.push(`/friends/${encodeURIComponent(f.username)}`);
                                        }}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                router.push(`/friends/${encodeURIComponent(f.username)}`);
                                            }
                                        }}
                                    >
                                        <div className={styles.friendCardTop}>
                                            <div
                                                className={styles.friendAvatar}
                                                style={{ background: getAvatarGradient(f.avatar_color || 'blue') }}
                                            >
                                                {initials}
                                            </div>
                                            <div className={styles.friendMeta}>
                                                <div className={styles.friendHandle}>@{f.username}</div>
                                                {f.display_name && (
                                                    <div className={styles.friendDisplay}>{f.display_name}</div>
                                                )}
                                                <div className={styles.friendBadge}>Friend · View profile</div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className={styles.friendRemoveBtn}
                                            disabled={rowBusy === `rm:${f.id}`}
                                            onClick={async e => {
                                                e.stopPropagation();
                                                setRowBusy(`rm:${f.id}`);
                                                try {
                                                    const ok = await removeFriend(f.id);
                                                    if (ok) search.invalidateSearch();
                                                } finally {
                                                    setRowBusy(null);
                                                }
                                            }}
                                        >
                                            {rowBusy === `rm:${f.id}` ? '…' : 'Remove'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <aside className={styles.friendsAside}>
                <div className={styles.friendsPanel} style={{ maxHeight: 'none' }}>
                    <h3 className={styles.friendsPanelTitle}>Find people</h3>
                    <input
                        type="text"
                        className={styles.friendsSearchInput}
                        placeholder="Search by @username"
                        value={search.query}
                        onChange={e => search.setQuery(e.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                    />
                    <div className={styles.friendsSearchResults}>
                        {search.loading && search.query.trim().length > 0 && (
                            <div className={styles.emptyText} style={{ padding: 8 }}>
                                Searching…
                            </div>
                        )}
                        {!search.loading &&
                            search.query.trim().length > 0 &&
                            search.results.length === 0 && (
                                <div className={styles.emptyText} style={{ padding: 8 }}>
                                    No users match that search.
                                </div>
                            )}
                        {search.results.map(r => (
                            <div key={r.id} className={styles.friendsSearchRow}>
                                <div className={styles.friendsSearchRowInfo}>
                                    <div className={styles.friendsSearchRowHandle}>@{r.username}</div>
                                    {r.displayName && (
                                        <div className={styles.friendsSearchRowSub}>{r.displayName}</div>
                                    )}
                                </div>
                                {renderSearchButton(r)}
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.friendsPanel}>
                    <h3 className={styles.friendsPanelTitle}>Friend requests</h3>
                    {incoming.length === 0 ? (
                        <p className={styles.emptyText} style={{ margin: 0 }}>
                            No pending friend requests
                        </p>
                    ) : (
                        <div className={styles.friendsReqList}>
                            {incoming.map(req => {
                                const initials = getInitials(req.sender.username, req.sender.displayName);
                                return (
                                    <div key={req.id} className={styles.friendsReqRow}>
                                        <div className={styles.friendCardTop}>
                                            <div
                                                className={styles.friendAvatar}
                                                style={{
                                                    background: getAvatarGradient(req.sender.avatarColor || 'blue'),
                                                }}
                                            >
                                                {initials}
                                            </div>
                                            <div className={styles.friendMeta}>
                                                <div className={styles.friendHandle}>@{req.sender.username}</div>
                                                {req.sender.displayName && (
                                                    <div className={styles.friendDisplay}>{req.sender.displayName}</div>
                                                )}
                                                <div className={styles.friendsSearchRowSub}>
                                                    {new Date(req.createdAt).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.friendsReqActions}>
                                            <button
                                                type="button"
                                                className={`${styles.friendsReqBtn} ${styles.friendsReqBtnAccept}`}
                                                disabled={rowBusy === `in:${req.id}`}
                                                onClick={async () => {
                                                    setRowBusy(`in:${req.id}`);
                                                    try {
                                                        await acceptRequest(req.id);
                                                    } finally {
                                                        setRowBusy(null);
                                                    }
                                                }}
                                            >
                                                {rowBusy === `in:${req.id}` ? '…' : 'Accept'}
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles.friendsReqBtn} ${styles.friendsReqBtnDecline}`}
                                                disabled={rowBusy === `dec:${req.id}`}
                                                onClick={async () => {
                                                    setRowBusy(`dec:${req.id}`);
                                                    try {
                                                        await declineRequest(req.id);
                                                    } finally {
                                                        setRowBusy(null);
                                                    }
                                                }}
                                            >
                                                {rowBusy === `dec:${req.id}` ? '…' : 'Decline'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className={styles.friendsPanel} style={{ maxHeight: 'none' }}>
                    <h3 className={styles.friendsPanelTitle}>Portfolio share settings</h3>
                    <p className={styles.friendsShareHelper}>Control which friends can view your portfolio.</p>
                    {shareLoading ? (
                        <div className={styles.emptyText}>Loading settings…</div>
                    ) : (
                        <>
                            {shareNote && (
                                <div
                                    className={`${styles.friendsBanner} ${
                                        shareNote.type === 'ok' ? styles.friendsBannerOk : styles.friendsBannerErr
                                    }`}
                                    style={{ marginBottom: 4 }}
                                >
                                    {shareNote.text}
                                </div>
                            )}
                            <div className={styles.friendsShareModes}>
                                <label
                                    className={`${styles.friendsShareModeRow} ${
                                        shareMode === 'all_friends' ? styles.friendsShareModeRowActive : ''
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="vestera-portfolio-share"
                                        className={styles.friendsShareModeRadio}
                                        checked={shareMode === 'all_friends'}
                                        onChange={() => setShareMode('all_friends')}
                                    />
                                    <span>
                                        <span className={styles.friendsShareModeLabel}>Share with all friends</span>
                                        <span className={styles.friendsShareModeHint}>
                                            Any accepted friend can open your portfolio.
                                        </span>
                                    </span>
                                </label>
                                <label
                                    className={`${styles.friendsShareModeRow} ${
                                        shareMode === 'no_one' ? styles.friendsShareModeRowActive : ''
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="vestera-portfolio-share"
                                        className={styles.friendsShareModeRadio}
                                        checked={shareMode === 'no_one'}
                                        onChange={() => setShareMode('no_one')}
                                    />
                                    <span>
                                        <span className={styles.friendsShareModeLabel}>Share with no one</span>
                                        <span className={styles.friendsShareModeHint}>
                                            Friends see your profile only; portfolio stays private.
                                        </span>
                                    </span>
                                </label>
                                <label
                                    className={`${styles.friendsShareModeRow} ${
                                        shareMode === 'selected_friends' ? styles.friendsShareModeRowActive : ''
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="vestera-portfolio-share"
                                        className={styles.friendsShareModeRadio}
                                        checked={shareMode === 'selected_friends'}
                                        onChange={() => setShareMode('selected_friends')}
                                    />
                                    <span>
                                        <span className={styles.friendsShareModeLabel}>Share with selected friends</span>
                                        <span className={styles.friendsShareModeHint}>
                                            Pick exactly who can view your holdings and performance.
                                        </span>
                                    </span>
                                </label>
                            </div>

                            {shareMode === 'selected_friends' && (
                                <div className={styles.friendsShareCheckWrap}>
                                    <p className={styles.friendsShareCheckTitle}>Who can view</p>
                                    {sortedFriends.length === 0 ? (
                                        <p className={styles.emptyText} style={{ margin: 0 }}>
                                            Add friends first, then choose who can see your portfolio.
                                        </p>
                                    ) : (
                                        <div className={styles.friendsShareChecklist}>
                                            {sortedFriends.map(fr => (
                                                <label key={fr.id} className={styles.friendsShareCheckRow}>
                                                    <input
                                                        type="checkbox"
                                                        checked={allowedIds.has(fr.id)}
                                                        onChange={() => toggleAllowed(fr.id)}
                                                    />
                                                    <span>@{fr.username}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                type="button"
                                className={styles.friendsShareSaveBtn}
                                disabled={shareSaving || !shareDirty}
                                onClick={() => void saveShareSettings()}
                            >
                                {shareSaving ? 'Saving…' : 'Save portfolio sharing'}
                            </button>
                        </>
                    )}
                </div>
            </aside>
        </div>
    );
}
