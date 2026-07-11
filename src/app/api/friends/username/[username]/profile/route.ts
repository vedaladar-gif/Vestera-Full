import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getProfileByUsername, getUserRelation } from '@/lib/friends';
import { canViewerSeePortfolio } from '@/lib/portfolioShare';
import { computeUserPortfolioSnapshot } from '@/lib/userPortfolioSnapshot';
import { getUserLeaderboardRank } from '@/lib/leaderboard';

type RouteCtx = { params: Promise<{ username: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
    const session = await getSession();
    if (!session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username: raw } = await ctx.params;
    const decoded = decodeURIComponent(raw || '');
    const profile = await getProfileByUsername(decoded);
    if (!profile) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const viewerId = session.userId;
    const { relation, incomingRequestId } = await getUserRelation(viewerId, profile.id);
    const isSelf = relation === 'self';
    const isFriend = relation === 'friend';

    const [snapshot, rank] = await Promise.all([
        computeUserPortfolioSnapshot(profile.id),
        getUserLeaderboardRank(profile.id),
    ]);

    const canViewPortfolio =
        isSelf || (isFriend && (await canViewerSeePortfolio(profile.id, viewerId)));

    return NextResponse.json({
        friend: profile,
        isSelf,
        relation,
        incomingRequestId,
        canViewPortfolio,
        stats: {
            rank,
            pl: snapshot.pl,
            pct: snapshot.pct,
            totalValue: snapshot.total_account_value,
            startingCash: snapshot.starting_cash,
        },
    });
}
