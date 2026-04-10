import { STARTING_CASH } from '@/lib/stocks';

/** Percent return vs starting balance, rounded to nearest tenth (e.g. 5.36 → 5.4). */
export function roundReturnToTenth(pctRaw: number): number {
    return Math.round(pctRaw * 10) / 10;
}

export function totalAccountValue(cash: number, holdingsMarketValue: number): number {
    return cash + holdingsMarketValue;
}

export function plVersusStarting(totalAccount: number, starting = STARTING_CASH): number {
    return totalAccount - starting;
}

export function returnPctVersusStarting(totalAccount: number, starting = STARTING_CASH): number {
    if (!starting) return 0;
    const raw = ((totalAccount - starting) / starting) * 100;
    return roundReturnToTenth(raw);
}

export type TradeLike = { stock: string; shares: number; price: number; action: string };

/**
 * Average-cost basis from trade history (oldest → newest). Matches typical paper-portfolio accounting.
 */
export function positionsFromTradesAsc(tradesAsc: TradeLike[]): Map<string, { shares: number; avgCost: number }> {
    const m = new Map<string, { shares: number; totalCost: number }>();
    for (const t of tradesAsc) {
        const action = (t.action || '').toUpperCase();
        const cur = m.get(t.stock) ?? { shares: 0, totalCost: 0 };
        if (action === 'BUY') {
            const ns = cur.shares + t.shares;
            const nc = cur.totalCost + t.shares * t.price;
            m.set(t.stock, { shares: ns, totalCost: nc });
        } else if (action === 'SELL') {
            const avg = cur.shares > 0 ? cur.totalCost / cur.shares : 0;
            const ns = Math.max(0, cur.shares - t.shares);
            const nc = ns > 0 ? ns * avg : 0;
            m.set(t.stock, { shares: ns, totalCost: nc });
        }
    }
    const out = new Map<string, { shares: number; avgCost: number }>();
    for (const [sym, v] of m) {
        if (v.shares > 0) {
            out.set(sym, { shares: v.shares, avgCost: v.totalCost / v.shares });
        }
    }
    return out;
}
