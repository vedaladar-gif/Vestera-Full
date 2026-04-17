'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface AssetSearchRow {
    symbol: string;
    name: string;
    type: string;
    sector?: string;
    price: number | null;
    change: number | null;
    changePct: number | null;
}

type Options = {
    debounceMs?: number;
    limit?: number;
};

/**
 * Debounced Trade search against `/api/search-stocks`, plus optional popular suggestions when the query is empty.
 */
export function useAssetSearch(options?: Options) {
    const debounceMs = options?.debounceMs ?? 220;
    const limit = options?.limit ?? 25;

    const [query, setQueryRaw] = useState('');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<AssetSearchRow[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const genRef = useRef(0);

    const fetchPopular = useCallback(async () => {
        const g = ++genRef.current;
        setLoading(true);
        try {
            const res = await fetch('/api/search-stocks?suggestions=popular', { credentials: 'same-origin' });
            const data = await res.json().catch(() => ({}));
            if (g !== genRef.current) return;
            setResults(Array.isArray(data.results) ? data.results : []);
        } finally {
            if (g === genRef.current) setLoading(false);
        }
    }, []);

    const setQuery = useCallback(
        (q: string) => {
            setQueryRaw(q);
            if (!q.trim()) {
                setSelectedIndex(-1);
                void fetchPopular();
            }
        },
        [fetchPopular]
    );

    useEffect(() => {
        const q = query.trim();
        if (!q) {
            return;
        }

        const g = ++genRef.current;
        const t = window.setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/search-stocks?q=${encodeURIComponent(q)}&limit=${limit}&quotes=1`,
                    { credentials: 'same-origin' }
                );
                const data = await res.json().catch(() => ({}));
                if (g !== genRef.current) return;
                setResults(Array.isArray(data.results) ? data.results : []);
                setSelectedIndex(-1);
            } finally {
                if (g === genRef.current) setLoading(false);
            }
        }, debounceMs);

        return () => clearTimeout(t);
    }, [query, debounceMs, limit]);

    const onFocusOpen = useCallback(() => {
        if (!query.trim()) {
            void fetchPopular();
        }
    }, [query, fetchPopular]);

    return {
        query,
        setQuery,
        open,
        setOpen,
        loading,
        results,
        selectedIndex,
        setSelectedIndex,
        onFocusOpen,
        fetchPopular,
    };
}
