'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PredictAIResponse } from './types';

const REFRESH_MS = 60_000; // poll for breaking news / price moves without hammering the server

/** Shared fetch for Vestera Predict AI so the "Today's Forecast" card (above the chart) and the
 * rest of the Predict AI panels (below, near model performance) stay in sync from one request. */
export function usePredictAI(symbol: string | null) {
    const [data, setData] = useState<PredictAIResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    // Tracks the symbol the most recently-issued request was for, so a slow response for a
    // symbol the user has since navigated away from can't overwrite the current view.
    const latestSymbolRef = useRef<string | null>(null);

    const load = useCallback((sym: string, silent = false) => {
        if (!silent) setError(null);
        fetch(`/api/predict-ai/${encodeURIComponent(sym)}`)
            .then(async r => {
                const json = await r.json();
                if (latestSymbolRef.current !== sym) return; // stale response — a newer symbol is now active
                if (!r.ok) {
                    // A failed background refresh shouldn't wipe out a forecast the user is already viewing.
                    if (!silent) setError(json.error || 'Unable to generate a Predict AI forecast right now.');
                    return;
                }
                setData(json);
                setError(null);
            })
            .catch(() => {
                if (latestSymbolRef.current === sym && !silent) setError('Unable to generate a Predict AI forecast right now.');
            });
    }, []);

    useEffect(() => {
        latestSymbolRef.current = symbol;
        if (!symbol) { setData(null); setError(null); return; }
        setData(null);
        load(symbol);
        const id = setInterval(() => load(symbol, true), REFRESH_MS);
        return () => clearInterval(id);
    }, [symbol, load]);

    return { data, error };
}
