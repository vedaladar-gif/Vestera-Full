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

export interface NewsAnalysisData {
    item: { uuid: string; title: string; url: string; source: string; publishedAt: number; relatedTickers: string[] };
    affectedTicker: string;
    sentiment: number;
    importance: number;
    eventType: NewsEventType;
    timeRelevance: TimeRelevance;
    hoursAgo: number;
    estimatedImpact: number;
    confidence: number;
}

export interface TrajectoryPointData {
    time: string | number;
    price: number;
}

export interface HorizonWeightsData {
    technical: number;
    fundamental: number;
    news: number;
    marketCondition: number;
    sector: number;
}

export interface HorizonPredictionData {
    key: 'TODAY' | '1W' | '1M' | '3M' | '6M' | '1Y';
    label: string;
    direction: Direction;
    currentPrice: number;
    predictedPrice: number;
    predictedChangePct: number;
    confidence: number;
    compositeScore: number;
    weights: HorizonWeightsData;
    signals: { technical: number; fundamental: number; news: number; marketCondition: number; sector: number };
    trajectory: TrajectoryPointData[];
}

export interface TodayForecastData {
    direction: Direction;
    currentPrice: number;
    predictedPrice: number;
    predictedChangePct: number;
    confidence: number;
    generatedAt: number;
}

export interface PredictAIResponse {
    symbol: string;
    modelVersion: string;
    generatedAt: number;
    todayForecast: TodayForecastData;
    horizons: HorizonPredictionData[];
    news: NewsAnalysisData[];
    dataAvailability: { newsAvailable: boolean; fundamentalsAvailable: boolean; marketConditionAvailable: boolean };
    triggerReason: string;
}

export interface HistoryLogEntry {
    ts: string;
    triggerReason: string;
    note: string;
    predictedPrice: number;
    direction: Direction;
    confidence: number;
}

export interface HistoryLogResponse {
    symbol: string;
    entries: HistoryLogEntry[];
}

export interface PredictAIBacktestResponse {
    symbol: string;
    modelVersion: string;
    methodology: string;
    periodStart: string;
    periodEnd: string;
    runAt: string;
    sampleCount: number;
    accuracy: Array<{ horizon: string; sampleCount: number; directionAccuracyPct: number | null; avgAbsErrorPct: number | null }>;
}
