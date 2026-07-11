import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { buildScoredLeaderboard } from '@/lib/leaderboard';

export async function GET() {
    const session = await getSession();
    if (!session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scored = await buildScoredLeaderboard();
    if (scored.length === 0) {
        return NextResponse.json({ leaderboard: [] });
    }

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
        isCurrentUser: row.id === session.userId,
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
