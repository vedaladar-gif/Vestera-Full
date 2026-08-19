import { NextResponse } from 'next/server';
import { isTradableSymbol, normalizeTradableTicker } from '@/lib/assetCatalog';
import { runFullAnalysis } from '@/lib/predictionEngine/analyze';
import { logLivePrediction } from '@/lib/aiForecast/store';
import { getSession } from '@/lib/session';
import { getHoldings } from '@/lib/models';

/** In-memory cache of the full analysis payload — avoids re-running the model pipeline on every page view/poll. */
const ANALYSIS_TTL_MS = 2 * 60 * 1000;
const analysisCache = new Map<string, { ts: number; payload: unknown }>();

export async function GET(request: Request, { params }: { params: Promise<{ stock: string }> }) {
    const { stock } = await params;
    const ticker = normalizeTradableTicker(stock);

    if (!ticker || !isTradableSymbol(ticker)) {
        return NextResponse.json({ error: 'Unknown or unsupported ticker.' }, { status: 400 });
    }

    const cached = analysisCache.get(ticker);
    if (cached && Date.now() - cached.ts < ANALYSIS_TTL_MS) {
        return NextResponse.json(await attachUserContext(cached.payload, ticker));
    }

    let result;
    try {
        result = await runFullAnalysis(ticker);
    } catch (e) {
        console.error(`[ai-forecast] analysis failed for ${ticker}:`, e);
        return NextResponse.json(
            { error: 'Unable to retrieve current market data. Please try again.' },
            { status: 502 }
        );
    }

    if (!result.ok) {
        if (result.reason === 'no-market-data') {
            return NextResponse.json(
                { error: 'Unable to retrieve current market data. Please try again.' },
                { status: 502 }
            );
        }
        return NextResponse.json(
            {
                error: 'Insufficient data to generate a reliable forecast.',
                reason: 'This symbol does not have enough historical price history for the model to analyze.',
            },
            { status: 422 }
        );
    }

    const { data } = result;

    try {
        for (const h of [...data.shortTerm, ...data.longTerm]) {
            logLivePrediction(ticker, data.prediction.compositeScore, h, data.quote.price);
        }
    } catch (e) {
        console.warn('[ai-forecast] failed to log live prediction (non-critical):', e);
    }

    const payload = {
        symbol: data.symbol,
        quote: data.quote,
        fundamentalsAvailable: data.fundamentals.available,
        fundamentals: data.fundamentals,
        outlook: {
            category: data.prediction.category,
            compositeScore: data.prediction.compositeScore,
            confidence: data.prediction.confidence,
            probabilityUp: data.prediction.probabilityUp,
            riskScore: data.prediction.riskScore,
            annualizedVolatility: data.prediction.annualizedVolatility,
        },
        shortTerm: data.shortTerm,
        longTerm: data.longTerm,
        scenarios: data.scenarios,
        risk: data.risk,
        factors: data.factors,
        summary: data.summary,
        dataUpdatedAt: data.dataUpdatedAt,
    };

    analysisCache.set(ticker, { ts: Date.now(), payload });

    return NextResponse.json(await attachUserContext(payload, ticker));
}

async function attachUserContext(payload: unknown, ticker: string) {
    const session = await getSession();
    if (!session.userId) return { ...(payload as object), userContext: { authenticated: false } };

    try {
        const holdings = await getHoldings(session.userId);
        const position = holdings.find(h => h.stock === ticker);
        return {
            ...(payload as object),
            userContext: {
                authenticated: true,
                ownsPosition: !!position,
                shares: position?.shares ?? 0,
            },
        };
    } catch {
        return { ...(payload as object), userContext: { authenticated: true } };
    }
}
