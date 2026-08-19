/**
 * Decides whether Vestera Predict AI should log a fresh prediction / history
 * entry, vs. reuse the same underlying (already-cached) computation. This is
 * the "efficient background processing, caching, and update triggers"
 * requirement: quote/history/fundamentals/news are already cached with TTLs
 * in `src/lib/marketData`, so recomputation itself is cheap; what this module
 * bounds is how often we WRITE to the prediction-history timeline, so it
 * reads as meaningful events rather than being spammed on every page view.
 */
import { getSeenNewsUuids, getState } from './store';
import type { NewsAnalysis } from './types';

const MIN_LOG_INTERVAL_MS = 90 * 1000; // never log more than ~once every 90s, even if a trigger fires
const SCHEDULED_REFRESH_MS = 15 * 60 * 1000; // force a periodic refresh entry at least this often
const PRICE_MOVE_THRESHOLD_PCT = 1.2; // "large unexpected price movement"
const NEWS_IMPORTANCE_THRESHOLD = 0.22; // importance * confidence combined bar for "meaningful" news

export type TriggerReason =
    | 'initial_computation'
    | 'news_detected'
    | 'price_move'
    | 'scheduled_refresh'
    | 'throttled'
    | 'no_change';

export interface TriggerDecision {
    reason: TriggerReason;
    shouldLog: boolean;
    newArticles: NewsAnalysis[];
    /** The actual observed price move (%) since the last computed state, when known — used for the 'price_move' history note. */
    priceChangePct?: number;
}

export function determineTrigger(symbol: string, currentPrice: number, todayNewsAnalyses: NewsAnalysis[]): TriggerDecision {
    const seen = getSeenNewsUuids(symbol);
    const newArticles = todayNewsAnalyses.filter(a => !seen.has(a.item.uuid));
    const meaningfulNew = newArticles.filter(
        a => a.importance * a.confidence >= NEWS_IMPORTANCE_THRESHOLD && a.timeRelevance !== 'STALE'
    );

    const state = getState(symbol);
    if (!state) {
        return { reason: 'initial_computation', shouldLog: true, newArticles };
    }

    const elapsedMs = Date.now() - new Date(state.computedAt).getTime();
    const priceChangePct = state.asOfPrice > 0 ? Math.abs(((currentPrice - state.asOfPrice) / state.asOfPrice) * 100) : 0;

    if (elapsedMs < MIN_LOG_INTERVAL_MS) {
        return { reason: 'throttled', shouldLog: false, newArticles };
    }
    if (meaningfulNew.length > 0) {
        return { reason: 'news_detected', shouldLog: true, newArticles: meaningfulNew, priceChangePct };
    }
    if (priceChangePct >= PRICE_MOVE_THRESHOLD_PCT) {
        return { reason: 'price_move', shouldLog: true, newArticles, priceChangePct };
    }
    if (elapsedMs >= SCHEDULED_REFRESH_MS) {
        return { reason: 'scheduled_refresh', shouldLog: true, newArticles };
    }
    return { reason: 'no_change', shouldLog: false, newArticles };
}

export function historyNoteFor(reason: TriggerReason, newArticles: NewsAnalysis[], predictedPrice: number, priceChangePct?: number): string {
    switch (reason) {
        case 'initial_computation':
            return `Initial Vestera Predict AI forecast generated — predicted $${predictedPrice.toFixed(2)}.`;
        case 'news_detected': {
            const top = newArticles[0];
            return top
                ? `Breaking news detected ("${top.item.title}") — prediction updated to $${predictedPrice.toFixed(2)}.`
                : `New relevant news detected — prediction updated to $${predictedPrice.toFixed(2)}.`;
        }
        case 'price_move':
            return `Market conditions changed${priceChangePct ? ` (${priceChangePct.toFixed(1)}% move)` : ''} — prediction updated to $${predictedPrice.toFixed(2)}.`;
        case 'scheduled_refresh':
            return `Scheduled refresh with latest market data — prediction updated to $${predictedPrice.toFixed(2)}.`;
        default:
            return `Prediction updated to $${predictedPrice.toFixed(2)}.`;
    }
}
