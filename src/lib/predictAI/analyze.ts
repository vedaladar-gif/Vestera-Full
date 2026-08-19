/**
 * Top-level orchestration for Vestera Predict AI — a second, fully
 * independent prediction engine (see `types.ts` for the design rationale).
 * Fetches real market data + real news, runs each signal component, combines
 * them per-horizon, decides whether this is a "meaningful update" worth
 * logging to the prediction-history timeline, and returns the full payload
 * consumed by the `/api/predict-ai/*` routes.
 */
import { getFundamentals, getHistoricalData, getStockData } from '@/lib/marketData';
import { computeTechnicalSignal } from './technicalSignal';
import { computeFundamentalSignal } from './fundamentalSignal';
import { computeMarketConditionSignal, computeSectorSignal } from './marketConditionSignal';
import { fetchNewsForSymbol } from './newsFeed';
import { aggregateNewsSignal, analyzeNewsFeed } from './newsAnalysis';
import { computeHorizonPrediction, PREDICT_AI_HORIZONS } from './combine';
import { determineTrigger, historyNoteFor } from './trigger';
import { appendHistoryLog, logPrediction, recordSeenNews, setState } from './store';
import { PREDICT_AI_MODEL_VERSION } from './types';
import type { HorizonPrediction, PredictAIOutput, TodayForecast } from './types';

const MODEL_LOOKBACK_DAYS = 400; // enough for 200-day SMA + momentum lookbacks

export type PredictAIResult =
    | { ok: true; data: PredictAIOutput }
    | { ok: false; reason: 'no-market-data' | 'insufficient-history' };

export async function runPredictAI(symbol: string): Promise<PredictAIResult> {
    const upper = symbol.toUpperCase();

    const [quote, fundamentals, bars, spyBars, newsFeed] = await Promise.all([
        getStockData(upper),
        getFundamentals(upper),
        getHistoricalData(upper, MODEL_LOOKBACK_DAYS),
        upper === 'SPY' ? getHistoricalData('SPY', MODEL_LOOKBACK_DAYS).then(b => b) : getHistoricalData('SPY', MODEL_LOOKBACK_DAYS),
        fetchNewsForSymbol(upper),
    ]);

    if (!quote) return { ok: false, reason: 'no-market-data' };

    const closes = bars.map(b => b.close).filter(c => c > 0);
    if (closes.length < 25) return { ok: false, reason: 'insufficient-history' };

    const spyCloses = spyBars.length > 0 ? spyBars.map(b => b.close).filter(c => c > 0) : null;

    const technical = computeTechnicalSignal(bars);
    const fundamentalScore = computeFundamentalSignal(fundamentals);
    const marketCondition = computeMarketConditionSignal(upper === 'SPY' ? null : spyCloses);
    const sector = await computeSectorSignal(upper, spyCloses);

    const currentPrice = quote.price;
    const asOfDate = new Date(bars[bars.length - 1]?.date || Date.now());
    const nowMs = Date.now();

    const horizons: HorizonPrediction[] = PREDICT_AI_HORIZONS.map(def => {
        const analyses = newsFeed.available ? analyzeNewsFeed(newsFeed.items, upper, def.key, nowMs) : [];
        const { signal: newsSignal, weight: newsDataWeight } = aggregateNewsSignal(analyses);
        const newsConfidenceAvg = analyses.length > 0 ? analyses.reduce((s, a) => s + a.confidence, 0) / analyses.length : 0;

        return computeHorizonPrediction(
            def.key,
            def,
            {
                technical: technical.score,
                fundamental: fundamentalScore,
                fundamentalAvailable: fundamentals.available,
                marketCondition: marketCondition.score,
                marketConditionAvailable: marketCondition.available,
                sector: sector.score,
                sectorAvailable: sector.available,
                newsSignal,
                newsDataWeight,
                newsConfidenceAvg,
            },
            currentPrice,
            technical.annualizedVolatility,
            asOfDate,
            Math.floor(nowMs / 1000)
        );
    });

    const todayHorizon = horizons.find(h => h.key === 'TODAY')!;
    const todayForecast: TodayForecast = {
        direction: todayHorizon.direction,
        currentPrice: todayHorizon.currentPrice,
        predictedPrice: todayHorizon.predictedPrice,
        predictedChangePct: todayHorizon.predictedChangePct,
        confidence: todayHorizon.confidence,
        generatedAt: Math.floor(nowMs / 1000),
    };

    // News analyzed at "TODAY" decay (most sensitive to recency) is what drives the recompute trigger.
    const todayNewsAnalyses = newsFeed.available ? analyzeNewsFeed(newsFeed.items, upper, 'TODAY', nowMs) : [];
    const trigger = determineTrigger(upper, currentPrice, todayNewsAnalyses);

    if (trigger.shouldLog) {
        for (const h of horizons) logPrediction(upper, h, trigger.reason, todayNewsAnalyses);
        const note = historyNoteFor(trigger.reason, trigger.newArticles, todayForecast.predictedPrice, trigger.priceChangePct);
        appendHistoryLog(upper, trigger.reason, note, todayForecast.predictedPrice, todayForecast.direction, todayForecast.confidence);
        recordSeenNews(upper, todayNewsAnalyses);
        setState(upper, currentPrice, todayHorizon.compositeScore);
    }

    return {
        ok: true,
        data: {
            symbol: upper,
            modelVersion: PREDICT_AI_MODEL_VERSION,
            generatedAt: Math.floor(nowMs / 1000),
            todayForecast,
            horizons,
            news: todayNewsAnalyses.slice(0, 12),
            dataAvailability: {
                newsAvailable: newsFeed.available,
                fundamentalsAvailable: fundamentals.available,
                marketConditionAvailable: marketCondition.available,
            },
            triggerReason: trigger.reason,
        },
    };
}
