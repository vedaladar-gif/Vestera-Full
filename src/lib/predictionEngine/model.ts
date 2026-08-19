/**
 * The quantitative scoring model at the heart of the AI Forecast feature.
 *
 * Design note on "AI/ML" scope: this is a transparent, deterministic
 * quantitative ensemble — a weighted composite of technical + fundamental +
 * analyst-consensus signals, each normalized to [-1, 1] — rather than a
 * trained neural network or gradient-boosted tree. Training/validating a
 * real ML model (XGBoost/LightGBM/neural nets) requires an offline training
 * pipeline, curated historical fundamentals across thousands of symbols, and
 * a model registry that a live request/response web app can't responsibly
 * fabricate on the spot. A hardcoded "trained" model with made-up weights
 * would be *less* honest than a documented, auditable rules-based ensemble.
 * The architecture below (see `README.md` in this folder) is intentionally
 * modular so a real trained model can be swapped in as `signals.ts` +
 * `model.ts` are the only two files that would need to change.
 *
 * Every number below is computed from real historical bars / fundamentals
 * passed in by the caller — nothing is hardcoded per symbol.
 */
import type { HistoricalBar, StockFundamentals } from '@/lib/marketData';
import {
    annualizedVolatility,
    bollingerBands,
    clamp,
    macd,
    maxDrawdown,
    momentum,
    relativeStrengthIndex,
    simpleMovingAverage,
    trendStrength,
} from './indicators';
import type { ModelPipelineOutput } from './types';

export interface SignalInputs {
    closes: number[];
    bars: HistoricalBar[];
    spyCloses: number[] | null;
    fundamentals: StockFundamentals;
}

/** Raw (non-normalized) indicator values used to generate human-readable explanations. */
export interface RawStats {
    rsi: number | null;
    priceVsSma50Pct: number | null;
    priceVsSma200Pct: number | null;
    momentum20Pct: number | null;
    momentum60Pct: number | null;
    momentum120Pct: number | null;
    macdHistogram: number | null;
    percentB: number | null;
    relativeStrength60Pct: number | null;
    trailingPE: number | null;
    growthAvgPct: number | null;
    profitMarginPct: number | null;
    analystRecommendationKey: string | null;
    numberOfAnalystOpinions: number | null;
}

function safe(v: number | null | undefined, fallback = 0): number {
    return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

/**
 * Computes the named, individually-inspectable [-1, 1] signals that feed the
 * composite score, plus the raw stats those signals were derived from (for
 * plain-English explanations). Exported so the backtester can call the exact
 * same function with historical data truncated at each simulated "as of" date.
 */
export function computeSignals(input: SignalInputs): { signals: Record<string, number>; raw: RawStats } {
    const { closes, bars, spyCloses, fundamentals } = input;
    const n = closes.length;
    const price = closes[n - 1];
    const signals: Record<string, number> = {};
    const raw: Partial<RawStats> = {};

    // ── Trend: price vs 50/200-day moving averages + regression slope ──
    const sma50 = simpleMovingAverage(closes, 50);
    const sma200 = simpleMovingAverage(closes, 200);
    const last50 = sma50[n - 1];
    const last200 = sma200[n - 1];
    let trendSignal = 0;
    if (last50 !== null) {
        raw.priceVsSma50Pct = ((price - last50) / last50) * 100;
        trendSignal += clamp((price - last50) / last50 / 0.08, -1, 1) * 0.5;
    }
    if (last200 !== null) {
        raw.priceVsSma200Pct = ((price - last200) / last200) * 100;
        trendSignal += clamp((price - last200) / last200 / 0.15, -1, 1) * 0.3;
    }
    const slope = trendStrength(closes, 50);
    if (slope !== null) trendSignal += clamp(slope * 8, -1, 1) * 0.2;
    signals.trend = clamp(trendSignal, -1, 1);

    // ── Momentum: 20/60/120-day returns ──
    const m20 = momentum(closes, 20);
    const m60 = momentum(closes, 60);
    const m120 = momentum(closes, 120);
    let momentumSignal = 0;
    let momentumWeight = 0;
    if (m20 !== null) { raw.momentum20Pct = m20 * 100; momentumSignal += clamp(m20 / 0.12, -1, 1) * 0.4; momentumWeight += 0.4; }
    if (m60 !== null) { raw.momentum60Pct = m60 * 100; momentumSignal += clamp(m60 / 0.2, -1, 1) * 0.35; momentumWeight += 0.35; }
    if (m120 !== null) { raw.momentum120Pct = m120 * 100; momentumSignal += clamp(m120 / 0.3, -1, 1) * 0.25; momentumWeight += 0.25; }
    signals.momentum = momentumWeight > 0 ? clamp(momentumSignal / momentumWeight, -1, 1) : 0;

    // ── RSI: mild mean-reversion signal (overbought = slight negative, oversold = slight positive) ──
    const rsiSeries = relativeStrengthIndex(closes, 14);
    const rsi = rsiSeries[n - 1];
    raw.rsi = rsi;
    signals.rsi = rsi !== null ? clamp((50 - rsi) / 30, -1, 1) : 0;

    // ── MACD: histogram direction & trajectory ──
    const macdResult = macd(closes);
    const hist = macdResult.histogram[n - 1];
    const prevHist = macdResult.histogram[n - 2] ?? hist;
    let macdSignal = 0;
    if (hist !== null && price > 0) {
        raw.macdHistogram = hist;
        macdSignal = clamp((hist / price) / 0.01, -1, 1) * 0.7;
        if (prevHist !== null) macdSignal += clamp((hist - prevHist) / price / 0.005, -1, 1) * 0.3;
    }
    signals.macd = clamp(macdSignal, -1, 1);

    // ── Bollinger position (%B): extreme bands lean mean-reverting ──
    const bb = bollingerBands(closes, 20, 2);
    const pctB = bb[n - 1]?.percentB ?? null;
    raw.percentB = pctB;
    signals.bollinger = pctB !== null ? clamp((0.5 - pctB) * 1.4, -1, 1) : 0;

    // ── Relative strength vs S&P 500 (60-day) ──
    if (spyCloses && spyCloses.length > 60 && closes.length > 60) {
        const stockRet = momentum(closes, 60) ?? 0;
        const spyRet = momentum(spyCloses, 60) ?? 0;
        raw.relativeStrength60Pct = (stockRet - spyRet) * 100;
        signals.relativeStrength = clamp((stockRet - spyRet) / 0.15, -1, 1);
    } else {
        signals.relativeStrength = 0;
    }

    // ── Fundamentals: valuation, growth, profitability, analyst consensus ──
    if (fundamentals.available) {
        const pe = fundamentals.trailingPE;
        raw.trailingPE = pe;
        // Anchor: ~22x is roughly a long-run broad-market average P/E. Cheaper-than-anchor -> positive, richer -> negative.
        signals.valuation = pe !== null && pe > 0 ? clamp((22 - pe) / 25, -1, 1) : 0;

        const growth = [fundamentals.earningsGrowth, fundamentals.revenueGrowth].filter(
            (v): v is number => typeof v === 'number'
        );
        if (growth.length > 0) raw.growthAvgPct = (growth.reduce((a, b) => a + b, 0) / growth.length) * 100;
        signals.growth = growth.length > 0 ? clamp((growth.reduce((a, b) => a + b, 0) / growth.length) / 0.2, -1, 1) : 0;

        const margin = fundamentals.profitMargins;
        if (margin !== null) raw.profitMarginPct = margin * 100;
        signals.profitability = margin !== null ? clamp(margin / 0.25, -1, 1) : 0;

        const rec = fundamentals.analystRecommendationMean;
        raw.analystRecommendationKey = fundamentals.analystRecommendationKey;
        raw.numberOfAnalystOpinions = fundamentals.numberOfAnalystOpinions;
        // Yahoo scale: 1 = Strong Buy ... 5 = Strong Sell -> invert to [-1, 1]
        signals.analyst = rec !== null ? clamp((3 - rec) / 2, -1, 1) : 0;
    } else {
        signals.valuation = 0;
        signals.growth = 0;
        signals.profitability = 0;
        signals.analyst = 0;
    }

    const fullRaw: RawStats = {
        rsi: raw.rsi ?? null,
        priceVsSma50Pct: raw.priceVsSma50Pct ?? null,
        priceVsSma200Pct: raw.priceVsSma200Pct ?? null,
        momentum20Pct: raw.momentum20Pct ?? null,
        momentum60Pct: raw.momentum60Pct ?? null,
        momentum120Pct: raw.momentum120Pct ?? null,
        macdHistogram: raw.macdHistogram ?? null,
        percentB: raw.percentB ?? null,
        relativeStrength60Pct: raw.relativeStrength60Pct ?? null,
        trailingPE: raw.trailingPE ?? null,
        growthAvgPct: raw.growthAvgPct ?? null,
        profitMarginPct: raw.profitMarginPct ?? null,
        analystRecommendationKey: raw.analystRecommendationKey ?? null,
        numberOfAnalystOpinions: raw.numberOfAnalystOpinions ?? null,
    };

    return { signals, raw: fullRaw };
}

const WEIGHTS: Record<string, number> = {
    trend: 0.18,
    momentum: 0.15,
    rsi: 0.08,
    macd: 0.09,
    bollinger: 0.05,
    relativeStrength: 0.15,
    valuation: 0.1,
    growth: 0.1,
    profitability: 0.05,
    analyst: 0.05,
};

/** Runs the full pipeline: signals -> composite score -> category -> confidence -> headline probability/risk. */
export function generatePrediction(input: SignalInputs): ModelPipelineOutput & { raw: RawStats } {
    const { signals, raw } = computeSignals(input);
    const { closes, fundamentals } = input;

    let composite = 0;
    let weightUsed = 0;
    for (const [key, weight] of Object.entries(WEIGHTS)) {
        const v = signals[key];
        if (typeof v === 'number') {
            composite += v * weight;
            weightUsed += weight;
        }
    }
    composite = weightUsed > 0 ? composite / weightUsed : 0;
    composite = clamp(composite, -1, 1);

    const compositeScore = Math.round(composite * 100);

    // Confidence: agreement across signals + data completeness - volatility penalty.
    const signalValues = Object.values(signals);
    const agreementCount = signalValues.filter(v => (composite >= 0 ? v > 0.05 : v < -0.05)).length;
    const agreementRatio = signalValues.length > 0 ? agreementCount / signalValues.length : 0;
    const dataCompleteness = fundamentals.available ? 1 : 0.6;
    const vol = annualizedVolatility(closes, 60);
    const volatilityPenalty = vol !== null ? clamp((vol - 0.25) / 0.6, 0, 1) : 0.25;

    const confidence = clamp(0.3 + agreementRatio * 0.4 + dataCompleteness * 0.15 - volatilityPenalty * 0.2, 0.05, 0.95);

    const probabilityUp = 1 / (1 + Math.exp(-3 * composite));

    const dailyVol = vol !== null ? vol / Math.sqrt(252) : 0.02;
    const monthlyDrift = composite * 0.25 * confidence * (21 / 252); // capped ~25%/yr annualized drift at full conviction
    const expectedReturn1m = monthlyDrift;

    const riskScore = clamp(
        Math.round(
            volatilityPenalty * 40 +
            clamp(Math.abs(maxDrawdown(closes, 252)) / 0.5, 0, 1) * 30 +
            (1 - confidence) * 30
        ),
        0,
        100
    );

    return {
        compositeScore,
        category:
            compositeScore >= 60 ? 'Strong Bullish' :
            compositeScore >= 20 ? 'Bullish' :
            compositeScore > -20 ? 'Neutral' :
            compositeScore > -60 ? 'Bearish' : 'Strong Bearish',
        confidence,
        probabilityUp,
        expectedReturn1m,
        riskScore,
        annualizedVolatility: vol,
        signals,
        raw,
    };
}

export function safeNumber(v: number | null | undefined, fallback = 0): number {
    return safe(v, fallback);
}
