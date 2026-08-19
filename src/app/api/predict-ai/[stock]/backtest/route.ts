import { NextResponse } from 'next/server';
import { isTradableSymbol, normalizeTradableTicker } from '@/lib/assetCatalog';
import { getFundamentals } from '@/lib/marketData';
import { runPredictAIBacktest, PREDICT_AI_BACKTEST_METHODOLOGY } from '@/lib/predictAI/backtest';
import { getLatestBacktestRun, getModelAccuracy } from '@/lib/predictAI/store';
import { PREDICT_AI_MODEL_VERSION } from '@/lib/predictAI/types';

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;
const inFlight = new Map<string, Promise<ReturnType<typeof getLatestBacktestRun>>>();

export async function GET(request: Request, { params }: { params: Promise<{ stock: string }> }) {
    const { stock } = await params;
    const ticker = normalizeTradableTicker(stock);
    if (!ticker || !isTradableSymbol(ticker)) {
        return NextResponse.json({ error: 'Unknown or unsupported ticker.' }, { status: 400 });
    }

    let run = getLatestBacktestRun(ticker);
    const isStale = !run || Date.now() - new Date(run.runAt).getTime() > STALE_AFTER_MS;

    if (isStale) {
        if (!inFlight.has(ticker)) {
            inFlight.set(
                ticker,
                (async () => {
                    try {
                        const fundamentals = await getFundamentals(ticker);
                        const fresh = await runPredictAIBacktest(ticker, fundamentals);
                        return fresh ?? getLatestBacktestRun(ticker);
                    } finally {
                        inFlight.delete(ticker);
                    }
                })()
            );
        }
        const fresh = await inFlight.get(ticker)!;
        if (fresh) run = fresh;
    }

    if (!run) {
        return NextResponse.json(
            { error: 'Insufficient data to generate a reliable forecast.', reason: 'Not enough historical data to backtest this symbol.' },
            { status: 422 }
        );
    }

    const accuracy = getModelAccuracy(ticker, run.id);

    return NextResponse.json({
        symbol: ticker,
        modelVersion: PREDICT_AI_MODEL_VERSION,
        methodology: PREDICT_AI_BACKTEST_METHODOLOGY,
        periodStart: run.periodStart,
        periodEnd: run.periodEnd,
        runAt: run.runAt,
        sampleCount: run.sampleCount,
        accuracy,
    });
}
