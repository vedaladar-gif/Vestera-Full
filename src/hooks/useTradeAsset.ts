'use client';

import { useState } from 'react';
import { useStockQuote } from '@/hooks/useStockQuote';

type Options = {
    enabled?: boolean;
    pollIntervalMs?: number;
};

/**
 * Active Trade symbol + live quote polling (same contract as `useStockQuote`).
 */
export function useTradeAsset(initialTicker: string, options?: Options) {
    const [ticker, setTicker] = useState(() => initialTicker.toUpperCase());
    const quoteState = useStockQuote(ticker, {
        enabled: options?.enabled ?? true,
        pollIntervalMs: options?.pollIntervalMs ?? 15_000,
    });
    return { ticker, setTicker, ...quoteState };
}
