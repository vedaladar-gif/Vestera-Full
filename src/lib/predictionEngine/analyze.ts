/**
 * Top-level orchestration: fetches real market data via the provider
 * abstraction, runs the quant model, and assembles the full analysis payload
 * consumed by the AI Forecast API route + UI. Nothing here should contain
 * business/UI logic — that lives in the API route and React components.
 */
import { getFundamentals, getHistoricalData, getStockData } from '@/lib/marketData';
import type { StockFundamentals, StockQuote } from '@/lib/marketData';
import { generatePrediction, type RawStats } from './model';
import { explainFactors } from './explain';
import { LONG_TERM_HORIZONS, SHORT_TERM_HORIZONS, generateForecastHorizons } from './forecast';
import { generateScenarios } from './scenarios';
import { calculateRisk } from './risk';
import { generateSummary } from './summary';
import type { FactorExplanation, HorizonForecast, ModelPipelineOutput, RiskBreakdown, ScenarioSet } from './types';

/** Enough daily history for a 200-day SMA + volatility/drawdown lookback with margin. */
const MODEL_LOOKBACK_DAYS = 760;

export interface FullAnalysis {
    symbol: string;
    quote: StockQuote;
    fundamentals: StockFundamentals;
    prediction: ModelPipelineOutput & { raw: RawStats };
    shortTerm: HorizonForecast[];
    longTerm: HorizonForecast[];
    scenarios: ScenarioSet;
    risk: RiskBreakdown;
    factors: FactorExplanation;
    summary: string;
    dataUpdatedAt: number;
    insufficientData?: string;
}

export type AnalysisResult =
    | { ok: true; data: FullAnalysis }
    | { ok: false; reason: 'no-market-data' | 'insufficient-history' };

export async function runFullAnalysis(symbol: string): Promise<AnalysisResult> {
    const upper = symbol.toUpperCase();

    const [quote, fundamentals, bars, spyBars] = await Promise.all([
        getStockData(upper),
        getFundamentals(upper),
        getHistoricalData(upper, MODEL_LOOKBACK_DAYS),
        upper === 'SPY' ? Promise.resolve([]) : getHistoricalData('SPY', MODEL_LOOKBACK_DAYS),
    ]);

    if (!quote) {
        return { ok: false, reason: 'no-market-data' };
    }

    const closes = bars.map(b => b.close).filter(c => c > 0);
    if (closes.length < 30) {
        return { ok: false, reason: 'insufficient-history' };
    }

    const spyCloses = spyBars.length > 0 ? spyBars.map(b => b.close).filter(c => c > 0) : null;

    const prediction = generatePrediction({ closes, bars, spyCloses, fundamentals });

    const shortTerm = generateForecastHorizons({
        horizons: SHORT_TERM_HORIZONS,
        price: quote.price,
        compositeScore: prediction.compositeScore,
        confidence: prediction.confidence,
        annualizedVolatility: prediction.annualizedVolatility,
        signals: prediction.signals,
        raw: prediction.raw,
    });

    const longTerm = generateForecastHorizons({
        horizons: LONG_TERM_HORIZONS,
        price: quote.price,
        compositeScore: prediction.compositeScore,
        confidence: prediction.confidence,
        annualizedVolatility: prediction.annualizedVolatility,
        signals: prediction.signals,
        raw: prediction.raw,
    });

    const scenarios = generateScenarios({
        price: quote.price,
        horizonLabel: '1 Month',
        tradingDays: 21,
        compositeScore: prediction.compositeScore,
        confidence: prediction.confidence,
        annualizedVolatility: prediction.annualizedVolatility,
    });

    const risk = calculateRisk({
        closes,
        annualizedVolatility: prediction.annualizedVolatility,
        raw: prediction.raw,
        fundamentals,
    });

    const factors = explainFactors(prediction.signals, prediction.raw);

    const summary = generateSummary({
        symbol: upper,
        name: quote.name,
        prediction,
        factors,
        risk,
        expectedReturn1mPct: prediction.expectedReturn1m * 100,
    });

    return {
        ok: true,
        data: {
            symbol: upper,
            quote,
            fundamentals,
            prediction,
            shortTerm,
            longTerm,
            scenarios,
            risk,
            factors,
            summary,
            dataUpdatedAt: quote.fetchedAt,
        },
    };
}
