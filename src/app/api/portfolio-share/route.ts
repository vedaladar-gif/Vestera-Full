import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import {
    getPortfolioShareSettings,
    replacePortfolioShareAllowedFriends,
    setPortfolioShareMode,
    type PortfolioShareMode,
} from '@/lib/portfolioShare';

export async function GET() {
    const session = await getSession();
    if (!session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getPortfolioShareSettings(session.userId);
    if (!settings) {
        return NextResponse.json(
            {
                error:
                    'Could not load portfolio sharing settings. If this is a new install, run the migration `20260415120000_portfolio_share.sql` on Supabase.',
            },
            { status: 500 }
        );
    }

    return NextResponse.json(settings);
}

export async function PUT(req: Request) {
    const session = await getSession();
    if (!session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const mode = (body as { mode?: string }).mode;
    const allowed = (body as { allowedFriendUserIds?: string[] }).allowedFriendUserIds;

    const valid: PortfolioShareMode[] = ['all_friends', 'no_one', 'selected_friends'];
    if (!mode || !valid.includes(mode as PortfolioShareMode)) {
        return NextResponse.json({ error: 'Invalid share mode' }, { status: 400 });
    }

    const userId = session.userId;

    if (mode === 'selected_friends') {
        const modeRes = await setPortfolioShareMode(userId, 'selected_friends');
        if (!modeRes.ok) {
            return NextResponse.json({ error: modeRes.error }, { status: 500 });
        }
        const rep = await replacePortfolioShareAllowedFriends(userId, Array.isArray(allowed) ? allowed : []);
        if (!rep.ok) {
            return NextResponse.json({ error: rep.error }, { status: 500 });
        }
    } else {
        const res = await setPortfolioShareMode(userId, mode as PortfolioShareMode);
        if (!res.ok) {
            return NextResponse.json({ error: res.error }, { status: 500 });
        }
    }

    const settings = await getPortfolioShareSettings(userId);
    return NextResponse.json(settings ?? { mode: 'all_friends' as const, allowedFriendUserIds: [] });
}
