/**
 * Yahoo Finance-backed implementation of the market-data provider contract.
 * Server-side only — never imported from client components.
 */
import YahooFinance from 'yahoo-finance2';
import { toYahooFinanceSymbol } from '@/lib/stocks';
import type { StockQuote, StockFundamentals, MarketStatus, MarketNews } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yf = new (YahooFinance as any)({ suppressNotices: ['yahooSurvey'] });

function num(v: unknown): number | null {
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function marketStatusFromState(state: unknown): MarketStatus {
    const s = typeof state === 'string' ? state.toUpperCase() : '';
    if (s.includes('PRE')) return 'PRE_MARKET';
    if (s.includes('POST')) return 'AFTER_HOURS';
    if (s === 'REGULAR') return 'OPEN';
    return 'CLOSED';
}

export async function fetchYahooQuote(symbol: string): Promise<StockQuote | null> {
    const yfSymbol = toYahooFinanceSymbol(symbol);
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const q: any = await yf.quote(yfSymbol);
        if (!q || typeof q !== 'object') return null;
        const price = num(q.regularMarketPrice);
        if (price === null || price <= 0) return null;

        return {
            symbol: symbol.toUpperCase(),
            name: q.longName || q.shortName || symbol.toUpperCase(),
            price,
            previousClose: num(q.regularMarketPreviousClose) ?? price,
            change: num(q.regularMarketChange) ?? 0,
            changePct: num(q.regularMarketChangePercent) ?? 0,
            open: num(q.regularMarketOpen) ?? price,
            dayHigh: num(q.regularMarketDayHigh) ?? price,
            dayLow: num(q.regularMarketDayLow) ?? price,
            volume: num(q.regularMarketVolume) ?? 0,
            avgVolume3m: num(q.averageDailyVolume3Month),
            marketCap: num(q.marketCap),
            fiftyTwoWeekLow: num(q.fiftyTwoWeekLow) ?? price,
            fiftyTwoWeekHigh: num(q.fiftyTwoWeekHigh) ?? price,
            fiftyDayAverage: num(q.fiftyDayAverage),
            twoHundredDayAverage: num(q.twoHundredDayAverage),
            marketStatus: marketStatusFromState(q.marketState),
            preMarketPrice: num(q.preMarketPrice),
            postMarketPrice: num(q.postMarketPrice),
            currency: typeof q.currency === 'string' ? q.currency : 'USD',
            fetchedAt: Math.floor(Date.now() / 1000),
        };
    } catch (e) {
        console.error(`[marketData/yahoo] quote failed for ${yfSymbol}:`, e);
        return null;
    }
}

const EMPTY_FUNDAMENTALS = (symbol: string): StockFundamentals => ({
    symbol: symbol.toUpperCase(),
    available: false,
    trailingPE: null,
    forwardPE: null,
    priceToBook: null,
    priceToSales: null,
    pegRatio: null,
    dividendYield: null,
    beta: null,
    earningsGrowth: null,
    revenueGrowth: null,
    profitMargins: null,
    returnOnEquity: null,
    debtToEquity: null,
    freeCashflow: null,
    epsTrailingTwelveMonths: null,
    epsForward: null,
    analystRecommendationMean: null,
    analystRecommendationKey: null,
    analystTargetMeanPrice: null,
    numberOfAnalystOpinions: null,
    nextEarningsDate: null,
    sharesOutstanding: null,
});

/** Best-effort fundamentals — ETFs/crypto legitimately have no company financials, so we mark `available: false` rather than fabricate numbers. */
export async function fetchYahooFundamentals(symbol: string): Promise<StockFundamentals> {
    const yfSymbol = toYahooFinanceSymbol(symbol);
    const out = EMPTY_FUNDAMENTALS(symbol);

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const qs: any = await yf.quoteSummary(yfSymbol, {
            modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail', 'calendarEvents'],
        });
        const fd = qs?.financialData ?? {};
        const ks = qs?.defaultKeyStatistics ?? {};
        const sd = qs?.summaryDetail ?? {};

        out.available = Object.keys(fd).length > 0 || Object.keys(ks).length > 0;
        out.trailingPE = num(sd.trailingPE) ?? num(ks.trailingPE);
        out.forwardPE = num(ks.forwardPE) ?? num(sd.forwardPE);
        out.priceToBook = num(ks.priceToBook);
        out.pegRatio = num(ks.pegRatio);
        out.dividendYield = num(sd.dividendYield);
        out.beta = num(ks.beta) ?? num(sd.beta);
        out.earningsGrowth = num(fd.earningsGrowth);
        out.revenueGrowth = num(fd.revenueGrowth);
        out.profitMargins = num(fd.profitMargins) ?? num(ks.profitMargins);
        out.returnOnEquity = num(fd.returnOnEquity);
        out.debtToEquity = num(fd.debtToEquity);
        out.freeCashflow = num(fd.freeCashflow);
        out.epsTrailingTwelveMonths = num(ks.trailingEps);
        out.epsForward = num(ks.forwardEps);
        out.analystRecommendationMean = num(fd.recommendationMean);
        out.analystRecommendationKey = typeof fd.recommendationKey === 'string' ? fd.recommendationKey : null;
        out.analystTargetMeanPrice = num(fd.targetMeanPrice);
        out.numberOfAnalystOpinions = num(fd.numberOfAnalystOpinions);
        out.sharesOutstanding = num(ks.sharesOutstanding);

        const revenue = num(fd.totalRevenue);
        const mc = num((await yf.quote(yfSymbol).catch(() => null))?.marketCap);
        if (mc && revenue && revenue > 0) out.priceToSales = mc / revenue;

        const earningsDates = qs?.calendarEvents?.earnings?.earningsDate;
        if (Array.isArray(earningsDates) && earningsDates.length > 0) {
            const d = earningsDates[0];
            const t = d instanceof Date ? d.getTime() : new Date(d).getTime();
            if (Number.isFinite(t)) out.nextEarningsDate = Math.floor(t / 1000);
        }
    } catch (e) {
        console.warn(`[marketData/yahoo] fundamentals unavailable for ${yfSymbol} (likely an ETF/index/crypto):`, e instanceof Error ? e.message : e);
        return EMPTY_FUNDAMENTALS(symbol); // available stays false — never fabricated
    }

    return out;
}

/**
 * Real recent news headlines for a symbol via Yahoo Finance's search endpoint
 * (title, publisher, publish time, related tickers — no article body). Used
 * by Vestera Predict AI's news-analysis component. Never fabricated: returns
 * `available: false` with an empty list if the provider call fails.
 */
export async function fetchYahooNews(symbol: string, count = 15): Promise<MarketNews> {
    const yfSymbol = toYahooFinanceSymbol(symbol);
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = await yf.search(yfSymbol, { newsCount: count, quotesCount: 0 });
        const news = Array.isArray(result?.news) ? result.news : [];
        return {
            available: true,
            items: news
                .filter((n: { title?: unknown; providerPublishTime?: unknown }) => typeof n.title === 'string' && n.providerPublishTime)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((n: any) => ({
                    title: n.title as string,
                    url: typeof n.link === 'string' ? n.link : '',
                    publishedAt: Math.floor(new Date(n.providerPublishTime).getTime() / 1000),
                    source: typeof n.publisher === 'string' ? n.publisher : 'Unknown',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    relatedTickers: Array.isArray(n.relatedTickers) ? (n.relatedTickers as string[]) : ([] as string[]),
                    uuid: typeof n.uuid === 'string' ? n.uuid : `${n.link}`,
                })),
        };
    } catch (e) {
        console.warn(`[marketData/yahoo] news unavailable for ${yfSymbol}:`, e instanceof Error ? e.message : e);
        return { available: false, items: [] };
    }
}
