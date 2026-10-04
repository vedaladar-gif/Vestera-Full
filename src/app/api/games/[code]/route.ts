import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { continueGame, getGame, startGame, tradeInGame, type AssetId } from '@/lib/wallStreetGame';

type Context = { params: Promise<{ code: string }> };

export async function GET(_request: Request, context: Context) {
    const session = await getSession();
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
        const { code } = await context.params;
        return NextResponse.json(getGame(session.userId, code));
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Could not load game.' },
            { status: 404 },
        );
    }
}

export async function POST(request: Request, context: Context) {
    const session = await getSession();
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
        const { code } = await context.params;
        const body = await request.json() as {
            action?: 'start' | 'continue' | 'trade';
            id?: AssetId;
            side?: 'buy' | 'sell';
            amount?: number;
            shares?: number | 'max';
        };
        const room = code.toUpperCase();
        if (body.action === 'start') startGame(session.userId, room);
        else if (body.action === 'continue') continueGame(session.userId, room);
        else if (body.action === 'trade' && body.id && body.side) {
            const shares = body.shares === 'max' ? 'max' : Number(body.shares) > 0 ? Math.floor(Number(body.shares)) : undefined;
            tradeInGame(session.userId, room, body.id, body.side, Number(body.amount) || 0, shares);
        } else {
            return NextResponse.json({ error: 'Invalid game action.' }, { status: 400 });
        }
        return NextResponse.json(getGame(session.userId, code));
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Could not update game.' },
            { status: 400 },
        );
    }
}
