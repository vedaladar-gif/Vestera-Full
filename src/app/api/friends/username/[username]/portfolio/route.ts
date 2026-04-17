import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { friendshipExists, getProfileByUsername } from '@/lib/friends';
import { canViewerSeePortfolio } from '@/lib/portfolioShare';
import { computeUserPortfolioSnapshot } from '@/lib/userPortfolioSnapshot';
import { getAssetBySymbol } from '@/lib/assetCatalog';

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
    const ownerId = profile.id;

    if (ownerId !== viewerId) {
        if (!(await friendshipExists(ownerId, viewerId))) {
            return NextResponse.json({ error: 'Not friends with this user' }, { status: 403 });
        }
        if (!(await canViewerSeePortfolio(ownerId, viewerId))) {
            return NextResponse.json({ error: 'Portfolio is not shared with you' }, { status: 403 });
        }
    }

    const snap = await computeUserPortfolioSnapshot(ownerId);
    return NextResponse.json({
        friend: profile,
        ...snap,
        holdings: snap.holdings.map(h => ({
            ...h,
            company_name: getAssetBySymbol(h.stock)?.name ?? null,
        })),
    });
}
