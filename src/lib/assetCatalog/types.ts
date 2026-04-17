export type AssetKind = 'stock' | 'etf' | 'crypto' | 'commodity_proxy';

export interface AssetRecord {
    symbol: string;
    name: string;
    type: AssetKind;
    exchange: string;
    sector?: string;
    /** Extra phrases for intent search (e.g. "s&p 500", "gold", "nasdaq"). Lowercased at index time. */
    searchableTerms?: readonly string[];
}

export interface AssetSearchHit extends AssetRecord {
    score: number;
}
