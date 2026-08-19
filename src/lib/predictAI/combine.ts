/**
 * Combines the independent signal components (technical, fundamental, news,
 * market condition, sector) into a single composite score per prediction
 * horizon, using horizon-specific weights (spec requirement: "For intraday
 * predictions, prioritize real-time price movement, volume, market
 * conditions, and breaking news. For longer-term predictions, increase the
 * importance of fundamentals, earnings growth, valuation, industry trends,
 * and long-term news.").
 */
import { clamp } from '@/lib/predictionEngine/indicators';
import { buildDailyTrajectory, buildTodayTrajectory } from './trajectory';
import type {
    Direction,
    HorizonPrediction,
    HorizonWeights,
    PredictAIHorizonKey,
    SignalBreakdown,
    TrajectoryPoint,
} from './types';

export interface HorizonDef {
    key: PredictAIHorizonKey;
    label: string;
    tradingDays: number; // trading days ahead the trajectory should extend
}

export const PREDICT_AI_HORIZONS: HorizonDef[] = [
    { key: 'TODAY', label: 'Today', tradingDays: 1 },
    { key: '1W', label: '1 Week', tradingDays: 5 },
    { key: '1M', label: '1 Month', tradingDays: 21 },
    { key: '3M', label: '3 Months', tradingDays: 63 },
    { key: '6M', label: '6 Months', tradingDays: 126 },
    { key: '1Y', label: '1 Year', tradingDays: 252 },
];

// Sum to 1.0 for every horizon. Weight shifts from technical/news (short horizons) to fundamentals (long horizons).
export const HORIZON_WEIGHTS: Record<PredictAIHorizonKey, HorizonWeights> = {
    TODAY: { technical: 0.40, marketCondition: 0.20, news: 0.30, fundamental: 0.05, sector: 0.05 },
    '1W': { technical: 0.32, marketCondition: 0.15, news: 0.28, fundamental: 0.15, sector: 0.10 },
    '1M': { technical: 0.22, marketCondition: 0.10, news: 0.18, fundamental: 0.32, sector: 0.18 },
    '3M': { technical: 0.14, marketCondition: 0.06, news: 0.10, fundamental: 0.46, sector: 0.24 },
    '6M': { technical: 0.09, marketCondition: 0.05, news: 0.06, fundamental: 0.56, sector: 0.24 },
    '1Y': { technical: 0.05, marketCondition: 0.04, news: 0.04, fundamental: 0.67, sector: 0.20 },
};

/** How much of a stock's own realized volatility the model assumes it can legitimately "explain" as directional edge. Kept conservative. */
const DRIFT_TO_VOL_RATIO = 0.9;
const MAX_ANNUAL_DRIFT = 0.6; // sanity cap even at max conviction/confidence on a highly volatile name
const MAX_TODAY_MOVE = 0.06; // sanity cap on a single day's predicted move
const NEUTRAL_BAND_PCT = 0.15; // predicted moves smaller than this (in %) are reported as NEUTRAL, not a coin-flip UP/DOWN

export interface RawSignalInputs {
    technical: number; // -1..1
    fundamental: number; // -1..1, 0 if unavailable
    fundamentalAvailable: boolean;
    marketCondition: number; // -1..1, 0 if unavailable
    marketConditionAvailable: boolean;
    sector: number; // -1..1, 0 if unavailable
    sectorAvailable: boolean;
    newsSignal: number; // -1..1
    newsDataWeight: number; // 0..1 — how much real news data backs this signal (article count/quality)
    newsConfidenceAvg: number; // 0..1 average confidence of the news classifications feeding this signal
}

interface CompositeResult {
    compositeScore: number; // -1..1
    confidence: number; // 0..1
    signals: SignalBreakdown;
    effectiveWeights: HorizonWeights;
}

function computeComposite(horizonKey: PredictAIHorizonKey, input: RawSignalInputs): CompositeResult {
    const baseWeights = HORIZON_WEIGHTS[horizonKey];

    // Redistribute weight away from unavailable/low-confidence components onto the ones we actually trust.
    const availability = {
        technical: 1,
        fundamental: input.fundamentalAvailable ? 1 : 0,
        marketCondition: input.marketConditionAvailable ? 1 : 0,
        sector: input.sectorAvailable ? 1 : 0,
        news: input.newsDataWeight, // partial credit — sparse/low-importance news counts for less
    };

    const rawWeights: Record<keyof HorizonWeights, number> = {
        technical: baseWeights.technical * availability.technical,
        fundamental: baseWeights.fundamental * availability.fundamental,
        marketCondition: baseWeights.marketCondition * availability.marketCondition,
        sector: baseWeights.sector * availability.sector,
        news: baseWeights.news * availability.news,
    };
    const totalWeight = Object.values(rawWeights).reduce((a, b) => a + b, 0);

    const effectiveWeights: HorizonWeights = totalWeight > 0
        ? {
            technical: rawWeights.technical / totalWeight,
            fundamental: rawWeights.fundamental / totalWeight,
            marketCondition: rawWeights.marketCondition / totalWeight,
            sector: rawWeights.sector / totalWeight,
            news: rawWeights.news / totalWeight,
        }
        : baseWeights;

    const compositeScore = clamp(
        input.technical * effectiveWeights.technical +
        input.fundamental * effectiveWeights.fundamental +
        input.marketCondition * effectiveWeights.marketCondition +
        input.sector * effectiveWeights.sector +
        input.newsSignal * effectiveWeights.news,
        -1,
        1
    );

    // Confidence: agreement across the (weighted) components + data completeness + news classification confidence.
    const components: Array<{ v: number; w: number }> = [
        { v: input.technical, w: effectiveWeights.technical },
        { v: input.fundamental, w: effectiveWeights.fundamental },
        { v: input.marketCondition, w: effectiveWeights.marketCondition },
        { v: input.sector, w: effectiveWeights.sector },
        { v: input.newsSignal, w: effectiveWeights.news },
    ].filter(c => c.w > 0.01);

    let agreementWeight = 0;
    for (const c of components) {
        const agrees = compositeScore >= 0 ? c.v >= -0.02 : c.v <= 0.02;
        if (agrees) agreementWeight += c.w;
    }
    const agreementRatio = components.length > 0 ? agreementWeight : 0;
    const dataCompleteness = (availability.fundamental + availability.marketCondition + availability.sector + Math.min(1, availability.news)) / 4;

    const confidence = clamp(
        0.28 + agreementRatio * 0.42 + dataCompleteness * 0.15 + input.newsConfidenceAvg * 0.05,
        0.1,
        0.95
    );

    return {
        compositeScore,
        confidence,
        signals: {
            technical: input.technical,
            fundamental: input.fundamental,
            news: input.newsSignal,
            marketCondition: input.marketCondition,
            sector: input.sector,
        },
        effectiveWeights,
    };
}

function classifyDirection(predictedChangePct: number): Direction {
    if (predictedChangePct > NEUTRAL_BAND_PCT) return 'UP';
    if (predictedChangePct < -NEUTRAL_BAND_PCT) return 'DOWN';
    return 'NEUTRAL';
}

export function computeHorizonPrediction(
    horizonKey: PredictAIHorizonKey,
    def: HorizonDef,
    input: RawSignalInputs,
    currentPrice: number,
    annualizedVolatility: number | null,
    asOfDate: Date,
    lastTimeUtc?: number
): HorizonPrediction {
    const { compositeScore, confidence, signals, effectiveWeights } = computeComposite(horizonKey, input);
    const vol = annualizedVolatility ?? 0.35;

    let trajectory: TrajectoryPoint[];
    let predictedPrice: number;

    if (horizonKey === 'TODAY') {
        const dayVol = vol / Math.sqrt(252);
        const todayLogDrift = clamp(compositeScore * confidence * dayVol * DRIFT_TO_VOL_RATIO, -MAX_TODAY_MOVE, MAX_TODAY_MOVE);
        predictedPrice = currentPrice * Math.exp(todayLogDrift);
        trajectory = buildTodayTrajectory(currentPrice, todayLogDrift, lastTimeUtc ?? Math.floor(asOfDate.getTime() / 1000));
    } else {
        const annualDrift = clamp(compositeScore * confidence * vol * DRIFT_TO_VOL_RATIO, -MAX_ANNUAL_DRIFT, MAX_ANNUAL_DRIFT);
        const dailyLogDrift = annualDrift / 252;
        predictedPrice = currentPrice * Math.exp(dailyLogDrift * def.tradingDays);
        trajectory = buildDailyTrajectory(currentPrice, dailyLogDrift, def.tradingDays, asOfDate);
    }

    const predictedChangePct = ((predictedPrice - currentPrice) / currentPrice) * 100;

    return {
        key: horizonKey,
        label: def.label,
        direction: classifyDirection(predictedChangePct),
        currentPrice,
        predictedPrice,
        predictedChangePct,
        confidence: Math.round(confidence * 100),
        compositeScore: Math.round(compositeScore * 100),
        weights: effectiveWeights,
        signals,
        trajectory,
    };
}
