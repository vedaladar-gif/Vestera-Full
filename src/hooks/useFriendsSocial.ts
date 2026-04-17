'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface FriendEntry {
    id: string;
    username: string;
    display_name: string | null;
    avatar_color: string | null;
}

export interface IncomingRequest {
    id: number;
    createdAt: string;
    sender: {
        id: string;
        username: string;
        displayName: string | null;
        avatarColor: string | null;
    };
}

export type SearchRelation = 'none' | 'friend' | 'outgoing_pending' | 'incoming_pending';

export interface UserSearchResult {
    id: string;
    username: string;
    displayName: string | null;
    avatarColor: string | null;
    relation: SearchRelation;
    incomingRequestId?: number;
}

export function useFriendsSocial() {
    const [friends, setFriends] = useState<FriendEntry[]>([]);
    const [incoming, setIncoming] = useState<IncomingRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
    const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showBanner = useCallback((type: 'ok' | 'err', text: string) => {
        if (bannerTimer.current) clearTimeout(bannerTimer.current);
        setBanner({ type, text });
        bannerTimer.current = setTimeout(() => {
            setBanner(null);
            bannerTimer.current = null;
        }, 4000);
    }, []);

    const refresh = useCallback(async () => {
        try {
            const [fr, rq] = await Promise.all([
                fetch('/api/friends', { credentials: 'same-origin' }).then(r => (r.ok ? r.json() : null)),
                fetch('/api/friend-requests', { credentials: 'same-origin' }).then(r => (r.ok ? r.json() : null)),
            ]);
            if (fr?.friends) setFriends(fr.friends);
            if (rq?.incoming) setIncoming(rq.incoming);
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    useEffect(
        () => () => {
            if (bannerTimer.current) clearTimeout(bannerTimer.current);
        },
        []
    );

    const sendRequest = useCallback(
        async (payload: { username: string; recipientUserId?: string }) => {
            const res = await fetch('/api/friend-requests', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: payload.username,
                    ...(payload.recipientUserId ? { recipientUserId: payload.recipientUserId } : {}),
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                showBanner('err', typeof data.error === 'string' ? data.error : 'Could not send request');
                return false;
            }
            showBanner('ok', 'Friend request sent');
            await refresh();
            return true;
        },
        [refresh, showBanner]
    );

    const acceptRequest = useCallback(
        async (requestId: number) => {
            const res = await fetch(`/api/friend-requests/${requestId}/accept`, {
                method: 'POST',
                credentials: 'same-origin',
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                showBanner('err', typeof data.error === 'string' ? data.error : 'Could not accept');
                return false;
            }
            showBanner('ok', 'Friend added');
            await refresh();
            return true;
        },
        [refresh, showBanner]
    );

    const declineRequest = useCallback(
        async (requestId: number) => {
            const res = await fetch(`/api/friend-requests/${requestId}/decline`, {
                method: 'POST',
                credentials: 'same-origin',
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                showBanner('err', typeof data.error === 'string' ? data.error : 'Could not decline');
                return false;
            }
            showBanner('ok', 'Request declined');
            await refresh();
            return true;
        },
        [refresh, showBanner]
    );

    const removeFriend = useCallback(
        async (friendUserId: string) => {
            const res = await fetch(`/api/friends/${encodeURIComponent(friendUserId)}`, {
                method: 'DELETE',
                credentials: 'same-origin',
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                showBanner('err', typeof data.error === 'string' ? data.error : 'Could not remove');
                return false;
            }
            showBanner('ok', 'Removed from friends');
            await refresh();
            return true;
        },
        [refresh, showBanner]
    );

    return {
        friends,
        incoming,
        loading,
        refresh,
        banner,
        sendRequest,
        acceptRequest,
        declineRequest,
        removeFriend,
        showBanner,
    };
}

export function useUsernameSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const gen = useRef(0);
    /** Increment to re-run search with the same query (e.g. after removing a friend). */
    const [searchNonce, setSearchNonce] = useState(0);

    const invalidateSearch = useCallback(() => {
        setSearchNonce(n => n + 1);
    }, []);

    useEffect(() => {
        const q = query.trim();
        if (q.length < 1) {
            setResults([]);
            return;
        }
        const g = ++gen.current;
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/users/search?q=${encodeURIComponent(q)}&limit=15`,
                    { credentials: 'same-origin' }
                );
                const data = await res.json().catch(() => ({}));
                if (g !== gen.current) return;
                setResults(Array.isArray(data.results) ? data.results : []);
            } finally {
                if (g === gen.current) setLoading(false);
            }
        }, 220);
        return () => clearTimeout(t);
    }, [query, searchNonce]);

    return { query, setQuery, results, loading, invalidateSearch };
}
