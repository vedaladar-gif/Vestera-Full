import { NextResponse } from 'next/server';
import { isTradableSymbol, normalizeTradableTicker } from '@/lib/assetCatalog';
import { getCurrentPrice } from '@/lib/stocks';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ stock: string }> }
) {
    const { stock } = await params;
    const ticker = normalizeTradableTicker(stock);

    if (!isTradableSymbol(ticker)) {
        return NextResponse.json({ error: 'Invalid stock' }, { status: 400 });
    }

    const price = await getCurrentPrice(ticker);
    return NextResponse.json({ stock: ticker, price });
}
