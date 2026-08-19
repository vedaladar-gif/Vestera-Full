/**
 * Risk breakdown — every sub-rating is derived from a real, computed number
 * (volatility, drawdown, RSI, beta, days-to-earnings). Where the underlying
 * data isn't available (e.g. no fundamentals for an ETF, no earnings date
 * published), the rating is explicitly "N/A" / "Unknown" rather than guessed.
 */
import { clamp, maxDrawdown } from './indicators';
import type { RiskBreakdown, RiskLevel } from './types';
import type { RawStats } from './model';
import type { StockFundamentals } from '@/lib/marketData';

function levelFromScore(score: number): RiskLevel {
    if (score < 0.2) return 'Very Low';
    if (score < 0.4) return 'Low';
    if (score < 0.6) return 'Moderate';
    if (score < 0.8) return 'High';
    return 'Very High';
}

export function calculateRisk(params: {
    closes: number[];
    annualizedVolatility: number | null;
    raw: RawStats;
    fundamentals: StockFundamentals;
}): RiskBreakdown {
    const { closes, annualizedVolatility, raw, fundamentals } = params;

    const volScore = annualizedVolatility !== null ? clamp((annualizedVolatility - 0.12) / 0.55, 0, 1) : 0.5;
    const dd = maxDrawdown(closes, 252);
    const drawdownScore = clamp(Math.abs(dd) / 0.55, 0, 1);

    let valuationLevel: RiskLevel | 'N/A' = 'N/A';
    let valuationNote = 'No fundamentals available for this symbol (common for ETFs/indexes).';
    let valuationScore = 0.4;
    if (fundamentals.available && raw.trailingPE !== null) {
        valuationScore = clamp((raw.trailingPE - 15) / 45, 0, 1);
        valuationLevel = levelFromScore(valuationScore);
        valuationNote = `Trailing P/E of ${raw.trailingPE.toFixed(1)}x`;
    }

    const rsi = raw.rsi;
    const momentumScore = rsi !== null ? clamp(Math.abs(rsi - 50) / 45, 0, 1) : 0.35;
    const momentumLevel = levelFromScore(momentumScore);

    const beta = fundamentals.beta;
    const marketScore = beta !== null ? clamp((Math.abs(beta) - 0.6) / 1.4, 0, 1) : 0.45;
    const marketLevel = levelFromScore(marketScore);

    let earningsLevel: RiskLevel | 'Unknown' = 'Unknown';
    let daysUntil: number | null = null;
    let earningsScore = 0.35;
    if (fundamentals.nextEarningsDate) {
        const nowSec = Date.now() / 1000;
        daysUntil = Math.round((fundamentals.nextEarningsDate - nowSec) / 86400);
        if (daysUntil >= 0 && daysUntil <= 45) {
            earningsScore = clamp(1 - daysUntil / 45, 0.15, 1);
            earningsLevel = levelFromScore(earningsScore);
        } else {
            earningsScore = 0.1;
            earningsLevel = 'Low';
        }
    }

    const overallScore = clamp(
        volScore * 0.3 + drawdownScore * 0.2 + valuationScore * 0.2 + momentumScore * 0.1 + marketScore * 0.1 + earningsScore * 0.1,
        0,
        1
    );

    return {
        overall: levelFromScore(overallScore),
        overallScore: Math.round(overallScore * 100),
        volatility: {
            level: levelFromScore(volScore),
            annualizedVolatilityPct: annualizedVolatility !== null ? annualizedVolatility * 100 : null,
        },
        drawdown: { level: levelFromScore(drawdownScore), maxDrawdownPct: dd * 100 },
        valuation: { level: valuationLevel, note: valuationNote },
        momentum: { level: momentumLevel, rsi },
        market: { level: marketLevel, beta },
        earningsEvent: { level: earningsLevel, nextEarningsDate: fundamentals.nextEarningsDate, daysUntil },
    };
}
