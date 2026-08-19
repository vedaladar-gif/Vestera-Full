'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PredictAIResponse } from './types';

const REFRESH_MS = 60_000; // poll for breaking news / price moves without hammering the server

/** Shared fetch for Vestera Predict AI so the "Today's Forecast" card (above the chart) and the
 *  rest of the Predict AI panels (below, near model performance) stay in sync from one request. */
export function usePredictAI(symbol: string | null) {
    const [data, setData] = useState<PredictAIResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback((sym: string, silent = false) => {
        if (!silent) setError(null);
        fetch(`/api/predict-ai/${encodeURIComponent(sym)}`)
            .then(async r => {
                const json = await r.json();
                if (!r.ok) { setError(json.error || 'Unable to generate a Predict AI forecast right now.'); return; }
                setData(json);
                setError(null);
            })
            .catch(() => setError('Unable to generate a Predict AI forecast right now.'));
    }, []);

    useEffect(() => {
        if (!symbol) { setData(null); setError(null); return; }
        setData(null);
        load(symbol);
        const id = setInterval(() => load(symbol, true), REFRESH_MS);
        return () => clearInterval(id);
    }, [symbol, load]);

    return { data, error };
}
