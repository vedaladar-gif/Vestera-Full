'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './aiForecastComponents.module.css';

interface SearchHit {
    symbol: string;
    name: string;
    type: string;
    sector?: string;
    price: number | null;
    changePct: number | null;
}

const POPULAR = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'SPY', 'QQQ'];

export default function StockSearch({ onSelect }: { onSelect: (symbol: string) => void }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchHit[]>([]);
    const [popular, setPopular] = useState<SearchHit[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const boxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('/api/search-stocks?suggestions=popular')
            .then(r => r.json())
            .then(d => setPopular((d.results || []).filter((r: SearchHit) => POPULAR.includes(r.symbol))))
            .catch(() => {});
    }, []);

    useEffect(() => {
        const q = query.trim();
        if (!q) { setResults([]); return; }
        setLoading(true);
        const id = setTimeout(() => {
            fetch(`/api/search-stocks?q=${encodeURIComponent(q)}&limit=8`)
                .then(r => r.json())
                .then(d => setResults(d.results || []))
                .catch(() => setResults([]))
                .finally(() => setLoading(false));
        }, 200);
        return () => clearTimeout(id);
    }, [query]);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    const pick = (symbol: string) => {
        setQuery('');
        setOpen(false);
        onSelect(symbol.toUpperCase());
    };

    const list = query.trim() ? results : popular;

    return (
        <div className={styles.searchBox} ref={boxRef}>
            <div className={styles.searchInputWrap}>
                <input
                    className={styles.searchInput}
                    placeholder="Search a stock or ticker… (AAPL, NVDA, TSLA…)"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => setOpen(true)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && list.length > 0) pick(list[0].symbol);
                    }}
                />
                {loading && <span className={styles.searchSpinner} />}
            </div>

            {open && list.length > 0 && (
                <div className={styles.searchDropdown}>
                    {!query.trim() && <div className={styles.searchDropdownLabel}>Popular</div>}
                    {list.map(hit => (
                        <button key={hit.symbol} className={styles.searchResultRow} onClick={() => pick(hit.symbol)}>
                            <div>
                                <div className={styles.searchResultSymbol}>{hit.symbol}</div>
                                <div className={styles.searchResultName}>{hit.name}</div>
                            </div>
                            {hit.price !== null && (
                                <div className={styles.searchResultPrice}>
                                    <div>${hit.price.toFixed(2)}</div>
                                    {hit.changePct !== null && (
                                        <div className={hit.changePct >= 0 ? styles.textGreen : styles.textRed}>
                                            {hit.changePct >= 0 ? '+' : ''}{hit.changePct.toFixed(2)}%
                                        </div>
                                    )}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
