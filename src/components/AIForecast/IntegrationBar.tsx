'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './aiForecastComponents.module.css';

export default function IntegrationBar({
    symbol,
    authenticated,
    ownsPosition,
    shares,
}: {
    symbol: string;
    authenticated: boolean;
    ownsPosition?: boolean;
    shares?: number;
}) {
    const [inWatchlist, setInWatchlist] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!authenticated) return;
        fetch('/api/ai-forecast/watchlist')
            .then(r => (r.ok ? r.json() : { symbols: [] }))
            .then(d => setInWatchlist((d.symbols || []).includes(symbol)))
            .catch(() => {});
    }, [authenticated, symbol]);

    const toggleWatchlist = async () => {
        if (!authenticated || busy) return;
        setBusy(true);
        try {
            if (inWatchlist) {
                await fetch(`/api/ai-forecast/watchlist?symbol=${encodeURIComponent(symbol)}`, { method: 'DELETE' });
                setInWatchlist(false);
            } else {
                await fetch('/api/ai-forecast/watchlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ symbol }),
                });
                setInWatchlist(true);
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className={styles.integrationBar}>
            <div className={styles.integrationLeft}>
                {authenticated && ownsPosition ? (
                    <span className={styles.positionBadge}>You own {shares} share{shares === 1 ? '' : 's'} of {symbol}</span>
                ) : (
                    <span className={styles.positionBadgeMuted}>Educational analysis — not a trade recommendation</span>
                )}
            </div>
            <div className={styles.integrationActions}>
                <Link href={`/trade?ticker=${symbol}`} className={styles.integrationBtnSecondary}>View Stock</Link>
                <Link href={`/trade?ticker=${symbol}`} className={styles.integrationBtnPrimary}>Paper Trade</Link>
                {authenticated ? (
                    <button className={inWatchlist ? styles.integrationBtnActive : styles.integrationBtnSecondary} onClick={toggleWatchlist} disabled={busy}>
                        {inWatchlist ? '★ On Watchlist' : '☆ Add to Watchlist'}
                    </button>
                ) : (
                    <Link href="/login" className={styles.integrationBtnSecondary}>Log in to save to watchlist</Link>
                )}
            </div>
        </div>
    );
}
