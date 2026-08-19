/**
 * Fundamental-analysis component for Vestera Predict AI — valuation, growth,
 * profitability, and analyst consensus, all sourced from real fundamentals
 * data (see `src/lib/marketData`). Independent weighting from the original
 * AI Forecast model. Returns 0 (neutral, not fabricated) when fundamentals
 * aren't available for the symbol (e.g. ETFs/crypto).
 */
import type { StockFundamentals } from '@/lib/marketData';
import { clamp } from '@/lib/predictionEngine/indicators';

export function computeFundamentalSignal(fundamentals: StockFundamentals): number {
    if (!fundamentals.available) return 0;

    let score = 0;
    let weight = 0;

    if (fundamentals.trailingPE !== null && fundamentals.trailingPE > 0) {
        score += clamp((23 - fundamentals.trailingPE) / 28, -1, 1) * 0.25;
        weight += 0.25;
    }
    const growthValues = [fundamentals.earningsGrowth, fundamentals.revenueGrowth].filter(
        (v): v is number => typeof v === 'number'
    );
    if (growthValues.length > 0) {
        const avgGrowth = growthValues.reduce((a, b) => a + b, 0) / growthValues.length;
        score += clamp(avgGrowth / 0.18, -1, 1) * 0.3;
        weight += 0.3;
    }
    if (fundamentals.profitMargins !== null) {
        score += clamp(fundamentals.profitMargins / 0.22, -1, 1) * 0.2;
        weight += 0.2;
    }
    if (fundamentals.analystRecommendationMean !== null) {
        score += clamp((3 - fundamentals.analystRecommendationMean) / 2, -1, 1) * 0.25;
        weight += 0.25;
    }

    return weight > 0 ? clamp(score / weight, -1, 1) : 0;
}
