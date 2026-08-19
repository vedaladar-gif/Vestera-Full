/**
 * Generates the SINGLE projected price trajectory Vestera Predict AI draws on
 * the chart (a dotted line, not a range/cone). Each point is a deterministic
 * function of the model's computed drift for that horizon — no randomness,
 * no fabricated wiggle. The path is the expected-value glide from the current
 * price to the horizon's predicted price.
 */
import type { TrajectoryPoint } from './types';

/** Daily-resolution trajectory for multi-day horizons (1W..1Y), calendar-dated from `asOfDate`. */
export function buildDailyTrajectory(
    currentPrice: number,
    dailyLogDrift: number,
    tradingDaysAhead: number,
    asOfDate: Date,
    maxPoints = 40
): TrajectoryPoint[] {
    const step = Math.max(1, Math.round(tradingDaysAhead / maxPoints));
    const points: TrajectoryPoint[] = [];
    for (let d = step; d <= tradingDaysAhead; d += step) {
        const price = currentPrice * Math.exp(dailyLogDrift * d);
        const futureDate = new Date(asOfDate);
        futureDate.setDate(futureDate.getDate() + Math.round(d * 1.4)); // trading-day -> calendar-day approximation
        points.push({ time: futureDate.toISOString().split('T')[0], price });
    }
    // Always include the exact final point so the line visibly reaches the predicted price.
    const finalDate = new Date(asOfDate);
    finalDate.setDate(finalDate.getDate() + Math.round(tradingDaysAhead * 1.4));
    const finalIso = finalDate.toISOString().split('T')[0];
    if (points.length === 0 || points[points.length - 1].time !== finalIso) {
        points.push({ time: finalIso, price: currentPrice * Math.exp(dailyLogDrift * tradingDaysAhead) });
    }
    return points;
}

/** Intraday glide path toward the predicted end-of-day price (unix-second steps, ~10 minutes apart). */
export function buildTodayTrajectory(
    currentPrice: number,
    todayLogDrift: number,
    lastTimeUtc: number,
    steps = 12,
    stepMinutes = 10
): TrajectoryPoint[] {
    const points: TrajectoryPoint[] = [];
    for (let s = 1; s <= steps; s++) {
        const fraction = s / steps;
        const price = currentPrice * Math.exp(todayLogDrift * fraction);
        points.push({ time: lastTimeUtc + s * stepMinutes * 60, price });
    }
    return points;
}
