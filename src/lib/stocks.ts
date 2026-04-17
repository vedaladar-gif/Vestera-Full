import YahooFinance from 'yahoo-finance2';
import { TRADABLE_SYMBOL_LIST, normalizeTradableTicker } from '@/lib/assetCatalog';

const yahooFinance = new YahooFinance();

/** @deprecated Use `isTradableSymbol` from `@/lib/assetCatalog` — kept for legacy imports. */
export const STOCKS = TRADABLE_SYMBOL_LIST as unknown as string[];

/** Yahoo Finance uses hyphens for share classes (e.g. BRK-B); catalog may use dots (BRK.B). */
export function toYahooFinanceSymbol(symbol: string): string {
    const base = normalizeSymbol(symbol.trim());
    const u = base.toUpperCase();
    if (u.includes('.')) return u.replace(/\./g, '-');
    return u;
}

// Human-friendly aliases for crypto
export function normalizeSymbol(symbol: string): string {
    return normalizeTradableTicker(symbol);
}

export { displaySymbol } from '@/lib/symbolDisplay';

// In-memory price cache
const CACHE: Map<string, { ts: number; price: number }> = new Map();
const CACHE_TTL = 60; // 60 seconds

export async function getCurrentPrice(symbol: string): Promise<number> {
    const yfSymbol = toYahooFinanceSymbol(symbol);

    // Check cache
    const cached = CACHE.get(yfSymbol);
    if (cached && (Date.now() / 1000 - cached.ts) < CACHE_TTL) {
        return cached.price;
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const quote: any = await yahooFinance.quote(yfSymbol);
        const price =
            quote.regularMarketPrice ??
            quote.bid ??
            quote.ask ??
            100.0;

        CACHE.set(yfSymbol, { ts: Date.now() / 1000, price });
        return price;
    } catch (e) {
        console.error(`Error fetching price for ${yfSymbol}:`, e);
        return 100.0; // Fallback
    }
}

export interface HistoricalBar {
    /** YYYY-MM-DD for daily bars; ISO datetime string for intraday. */
    date: string;
    /** Unix seconds (UTC) — required for intraday / 1D charts in lightweight-charts. */
    timeUtc?: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

function sessionTimezoneForYahooSymbol(yfSymbol: string): string {
    const u = yfSymbol.toUpperCase();
    if (u.startsWith('BTC') || u.startsWith('ETH')) return 'UTC';
    return 'America/New_York';
}

/**
 * Latest trading session as 5m bars: today if the market produced intraday data, otherwise
 * the most recent calendar day in the window that has bars (completed session when closed).
 */
export async function getIntradaySession(symbol: string): Promise<HistoricalBar[]> {
    const yfSymbol = toYahooFinanceSymbol(symbol);
    const tz = sessionTimezoneForYahooSymbol(yfSymbol);

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 12);

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = await yahooFinance.chart(yfSymbol, {
            period1: start,
            period2: end,
            interval: '5m',
        });

        if (!result.quotes || result.quotes.length === 0) {
            return [];
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const quotes: any[] = result.quotes.filter((q: any) => q && (q.close ?? 0) > 0);
        if (quotes.length === 0) return [];

        const dayKey = (d: Date) =>
            d.toLocaleDateString('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });

        const groups = new Map<string, typeof quotes>();
        for (const q of quotes) {
            const t = q.date ? new Date(q.date) : null;
            if (!t || Number.isNaN(t.getTime())) continue;
            const k = dayKey(t);
            if (!groups.has(k)) groups.set(k, []);
            groups.get(k)!.push(q);
        }

        const sortedDays = [...groups.keys()].sort();
        const targetDay = sortedDays[sortedDays.length - 1];
        const dayBars = groups.get(targetDay) ?? [];

        return dayBars
            .map((q: any) => {
                const t = q.date ? new Date(q.date) : new Date();
                const iso = t.toISOString();
                return {
                    date: iso,
                    timeUtc: Math.floor(t.getTime() / 1000),
                    open: q.open ?? q.close ?? 0,
                    high: q.high ?? q.close ?? 0,
                    low: q.low ?? q.close ?? 0,
                    close: q.close ?? 0,
                    volume: q.volume ?? 0,
                } as HistoricalBar;
            })
            .filter((b: HistoricalBar) => b.close > 0)
            .sort((a, b) => (a.timeUtc ?? 0) - (b.timeUtc ?? 0));
    } catch (e) {
        console.error(`Error fetching intraday for ${yfSymbol}:`, e);
        return [];
    }
}

export async function getHistorical(symbol: string, days = 30): Promise<HistoricalBar[]> {
    const yfSymbol = toYahooFinanceSymbol(symbol);

    try {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days - 10);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = await yahooFinance.chart(yfSymbol, {
            period1: start,
            period2: end,
            interval: '1d',
        });

        if (!result.quotes || result.quotes.length === 0) {
            return [];
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return result.quotes.slice(-days).map((q: any) => ({
            date: q.date ? new Date(q.date).toISOString().split('T')[0] : '',
            open: q.open ?? q.close ?? 0,
            high: q.high ?? q.close ?? 0,
            low: q.low ?? q.close ?? 0,
            close: q.close ?? 0,
            volume: q.volume ?? 0,
        })).filter((b: HistoricalBar) => b.close > 0);
    } catch (e) {
        console.error(`Error fetching historical for ${yfSymbol}:`, e);
        return [];
    }
}


export const STARTING_CASH = 100000.0;

