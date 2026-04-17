import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { friendshipExists, getProfileByUsername } from '@/lib/friends';
import { canViewerSeePortfolio } from '@/lib/portfolioShare';

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
    if (profile.id === viewerId) {
        return NextResponse.json({
            friend: profile,
            isSelf: true,
            canViewPortfolio: true,
        });
    }

    if (!(await friendshipExists(profile.id, viewerId))) {
        return NextResponse.json({ error: 'Not friends with this user' }, { status: 403 });
    }

    const canViewPortfolio = await canViewerSeePortfolio(profile.id, viewerId);
    return NextResponse.json({
        friend: profile,
        isSelf: false,
        canViewPortfolio,
    });
}
