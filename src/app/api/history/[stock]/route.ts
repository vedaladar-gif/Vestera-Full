import { NextResponse } from 'next/server';
import { isTradableSymbol, normalizeTradableTicker } from '@/lib/assetCatalog';
import { getHistorical, getIntradaySession } from '@/lib/stocks';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ stock: string }> }
) {
    const { stock } = await params;
    const ticker = normalizeTradableTicker(stock);
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') || '').toLowerCase();

    if (!isTradableSymbol(ticker)) {
        return NextResponse.json({ error: 'Invalid stock' }, { status: 400 });
    }

    if (range === '1d') {
        const history = await getIntradaySession(ticker);
        return NextResponse.json({ stock: ticker, history, range: '1d' });
    }

    const days = Math.min(parseInt(searchParams.get('days') || '30', 10), 365);
    const data = await getHistorical(ticker, days);
    return NextResponse.json({ stock: ticker, history: data });
}
