/**
 * Converts the model's computed signals + raw stats into short, plain-English
 * factor bullets. Every sentence embeds a real number from the analysis —
 * nothing here is templated with made-up statistics.
 */
import type { RawStats } from './model';
import type { FactorExplanation } from './types';

interface FactorCandidate {
    key: string;
    text: string;
    /** Signed strength used for ranking/sign — same sign convention as the model signal (+bullish / -bearish). */
    weight: number;
}

const pct = (v: number, digits = 1) => `${v >= 0 ? '+' : ''}${v.toFixed(digits)}%`;

export function buildFactorCandidates(signals: Record<string, number>, raw: RawStats): FactorCandidate[] {
    const out: FactorCandidate[] = [];

    if (raw.priceVsSma50Pct !== null) {
        out.push({
            key: 'trend50',
            weight: signals.trend ?? 0,
            text: raw.priceVsSma50Pct >= 0
                ? `Price is ${pct(raw.priceVsSma50Pct)} above its 50-day moving average — a constructive short/medium-term trend`
                : `Price is ${pct(raw.priceVsSma50Pct)} below its 50-day moving average — a soft short/medium-term trend`,
        });
    }
    if (raw.priceVsSma200Pct !== null) {
        out.push({
            key: 'trend200',
            weight: signals.trend ?? 0,
            text: raw.priceVsSma200Pct >= 0
                ? `Trading ${pct(raw.priceVsSma200Pct)} above the 200-day moving average — long-term uptrend intact`
                : `Trading ${pct(raw.priceVsSma200Pct)} below the 200-day moving average — long-term trend is weak`,
        });
    }
    if (raw.momentum60Pct !== null) {
        out.push({
            key: 'momentum60',
            weight: signals.momentum ?? 0,
            text: `${pct(raw.momentum60Pct)} price momentum over the last 60 trading sessions`,
        });
    }
    if (raw.rsi !== null) {
        if (raw.rsi >= 70) {
            out.push({ key: 'rsi', weight: -0.4, text: `RSI at ${raw.rsi.toFixed(0)} — approaching overbought territory` });
        } else if (raw.rsi <= 30) {
            out.push({ key: 'rsi', weight: 0.4, text: `RSI at ${raw.rsi.toFixed(0)} — approaching oversold territory` });
        } else {
            out.push({ key: 'rsi', weight: (signals.rsi ?? 0) * 0.3, text: `RSI at ${raw.rsi.toFixed(0)} — no extreme overbought/oversold reading` });
        }
    }
    if (raw.macdHistogram !== null) {
        out.push({
            key: 'macd',
            weight: signals.macd ?? 0,
            text: (signals.macd ?? 0) >= 0
                ? 'MACD histogram is positive — short-term momentum favors buyers'
                : 'MACD histogram is negative — short-term momentum favors sellers',
        });
    }
    if (raw.percentB !== null) {
        out.push({
            key: 'bollinger',
            weight: signals.bollinger ?? 0,
            text: raw.percentB >= 0.95
                ? 'Price is pressing the upper Bollinger Band — elevated volatility/extension risk'
                : raw.percentB <= 0.05
                ? 'Price is pressing the lower Bollinger Band — stretched to the downside'
                : 'Price sits within a normal Bollinger Band range',
        });
    }
    if (raw.relativeStrength60Pct !== null) {
        out.push({
            key: 'relativeStrength',
            weight: signals.relativeStrength ?? 0,
            text: raw.relativeStrength60Pct >= 0
                ? `Outperforming the S&P 500 by ${pct(raw.relativeStrength60Pct)} over the last 60 sessions`
                : `Underperforming the S&P 500 by ${pct(Math.abs(raw.relativeStrength60Pct))} over the last 60 sessions`,
        });
    }
    if (raw.trailingPE !== null) {
        out.push({
            key: 'valuation',
            weight: signals.valuation ?? 0,
            text: raw.trailingPE > 30
                ? `Trading at a trailing P/E of ${raw.trailingPE.toFixed(1)}x — an elevated valuation versus the broad market`
                : `Trading at a trailing P/E of ${raw.trailingPE.toFixed(1)}x — a reasonable valuation versus the broad market`,
        });
    }
    if (raw.growthAvgPct !== null) {
        out.push({
            key: 'growth',
            weight: signals.growth ?? 0,
            text: raw.growthAvgPct >= 0
                ? `Average earnings/revenue growth of ${pct(raw.growthAvgPct)} year-over-year`
                : `Earnings/revenue growth is negative (${pct(raw.growthAvgPct)}) year-over-year`,
        });
    }
    if (raw.profitMarginPct !== null) {
        out.push({
            key: 'profitability',
            weight: signals.profitability ?? 0,
            text: raw.profitMarginPct >= 15
                ? `Healthy profit margin of ${raw.profitMarginPct.toFixed(1)}%`
                : `Thin profit margin of ${raw.profitMarginPct.toFixed(1)}%`,
        });
    }
    if (raw.analystRecommendationKey) {
        const label = raw.analystRecommendationKey.replace(/_/g, ' ');
        out.push({
            key: 'analyst',
            weight: signals.analyst ?? 0,
            text: `Analyst consensus: ${label}${raw.numberOfAnalystOpinions ? ` (${raw.numberOfAnalystOpinions} analysts)` : ''}`,
        });
    }

    return out;
}

/** Splits factor candidates into the strongest positive/negative bullets (max 5 each). */
export function explainFactors(signals: Record<string, number>, raw: RawStats): FactorExplanation {
    const candidates = buildFactorCandidates(signals, raw);
    const positive = candidates
        .filter(c => c.weight > 0.05)
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5)
        .map(c => c.text);
    const negative = candidates
        .filter(c => c.weight < -0.05)
        .sort((a, b) => a.weight - b.weight)
        .slice(0, 5)
        .map(c => c.text);
    return { positive, negative };
}
