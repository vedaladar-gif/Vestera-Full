import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { isTradableSymbol, normalizeTradableTicker } from '@/lib/assetCatalog';
import { addToWatchlist, getWatchlist, removeFromWatchlist } from '@/lib/aiForecast/store';

export async function GET() {
    const session = await getSession();
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ symbols: getWatchlist(session.userId) });
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const ticker = normalizeTradableTicker(typeof body.symbol === 'string' ? body.symbol : '');
    if (!ticker || !isTradableSymbol(ticker)) {
        return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 });
    }

    addToWatchlist(session.userId, ticker);
    return NextResponse.json({ success: true, symbols: getWatchlist(session.userId) });
}

export async function DELETE(request: Request) {
    const session = await getSession();
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const ticker = normalizeTradableTicker(searchParams.get('symbol') || '');
    if (!ticker || !isTradableSymbol(ticker)) {
        return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 });
    }

    removeFromWatchlist(session.userId, ticker);
    return NextResponse.json({ success: true, symbols: getWatchlist(session.userId) });
}
