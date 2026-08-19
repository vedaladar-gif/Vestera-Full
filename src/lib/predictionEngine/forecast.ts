/**
 * Per-horizon forecast generation. Uses a lognormal (geometric Brownian
 * motion-style) projection: the model's composite score sets the drift, the
 * stock's own trailing realized volatility sets the spread, and both are
 * scaled by sqrt(time) — the standard way quant models widen uncertainty for
 * longer horizons rather than presenting false precision.
 */
import { clamp, normalCdf } from './indicators';
import { buildFactorCandidates } from './explain';
import type { RawStats } from './model';
import type { Direction, HorizonForecast } from './types';

export interface HorizonDef {
    key: HorizonForecast['key'];
    label: string;
    tradingDays: number;
}

export const SHORT_TERM_HORIZONS: HorizonDef[] = [
    { key: '1D', label: '1 Day', tradingDays: 1 },
    { key: '1W', label: '1 Week', tradingDays: 5 },
    { key: '1M', label: '1 Month', tradingDays: 21 },
];

export const LONG_TERM_HORIZONS: HorizonDef[] = [
    { key: '3M', label: '3 Months', tradingDays: 63 },
    { key: '6M', label: '6 Months', tradingDays: 126 },
    { key: '1Y', label: '1 Year', tradingDays: 252 },
    { key: '3Y', label: '3 Years', tradingDays: 756 },
];

const DEFAULT_ANNUAL_VOL = 0.35; // used only when trailing volatility can't be computed (very short history)
const MAX_ANNUAL_DRIFT = 0.25; // cap the model's implied annualized drift at full conviction (avoid false precision)

const SHORT_TERM_FACTOR_KEYS = new Set(['momentum60', 'rsi', 'macd', 'bollinger', 'trend50']);
const LONG_TERM_FACTOR_KEYS = new Set(['valuation', 'growth', 'profitability', 'analyst', 'trend200', 'relativeStrength']);

function keyFactorsFor(horizonKey: HorizonForecast['key'], signals: Record<string, number>, raw: RawStats): string[] {
    const isShort = horizonKey === '1D' || horizonKey === '1W' || horizonKey === '1M';
    const pool = isShort ? SHORT_TERM_FACTOR_KEYS : LONG_TERM_FACTOR_KEYS;
    const candidates = buildFactorCandidates(signals, raw).filter(c => pool.has(c.key));
    return candidates
        .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
        .slice(0, 3)
        .map(c => c.text);
}

export function generateForecastHorizons(params: {
    horizons: HorizonDef[];
    price: number;
    compositeScore: number; // -100..100
    confidence: number; // 0..1
    annualizedVolatility: number | null;
    signals: Record<string, number>;
    raw: RawStats;
}): HorizonForecast[] {
    const { horizons, price, compositeScore, confidence, annualizedVolatility, signals, raw } = params;
    const compositeNorm = clamp(compositeScore / 100, -1, 1);
    const annualDrift = compositeNorm * MAX_ANNUAL_DRIFT * confidence;
    const annualVol = annualizedVolatility ?? DEFAULT_ANNUAL_VOL;

    const direction: Direction = compositeScore > 10 ? 'bullish' : compositeScore < -10 ? 'bearish' : 'neutral';

    return horizons.map(h => {
        const t = h.tradingDays / 252;
        const driftLog = annualDrift * t;
        const sigma = annualVol * Math.sqrt(t);

        const priceLow = sigma > 0 ? price * Math.exp(driftLog - sigma) : price * (1 + driftLog - 0.01);
        const priceHigh = sigma > 0 ? price * Math.exp(driftLog + sigma) : price * (1 + driftLog + 0.01);

        const probabilityUp = sigma > 0 ? normalCdf(driftLog / sigma) : driftLog >= 0 ? 0.6 : 0.4;

        // Confidence decays for longer horizons — more time = more can go wrong.
        const horizonDecay = 1 / (1 + h.tradingDays / 180);
        const horizonConfidence = clamp(0.05 + confidence * horizonDecay, 0.05, 0.95);

        return {
            key: h.key,
            label: h.label,
            tradingDays: h.tradingDays,
            direction,
            expectedReturnPct: (Math.exp(driftLog) - 1) * 100,
            priceLow: Math.min(priceLow, priceHigh),
            priceHigh: Math.max(priceLow, priceHigh),
            probabilityUp: clamp(probabilityUp, 0.02, 0.98),
            confidence: horizonConfidence,
            keyFactors: keyFactorsFor(h.key, signals, raw),
        };
    });
}
