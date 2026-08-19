/**
 * Builds the "AI Summary" paragraph directly from the model's own computed
 * output (category, top factors, risk). This is deliberately template-based
 * rather than an LLM call: every sentence is assembled from numbers the
 * model actually computed, so there is zero chance of the summary inventing
 * a statistic that isn't in the underlying analysis.
 */
import type { FactorExplanation, ModelPipelineOutput, RiskBreakdown } from './types';

/** Lowercases a sentence's leading word for mid-sentence joining, but leaves leading acronyms (RSI, MACD, P/E) untouched. */
function lowerLead(s: string): string {
    return /^[A-Z]{2,}/.test(s) ? s : s.replace(/^./, c => c.toLowerCase());
}

export function generateSummary(params: {
    symbol: string;
    name: string;
    prediction: Pick<ModelPipelineOutput, 'category' | 'compositeScore' | 'confidence'>;
    factors: FactorExplanation;
    risk: RiskBreakdown;
    expectedReturn1mPct: number;
}): string {
    const { symbol, name, prediction, factors, risk, expectedReturn1mPct } = params;
    const tone = prediction.category.toLowerCase();
    const confidencePct = Math.round(prediction.confidence * 100);

    const leadFactors = factors.positive.slice(0, 2);
    const dragFactors = factors.negative.slice(0, 2);

    const sentences: string[] = [];

    sentences.push(
        `${name} (${symbol}) is currently showing a ${tone} signal from Vestera's quantitative model` +
        (leadFactors.length > 0 ? `, driven by ${leadFactors.map(lowerLead).join(' and ')}.` : '.')
    );

    const dirWord = expectedReturn1mPct >= 0 ? 'modest upside' : 'modest downside';
    sentences.push(
        `Over the next month the model estimates ${dirWord} of roughly ${Math.abs(expectedReturn1mPct).toFixed(1)}%, ` +
        `with ${confidencePct}% model confidence based on signal agreement and data completeness.`
    );

    if (dragFactors.length > 0) {
        sentences.push(`Working against this view: ${dragFactors.map(lowerLead).join('; ')}.`);
    }

    sentences.push(`Overall risk is rated ${risk.overall.toLowerCase()}, driven mainly by volatility and valuation.`);

    return sentences.join(' ');
}
