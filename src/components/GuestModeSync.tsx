'use client';

import { useEffect } from 'react';
import { syncGuestCookieFromLocalStorage } from '@/lib/guestMode';

/** Restores guest cookie from localStorage after hard refresh (middleware needs the cookie). */
export default function GuestModeSync() {
    useEffect(() => {
        syncGuestCookieFromLocalStorage();
    }, []);
    return null;
}
