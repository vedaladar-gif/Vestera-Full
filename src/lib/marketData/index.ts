/**
 * Market-data provider abstraction for the AI Forecast ("Vesterast") feature.
 *
 * The prediction engine and UI call ONLY the functions exported from this
 * file — never a vendor SDK directly. That keeps the data source swappable.
 *
 * Why Yahoo Finance and not Robinhood:
 * Robinhood does not publish a public, ToS-compliant market-data API for
 * third-party applications. The endpoints its own apps use are unofficial,
 * require a signed-in brokerage session, and using them from a third-party
 * app would violate Robinhood's Terms of Service and could put a user's
 * brokerage account at risk — Vestera will never ask a user for their
 * Robinhood credentials. Per the "if direct access is unavailable, use a
 * clean provider abstraction with a legitimate substitute" requirement,
 * Vestera uses Yahoo Finance (already used elsewhere in this app for quotes
 * and charts) as the active provider below. To swap providers later, add a
 * new `xyzProvider.ts` implementing the same shapes and change the imports
 * in this file only — the engine/UI never need to change.
 */
import { fetchYahooFundamentals, fetchYahooQuote, fetchYahooNews } from './yahooProvider';
import { getHistorical as fetchYahooHistorical, getIntradaySession as fetchYahooIntraday } from '@/lib/stocks';
import type { StockQuote, StockFundamentals, HistoricalBar, MarketNews } from './types';

export type { StockQuote, StockFundamentals, HistoricalBar, MarketNews, MarketStatus } from './types';

const QUOTE_TTL_MS = 30_000;
const FUNDAMENTALS_TTL_MS = 6 * 60 * 60 * 1000; // fundamentals change slowly — cache 6h
const HISTORY_TTL_MS = 5 * 60 * 1000;
const NEWS_TTL_MS = 3 * 60 * 1000; // news moves fast — short cache so Predict AI can react quickly

const quoteCache = new Map<string, { data: StockQuote; ts: number }>();
const fundamentalsCache = new Map<string, { data: StockFundamentals; ts: number }>();
const historyCache = new Map<string, { data: HistoricalBar[]; ts: number }>();
const newsCache = new Map<string, { data: MarketNews; ts: number }>();

/** Current quote/snapshot for a ticker. Returns null (never fake data) if the provider can't be reached. */
export async function getStockData(symbol: string): Promise<StockQuote | null> {
    const key = symbol.toUpperCase();
    const cached = quoteCache.get(key);
    if (cached && Date.now() - cached.ts < QUOTE_TTL_MS) return cached.data;

    const data = await fetchYahooQuote(key);
    if (data) quoteCache.set(key, { data, ts: Date.now() });
    return data;
}

/** Daily bars for the requested lookback window (supports up to ~5 years for long-range charts/backtesting). */
export async function getHistoricalData(symbol: string, days: number): Promise<HistoricalBar[]> {
    const key = `${symbol.toUpperCase()}:${days}`;
    const cached = historyCache.get(key);
    if (cached && Date.now() - cached.ts < HISTORY_TTL_MS) return cached.data;

    const data = await fetchYahooHistorical(symbol, days);
    if (data.length > 0) historyCache.set(key, { data, ts: Date.now() });
    return data;
}

/** Intraday 5-minute bars for the latest completed/active session (used for the 1D chart range). */
export async function getIntradayData(symbol: string): Promise<HistoricalBar[]> {
    return fetchYahooIntraday(symbol);
}

/** Company fundamentals. `available: false` (not fake numbers) when the provider has none for this symbol. */
export async function getFundamentals(symbol: string): Promise<StockFundamentals> {
    const key = symbol.toUpperCase();
    const cached = fundamentalsCache.get(key);
    if (cached && Date.now() - cached.ts < FUNDAMENTALS_TTL_MS) return cached.data;

    const data = await fetchYahooFundamentals(key);
    fundamentalsCache.set(key, { data, ts: Date.now() });
    return data;
}

/**
 * Real recent news headlines for a symbol (title/publisher/publish time/related
 * tickers) via Yahoo Finance. Honestly reports `available: false` (never fake
 * headlines) if the provider call fails. Used by Vestera Predict AI's news
 * analysis component — the original AI Forecast model does not use this.
 */
export async function getMarketNews(symbol: string): Promise<MarketNews> {
    const key = symbol.toUpperCase();
    const cached = newsCache.get(key);
    if (cached && Date.now() - cached.ts < NEWS_TTL_MS) return cached.data;

    const data = await fetchYahooNews(key);
    newsCache.set(key, { data, ts: Date.now() });
    return data;
}
