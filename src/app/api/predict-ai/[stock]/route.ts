import { NextResponse } from 'next/server';
import { isTradableSymbol, normalizeTradableTicker } from '@/lib/assetCatalog';
import { runPredictAI } from '@/lib/predictAI/analyze';

/** Short in-memory cache — the underlying quote/history/news calls are already cached with their own TTLs. */
const CACHE_TTL_MS = 60 * 1000;
const cache = new Map<string, { ts: number; payload: unknown }>();

export async function GET(request: Request, { params }: { params: Promise<{ stock: string }> }) {
    const { stock } = await params;
    const ticker = normalizeTradableTicker(stock);
    if (!ticker || !isTradableSymbol(ticker)) {
        return NextResponse.json({ error: 'Unknown or unsupported ticker.' }, { status: 400 });
    }

    const cached = cache.get(ticker);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        return NextResponse.json(cached.payload);
    }

    let result;
    try {
        result = await runPredictAI(ticker);
    } catch (e) {
        console.error(`[predict-ai] analysis failed for ${ticker}:`, e);
        return NextResponse.json({ error: 'Unable to retrieve current market data. Please try again.' }, { status: 502 });
    }

    if (!result.ok) {
        if (result.reason === 'no-market-data') {
            return NextResponse.json({ error: 'Unable to retrieve current market data. Please try again.' }, { status: 502 });
        }
        return NextResponse.json(
            { error: 'Insufficient data to generate a reliable forecast.', reason: 'This symbol does not have enough historical price history for Vestera Predict AI to analyze.' },
            { status: 422 }
        );
    }

    cache.set(ticker, { ts: Date.now(), payload: result.data });
    return NextResponse.json(result.data);
}
