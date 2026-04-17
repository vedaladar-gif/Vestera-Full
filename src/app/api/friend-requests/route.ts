import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { listIncomingRequests, sendFriendRequest } from '@/lib/friends';

export async function GET() {
    const session = await getSession();
    if (!session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const incoming = await listIncomingRequests(session.userId);
    return NextResponse.json({
        incoming: incoming.map(r => ({
            id: r.id,
            createdAt: r.created_at,
            sender: {
                id: r.sender.id,
                username: r.sender.username,
                displayName: r.sender.display_name,
                avatarColor: r.sender.avatar_color,
            },
        })),
    });
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const o = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    const username = typeof o.username === 'string' ? o.username : '';
    const recipientUserId = typeof o.recipientUserId === 'string' ? o.recipientUserId.trim() : '';

    if (!username.trim() && !recipientUserId) {
        return NextResponse.json({ error: 'Provide username or recipientUserId', code: 'INVALID' }, { status: 400 });
    }

    const result = await sendFriendRequest(session.userId, {
        username: username.trim() || undefined,
        recipientUserId: recipientUserId || undefined,
    });
    if (!result.ok) {
        const status =
            result.code === 'NOT_FOUND'
                ? 404
                : result.code === 'SELF' || result.code === 'ALREADY_FRIENDS' || result.code === 'DUPLICATE'
                  ? 409
                  : result.code === 'INCOMING_EXISTS'
                    ? 409
                    : 400;
        return NextResponse.json({ error: result.error, code: result.code }, { status });
    }

    return NextResponse.json({
        success: true,
        requestId: result.requestId,
        state: result.state,
    });
}
