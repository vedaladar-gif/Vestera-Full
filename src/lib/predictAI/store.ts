/**
 * Persistence for Vestera Predict AI — local SQLite via the app's existing
 * `getDb()` (same pattern as `src/lib/aiForecast/store.ts`). Stores: live
 * predictions (for accuracy tracking), a human-readable prediction-history
 * timeline, backtest runs/results, and the "last seen" news/state snapshot
 * used to detect when a recompute is actually warranted.
 */
import { getDb } from '@/lib/db';
import { PREDICT_AI_MODEL_VERSION } from './types';
import type { Direction, HorizonPrediction, NewsAnalysis, PredictionHistoryEntry } from './types';

const HORIZON_TO_CALENDAR_DAYS: Record<string, number> = {
    TODAY: 1,
    '1W': 7,
    '1M': 30,
    '3M': 91,
    '6M': 182,
    '1Y': 365,
};

export function logPrediction(symbol: string, horizon: HorizonPrediction, triggerReason: string, news: NewsAnalysis[]): void {
    const db = getDb();
    const now = new Date();
    const targetDate = new Date(now.getTime() + (HORIZON_TO_CALENDAR_DAYS[horizon.key] ?? 1) * 86_400_000);
    const newsSnapshot = JSON.stringify(
        news.slice(0, 8).map(n => ({ title: n.item.title, sentiment: Math.round(n.sentiment * 100) / 100, eventType: n.eventType }))
    );

    db.prepare(
        `INSERT INTO predictai_predictions
      (symbol, horizon, generated_at, as_of_price, predicted_price, predicted_direction, confidence, composite_score, target_date, news_snapshot, trigger_reason, model_version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
        symbol,
        horizon.key,
        now.toISOString(),
        horizon.currentPrice,
        horizon.predictedPrice,
        horizon.direction,
        horizon.confidence,
        horizon.compositeScore,
        targetDate.toISOString(),
        newsSnapshot,
        triggerReason,
        PREDICT_AI_MODEL_VERSION
    );
}

export function appendHistoryLog(symbol: string, triggerReason: string, note: string, todayPredictedPrice: number, direction: Direction, confidence: number): void {
    const db = getDb();
    db.prepare(
        `INSERT INTO predictai_history_log (symbol, ts, trigger_reason, note, predicted_price, direction, confidence) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(symbol, new Date().toISOString(), triggerReason, note, todayPredictedPrice, direction, confidence);
}

export interface HistoryLogRow extends PredictionHistoryEntry {}

export function getHistoryLog(symbol: string, limit = 25): HistoryLogRow[] {
    const db = getDb();
    const rows = db
        .prepare(
            `SELECT ts, trigger_reason as triggerReason, note, predicted_price as predictedPrice, direction, confidence
       FROM predictai_history_log WHERE symbol = ? ORDER BY id DESC LIMIT ?`
        )
        .all(symbol, limit) as HistoryLogRow[];
    return rows;
}

export interface PredictAIState {
    symbol: string;
    computedAt: string;
    asOfPrice: number;
    compositeScore: number;
}

export function getState(symbol: string): PredictAIState | null {
    const db = getDb();
    const row = db
        .prepare(`SELECT symbol, computed_at as computedAt, as_of_price as asOfPrice, composite_score as compositeScore FROM predictai_state WHERE symbol = ?`)
        .get(symbol) as PredictAIState | undefined;
    return row ?? null;
}

export function setState(symbol: string, asOfPrice: number, compositeScore: number): void {
    const db = getDb();
    db.prepare(
        `INSERT INTO predictai_state (symbol, computed_at, as_of_price, composite_score) VALUES (?, ?, ?, ?)
     ON CONFLICT(symbol) DO UPDATE SET computed_at = excluded.computed_at, as_of_price = excluded.as_of_price, composite_score = excluded.composite_score`
    ).run(symbol, new Date().toISOString(), asOfPrice, compositeScore);
}

export interface SeenNewsRow {
    uuid: string;
}

export function getSeenNewsUuids(symbol: string): Set<string> {
    const db = getDb();
    const rows = db.prepare(`SELECT uuid FROM predictai_news_seen WHERE symbol = ?`).all(symbol) as SeenNewsRow[];
    return new Set(rows.map(r => r.uuid));
}

export function recordSeenNews(symbol: string, analyses: NewsAnalysis[]): void {
    const db = getDb();
    const insert = db.prepare(
        `INSERT OR IGNORE INTO predictai_news_seen (symbol, uuid, title, published_at, first_seen_at, event_type, sentiment, importance)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const tx = db.transaction((rows: NewsAnalysis[]) => {
        for (const a of rows) {
            insert.run(
                symbol,
                a.item.uuid,
                a.item.title,
                new Date(a.item.publishedAt * 1000).toISOString(),
                new Date().toISOString(),
                a.eventType,
                a.sentiment,
                a.importance
            );
        }
    });
    tx(analyses);
}

// ── Backtest persistence (mirrors src/lib/aiForecast/store.ts shape) ──────
export interface PredictAIBacktestRunSummary {
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
        predictedPrice: number;
        actualPrice: number;
        actualReturnPct: number;
        directionCorrect: boolean;
        errorPct: number;
    }>;
}): PredictAIBacktestRunSummary {
    const db = getDb();
    const runAt = new Date().toISOString();

    const info = db
        .prepare(`INSERT INTO predictai_backtest_runs (symbol, run_at, methodology, period_start, period_end, sample_count) VALUES (?, ?, ?, ?, ?, ?)`)
        .run(params.symbol, runAt, params.methodology, params.periodStart, params.periodEnd, params.results.length);
    const runId = Number(info.lastInsertRowid);

    const insertResult = db.prepare(
        `INSERT INTO predictai_backtest_results
      (run_id, symbol, horizon, as_of_date, predicted_direction, predicted_price, actual_price, actual_return_pct, direction_correct, error_pct)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertMany = db.transaction((rows: typeof params.results) => {
        for (const r of rows) {
            insertResult.run(
                runId,
                params.symbol,
                r.horizon,
                r.asOfDate,
                r.predictedDirection,
                r.predictedPrice,
                r.actualPrice,
                r.actualReturnPct,
                r.directionCorrect ? 1 : 0,
                r.errorPct
            );
        }
    });
    insertMany(params.results);

    return { id: runId, symbol: params.symbol, runAt, methodology: params.methodology, periodStart: params.periodStart, periodEnd: params.periodEnd, sampleCount: params.results.length };
}

export function getLatestBacktestRun(symbol: string): PredictAIBacktestRunSummary | null {
    const db = getDb();
    const row = db
        .prepare(
            `SELECT id, symbol, run_at as runAt, methodology, period_start as periodStart, period_end as periodEnd, sample_count as sampleCount
       FROM predictai_backtest_runs WHERE symbol = ? ORDER BY id DESC LIMIT 1`
        )
        .get(symbol) as PredictAIBacktestRunSummary | undefined;
    return row ?? null;
}

export interface PredictAIAccuracyByHorizon {
    horizon: string;
    sampleCount: number;
    directionAccuracyPct: number | null;
    avgAbsErrorPct: number | null;
}

export function getModelAccuracy(symbol: string, runId: number): PredictAIAccuracyByHorizon[] {
    const db = getDb();
    const rows = db
        .prepare(`SELECT horizon, direction_correct as directionCorrect, error_pct as errorPct FROM predictai_backtest_results WHERE run_id = ? AND symbol = ?`)
        .all(runId, symbol) as { directionCorrect: number; errorPct: number; horizon: string }[];

    const byHorizon = new Map<string, typeof rows>();
    for (const r of rows) {
        if (!byHorizon.has(r.horizon)) byHorizon.set(r.horizon, []);
        byHorizon.get(r.horizon)!.push(r);
    }

    const order = ['TODAY', '1W', '1M', '3M', '6M', '1Y'];
    const out: PredictAIAccuracyByHorizon[] = [];
    for (const [horizon, group] of byHorizon) {
        const total = group.length;
        const correct = group.filter(g => g.directionCorrect === 1).length;
        const avgErr = group.reduce((s, g) => s + Math.abs(g.errorPct), 0) / (total || 1);
        out.push({
            horizon,
            sampleCount: total,
            directionAccuracyPct: total > 0 ? (correct / total) * 100 : null,
            avgAbsErrorPct: total > 0 ? avgErr : null,
        });
    }
    return out.sort((a, b) => order.indexOf(a.horizon) - order.indexOf(b.horizon));
}
