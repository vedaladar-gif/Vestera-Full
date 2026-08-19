/**
 * Pure technical-indicator math. Every function here operates only on the
 * historical bars/closes passed in — no network calls, no randomness, no
 * hardcoded per-symbol values. Used by both the live prediction engine and
 * the backtester (so backtests exercise the exact same math as production).
 */
import type { HistoricalBar } from '@/lib/marketData';

export function simpleMovingAverage(values: number[], period: number): (number | null)[] {
    const out: (number | null)[] = new Array(values.length).fill(null);
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
        sum += values[i];
        if (i >= period) sum -= values[i - period];
        if (i >= period - 1) out[i] = sum / period;
    }
    return out;
}

export function exponentialMovingAverage(values: number[], period: number): (number | null)[] {
    const out: (number | null)[] = new Array(values.length).fill(null);
    if (values.length === 0) return out;
    const k = 2 / (period + 1);
    let prevEma: number | null = null;
    for (let i = 0; i < values.length; i++) {
        if (prevEma === null) {
            if (i === period - 1) {
                const seed = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
                prevEma = seed;
                out[i] = seed;
            }
            continue;
        }
        prevEma = values[i] * k + prevEma * (1 - k);
        out[i] = prevEma;
    }
    return out;
}

export function relativeStrengthIndex(closes: number[], period = 14): (number | null)[] {
    const out: (number | null)[] = new Array(closes.length).fill(null);
    if (closes.length < period + 1) return out;

    let gainSum = 0;
    let lossSum = 0;
    for (let i = 1; i <= period; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff >= 0) gainSum += diff;
        else lossSum -= diff;
    }
    let avgGain = gainSum / period;
    let avgLoss = lossSum / period;
    out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

    for (let i = period + 1; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    }
    return out;
}

export interface MacdResult {
    macdLine: (number | null)[];
    signalLine: (number | null)[];
    histogram: (number | null)[];
}

export function macd(closes: number[], fast = 12, slow = 26, signal = 9): MacdResult {
    const emaFast = exponentialMovingAverage(closes, fast);
    const emaSlow = exponentialMovingAverage(closes, slow);
    const macdLine: (number | null)[] = closes.map((_, i) =>
        emaFast[i] !== null && emaSlow[i] !== null ? (emaFast[i] as number) - (emaSlow[i] as number) : null
    );

    const macdValuesOnly = macdLine.filter((v): v is number => v !== null);
    const signalOnlyEma = exponentialMovingAverage(macdValuesOnly, signal);
    const signalLine: (number | null)[] = new Array(closes.length).fill(null);
    let cursor = 0;
    for (let i = 0; i < closes.length; i++) {
        if (macdLine[i] === null) continue;
        signalLine[i] = signalOnlyEma[cursor] ?? null;
        cursor++;
    }

    const histogram = closes.map((_, i) =>
        macdLine[i] !== null && signalLine[i] !== null ? (macdLine[i] as number) - (signalLine[i] as number) : null
    );

    return { macdLine, signalLine, histogram };
}

export interface BollingerBand {
    upper: number | null;
    middle: number | null;
    lower: number | null;
    percentB: number | null;
}

export function bollingerBands(closes: number[], period = 20, stdDevMult = 2): BollingerBand[] {
    const mid = simpleMovingAverage(closes, period);
    return closes.map((close, i) => {
        if (i < period - 1 || mid[i] === null) return { upper: null, middle: null, lower: null, percentB: null };
        const window = closes.slice(i - period + 1, i + 1);
        const mean = mid[i] as number;
        const variance = window.reduce((s, v) => s + (v - mean) ** 2, 0) / period;
        const sd = Math.sqrt(variance);
        const upper = mean + stdDevMult * sd;
        const lower = mean - stdDevMult * sd;
        const percentB = upper === lower ? 0.5 : (close - lower) / (upper - lower);
        return { upper, middle: mean, lower, percentB };
    });
}

/** Average True Range — volatility measured in price units. */
export function averageTrueRange(bars: HistoricalBar[], period = 14): (number | null)[] {
    const out: (number | null)[] = new Array(bars.length).fill(null);
    if (bars.length < 2) return out;

    const trueRanges: number[] = [0];
    for (let i = 1; i < bars.length; i++) {
        const b = bars[i];
        const prevClose = bars[i - 1].close;
        const tr = Math.max(b.high - b.low, Math.abs(b.high - prevClose), Math.abs(b.low - prevClose));
        trueRanges.push(tr);
    }

    let atr: number | null = null;
    for (let i = 0; i < bars.length; i++) {
        if (i < period) {
            if (i === period - 1) {
                atr = trueRanges.slice(1, period + 1).reduce((a, b) => a + b, 0) / period;
                out[i] = atr;
            }
            continue;
        }
        atr = ((atr as number) * (period - 1) + trueRanges[i]) / period;
        out[i] = atr;
    }
    return out;
}

/** Daily log returns — the standard input for volatility/drift estimation. */
export function dailyLogReturns(closes: number[]): number[] {
    const out: number[] = [];
    for (let i = 1; i < closes.length; i++) {
        if (closes[i - 1] > 0 && closes[i] > 0) out.push(Math.log(closes[i] / closes[i - 1]));
    }
    return out;
}

/** Annualized volatility (stdev of daily log returns * sqrt(252)) over the trailing `lookback` sessions. */
export function annualizedVolatility(closes: number[], lookback = 60): number | null {
    const returns = dailyLogReturns(closes.slice(-lookback - 1));
    if (returns.length < 5) return null;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1);
    return Math.sqrt(variance) * Math.sqrt(252);
}

/** % price change over the trailing `period` sessions. */
export function momentum(closes: number[], period: number): number | null {
    if (closes.length <= period) return null;
    const past = closes[closes.length - 1 - period];
    const now = closes[closes.length - 1];
    if (!past) return null;
    return (now - past) / past;
}

/** Largest peak-to-trough decline (as a negative fraction) within the trailing `lookback` sessions. */
export function maxDrawdown(closes: number[], lookback = 252): number {
    const window = closes.slice(-lookback);
    let peak = -Infinity;
    let worst = 0;
    for (const c of window) {
        if (c > peak) peak = c;
        const dd = peak > 0 ? (c - peak) / peak : 0;
        if (dd < worst) worst = dd;
    }
    return worst;
}

/** Linear-regression slope of price over `period` sessions, normalized by price level (dimensionless trend strength). */
export function trendStrength(closes: number[], period = 50): number | null {
    if (closes.length < period) return null;
    const window = closes.slice(-period);
    const n = window.length;
    const xMean = (n - 1) / 2;
    const yMean = window.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
        num += (i - xMean) * (window[i] - yMean);
        den += (i - xMean) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    return yMean > 0 ? (slope * n) / yMean : 0;
}

/** Standard normal CDF via Abramowitz-Stegun erf approximation. */
export function normalCdf(z: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp((-z * z) / 2);
    let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (z > 0) p = 1 - p;
    return p;
}

export function clamp(v: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, v));
}
