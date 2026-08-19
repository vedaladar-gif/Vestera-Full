'use client';

import { useEffect, useState } from 'react';

function todayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * React hook that returns today's date, formatted, and automatically rolls
 * over to the next day without a page refresh — checked every minute (and
 * re-synced whenever the tab regains focus, which also catches laptop
 * sleep/wake skipping past midnight).
 */
export function useCurrentDate(options?: { weekday?: 'long' | 'short'; intervalMs?: number }): { date: Date; formatted: string } {
    const { weekday = 'long', intervalMs = 60_000 } = options ?? {};
    const [key, setKey] = useState(() => todayKey());

    useEffect(() => {
        const check = () => setKey(prev => {
            const now = todayKey();
            return now !== prev ? now : prev;
        });
        const timer = setInterval(check, intervalMs);
        document.addEventListener('visibilitychange', check);
        window.addEventListener('focus', check);
        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', check);
            window.removeEventListener('focus', check);
        };
    }, [intervalMs]);

    const date = new Date();
    const formatted = date.toLocaleDateString(undefined, { weekday, year: 'numeric', month: 'long', day: 'numeric' });
    // `key` is intentionally unused here beyond triggering the re-render above.
    void key;
    return { date, formatted };
}
