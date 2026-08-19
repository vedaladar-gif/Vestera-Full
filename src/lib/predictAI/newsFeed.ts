/**
 * Real-time news retrieval for Vestera Predict AI. Pulls live headlines from
 * the market-data provider (Yahoo Finance search — title, publisher, publish
 * time, related tickers; see `src/lib/marketData`). No article is ever
 * invented: if the provider call fails, this returns an empty list and the
 * caller treats news as unavailable rather than fabricating headlines.
 */
import { getMarketNews } from '@/lib/marketData';
import { toYahooFinanceSymbol } from '@/lib/stocks';
import type { NewsItem } from './types';

export interface NewsFeedResult {
    available: boolean;
    items: NewsItem[];
}

/**
 * Recent headlines that actually mention this ticker in `relatedTickers` (Yahoo's own
 * tagging — not a guess). Yahoo tags `relatedTickers` using ITS OWN symbol format
 * (hyphenated, e.g. "BRK-B"), while `symbol` here is in Vestera's catalog format
 * (e.g. "BRK.B") — so the match must be done against the Yahoo-formatted symbol,
 * not the catalog one, or every tagged article for hyphen-affected tickers is
 * wrongly dropped.
 */
export async function fetchNewsForSymbol(symbol: string): Promise<NewsFeedResult> {
    const upper = symbol.toUpperCase();
    const yfSymbol = toYahooFinanceSymbol(upper);
    const news = await getMarketNews(upper);
    if (!news.available) return { available: false, items: [] };

    const items: NewsItem[] = news.items
        .filter(n => !n.relatedTickers || n.relatedTickers.length === 0 || n.relatedTickers.includes(yfSymbol))
        .map(n => ({
            uuid: n.uuid || `${n.url}:${n.publishedAt}`,
            title: n.title,
            url: n.url,
            source: n.source,
            publishedAt: n.publishedAt,
            relatedTickers: n.relatedTickers ?? [yfSymbol],
        }))
        .sort((a, b) => b.publishedAt - a.publishedAt);

    return { available: true, items };
}
