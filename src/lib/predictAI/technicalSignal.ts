/**
 * Technical-analysis component for Vestera Predict AI. Independent from the
 * original AI Forecast model's `computeSignals` (different weighting scheme,
 * different composite formula) but reuses the same pure indicator math in
 * `predictionEngine/indicators.ts` — that math is just arithmetic (SMA, RSI,
 * MACD…), not "the model", so re-deriving it would only introduce bugs.
 */
import type { HistoricalBar } from '@/lib/marketData';
import {
    annualizedVolatility,
    clamp,
    macd,
    momentum,
    relativeStrengthIndex,
    simpleMovingAverage,
    trendStrength,
} from '@/lib/predictionEngine/indicators';

export interface TechnicalSignalResult {
    score: number; // -1..1
    volumeRatio: number | null; // today's volume vs trailing average — used by the recompute trigger
    priceChangePct: number; // latest session % change — used by the recompute trigger
    rsi: number | null;
    annualizedVolatility: number | null;
}

export function computeTechnicalSignal(bars: HistoricalBar[]): TechnicalSignalResult {
    const closes = bars.map(b => b.close).filter(c => c > 0);
    const n = closes.length;
    if (n < 20) {
        return { score: 0, volumeRatio: null, priceChangePct: 0, rsi: null, annualizedVolatility: null };
    }
    const price = closes[n - 1];

    // Short-horizon-weighted momentum (5/10/20 day) — Predict AI leans on the freshest price action.
    const m5 = momentum(closes, 5) ?? 0;
    const m10 = momentum(closes, 10) ?? 0;
    const m20 = momentum(closes, 20) ?? 0;
    const momentumScore = clamp((m5 / 0.05) * 0.45 + (m10 / 0.08) * 0.3 + (m20 / 0.12) * 0.25, -1, 1);

    const sma20 = simpleMovingAverage(closes, 20);
    const sma50 = simpleMovingAverage(closes, 50);
    let trendScore = 0;
    const last20 = sma20[n - 1];
    const last50 = sma50[n - 1];
    if (last20 !== null) trendScore += clamp((price - last20) / last20 / 0.05, -1, 1) * 0.5;
    if (last50 !== null) trendScore += clamp((price - last50) / last50 / 0.09, -1, 1) * 0.3;
    const slope = trendStrength(closes, 20);
    if (slope !== null) trendScore += clamp(slope * 10, -1, 1) * 0.2;
    trendScore = clamp(trendScore, -1, 1);

    const rsiSeries = relativeStrengthIndex(closes, 14);
    const rsi = rsiSeries[n - 1];
    const rsiScore = rsi !== null ? clamp((50 - rsi) / 35, -1, 1) : 0;

    const macdResult = macd(closes);
    const hist = macdResult.histogram[n - 1];
    const macdScore = hist !== null && price > 0 ? clamp((hist / price) / 0.008, -1, 1) : 0;

    // Volume: an unusual spike in volume alongside a price move strengthens conviction in that move's direction.
    const volumes = bars.map(b => b.volume).filter(v => v > 0);
    let volumeRatio: number | null = null;
    let volumeBoost = 0;
    if (volumes.length >= 20) {
        const avgVol20 = volumes.slice(-21, -1).reduce((a, b) => a + b, 0) / Math.min(20, volumes.length - 1);
        const todayVol = volumes[volumes.length - 1];
        volumeRatio = avgVol20 > 0 ? todayVol / avgVol20 : null;
        if (volumeRatio !== null && volumeRatio > 1.5) {
            const direction = m5 >= 0 ? 1 : -1;
            volumeBoost = direction * clamp((volumeRatio - 1.5) / 3, 0, 0.3);
        }
    }

    const priceChangePct = n >= 2 ? ((closes[n - 1] - closes[n - 2]) / closes[n - 2]) * 100 : 0;

    const score = clamp(
        momentumScore * 0.35 + trendScore * 0.3 + rsiScore * 0.1 + macdScore * 0.15 + volumeBoost,
        -1,
        1
    );

    return {
        score,
        volumeRatio,
        priceChangePct,
        rsi,
        annualizedVolatility: annualizedVolatility(closes, 60),
    };
}
