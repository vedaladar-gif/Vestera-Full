/**
 * Walk-forward backtesting.
 *
 * Methodology: for each historical "as of" date T, the model is run using
 * ONLY price/volume bars up to and including T (no look-ahead) to generate a
 * prediction for each short-term horizon. The prediction is then compared
 * against the REAL close price that actually occurred T+horizon sessions
 * later. This avoids the look-ahead bias a random train/test split would
 * introduce for time-series data.
 *
 * Known limitation (disclosed to users in the Model Performance section):
 * company fundamentals (P/E, growth, analyst consensus) are not available
 * historically from the free data provider used here, so backtests reuse
 * today's fundamentals snapshot at every simulated date. This mainly affects
 * the fundamentals-weighted ~30% of the composite score; the technical
 * signals (70% of the weight) are fully point-in-time correct.
 */
import { getHistoricalData } from '@/lib/marketData';
import type { StockFundamentals } from '@/lib/marketData';
import { generatePrediction } from '@/lib/predictionEngine/model';
import { generateForecastHorizons, type HorizonDef } from '@/lib/predictionEngine/forecast';
import { saveBacktestRun, type BacktestRunSummary } from './store';

const BACKTEST_HORIZONS: HorizonDef[] = [
    { key: '1D', label: '1 Day', tradingDays: 1 },
    { key: '1W', label: '1 Week', tradingDays: 5 },
    { key: '1M', label: '1 Month', tradingDays: 21 },
];

const BACKTEST_LOOKBACK_DAYS = 1100; // ~3 calendar years
const MIN_HISTORY_FOR_MODEL = 210; // 200-day SMA + buffer
const STEP = 3; // trading days between simulated predictions (perf/sample-count balance)

export const BACKTEST_METHODOLOGY =
    'Walk-forward simulation: at each simulated date, the model uses only price/volume history available up to that date (no look-ahead) to predict 1D/1W/1M direction, then compares against the real subsequent close. Fundamentals are not available historically from the free data provider, so backtests reuse the current fundamentals snapshot at every simulated date — this affects roughly 30% of the composite score.';

export async function runBacktest(symbol: string, fundamentals: StockFundamentals): Promise<BacktestRunSummary | null> {
    const upper = symbol.toUpperCase();
    const [bars, spyBars] = await Promise.all([
        getHistoricalData(upper, BACKTEST_LOOKBACK_DAYS),
        upper === 'SPY' ? Promise.resolve([]) : getHistoricalData('SPY', BACKTEST_LOOKBACK_DAYS),
    ]);

    const closes = bars.map(b => b.close).filter(c => c > 0);
    if (closes.length < MIN_HISTORY_FOR_MODEL + 30) return null;

    const spyCloses = spyBars.length === bars.length ? spyBars.map(b => b.close) : null;
    const maxHorizonDays = Math.max(...BACKTEST_HORIZONS.map(h => h.tradingDays));

    const results: Parameters<typeof saveBacktestRun>[0]['results'] = [];

    for (let i = MIN_HISTORY_FOR_MODEL; i < closes.length - maxHorizonDays; i += STEP) {
        const truncatedCloses = closes.slice(0, i + 1);
        const truncatedBars = bars.slice(0, i + 1);
        const truncatedSpy = spyCloses ? spyCloses.slice(0, i + 1) : null;
        const priceAtT = truncatedCloses[truncatedCloses.length - 1];
        const asOfDate = bars[i].date;

        const prediction = generatePrediction({
            closes: truncatedCloses,
            bars: truncatedBars,
            spyCloses: truncatedSpy,
            fundamentals,
        });

        const horizonForecasts = generateForecastHorizons({
            horizons: BACKTEST_HORIZONS,
            price: priceAtT,
            compositeScore: prediction.compositeScore,
            confidence: prediction.confidence,
            annualizedVolatility: prediction.annualizedVolatility,
            signals: prediction.signals,
            raw: prediction.raw,
        });

        // For binary directional scoring, resolve "neutral" to the composite score's sign (standard backtest convention).
        const predictedDirection = prediction.compositeScore >= 0 ? 'bullish' : 'bearish';

        for (const hf of horizonForecasts) {
            const targetIndex = i + hf.tradingDays;
            if (targetIndex >= closes.length) continue;
            const actualPrice = closes[targetIndex];
            const actualReturnPct = ((actualPrice - priceAtT) / priceAtT) * 100;
            const predictedPrice = priceAtT * (1 + hf.expectedReturnPct / 100);
            const errorPct = ((actualPrice - predictedPrice) / priceAtT) * 100;
            const actualDirection = actualReturnPct >= 0 ? 'bullish' : 'bearish';

            results.push({
                horizon: hf.key,
                asOfDate,
                predictedDirection,
                probabilityUp: hf.probabilityUp,
                predictedPrice,
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
        methodology: BACKTEST_METHODOLOGY,
        periodStart: bars[MIN_HISTORY_FOR_MODEL]?.date ?? '',
        periodEnd: bars[bars.length - 1]?.date ?? '',
        results,
    });
}
