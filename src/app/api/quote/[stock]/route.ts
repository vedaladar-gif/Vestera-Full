import { NextResponse } from 'next/server';
import { isTradableSymbol, normalizeTradableTicker } from '@/lib/assetCatalog';
import { getYahooQuoteForTradable } from '@/lib/yahooQuoteData';

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ stock: string }> }
) {
    const { stock } = await params;
    const ticker = normalizeTradableTicker(stock);

    if (!isTradableSymbol(ticker)) {
        return NextResponse.json({ error: 'Invalid stock' }, { status: 400 });
    }

    const data = await getYahooQuoteForTradable(ticker);
    if (!data) {
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }

    return NextResponse.json(data);
}
