import { getPortfolioRowsForUsers } from './models';
import { getCurrentPrice } from './stocks';
import { positionsFromTradesAsc, totalAccountValue } from './portfolioMath';

export interface ProfileLite {
    id: string;
    username: string;
    displayName: string | null;
    avatarColor: string;
    cash: number;
}

export interface AccountValue extends ProfileLite {
    holdingsValue: number;
    totalValue: number;
}

/** Computes live holdings + total account value for a batch of profiles. Used by admin tooling. */
export async function computeAccountValues(profiles: ProfileLite[]): Promise<AccountValue[]> {
    if (profiles.length === 0) return [];

    const ids = profiles.map(p => p.id);
    const tradeRows = await getPortfolioRowsForUsers(ids);

    const byUser = new Map<string, typeof tradeRows>();
    for (const r of tradeRows) {
        if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
        byUser.get(r.user_id)!.push(r);
    }

    const symbols = new Set<string>();
    for (const r of tradeRows) symbols.add(r.stock);

    const priceCache = new Map<string, number>();
    await Promise.all(
        [...symbols].map(async sym => {
            priceCache.set(sym, await getCurrentPrice(sym));
        }),
    );

    const results: AccountValue[] = [];
    for (const p of profiles) {
        const rows = (byUser.get(p.id) || []).slice();
        rows.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        const posMap = positionsFromTradesAsc(
            rows.map(r => ({ stock: r.stock, shares: r.shares, price: Number(r.price) || 0, action: r.action })),
        );

        let holdingsValue = 0;
        for (const [sym, { shares }] of posMap) {
            const px = priceCache.get(sym) ?? (await getCurrentPrice(sym));
            if (!priceCache.has(sym)) priceCache.set(sym, px);
            holdingsValue += shares * px;
        }

        results.push({ ...p, holdingsValue, totalValue: totalAccountValue(p.cash, holdingsValue) });
    }

    results.sort((a, b) => b.totalValue - a.totalValue);
    return results;
}
