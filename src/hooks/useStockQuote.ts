'use client';

import { useEffect, useRef, useState } from 'react';

/** Live quote fields from `GET /api/quote/[ticker]` — single source of truth for the trade page. */
export interface StockQuote {
    sym: string;
    price: number;
    change: number;
    changePct: number;
    open: number;
    volume: number;
    high52w: number;
    marketCap: number;
    updatedAt: number;
}

type Options = {
    enabled?: boolean;
    /** Default 15_000 ms */
    pollIntervalMs?: number;
};

function parseQuote(json: unknown, fallbackSym: string): StockQuote | null {
    if (!json || typeof json !== 'object') return null;
    const o = json as Record<string, unknown>;
    if (typeof o.price !== 'number' || o.price <= 0) return null;
    return {
        sym: typeof o.sym === 'string' ? o.sym : fallbackSym,
        price: o.price,
        change: typeof o.change === 'number' ? o.change : 0,
        changePct: typeof o.changePct === 'number' ? o.changePct : 0,
        open: typeof o.open === 'number' ? o.open : 0,
        volume: typeof o.volume === 'number' ? o.volume : 0,
        high52w: typeof o.high52w === 'number' ? o.high52w : 0,
        marketCap: typeof o.marketCap === 'number' ? o.marketCap : 0,
        updatedAt: Date.now(),
    };
}

/**
 * One polling loop per mounted ticker: fetches `/api/quote` on an interval and exposes shared state.
 * Stale responses are dropped when `ticker` changes (generation guard + no overlapping in-flight fetches).
 */
export function useStockQuote(ticker: string, options?: Options): {
    quote: StockQuote | null;
    loading: boolean;
    error: string | null;
} {
    const enabled = options?.enabled ?? true;
    const pollIntervalMs = options?.pollIntervalMs ?? 15_000;

    const [quote, setQuote] = useState<StockQuote | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generationRef = useRef(0);
    const inFlightRef = useRef(false);
    const prevSymRef = useRef<string | null>(null);

    useEffect(() => {
        if (!enabled || !ticker.trim()) {
            prevSymRef.current = null;
            setQuote(null);
            setError(null);
            setLoading(false);
            return;
        }

        const sym = ticker.toUpperCase();
        if (prevSymRef.current !== sym) {
            setQuote(null);
            setError(null);
            prevSymRef.current = sym;
        }

        const runId = ++generationRef.current;
        let intervalId: ReturnType<typeof setInterval> | null = null;

        const fetchOnce = async () => {
            if (runId !== generationRef.current) return;
            if (inFlightRef.current) return;
            inFlightRef.current = true;
            setLoading(true);
            try {
                const res = await fetch(`/api/quote/${encodeURIComponent(sym)}`, {
                    credentials: 'same-origin',
                });
                if (runId !== generationRef.current) return;
                const data: unknown = await res.json().catch(() => null);
                if (runId !== generationRef.current) return;

                if (!res.ok) {
                    const err =
                        data && typeof data === 'object' && typeof (data as { error?: string }).error === 'string'
                            ? (data as { error: string }).error
                            : 'Quote unavailable';
                    setError(err);
                    return;
                }

                const q = parseQuote(data, sym);
                if (q) {
                    setQuote(q);
                    setError(null);
                } else {
                    setError('Invalid quote response');
                }
            } catch {
                if (runId === generationRef.current) {
                    setError('Network error');
                }
            } finally {
                inFlightRef.current = false;
                if (runId === generationRef.current) {
                    setLoading(false);
                }
            }
        };

        void fetchOnce();
        intervalId = setInterval(() => void fetchOnce(), pollIntervalMs);

        return () => {
            generationRef.current++;
            if (intervalId) clearInterval(intervalId);
            inFlightRef.current = false;
        };
    }, [enabled, ticker, pollIntervalMs]);

    return { quote, loading, error };
}
