'use client';

import type { AssetSearchRow } from '@/hooks/useAssetSearch';
import styles from '@/app/trade/trade.module.css';
import { AssetResultRow } from './AssetResultRow';

type Props = {
    results: AssetSearchRow[];
    loading: boolean;
    queryTrimmed: string;
    selectedIndex: number;
    onSelect: (symbol: string) => void;
    onHoverIndex: (i: number) => void;
};

export function AssetSearchResults({
    results,
    loading,
    queryTrimmed,
    selectedIndex,
    onSelect,
    onHoverIndex,
}: Props) {
    return (
        <div className={styles.assetSearchDropdown} role="listbox">
            {loading && results.length === 0 && (
                <div className={styles.assetSearchHint}>Loading…</div>
            )}
            {!loading && queryTrimmed && results.length === 0 && (
                <div className={styles.assetSearchHint}>No matching assets found</div>
            )}
            {!queryTrimmed && !loading && results.length === 0 && (
                <div className={styles.assetSearchHint}>Popular symbols</div>
            )}
            {results.map((row, i) => (
                <div
                    key={row.symbol}
                    role="option"
                    aria-selected={i === selectedIndex}
                    onMouseEnter={() => onHoverIndex(i)}
                >
                    <AssetResultRow
                        row={row}
                        highlighted={i === selectedIndex}
                        onPick={() => onSelect(row.symbol)}
                    />
                </div>
            ))}
        </div>
    );
}
