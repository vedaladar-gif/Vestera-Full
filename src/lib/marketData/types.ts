/**
 * Market-data provider contract for the AI Forecast ("Vesterast") feature.
 *
 * The prediction engine and UI are built against these types only — never
 * against a specific vendor SDK. See `index.ts` for why Yahoo Finance is the
 * active provider and how another provider could be substituted later.
 */

export type MarketStatus = 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'AFTER_HOURS';

export interface StockQuote {
    symbol: string;
    name: string;
    price: number;
    previousClose: number;
    change: number;
    changePct: number;
    open: number;
    dayHigh: number;
    dayLow: number;
    volume: number;
    avgVolume3m: number | null;
    marketCap: number | null;
    fiftyTwoWeekLow: number;
    fiftyTwoWeekHigh: number;
    fiftyDayAverage: number | null;
    twoHundredDayAverage: number | null;
    marketStatus: MarketStatus;
    preMarketPrice: number | null;
    postMarketPrice: number | null;
    currency: string;
    /** Unix seconds — when this quote was actually retrieved from the provider. */
    fetchedAt: number;
}

export interface StockFundamentals {
    symbol: string;
    /** False when the provider has no fundamentals for this symbol (e.g. index ETFs/crypto) — never fabricated. */
    available: boolean;
    trailingPE: number | null;
    forwardPE: number | null;
    priceToBook: number | null;
    priceToSales: number | null;
    pegRatio: number | null;
    dividendYield: number | null;
    beta: number | null;
    earningsGrowth: number | null;
    revenueGrowth: number | null;
    profitMargins: number | null;
    returnOnEquity: number | null;
    debtToEquity: number | null;
    freeCashflow: number | null;
    epsTrailingTwelveMonths: number | null;
    epsForward: number | null;
    /** Yahoo analyst consensus: 1 = Strong Buy ... 5 = Strong Sell. */
    analystRecommendationMean: number | null;
    analystRecommendationKey: string | null;
    analystTargetMeanPrice: number | null;
    numberOfAnalystOpinions: number | null;
    /** Unix seconds for the next scheduled earnings report, if known. */
    nextEarningsDate: number | null;
    sharesOutstanding: number | null;
}

export interface HistoricalBar {
    date: string;
    timeUtc?: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface MarketNews {
    available: boolean;
    items: Array<{
        title: string;
        url: string;
        publishedAt: number;
        source: string;
        relatedTickers?: string[];
        uuid?: string;
    }>;
}
