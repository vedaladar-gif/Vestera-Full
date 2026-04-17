import { NextResponse } from 'next/server';
import { ASSET_CATALOG, getAssetBySymbol } from '@/lib/assetCatalog';
import { searchAssetCatalog } from '@/lib/assetSearchService';
import { getYahooQuotesBatch } from '@/lib/yahooQuoteData';

export interface StockSearchResultRow {
    symbol: string;
    name: string;
    type: string;
    sector?: string;
    price: number | null;
    change: number | null;
    changePct: number | null;
}

const POPULAR_TRADE_SYMBOLS = [
    'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'SPY', 'QQQ', 'VTI', 'GLD', 'SLV', 'JPM', 'V',
    'SCHD', 'AMD', 'AVGO', 'NFLX', 'COST', 'XOM',
] as const;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const suggestions = searchParams.get('suggestions');
    if (suggestions === 'popular') {
        const withQuotes = searchParams.get('quotes') !== '0';
        const base: StockSearchResultRow[] = [];
        for (const sym of POPULAR_TRADE_SYMBOLS) {
            const a = getAssetBySymbol(sym);
            if (!a) continue;
            base.push({
                symbol: a.symbol,
                name: a.name,
                type: a.type,
                sector: a.sector,
                price: null,
                change: null,
                changePct: null,
            });
        }
        if (withQuotes && base.length > 0) {
            const quoteMap = await getYahooQuotesBatch(
                base.map(r => r.symbol),
                6
            );
            for (const row of base) {
                const q = quoteMap.get(row.symbol);
                if (q && q.price > 0) {
                    row.price = q.price;
                    row.change = q.change;
                    row.changePct = q.changePct;
                }
            }
        }
        return NextResponse.json({ results: base });
    }

    const raw = (searchParams.get('q') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 50);
    const withQuotes = searchParams.get('quotes') !== '0';

    if (!raw) {
        return NextResponse.json({ results: [] as StockSearchResultRow[] });
    }

    const hits = searchAssetCatalog(ASSET_CATALOG, raw, limit);
    const base: StockSearchResultRow[] = hits.map(h => ({
        symbol: h.symbol,
        name: h.name,
        type: h.type,
        sector: h.sector,
        price: null,
        change: null,
        changePct: null,
    }));

    if (!withQuotes || base.length === 0) {
        return NextResponse.json({ results: base });
    }

    const quoteMap = await getYahooQuotesBatch(
        base.map(r => r.symbol),
        6
    );

    for (const row of base) {
        const q = quoteMap.get(row.symbol);
        if (q && q.price > 0) {
            row.price = q.price;
            row.change = q.change;
            row.changePct = q.changePct;
        }
    }

    return NextResponse.json({ results: base });
}
