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
import { isDemo } from '@/lib/demoStore';
import { getUserById } from '@/lib/models';
import { computeUserPortfolioSnapshot } from '@/lib/userPortfolioSnapshot';

// Practice bots shown on the leaderboard during the demo/tutorial. They always
// rank below the demo user so the tutorial can show "you're #1".
const DEMO_BOTS = [
    { username: 'alpha_wolf',    displayName: 'Alpha Wolf',    avatarColor: 'purple', pct: -1.8 },
    { username: 'diamond_dana',  displayName: 'Diamond Dana',  avatarColor: 'green',  pct: -3.2 },
    { username: 'quant_kid',     displayName: 'Quant Kid',     avatarColor: 'cyan',   pct: -4.6 },
    { username: 'bull_bella',    displayName: 'Bull Bella',    avatarColor: 'orange', pct: -6.1 },
    { username: 'steady_eddie',  displayName: 'Steady Eddie',  avatarColor: 'blue',   pct: -7.9 },
    { username: 'moon_max',      displayName: 'Moon Max',      avatarColor: 'red',    pct: -9.4 },
    { username: 'vesta_bot_7',   displayName: 'VestaBot-7',    avatarColor: 'purple', pct: -12.3 },
];

export async function GET(request: Request) {
    const session = await getSession();
    if (!session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tutorialParam = new URL(request.url).searchParams.get('tutorial') === '1';

    // ── Demo/tutorial leaderboard: the current user at #1, practice bots below.
    //    Works for the demo user AND real accounts running the onboarding tutorial. ──
    if (isDemo(session.userId) || tutorialParam) {
        const snap = await computeUserPortfolioSnapshot(session.userId);
        const meTotal = snap.total_account_value || STARTING_CASH;
        const mePct = snap.pct || 0;
        const profile = isDemo(session.userId) ? null : await getUserById(session.userId);

        const me = {
            rank: 1,
            username: profile?.username ?? 'demo_trader',
            displayName: 'You',
            avatarColor: profile?.avatar_color ?? 'blue',
            cash: snap.cash,
            holdingsValue: snap.portfolio_value,
            totalValue: meTotal,
            pl: snap.pl,
            pct: mePct,
            isCurrentUser: true,
        };

        const bots = DEMO_BOTS.map((b, i) => {
            const totalValue = STARTING_CASH * (1 + b.pct / 100);
            return {
                rank: i + 2,
                username: b.username,
                displayName: b.displayName,
                avatarColor: b.avatarColor,
                cash: totalValue,
                holdingsValue: 0,
                totalValue,
                pl: totalValue - STARTING_CASH,
                pct: b.pct,
                isCurrentUser: false,
            };
        });

        return NextResponse.json({ leaderboard: [me, ...bots] });
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
