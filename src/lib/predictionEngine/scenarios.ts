/**
 * Bull / base / bear scenario generation. Splits the model's projected
 * return distribution (lognormal, centered on the model's drift estimate)
 * into three buckets. The split points shift with the composite score so a
 * more bullish model conviction produces a higher bull-case probability and
 * a lower bear-case probability — the probabilities are a function of the
 * model output, not fixed constants.
 */
import { clamp, normalCdf } from './indicators';
import type { ScenarioSet } from './types';

export function generateScenarios(params: {
    price: number;
    horizonLabel: string;
    tradingDays: number;
    compositeScore: number; // -100..100
    confidence: number;
    annualizedVolatility: number | null;
}): ScenarioSet {
    const { price, horizonLabel, tradingDays, compositeScore, confidence, annualizedVolatility } = params;
    const compositeNorm = clamp(compositeScore / 100, -1, 1);
    const t = tradingDays / 252;
    const annualDrift = compositeNorm * 0.25 * confidence;
    const annualVol = annualizedVolatility ?? 0.35;
    const driftLog = annualDrift * t;
    const sigma = Math.max(annualVol * Math.sqrt(t), 0.005);

    // Cutoffs (in std devs from the drift) shift with conviction: more bullish -> cutoffs shift up.
    const shift = compositeNorm * 0.4;
    const bearCutoffZ = -0.5 + shift;
    const bullCutoffZ = 0.5 + shift;

    const bearProb = clamp(normalCdf(bearCutoffZ), 0.03, 0.9);
    const bullProbRaw = clamp(1 - normalCdf(bullCutoffZ), 0.03, 0.9);
    const baseProb = clamp(1 - bearProb - bullProbRaw, 0.05, 0.94);
    // Re-normalize so the three probabilities sum to 1 after clamping.
    const total = bearProb + baseProb + bullProbRaw;

    const bearPrice = price * Math.exp(driftLog - sigma);
    const basePrice = price * Math.exp(driftLog);
    const bullPrice = price * Math.exp(driftLog + sigma);

    return {
        horizonLabel,
        bear: { price: bearPrice, probability: bearProb / total },
        base: { price: basePrice, probability: baseProb / total },
        bull: { price: bullPrice, probability: bullProbRaw / total },
    };
}
