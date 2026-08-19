/**
 * Maps a company's GICS sector (from the asset catalog, sourced from real S&P
 * 500 constituent data) to its SPDR Select Sector ETF — a real, tradable proxy
 * for that sector's actual performance. Returns null (no fabricated sector
 * signal) when the symbol's sector isn't known.
 */
import { getAssetBySymbol } from '@/lib/assetCatalog';

const SECTOR_TO_ETF: Record<string, string> = {
    'Information Technology': 'XLK',
    'Technology': 'XLK',
    'Financials': 'XLF',
    'Health Care': 'XLV',
    'Healthcare': 'XLV',
    'Consumer Discretionary': 'XLY',
    'Consumer Staples': 'XLP',
    'Energy': 'XLE',
    'Industrials': 'XLI',
    'Materials': 'XLB',
    'Real Estate': 'XLRE',
    'Utilities': 'XLU',
    'Communication Services': 'XLC',
};

export function sectorEtfForSymbol(symbol: string): { sector: string; etf: string } | null {
    const asset = getAssetBySymbol(symbol);
    const sector = asset?.sector;
    if (!sector) return null;
    const etf = SECTOR_TO_ETF[sector];
    if (!etf) return null;
    if (etf.toUpperCase() === symbol.toUpperCase()) return null; // don't compare a sector ETF to itself
    return { sector, etf };
}
