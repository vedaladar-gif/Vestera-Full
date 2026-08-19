/**
 * Real-time news retrieval for Vestera Predict AI. Pulls live headlines from
 * the market-data provider (Yahoo Finance search — title, publisher, publish
 * time, related tickers; see `src/lib/marketData`). No article is ever
 * invented: if the provider call fails, this returns an empty list and the
 * caller treats news as unavailable rather than fabricating headlines.
 */
import { getMarketNews } from '@/lib/marketData';
import type { NewsItem } from './types';

export interface NewsFeedResult {
    available: boolean;
    items: NewsItem[];
}

/** Recent headlines that actually mention this ticker in `relatedTickers` (Yahoo's own tagging — not a guess). */
export async function fetchNewsForSymbol(symbol: string): Promise<NewsFeedResult> {
    const upper = symbol.toUpperCase();
    const news = await getMarketNews(upper);
    if (!news.available) return { available: false, items: [] };

    const items: NewsItem[] = news.items
        .filter(n => !n.relatedTickers || n.relatedTickers.length === 0 || n.relatedTickers.includes(upper))
        .map(n => ({
            uuid: n.uuid || `${n.url}:${n.publishedAt}`,
            title: n.title,
            url: n.url,
            source: n.source,
            publishedAt: n.publishedAt,
            relatedTickers: n.relatedTickers ?? [upper],
        }))
        .sort((a, b) => b.publishedAt - a.publishedAt);

    return { available: true, items };
}
