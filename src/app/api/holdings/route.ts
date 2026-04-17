import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { computeUserPortfolioSnapshot } from '@/lib/userPortfolioSnapshot';

export async function GET() {
    const session = await getSession();
    if (!session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snap = await computeUserPortfolioSnapshot(session.userId);
    return NextResponse.json(snap);
}
