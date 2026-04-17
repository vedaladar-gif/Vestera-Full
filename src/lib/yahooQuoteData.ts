import YahooFinance from 'yahoo-finance2';
import { normalizeTradableTicker } from '@/lib/assetCatalog';
import { toYahooFinanceSymbol } from '@/lib/stocks';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yf = new (YahooFinance as any)({ suppressNotices: ['yahooSurvey'] });

export interface QuotePayload {
    sym: string;
    price: number;
    change: number;
    changePct: number;
    open: number;
    volume: number;
    high52w: number;
    marketCap: number;
}

const quoteCache = new Map<string, { data: QuotePayload; ts: number }>();
/** Align with client trade page poll (15s). */
const CACHE_TTL = 15_000;

function buildPayload(canonicalTicker: string, q: Record<string, unknown>): QuotePayload {
    return {
        sym: canonicalTicker.toUpperCase(),
        price: typeof q.regularMarketPrice === 'number' ? q.regularMarketPrice : 0,
        change: typeof q.regularMarketChange === 'number' ? q.regularMarketChange : 0,
        changePct: typeof q.regularMarketChangePercent === 'number' ? q.regularMarketChangePercent : 0,
        open: typeof q.regularMarketOpen === 'number' ? q.regularMarketOpen : 0,
        volume: typeof q.regularMarketVolume === 'number' ? q.regularMarketVolume : 0,
        high52w: typeof q.fiftyTwoWeekHigh === 'number' ? q.fiftyTwoWeekHigh : 0,
        marketCap: typeof q.marketCap === 'number' ? q.marketCap : 0,
    };
}

/**
 * Live quote for a catalog ticker; uses Yahoo symbol mapping (e.g. BRK.B → BRK-B).
 * Responses always use the canonical `sym` the app stores (uppercase).
 */
export async function getYahooQuoteForTradable(rawTicker: string): Promise<QuotePayload | null> {
    const canonical = normalizeTradableTicker(rawTicker);
    const cached = quoteCache.get(canonical);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return cached.data;
    }

    const yfSym = toYahooFinanceSymbol(canonical);
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const q: any = await yf.quote(yfSym);
        if (!q || typeof q !== 'object') return null;
        const data = buildPayload(canonical, q as Record<string, unknown>);
        if (data.price <= 0) return null;
        quoteCache.set(canonical, { data, ts: Date.now() });
        return data;
    } catch {
        return null;
    }
}

/**
 * Bounded concurrency batch quotes (search dropdown, watchlists).
 */
export async function getYahooQuotesBatch(
    tickers: string[],
    maxConcurrent = 6
): Promise<Map<string, QuotePayload | null>> {
    const out = new Map<string, QuotePayload | null>();
    const unique = [...new Set(tickers.map(t => normalizeTradableTicker(t)))];
    let cursor = 0;

    async function worker() {
        while (true) {
            const idx = cursor++;
            if (idx >= unique.length) break;
            const sym = unique[idx];
            const q = await getYahooQuoteForTradable(sym);
            out.set(sym, q);
        }
    }

    const n = Math.min(maxConcurrent, Math.max(1, unique.length));
    await Promise.all(Array.from({ length: n }, () => worker()));
    return out;
}
