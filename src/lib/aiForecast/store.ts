/**
 * Persistence for the AI Forecast feature — local SQLite (via the app's
 * existing `getDb()`), same as `inquiries.ts`. Predictions/backtests are
 * derived, recomputable analytics data (not user account data), so this
 * intentionally does not require any Supabase table/RLS setup to work.
 */
import { getDb } from '@/lib/db';
import type { HorizonForecast } from '@/lib/predictionEngine/types';

export interface StoredPrediction {
    id: number;
    symbol: string;
    horizon: string;
    generatedAt: string;
    asOfPrice: number;
    predictedDirection: string;
    probabilityUp: number;
    predictedLow: number;
    predictedHigh: number;
    confidence: number;
    compositeScore: number;
    targetDate: string;
    actualPrice: number | null;
    resolvedAt: string | null;
    directionCorrect: 0 | 1 | null;
    errorPct: number | null;
}

const HORIZON_TO_CALENDAR_DAYS: Record<string, number> = {
    '1D': 1,
    '1W': 7,
    '1M': 30,
    '3M': 91,
    '6M': 182,
    '1Y': 365,
    '3Y': 1095,
};

/** Logs each live forecast so it can be scored against reality once its horizon elapses. Dedupes within a 6h window per symbol+horizon to avoid table bloat from repeated page views. */
export function logLivePrediction(symbol: string, compositeScore: number, horizon: HorizonForecast, asOfPrice: number): void {
    const db = getDb();
    const now = new Date();
    const recentCutoff = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();

    const existing = db
        .prepare(
            `SELECT id FROM ai_predictions WHERE symbol = ? AND horizon = ? AND generated_at > ? ORDER BY id DESC LIMIT 1`
        )
        .get(symbol, horizon.key, recentCutoff);
    if (existing) return;

    const targetDate = new Date(now.getTime() + (HORIZON_TO_CALENDAR_DAYS[horizon.key] ?? 1) * 86_400_000);

    db.prepare(
        `INSERT INTO ai_predictions
      (symbol, horizon, generated_at, as_of_price, predicted_direction, probability_up, predicted_low, predicted_high, confidence, composite_score, target_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
        symbol,
        horizon.key,
        now.toISOString(),
        asOfPrice,
        horizon.direction,
        horizon.probabilityUp,
        horizon.priceLow,
        horizon.priceHigh,
        horizon.confidence,
        compositeScore,
        targetDate.toISOString()
    );
}

/** Resolves any pending live predictions whose target date has passed, using the real historical closing price. */
export async function resolvePendingPredictions(
    symbol: string,
    getPriceAt: (isoDate: string) => Promise<number | null>
): Promise<void> {
    const db = getDb();
    const nowIso = new Date().toISOString();
    const pending = db
        .prepare(
            `SELECT id, target_date, as_of_price, predicted_direction FROM ai_predictions
       WHERE symbol = ? AND resolved_at IS NULL AND target_date <= ?`
        )
        .all(symbol, nowIso) as { id: number; target_date: string; as_of_price: number; predicted_direction: string }[];

    for (const row of pending) {
        const actual = await getPriceAt(row.target_date);
        if (actual === null) continue;
        const actualDirection = actual >= row.as_of_price ? 'bullish' : 'bearish';
        const correct = actualDirection === row.predicted_direction ? 1 : 0;
        const errorPct = row.as_of_price > 0 ? ((actual - row.as_of_price) / row.as_of_price) * 100 : 0;
        db.prepare(
            `UPDATE ai_predictions SET actual_price = ?, resolved_at = ?, direction_correct = ?, error_pct = ? WHERE id = ?`
        ).run(actual, new Date().toISOString(), correct, errorPct, row.id);
    }
}

export interface BacktestRunSummary {
    id: number;
    symbol: string;
    runAt: string;
    methodology: string;
    periodStart: string;
    periodEnd: string;
    sampleCount: number;
}

export function saveBacktestRun(params: {
    symbol: string;
    methodology: string;
    periodStart: string;
    periodEnd: string;
    results: Array<{
        horizon: string;
        asOfDate: string;
        predictedDirection: string;
        probabilityUp: number;
        predictedPrice: number;
        actualPrice: number;
        actualReturnPct: number;
        directionCorrect: boolean;
        errorPct: number;
    }>;
}): BacktestRunSummary {
    const db = getDb();
    const runAt = new Date().toISOString();

    const insertRun = db.prepare(
        `INSERT INTO ai_backtest_runs (symbol, run_at, methodology, period_start, period_end, sample_count) VALUES (?, ?, ?, ?, ?, ?)`
    );
    const info = insertRun.run(params.symbol, runAt, params.methodology, params.periodStart, params.periodEnd, params.results.length);
    const runId = Number(info.lastInsertRowid);

    const insertResult = db.prepare(
        `INSERT INTO ai_backtest_results
      (run_id, symbol, horizon, as_of_date, predicted_direction, probability_up, predicted_price, actual_price, actual_return_pct, direction_correct, error_pct)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertMany = db.transaction((rows: typeof params.results) => {
        for (const r of rows) {
            insertResult.run(
                runId,
                params.symbol,
                r.horizon,
                r.asOfDate,
                r.predictedDirection,
                r.probabilityUp,
                r.predictedPrice,
                r.actualPrice,
                r.actualReturnPct,
                r.directionCorrect ? 1 : 0,
                r.errorPct
            );
        }
    });
    insertMany(params.results);

    return {
        id: runId,
        symbol: params.symbol,
        runAt,
        methodology: params.methodology,
        periodStart: params.periodStart,
        periodEnd: params.periodEnd,
        sampleCount: params.results.length,
    };
}

export function getLatestBacktestRun(symbol: string): BacktestRunSummary | null {
    const db = getDb();
    const row = db
        .prepare(
            `SELECT id, symbol, run_at as runAt, methodology, period_start as periodStart, period_end as periodEnd, sample_count as sampleCount
       FROM ai_backtest_runs WHERE symbol = ? ORDER BY id DESC LIMIT 1`
        )
        .get(symbol) as BacktestRunSummary | undefined;
    return row ?? null;
}

export interface AccuracyByHorizon {
    horizon: string;
    sampleCount: number;
    directionAccuracyPct: number | null;
    avgAbsErrorPct: number | null;
    bullishAccuracyPct: number | null;
    bearishAccuracyPct: number | null;
}

export function getModelAccuracy(symbol: string, runId: number): AccuracyByHorizon[] {
    const db = getDb();
    const rows = db
        .prepare(
            `SELECT horizon, predicted_direction as predictedDirection, direction_correct as directionCorrect, error_pct as errorPct
       FROM ai_backtest_results WHERE run_id = ? AND symbol = ?`
        )
        .all(runId, symbol) as { predictedDirection: string; directionCorrect: number; errorPct: number; horizon: string }[];

    const byHorizon = new Map<string, typeof rows>();
    for (const r of rows) {
        if (!byHorizon.has(r.horizon)) byHorizon.set(r.horizon, []);
        byHorizon.get(r.horizon)!.push(r);
    }

    const out: AccuracyByHorizon[] = [];
    for (const [horizon, group] of byHorizon) {
        const total = group.length;
        const correct = group.filter(g => g.directionCorrect === 1).length;
        const bullish = group.filter(g => g.predictedDirection === 'bullish');
        const bearish = group.filter(g => g.predictedDirection === 'bearish');
        const avgErr = group.reduce((s, g) => s + Math.abs(g.errorPct), 0) / (total || 1);

        out.push({
            horizon,
            sampleCount: total,
            directionAccuracyPct: total > 0 ? (correct / total) * 100 : null,
            avgAbsErrorPct: total > 0 ? avgErr : null,
            bullishAccuracyPct:
                bullish.length > 0 ? (bullish.filter(g => g.directionCorrect === 1).length / bullish.length) * 100 : null,
            bearishAccuracyPct:
                bearish.length > 0 ? (bearish.filter(g => g.directionCorrect === 1).length / bearish.length) * 100 : null,
        });
    }
    return out.sort((a, b) => ['1D', '1W', '1M'].indexOf(a.horizon) - ['1D', '1W', '1M'].indexOf(b.horizon));
}

// ── Watchlist ────────────────────────────────────────────────────────────
export function addToWatchlist(userId: string, symbol: string): void {
    const db = getDb();
    db.prepare(`INSERT OR IGNORE INTO ai_watchlist (user_id, symbol, created_at) VALUES (?, ?, ?)`).run(
        userId,
        symbol.toUpperCase(),
        new Date().toISOString()
    );
}

export function removeFromWatchlist(userId: string, symbol: string): void {
    const db = getDb();
    db.prepare(`DELETE FROM ai_watchlist WHERE user_id = ? AND symbol = ?`).run(userId, symbol.toUpperCase());
}

export function getWatchlist(userId: string): string[] {
    const db = getDb();
    const rows = db
        .prepare(`SELECT symbol FROM ai_watchlist WHERE user_id = ? ORDER BY created_at DESC`)
        .all(userId) as { symbol: string }[];
    return rows.map(r => r.symbol);
}

export function isInWatchlist(userId: string, symbol: string): boolean {
    const db = getDb();
    const row = db.prepare(`SELECT 1 FROM ai_watchlist WHERE user_id = ? AND symbol = ?`).get(userId, symbol.toUpperCase());
    return !!row;
}
