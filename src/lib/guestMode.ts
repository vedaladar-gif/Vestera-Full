/**
 * Guest preview mode: localStorage + cookie so middleware can allow restricted
 * route shells while APIs remain session-protected.
 */

export const GUEST_COOKIE = 'vestera_guest';
export const GUEST_LOCAL_KEY = 'vestera_guest_mode';

const GUEST_EVENT = 'vestera-guest-change';

/** Max-Age 1 year */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function setGuestCookieClient(): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${GUEST_COOKIE}=1; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearGuestCookieClient(): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${GUEST_COOKIE}=; path=/; max-age=0`;
}

/** If localStorage says guest but cookie was cleared, restore cookie (refresh / multi-tab). */
export function syncGuestCookieFromLocalStorage(): void {
    if (typeof window === 'undefined') return;
    try {
        if (localStorage.getItem(GUEST_LOCAL_KEY) === '1') {
            setGuestCookieClient();
        }
    } catch {
        /* private mode */
    }
}

export function enterGuestMode(): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(GUEST_LOCAL_KEY, '1');
    } catch {
        /* still set cookie */
    }
    setGuestCookieClient();
    window.dispatchEvent(new Event(GUEST_EVENT));
}

export function clearGuestMode(): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(GUEST_LOCAL_KEY);
    } catch {
        /* ignore */
    }
    clearGuestCookieClient();
    window.dispatchEvent(new Event(GUEST_EVENT));
}

export function subscribeGuestMode(listener: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(GUEST_EVENT, listener);
    window.addEventListener('storage', listener);
    return () => {
        window.removeEventListener(GUEST_EVENT, listener);
        window.removeEventListener('storage', listener);
    };
}

export function readIsGuestClient(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        if (localStorage.getItem(GUEST_LOCAL_KEY) === '1') return true;
    } catch {
        /* ignore */
    }
    return document.cookie.split(';').some(c => {
        const t = c.trim();
        return t === `${GUEST_COOKIE}=1` || t.startsWith(`${GUEST_COOKIE}=1`);
    });
}
