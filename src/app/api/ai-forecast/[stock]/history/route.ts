import { NextResponse } from 'next/server';
import { isTradableSymbol, normalizeTradableTicker } from '@/lib/assetCatalog';
import { getHistoricalData, getIntradayData } from '@/lib/marketData';
import { simpleMovingAverage, clamp } from '@/lib/predictionEngine/indicators';
import { runFullAnalysis } from '@/lib/predictionEngine/analyze';

const RANGE_DAYS: Record<string, number> = {
    '1W': 7,
    '1M': 30,
    '3M': 90,
    '6M': 182,
    '1Y': 365,
    '5Y': 1825,
};

/**
 * How far the projected-trend cone extends, scaled to the chart range the user picked —
 * a 1W view projects ~1 week ahead, a 5Y view projects ~3 years ahead (the model's longest
 * supported horizon), etc. Values are trading days except '1D', which is handled separately
 * (intraday minutes rather than calendar days).
 */
const RANGE_TO_FORECAST_TRADING_DAYS: Record<string, number> = {
    '1W': 5,
    '1M': 21,
    '3M': 63,
    '6M': 126,
    '1Y': 252,
    '5Y': 756, // longest horizon the model supports (3 years)
};

const RANGE_TO_FORECAST_LABEL: Record<string, string> = {
    '1D': 'next few hours',
    '1W': 'next week',
    '1M': 'next month',
    '3M': 'next 3 months',
    '6M': 'next 6 months',
    '1Y': 'next year',
    '5Y': 'next 3 years',
};

export async function GET(request: Request, { params }: { params: Promise<{ stock: string }> }) {
    const { stock } = await params;
    const ticker = normalizeTradableTicker(stock);
    if (!ticker || !isTradableSymbol(ticker)) {
        return NextResponse.json({ error: 'Unknown or unsupported ticker.' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') || '3M').toUpperCase();
    const includeForecast = searchParams.get('forecast') !== '0';

    let history;
    if (range === '1D') {
        history = await getIntradayData(ticker);
    } else {
        const days = RANGE_DAYS[range] ?? 90;
        history = await getHistoricalData(ticker, days);
    }

    if (!history.length) {
        return NextResponse.json({
            stock: ticker,
            range,
            history: [],
            overlays: null,
            forecastCone: null,
            error: 'No chart data available for this symbol/range right now.',
        });
    }

    const closes = history.map(b => b.close);
    const sma20 = simpleMovingAverage(closes, 20);
    const sma50 = simpleMovingAverage(closes, 50);

    interface ConePoint { time: string | number; low: number; mid: number; high: number }
    let forecastCone: { points: ConePoint[]; horizonLabel: string } | null = null;

    if (includeForecast) {
        try {
            const analysis = await runFullAnalysis(ticker);
            if (analysis.ok) {
                const { prediction, quote } = analysis.data;
                const compositeNorm = clamp(prediction.compositeScore / 100, -1, 1);
                const annualDrift = compositeNorm * 0.25 * prediction.confidence;
                const annualVol = prediction.annualizedVolatility ?? 0.35;
                const points: ConePoint[] = [];

                if (range === '1D') {
                    // Intraday: project the next ~2 hours in 10-minute steps (fraction of a 6.5h trading day).
                    const lastBar = history[history.length - 1] as { timeUtc?: number; date: string };
                    const lastTimeUtc = lastBar.timeUtc ?? Math.floor(Date.parse(lastBar.date) / 1000);
                    const stepsAhead = 12; // 12 x 10min = 2 hours
                    for (let s = 1; s <= stepsAhead; s++) {
                        const fractionOfDay = (s * 10) / (6.5 * 60); // 6.5h trading session
                        const t = fractionOfDay / 252;
                        const driftLog = annualDrift * t;
                        const sigma = annualVol * Math.sqrt(t);
                        points.push({
                            time: lastTimeUtc + s * 10 * 60,
                            mid: quote.price * Math.exp(driftLog),
                            low: quote.price * Math.exp(driftLog - sigma),
                            high: quote.price * Math.exp(driftLog + sigma),
                        });
                    }
                } else {
                    const tradingDaysAhead = RANGE_TO_FORECAST_TRADING_DAYS[range] ?? 21;
                    const lastDate = new Date(history[history.length - 1].date);
                    // Sample at most ~60 points so long horizons (3Y) stay light on the chart.
                    const step = Math.max(1, Math.round(tradingDaysAhead / 60));
                    for (let d = step; d <= tradingDaysAhead; d += step) {
                        const t = d / 252;
                        const driftLog = annualDrift * t;
                        const sigma = annualVol * Math.sqrt(t);
                        const futureDate = new Date(lastDate);
                        // approximate trading-day -> calendar-day spacing (5/7 trading days per week)
                        futureDate.setDate(futureDate.getDate() + Math.round(d * 1.4));
                        points.push({
                            time: futureDate.toISOString().split('T')[0],
                            mid: quote.price * Math.exp(driftLog),
                            low: quote.price * Math.exp(driftLog - sigma),
                            high: quote.price * Math.exp(driftLog + sigma),
                        });
                    }
                }

                forecastCone = { points, horizonLabel: RANGE_TO_FORECAST_LABEL[range] ?? 'upcoming period' };
            }
        } catch (e) {
            console.warn('[ai-forecast/history] forecast cone generation failed (non-critical):', e);
        }
    }

    return NextResponse.json({
        stock: ticker,
        range,
        history,
        overlays: { sma20, sma50 },
        forecastCone,
    });
}
