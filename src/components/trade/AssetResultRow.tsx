'use client';

import type { AssetSearchRow } from '@/hooks/useAssetSearch';
import styles from '@/app/trade/trade.module.css';

type Props = {
    row: AssetSearchRow;
    onPick: () => void;
    highlighted: boolean;
};

export function AssetResultRow({ row, onPick, highlighted }: Props) {
    const up = (row.changePct ?? 0) >= 0;
    const hasPx = typeof row.price === 'number' && row.price > 0;
    const pct = row.changePct;

    return (
        <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={onPick}
            className={`${styles.assetSearchRow} ${highlighted ? styles.assetSearchRowHighlighted : ''}`}
        >
            <div className={styles.assetSearchRowLeft}>
                <span className={styles.assetSearchSym}>{row.symbol}</span>
                <span className={styles.assetSearchName}>{row.name}</span>
            </div>
            <div className={styles.assetSearchRowRight}>
                <span className={styles.assetSearchPrice}>
                    {hasPx ? `$${row.price!.toFixed(2)}` : '—'}
                </span>
                <span
                    className={styles.assetSearchChg}
                    style={{ color: up ? '#4ade80' : '#f87171' }}
                >
                    {hasPx && pct != null
                        ? `${up ? '+' : ''}${pct.toFixed(2)}%`
                        : '—'}
                </span>
            </div>
        </button>
    );
}
