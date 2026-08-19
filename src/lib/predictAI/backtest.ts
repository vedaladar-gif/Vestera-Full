/**
 * Walk-forward backtesting for Vestera Predict AI.
 *
 * Methodology: at each simulated historical date T, technical signals are
 * recomputed using ONLY price/volume bars up to and including T (no
 * look-ahead), then compared against the real subsequent close.
 *
 * Disclosed limitation (shown to users in the UI, never hidden): a free news
 * archive going back years isn't available, so historical backtests cannot
 * replay the news-analysis component — doing so would require either
 * fabricating historical headlines or leaking today's news into the past,
 * both of which this app refuses to do. Backtests therefore validate the
 * technical + fundamentals-snapshot signals only; the live news component is
 * exercised in real time for current predictions, and its effect is visible
 * in the prediction-history timeline (`/api/predict-ai/[stock]/history-log`)
 * rather than in the backtest accuracy numbers.
 */
import { getHistoricalData } from '@/lib/marketData';
import type { StockFundamentals } from '@/lib/marketData';
import { computeTechnicalSignal } from './technicalSignal';
import { computeFundamentalSignal } from './fundamentalSignal';
import { computeHorizonPrediction } from './combine';
import { saveBacktestRun, type PredictAIBacktestRunSummary } from './store';

const BACKTEST_HORIZONS: Array<{ key: 'TODAY' | '1W' | '1M'; label: string; tradingDays: number }> = [
    { key: 'TODAY', label: 'Today', tradingDays: 1 },
    { key: '1W', label: '1 Week', tradingDays: 5 },
    { key: '1M', label: '1 Month', tradingDays: 21 },
];

const BACKTEST_LOOKBACK_DAYS = 1100;
const MIN_HISTORY_FOR_MODEL = 80;
const STEP = 3;

export const PREDICT_AI_BACKTEST_METHODOLOGY =
    'Walk-forward simulation using only technical price/volume signals available at each simulated date (no look-ahead), compared against the real subsequent close. Fundamentals reuse today\'s snapshot at every simulated date (not available historically). News/sentiment and market-condition/sector signals are NOT included in this backtest — no historical news archive is available, so replaying them would require fabricating past headlines. The live news-analysis component runs in real time for current predictions only; its effect on live forecasts is visible in the prediction-history timeline, not in these accuracy numbers.';

export async function runPredictAIBacktest(symbol: string, fundamentals: StockFundamentals): Promise<PredictAIBacktestRunSummary | null> {
    const upper = symbol.toUpperCase();
    const bars = await getHistoricalData(upper, BACKTEST_LOOKBACK_DAYS);
    const closes = bars.map(b => b.close).filter(c => c > 0);
    if (closes.length < MIN_HISTORY_FOR_MODEL + 30) return null;

    const fundamentalScore = computeFundamentalSignal(fundamentals);
    const maxHorizonDays = Math.max(...BACKTEST_HORIZONS.map(h => h.tradingDays));
    const results: Parameters<typeof saveBacktestRun>[0]['results'] = [];

    for (let i = MIN_HISTORY_FOR_MODEL; i < bars.length - maxHorizonDays; i += STEP) {
        const truncatedBars = bars.slice(0, i + 1);
        const priceAtT = truncatedBars[truncatedBars.length - 1].close;
        if (!(priceAtT > 0)) continue;
        const asOfDate = new Date(bars[i].date);
        const technical = computeTechnicalSignal(truncatedBars);

        for (const hDef of BACKTEST_HORIZONS) {
            const targetIndex = i + hDef.tradingDays;
            if (targetIndex >= bars.length) continue;
            const actualPrice = bars[targetIndex].close;
            if (!(actualPrice > 0)) continue;

            const prediction = computeHorizonPrediction(
                hDef.key,
                hDef,
                {
                    technical: technical.score,
                    fundamental: fundamentalScore,
                    fundamentalAvailable: fundamentals.available,
                    marketCondition: 0,
                    marketConditionAvailable: false,
                    sector: 0,
                    sectorAvailable: false,
                    newsSignal: 0,
                    newsDataWeight: 0,
                    newsConfidenceAvg: 0,
                },
                priceAtT,
                technical.annualizedVolatility,
                asOfDate
            );

            const actualReturnPct = ((actualPrice - priceAtT) / priceAtT) * 100;
            const errorPct = ((actualPrice - prediction.predictedPrice) / priceAtT) * 100;
            const predictedDirection = prediction.compositeScore >= 0 ? 'UP' : 'DOWN';
            const actualDirection = actualReturnPct >= 0 ? 'UP' : 'DOWN';

            results.push({
                horizon: hDef.key,
                asOfDate: bars[i].date,
                predictedDirection,
                predictedPrice: prediction.predictedPrice,
                actualPrice,
                actualReturnPct,
                directionCorrect: predictedDirection === actualDirection,
                errorPct,
            });
        }
    }

    if (results.length === 0) return null;

    return saveBacktestRun({
        symbol: upper,
        methodology: PREDICT_AI_BACKTEST_METHODOLOGY,
        periodStart: bars[MIN_HISTORY_FOR_MODEL]?.date ?? '',
        periodEnd: bars[bars.length - 1]?.date ?? '',
        results,
    });
}
