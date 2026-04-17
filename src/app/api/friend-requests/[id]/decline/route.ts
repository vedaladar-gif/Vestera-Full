import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { declineFriendRequest } from '@/lib/friends';

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const requestId = parseInt(id, 10);
    if (!Number.isFinite(requestId) || requestId <= 0) {
        return NextResponse.json({ error: 'Invalid request id' }, { status: 400 });
    }

    const result = await declineFriendRequest(requestId, session.userId);
    if (!result.ok) {
        const status = result.code === 'NOT_FOUND' ? 404 : result.code === 'FORBIDDEN' ? 403 : 400;
        return NextResponse.json({ error: result.error, code: result.code }, { status });
    }

    return NextResponse.json({ success: true });
}
