import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { STOCKS } from '@/lib/stocks';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yf = new (YahooFinance as any)();

interface QuoteData {
    sym: string;
    price: number;
    change: number;
    changePct: number;
    open: number;
    volume: number;
    high52w: number;
    marketCap: number;
}

const quoteCache = new Map<string, { data: QuoteData; ts: number }>();
/** Align with client trade page poll (15s) so header, chart, and trade panel stay in sync. */
const CACHE_TTL = 15_000;

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ stock: string }> }
) {
    const { stock } = await params;
    const ticker = stock.toUpperCase();

    if (!STOCKS.includes(ticker)) {
        return NextResponse.json({ error: 'Invalid stock' }, { status: 400 });
    }

    const cached = quoteCache.get(ticker);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return NextResponse.json(cached.data);
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const q: any = await yf.quote(ticker);
        const data: QuoteData = {
            sym: ticker,
            price: q.regularMarketPrice ?? 0,
            change: q.regularMarketChange ?? 0,
            changePct: q.regularMarketChangePercent ?? 0,
            open: q.regularMarketOpen ?? 0,
            volume: q.regularMarketVolume ?? 0,
            high52w: q.fiftyTwoWeekHigh ?? 0,
            marketCap: q.marketCap ?? 0,
        };
        quoteCache.set(ticker, { data, ts: Date.now() });
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}
