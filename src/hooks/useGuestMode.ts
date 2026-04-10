'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    clearGuestMode as clearGuest,
    enterGuestMode as enterGuest,
    readIsGuestClient,
    subscribeGuestMode,
    syncGuestCookieFromLocalStorage,
} from '@/lib/guestMode';

/**
 * Guest flag from localStorage and/or guest cookie (kept in sync for middleware).
 */
export function useGuestMode() {
    const [isGuest, setIsGuest] = useState(false);
    const [ready, setReady] = useState(false);

    const recompute = useCallback(() => {
        setIsGuest(readIsGuestClient());
    }, []);

    useEffect(() => {
        syncGuestCookieFromLocalStorage();
        recompute();
        setReady(true);
        return subscribeGuestMode(recompute);
    }, [recompute]);

    const enterGuestMode = useCallback(() => {
        enterGuest();
    }, []);

    const clearGuestMode = useCallback(() => {
        clearGuest();
    }, []);

    return { isGuest, ready, enterGuestMode, clearGuestMode };
}
