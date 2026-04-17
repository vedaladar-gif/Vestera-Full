import { NextResponse } from 'next/server';
import { isTradableSymbol, normalizeTradableTicker } from '@/lib/assetCatalog';
import { getYahooQuotesBatch, type QuotePayload } from '@/lib/yahooQuoteData';

const MAX_SYMBOLS = 32;

export async function POST(request: Request) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const symbols =
        body &&
        typeof body === 'object' &&
        Array.isArray((body as { symbols?: unknown }).symbols)
            ? (body as { symbols: unknown[] }).symbols
            : null;

    if (!symbols) {
        return NextResponse.json({ error: 'Expected { symbols: string[] }' }, { status: 400 });
    }

    const cleaned: string[] = [];
    for (const s of symbols) {
        if (typeof s !== 'string' || cleaned.length >= MAX_SYMBOLS) break;
        const t = normalizeTradableTicker(s);
        if (isTradableSymbol(t)) cleaned.push(t);
    }

    if (cleaned.length === 0) {
        return NextResponse.json({ quotes: {} });
    }

    const map = await getYahooQuotesBatch(cleaned, 6);
    const quotes: Record<string, QuotePayload | null> = {};
    for (const sym of cleaned) {
        quotes[sym] = map.get(sym) ?? null;
    }

    return NextResponse.json({ quotes });
}
