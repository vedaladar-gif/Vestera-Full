import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { searchUsersByUsername } from '@/lib/friends';

export async function GET(request: Request) {
    const session = await getSession();
    if (!session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '15', 10), 25);

    if (q.length < 1) {
        return NextResponse.json({ results: [] });
    }

    const results = await searchUsersByUsername(session.userId, q, limit);
    return NextResponse.json({
        results: results.map(r => ({
            id: r.id,
            username: r.username,
            displayName: r.display_name,
            avatarColor: r.avatar_color,
            relation: r.relation,
            incomingRequestId: r.incomingRequestId,
        })),
    });
}
