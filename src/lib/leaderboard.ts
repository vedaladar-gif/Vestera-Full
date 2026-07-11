import { supabase } from '@/lib/supabaseClient';
import { getPortfolioRowsForUsers } from '@/lib/models';
import { getCurrentPrice } from '@/lib/stocks';
import {
    plVersusStarting,
    positionsFromTradesAsc,
    returnPctVersusStarting,
    totalAccountValue,
} from '@/lib/portfolioMath';
import { isEmailUsername } from '@/lib/avatarColors';

export type ScoredTrader = {
    id: string;
    username: string;
    displayName: string | null;
    avatarColor: string;
    cash: number;
    holdingsValue: number;
    totalValue: number;
    pl: number;
    pct: number;
};

/** Score every eligible trader for leaderboard ranking. */
export async function buildScoredLeaderboard(): Promise<ScoredTrader[]> {
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_color, cash')
        .limit(800);

    if (error || !profiles?.length) return [];

    const eligible = profiles.filter(p => p.username && !isEmailUsername(p.username as string));
    if (eligible.length === 0) return [];

    const ids = eligible.map(p => p.id as string);
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
        })
    );

    const scored: ScoredTrader[] = [];

    for (const p of eligible) {
        const uid = p.id as string;
        const cash = Number(p.cash) || 0;
        const rows = (byUser.get(uid) || []).slice();
        rows.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        const posMap = positionsFromTradesAsc(
            rows.map(r => ({
                stock: r.stock,
                shares: r.shares,
                price: Number(r.price) || 0,
                action: r.action,
            }))
        );

        let holdingsValue = 0;
        for (const [sym, { shares }] of posMap) {
            const px = priceCache.get(sym) ?? (await getCurrentPrice(sym));
            if (!priceCache.has(sym)) priceCache.set(sym, px);
            holdingsValue += shares * px;
        }

        const totalValue = totalAccountValue(cash, holdingsValue);

        scored.push({
            id: uid,
            username: p.username as string,
            displayName: (p.display_name as string | null) ?? null,
            avatarColor: (p.avatar_color as string) || 'blue',
            cash,
            holdingsValue,
            totalValue,
            pl: plVersusStarting(totalValue),
            pct: returnPctVersusStarting(totalValue),
        });
    }

    scored.sort((a, b) => b.totalValue - a.totalValue);
    return scored;
}

/** Return 1-based rank for a user, or null if not on the leaderboard. */
export async function getUserLeaderboardRank(userId: string): Promise<number | null> {
    const scored = await buildScoredLeaderboard();
    const idx = scored.findIndex(r => r.id === userId);
    return idx >= 0 ? idx + 1 : null;
}
