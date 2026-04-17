import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { listFriends } from '@/lib/friends';

export async function GET() {
    const session = await getSession();
    if (!session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const friends = await listFriends(session.userId);
    return NextResponse.json({ friends });
}
