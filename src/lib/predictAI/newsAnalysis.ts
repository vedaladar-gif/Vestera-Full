/**
 * Structured news-analysis component for Vestera Predict AI.
 *
 * This intentionally does NOT ask an LLM "is this good or bad?" — it runs a
 * deterministic, auditable classifier over each headline that produces:
 * sentiment, importance, event type, time relevance, estimated market impact,
 * affected ticker, and a confidence score for the classification itself.
 * Every field is a pure function of the headline text + publish time + related
 * tickers actually returned by the news provider (see `newsFeed.ts`).
 *
 * Limitation disclosed to users: only headline text (not full article bodies)
 * is available from the free news provider, so classification quality is
 * bounded by what a headline conveys. This is honestly reflected in the
 * per-article `confidence` score rather than papered over.
 */
import type { NewsAnalysis, NewsEventType, NewsItem, TimeRelevance } from './types';
import { clamp } from '@/lib/predictionEngine/indicators';

interface EventRule {
    type: NewsEventType;
    baseImportance: number; // 0..1, how impactful this category typically is
    keywords: RegExp;
}

// Ordered most-specific-first; first match wins.
const EVENT_RULES: EventRule[] = [
    { type: 'EARNINGS', baseImportance: 0.9, keywords: /\b(earnings|eps|quarterly results|q[1-4] results|revenue beat|revenue miss|profit warning|earnings surprise|beats? estimates|misses? estimates)\b/i },
    { type: 'GUIDANCE', baseImportance: 0.75, keywords: /\b(guidance|forecast cut|raises? outlook|cuts? outlook|lowers? guidance|raises? guidance)\b/i },
    { type: 'LEADERSHIP', baseImportance: 0.85, keywords: /\b(ceo|cfo|coo|resigns?|resignation|steps? down|appoints? new|names? new|executive shake-?up|founder (?:leaves|departs))\b/i },
    { type: 'MERGER_ACQUISITION', baseImportance: 0.85, keywords: /\b(acquisition|acquires?|merger|merges? with|to buy|takeover|bought by|deal to acquire)\b/i },
    { type: 'SEC_FILING', baseImportance: 0.8, keywords: /\b(sec filing|10-k|10-q|8-k|securities and exchange commission|regulatory filing|insider (?:sale|selling|buying)|form 4)\b/i },
    { type: 'LEGAL_REGULATORY', baseImportance: 0.7, keywords: /\b(lawsuit|sued|investigation|antitrust|fine[ds]?|settlement|recall|ftc|doj|fraud|regulatory probe)\b/i },
    { type: 'ANALYST_UPGRADE', baseImportance: 0.55, keywords: /\b(upgrades?|raises? price target|initiates? .*(buy|overweight|outperform)|reiterates? buy)\b/i },
    { type: 'ANALYST_DOWNGRADE', baseImportance: 0.55, keywords: /\b(downgrades?|cuts? price target|initiates? .*(sell|underweight|underperform)|reiterates? sell)\b/i },
    { type: 'MACRO', baseImportance: 0.5, keywords: /\b(federal reserve|fed rate|interest rates?|inflation|cpi|jobs report|gdp|recession|tariffs?|treasury yields?)\b/i },
    { type: 'PRODUCT', baseImportance: 0.45, keywords: /\b(launches?|unveils?|new product|announces? partnership|expands? into|rolls? out)\b/i },
    { type: 'MARKET_WIDE', baseImportance: 0.3, keywords: /\b(s&p 500|dow jones|nasdaq|stock market today|markets? (?:rally|slide|tumble|surge))\b/i },
];

const POSITIVE_WORDS: Array<[RegExp, number]> = [
    [/\bbeats?\b/i, 0.8], [/\bsurges?\b/i, 0.9], [/\bsoars?\b/i, 0.9], [/\brallies?\b/i, 0.7],
    [/\brecord\b/i, 0.6], [/\bupgrades?\b/i, 0.7], [/\bstrong\b/i, 0.5], [/\bgrowth\b/i, 0.4],
    [/\boutperforms?\b/i, 0.6], [/\bbullish\b/i, 0.7], [/\bwins?\b/i, 0.4], [/\bexpands?\b/i, 0.3],
    [/\bapprov(?:es|al|ed)\b/i, 0.6], [/\bpartnership\b/i, 0.3], [/\bbeat estimates\b/i, 0.8],
    [/\braises? (?:guidance|outlook|forecast|price target)\b/i, 0.7], [/\bprofit\b/i, 0.3], [/\bjump[s]?\b/i, 0.6],
    [/\bgains?\b/i, 0.4], [/\bpositive\b/i, 0.4], [/\bhikes? dividend\b/i, 0.5], [/\bbuyback\b/i, 0.4],
];
const NEGATIVE_WORDS: Array<[RegExp, number]> = [
    [/\bmiss(?:es)?\b/i, 0.8], [/\bplunges?\b/i, 0.9], [/\bslides?\b/i, 0.6], [/\btumbles?\b/i, 0.8],
    [/\bcrash(?:es)?\b/i, 0.9], [/\bdowngrades?\b/i, 0.7], [/\bweak\b/i, 0.5], [/\bdecline[sd]?\b/i, 0.5],
    [/\bunderperforms?\b/i, 0.6], [/\bbearish\b/i, 0.7], [/\blawsuit\b/i, 0.6], [/\bfraud\b/i, 0.9],
    [/\brecall(?:s|ed)?\b/i, 0.7], [/\bresigns?\b/i, 0.6], [/\bcuts? (?:guidance|outlook|forecast|price target|jobs)\b/i, 0.7],
    [/\bloss(?:es)?\b/i, 0.6], [/\bwarning\b/i, 0.6], [/\bnegative\b/i, 0.4], [/\bsues?\b/i, 0.5],
    [/\bprobe\b/i, 0.5], [/\bfine[ds]?\b/i, 0.5], [/\bslash(?:es)?\b/i, 0.6], [/\bdrops?\b/i, 0.5],
    [/\bantitrust\b/i, 0.5], [/\binvestigation\b/i, 0.5],
];

function classifyEventType(title: string): { type: NewsEventType; baseImportance: number; matched: boolean } {
    for (const rule of EVENT_RULES) {
        if (rule.keywords.test(title)) return { type: rule.type, baseImportance: rule.baseImportance, matched: true };
    }
    return { type: 'GENERAL', baseImportance: 0.2, matched: false };
}

function scoreSentiment(title: string): { sentiment: number; matches: number } {
    let pos = 0;
    let neg = 0;
    let matches = 0;
    for (const [re, w] of POSITIVE_WORDS) if (re.test(title)) { pos += w; matches++; }
    for (const [re, w] of NEGATIVE_WORDS) if (re.test(title)) { neg += w; matches++; }
    if (pos === 0 && neg === 0) return { sentiment: 0, matches: 0 };
    const raw = (pos - neg) / (pos + neg + 1); // dampened so a single weak word doesn't hit +/-1
    return { sentiment: clamp(raw * 1.6, -1, 1), matches };
}

function timeRelevanceFor(hoursAgo: number): TimeRelevance {
    if (hoursAgo <= 6) return 'BREAKING';
    if (hoursAgo <= 72) return 'RECENT';
    return 'STALE';
}

/**
 * Recency decay for a given prediction horizon — recent news matters far more
 * for intraday predictions than long-term ones (per spec: "recent news should
 * have more influence than old news... breaking article published minutes ago
 * should have substantially more influence on an intraday prediction").
 */
const HALF_LIFE_HOURS: Record<string, number> = {
    TODAY: 4,
    '1W': 24,
    '1M': 96,
    '3M': 240,
    '6M': 480,
    '1Y': 1080,
};

export function recencyWeight(hoursAgo: number, horizonKey: string): number {
    const halfLife = HALF_LIFE_HOURS[horizonKey] ?? 96;
    return Math.pow(0.5, Math.max(0, hoursAgo) / halfLife);
}

/**
 * Analyzes a single news item for a given symbol + prediction horizon.
 * `estimatedImpact` is the actual signed contribution this article makes to
 * that horizon's news signal: sentiment * importance * recency-decay * ticker-relevance.
 */
export function analyzeNewsItem(item: NewsItem, symbol: string, horizonKey: string, nowMs = Date.now()): NewsAnalysis {
    const { type, baseImportance, matched } = classifyEventType(item.title);
    const { sentiment, matches } = scoreSentiment(item.title);
    const hoursAgo = Math.max(0, (nowMs - item.publishedAt * 1000) / 3_600_000);

    // Roundup/digest articles that tag many tickers briefly mention this company rather than focus on it.
    const tickerCount = item.relatedTickers.length || 1;
    const relevanceMultiplier = tickerCount <= 2 ? 1 : clamp(2 / tickerCount, 0.2, 1);

    const recency = recencyWeight(hoursAgo, horizonKey);
    const importance = clamp(baseImportance * relevanceMultiplier, 0, 1);
    const estimatedImpact = clamp(sentiment * importance * recency, -1, 1);

    // Confidence in the classification itself — higher when we matched a clear event type AND clear sentiment words.
    const confidence = clamp(0.25 + (matched ? 0.35 : 0) + Math.min(matches, 3) * 0.13, 0.15, 0.95);

    return {
        item,
        affectedTicker: symbol.toUpperCase(),
        sentiment,
        importance,
        eventType: type,
        timeRelevance: timeRelevanceFor(hoursAgo),
        hoursAgo,
        estimatedImpact,
        confidence,
    };
}

/** Analyzes every item in a feed for a given symbol + horizon, most recent first. */
export function analyzeNewsFeed(items: NewsItem[], symbol: string, horizonKey: string, nowMs = Date.now()): NewsAnalysis[] {
    return items
        .map(item => analyzeNewsItem(item, symbol, horizonKey, nowMs))
        .sort((a, b) => b.item.publishedAt - a.item.publishedAt);
}

/**
 * Aggregates per-article analyses into a single [-1, 1] news signal for a
 * horizon, weighting each article by |estimatedImpact| so multiple
 * confirming articles carry more weight than one, but a single irrelevant
 * mention can't swing the forecast (spec: "do not allow irrelevant news to
 * significantly change the forecast").
 */
export function aggregateNewsSignal(analyses: NewsAnalysis[]): { signal: number; weight: number; topDrivers: NewsAnalysis[] } {
    if (analyses.length === 0) return { signal: 0, weight: 0, topDrivers: [] };

    let weightedSum = 0;
    let weightTotal = 0;
    for (const a of analyses) {
        const w = a.importance * a.confidence;
        weightedSum += a.estimatedImpact * w;
        weightTotal += w;
    }
    const signal = weightTotal > 0 ? clamp(weightedSum / weightTotal, -1, 1) : 0;
    // Overall confidence-weight for how much the news signal should count vs other signals this cycle.
    const weight = clamp(weightTotal / Math.max(1, analyses.length) * Math.min(1, analyses.length / 4), 0, 1);

    const topDrivers = [...analyses]
        .sort((a, b) => Math.abs(b.estimatedImpact) - Math.abs(a.estimatedImpact))
        .slice(0, 5);

    return { signal, weight, topDrivers };
}
