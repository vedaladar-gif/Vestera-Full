'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';

const LEGACY_KEY = 'vestera_learn_progress';

export interface LearnProgressMap {
    [key: string]: { completed: boolean; quizScore?: number; quizPassed?: boolean };
}

function storageKeyForUser(userId: string) {
    return `vestera_learn_progress_u_${userId}`;
}

/**
 * Learn progress: only persisted per authenticated user. Guests always see empty progress
 * and updates are no-ops (no localStorage reads/writes for logged-out users).
 */
export function useLearnProgress(
    authenticated: boolean,
    authLoading: boolean,
    userId: string | null
) {
    const [storedProgress, setStoredProgress] = useState<LearnProgressMap>({});

    const canPersist = Boolean(authenticated && !authLoading && userId);

    const progressForUi = useMemo(
        () => (canPersist ? storedProgress : {}),
        [canPersist, storedProgress]
    );

    // Logged out → drop in-memory progress so nothing leaks into the UI
    useEffect(() => {
        if (authLoading) return;
        if (!authenticated) {
            setStoredProgress({});
        }
    }, [authenticated, authLoading]);

    // Load / migrate when a signed-in user is known
    useEffect(() => {
        if (!canPersist || !userId) return;
        try {
            const key = storageKeyForUser(userId);
            let raw = localStorage.getItem(key);
            if (!raw || raw === '{}') {
                const legacy = localStorage.getItem(LEGACY_KEY);
                if (legacy) {
                    localStorage.setItem(key, legacy);
                    localStorage.removeItem(LEGACY_KEY);
                    raw = legacy;
                }
            }
            if (raw) {
                const parsed = JSON.parse(raw) as LearnProgressMap;
                setStoredProgress(parsed && typeof parsed === 'object' ? parsed : {});
            } else {
                setStoredProgress({});
            }
        } catch {
            setStoredProgress({});
        }
    }, [canPersist, userId]);

    const updateProgress = useCallback(
        (fn: (prev: LearnProgressMap) => LearnProgressMap) => {
            if (!canPersist || !userId) return;
            const key = storageKeyForUser(userId);
            setStoredProgress(prev => {
                const next = fn(prev);
                try {
                    localStorage.setItem(key, JSON.stringify(next));
                } catch {
                    /* quota / private mode */
                }
                return next;
            });
        },
        [canPersist, userId]
    );

    return { progressForUi, updateProgress };
}
