import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabaseClient';
import { getPortfolioRowsForUsers } from '@/lib/models';
import { getCurrentPrice, STARTING_CASH } from '@/lib/stocks';
import {
    plVersusStarting,
    positionsFromTradesAsc,
    returnPctVersusStarting,
    totalAccountValue,
} from '@/lib/portfolioMath';
import { isEmailUsername } from '@/lib/avatarColors';

export async function GET() {
    const session = await getSession();
    if (!session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_color, cash')
        .limit(800);

    if (error) {
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    const eligible = (profiles || []).filter(p => p.username && !isEmailUsername(p.username as string));

    if (eligible.length === 0) {
        return NextResponse.json({ leaderboard: [] });
    }

    const ids = eligible.map(p => p.id as string);
    const tradeRows = await getPortfolioRowsForUsers(ids);

    const byUser = new Map<string, typeof tradeRows>();
    for (const r of tradeRows) {
        if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
        byUser.get(r.user_id)!.push(r);
    }

    const symbols = new Set<string>();
    for (const r of tradeRows) {
        symbols.add(r.stock);
    }

    const priceCache = new Map<string, number>();
    await Promise.all(
        [...symbols].map(async sym => {
            const px = await getCurrentPrice(sym);
            priceCache.set(sym, px);
        })
    );

    type Scored = {
        id: string;
        username: string;
        displayName: string | null;
        avatarColor: string;
        cash: number;
        holdingsValue: number;
        totalValue: number;
        pl: number;
        pct: number;
        isCurrentUser: boolean;
    };

    const scored: Scored[] = [];

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
        const pl = plVersusStarting(totalValue);
        const pct = returnPctVersusStarting(totalValue);

        scored.push({
            id: uid,
            username: p.username as string,
            displayName: (p.display_name as string | null) ?? null,
            avatarColor: (p.avatar_color as string) || 'blue',
            cash,
            holdingsValue,
            totalValue,
            pl,
            pct,
            isCurrentUser: uid === session.userId,
        });
    }

    scored.sort((a, b) => b.totalValue - a.totalValue);

    const TOP = 100;
    const top = scored.slice(0, TOP);
    const rankedTop = top.map((row, index) => ({
        rank: index + 1,
        username: row.username,
        displayName: row.displayName,
        avatarColor: row.avatarColor,
        cash: row.cash,
        holdingsValue: row.holdingsValue,
        totalValue: row.totalValue,
        pl: row.pl,
        pct: row.pct,
        isCurrentUser: row.isCurrentUser,
    }));

    const meIndex = scored.findIndex(r => r.id === session.userId);
    const me = meIndex >= 0 ? scored[meIndex]! : null;
    const inTop = rankedTop.some(r => r.isCurrentUser);

    let leaderboard = rankedTop;
    if (me && !inTop) {
        leaderboard = [
            ...rankedTop,
            {
                rank: meIndex + 1,
                username: me.username,
                displayName: me.displayName,
                avatarColor: me.avatarColor,
                cash: me.cash,
                holdingsValue: me.holdingsValue,
                totalValue: me.totalValue,
                pl: me.pl,
                pct: me.pct,
                isCurrentUser: true,
            },
        ];
    }

    return NextResponse.json({ leaderboard });
}
