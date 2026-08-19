export interface QuoteData {
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
    marketStatus: 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'AFTER_HOURS';
}

export interface HorizonForecastData {
    key: string;
    label: string;
    tradingDays: number;
    direction: 'bullish' | 'bearish' | 'neutral';
    expectedReturnPct: number;
    priceLow: number;
    priceHigh: number;
    probabilityUp: number;
    confidence: number;
    keyFactors: string[];
}

export interface ScenarioSetData {
    horizonLabel: string;
    bear: { price: number; probability: number };
    base: { price: number; probability: number };
    bull: { price: number; probability: number };
}

export interface RiskBreakdownData {
    overall: string;
    overallScore: number;
    volatility: { level: string; annualizedVolatilityPct: number | null };
    drawdown: { level: string; maxDrawdownPct: number };
    valuation: { level: string; note: string };
    momentum: { level: string; rsi: number | null };
    market: { level: string; beta: number | null };
    earningsEvent: { level: string; nextEarningsDate: number | null; daysUntil: number | null };
}

export interface AnalysisResponse {
    symbol: string;
    quote: QuoteData;
    fundamentalsAvailable: boolean;
    fundamentals: {
        trailingPE: number | null;
        forwardPE: number | null;
        dividendYield: number | null;
        analystRecommendationKey: string | null;
        analystTargetMeanPrice: number | null;
        numberOfAnalystOpinions: number | null;
    };
    outlook: {
        category: string;
        compositeScore: number;
        confidence: number;
        probabilityUp: number;
        riskScore: number;
        annualizedVolatility: number | null;
    };
    shortTerm: HorizonForecastData[];
    longTerm: HorizonForecastData[];
    scenarios: ScenarioSetData;
    risk: RiskBreakdownData;
    factors: { positive: string[]; negative: string[] };
    summary: string;
    dataUpdatedAt: number;
    userContext?: { authenticated: boolean; ownsPosition?: boolean; shares?: number };
}

export interface BacktestResponse {
    symbol: string;
    methodology: string;
    periodStart: string;
    periodEnd: string;
    runAt: string;
    sampleCount: number;
    accuracy: Array<{
        horizon: string;
        sampleCount: number;
        directionAccuracyPct: number | null;
        avgAbsErrorPct: number | null;
        bullishAccuracyPct: number | null;
        bearishAccuracyPct: number | null;
    }>;
}
