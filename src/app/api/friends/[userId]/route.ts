import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { removeFriendship } from '@/lib/friends';

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const session = await getSession();
    if (!session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId: friendId } = await params;
    if (!friendId || friendId === session.userId) {
        return NextResponse.json({ error: 'Invalid friend' }, { status: 400 });
    }

    const result = await removeFriendship(session.userId, friendId);
    if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
}
