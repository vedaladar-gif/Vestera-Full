import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createGame, joinGame } from '@/lib/wallStreetGame';

export async function POST(request: Request) {
    const session = await getSession();
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json() as { action?: string; code?: string; slowMode?: boolean };
        if (body.action === 'create') {
            const code = await createGame(session.userId, Boolean(body.slowMode));
            return NextResponse.json({ code });
        }
        if (body.action === 'join' && body.code) {
            const code = await joinGame(session.userId, body.code);
            return NextResponse.json({ code });
        }
        return NextResponse.json({ error: 'Invalid game request.' }, { status: 400 });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Could not open game.' },
            { status: 400 },
        );
    }
}
