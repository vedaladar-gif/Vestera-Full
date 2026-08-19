/**
 * Vestera Predict AI — a second, independent prediction engine, additive to
 * the original AI Forecast model (`src/lib/predictionEngine/`). It never
 * imports from or mutates that engine's state; the two run side by side.
 *
 * Design note (same honesty standard as the original engine): this is a
 * transparent, modular quantitative pipeline — market/technical/fundamental
 * signals blended with a structured, keyword-and-recency-driven news/sentiment
 * analyzer — not a black-box LLM guess and not a trained neural net (a real
 * trained model can't be responsibly fabricated inside a live request/response
 * web app without an offline training pipeline + model registry). Every
 * number is computed from real data passed in; nothing is hardcoded per
 * symbol. See `combine.ts` for how horizon-specific weights are chosen.
 */

export const PREDICT_AI_MODEL_VERSION = 'v1.0';

export type Direction = 'UP' | 'DOWN' | 'NEUTRAL';

export type NewsEventType =
    | 'EARNINGS'
    | 'GUIDANCE'
    | 'ANALYST_UPGRADE'
    | 'ANALYST_DOWNGRADE'
    | 'LEADERSHIP'
    | 'MERGER_ACQUISITION'
    | 'PRODUCT'
    | 'LEGAL_REGULATORY'
    | 'SEC_FILING'
    | 'MACRO'
    | 'MARKET_WIDE'
    | 'GENERAL';

export type TimeRelevance = 'BREAKING' | 'RECENT' | 'STALE';

export interface NewsItem {
    uuid: string;
    title: string;
    url: string;
    source: string;
    publishedAt: number; // unix seconds
    relatedTickers: string[];
}

/** Structured output of the news-analysis component for a single article — never a bare LLM "good/bad" verdict. */
export interface NewsAnalysis {
    item: NewsItem;
    affectedTicker: string;
    sentiment: number; // -1 .. 1
    importance: number; // 0 .. 1
    eventType: NewsEventType;
    timeRelevance: TimeRelevance;
    hoursAgo: number;
    /** sentiment * importance * recency decay for the horizon being evaluated — the actual per-article contribution. */
    estimatedImpact: number;
    confidence: number; // 0 .. 1, how confidently the keyword engine classified this article
}

export type PredictAIHorizonKey = 'TODAY' | '1W' | '1M' | '3M' | '6M' | '1Y';

export interface HorizonWeights {
    technical: number;
    fundamental: number;
    news: number;
    marketCondition: number;
    sector: number;
}

export interface SignalBreakdown {
    technical: number; // -1..1
    fundamental: number; // -1..1
    news: number; // -1..1
    marketCondition: number; // -1..1
    sector: number; // -1..1
}

export interface TrajectoryPoint {
    /** ISO date (daily horizons) or unix seconds (intraday "Today" path). */
    time: string | number;
    price: number;
}

export interface HorizonPrediction {
    key: PredictAIHorizonKey;
    label: string;
    direction: Direction;
    currentPrice: number;
    predictedPrice: number;
    predictedChangePct: number;
    confidence: number; // 0..100
    compositeScore: number; // -100..100
    weights: HorizonWeights;
    signals: SignalBreakdown;
    trajectory: TrajectoryPoint[];
}

export interface TodayForecast {
    direction: Direction;
    currentPrice: number;
    predictedPrice: number;
    predictedChangePct: number;
    confidence: number; // 0..100
    generatedAt: number;
}

export interface PredictionHistoryEntry {
    ts: string;
    triggerReason: string;
    note: string;
    predictedPrice: number;
    direction: Direction;
    confidence: number;
}

export interface PredictAIOutput {
    symbol: string;
    modelVersion: string;
    generatedAt: number;
    todayForecast: TodayForecast;
    horizons: HorizonPrediction[];
    news: NewsAnalysis[];
    dataAvailability: {
        newsAvailable: boolean;
        fundamentalsAvailable: boolean;
        marketConditionAvailable: boolean;
    };
    triggerReason: string;
}
