'use client';

import type { AssetSearchRow } from '@/hooks/useAssetSearch';
import styles from '@/app/trade/trade.module.css';
import { AssetSearchResults } from './AssetSearchResults';

type Props = {
    query: string;
    onQueryChange: (q: string) => void;
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onFocusOpen: () => void;
    results: AssetSearchRow[];
    loading: boolean;
    selectedIndex: number;
    onSelectedIndexChange: (i: number) => void;
    onSelectSymbol: (symbol: string) => void;
};

export function AssetSearchInput({
    query,
    onQueryChange,
    open,
    onOpenChange,
    onFocusOpen,
    results,
    loading,
    selectedIndex,
    onSelectedIndexChange,
    onSelectSymbol,
}: Props) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open || results.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            onSelectedIndexChange(Math.min(results.length - 1, selectedIndex + 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            onSelectedIndexChange(Math.max(0, selectedIndex - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const row = results[selectedIndex >= 0 ? selectedIndex : 0];
            if (row) onSelectSymbol(row.symbol);
        } else if (e.key === 'Escape') {
            onOpenChange(false);
        }
    };

    return (
        <div className={styles.searchBox}>
            <input
                type="text"
                value={query}
                onChange={e => onQueryChange(e.target.value)}
                onFocus={() => {
                    onFocusOpen();
                    onOpenChange(true);
                }}
                onBlur={() => {
                    window.setTimeout(() => onOpenChange(false), 180);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search name or ticker…"
                className={styles.searchInputWide}
                autoComplete="off"
                spellCheck={false}
                aria-expanded={open}
                aria-controls="trade-asset-search-results"
            />
            {open && (
                <div id="trade-asset-search-results">
                    <AssetSearchResults
                        results={results}
                        loading={loading}
                        queryTrimmed={query.trim()}
                        selectedIndex={selectedIndex}
                        onSelect={onSelectSymbol}
                        onHoverIndex={onSelectedIndexChange}
                    />
                </div>
            )}
        </div>
    );
}
