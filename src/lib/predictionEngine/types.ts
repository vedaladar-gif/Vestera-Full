export type Direction = 'bullish' | 'bearish' | 'neutral';

export type OutlookCategory = 'Strong Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Strong Bearish';

export type RiskLevel = 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High';

export interface HorizonForecast {
    key: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '3Y';
    label: string;
    tradingDays: number;
    direction: Direction;
    expectedReturnPct: number;
    priceLow: number;
    priceHigh: number;
    probabilityUp: number;
    confidence: number;
    keyFactors: string[];
}

export interface ScenarioSet {
    horizonLabel: string;
    bear: { price: number; probability: number };
    base: { price: number; probability: number };
    bull: { price: number; probability: number };
}

export interface RiskBreakdown {
    overall: RiskLevel;
    overallScore: number; // 0-100, higher = riskier
    volatility: { level: RiskLevel; annualizedVolatilityPct: number | null };
    drawdown: { level: RiskLevel; maxDrawdownPct: number };
    valuation: { level: RiskLevel | 'N/A'; note: string };
    momentum: { level: RiskLevel; rsi: number | null };
    market: { level: RiskLevel; beta: number | null };
    earningsEvent: { level: RiskLevel | 'Unknown'; nextEarningsDate: number | null; daysUntil: number | null };
}

export interface FactorExplanation {
    positive: string[];
    negative: string[];
}

export interface ModelPipelineOutput {
    /** Composite score, -100 (strong bearish) .. +100 (strong bullish). */
    compositeScore: number;
    category: OutlookCategory;
    confidence: number; // 0-1
    probabilityUp: number; // 0-1, primary (1-month) horizon
    expectedReturn1m: number;
    riskScore: number; // 0-100
    annualizedVolatility: number | null;
    signals: Record<string, number>; // named signal -> [-1, 1] contribution, for transparency/debugging
}
