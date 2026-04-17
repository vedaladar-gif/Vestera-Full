import { EXTRA_INSTRUMENTS } from './extraInstruments';
import { SP500_CONSTITUENTS } from './sp500Constituents';
import type { AssetRecord } from './types';

function mergeCatalog(): AssetRecord[] {
    const map = new Map<string, AssetRecord>();
    for (const a of SP500_CONSTITUENTS) {
        map.set(a.symbol.toUpperCase(), { ...a, symbol: a.symbol.toUpperCase() });
    }
    for (const a of EXTRA_INSTRUMENTS) {
        map.set(a.symbol.toUpperCase(), { ...a, symbol: a.symbol.toUpperCase() });
    }
    return [...map.values()];
}

const _merged = mergeCatalog();

/** Full tradable universe (S&P 500 constituents + ETFs/crypto/commodity proxies). */
export const ASSET_CATALOG: readonly AssetRecord[] = _merged;

const _bySymbol = new Map(_merged.map(a => [a.symbol.toUpperCase(), a]));

/** O(1) membership for API validation (canonical symbols only). */
const _tradableSet = new Set(_bySymbol.keys());

/** All uppercase tickers accepted by trade / quote / history APIs. */
export const TRADABLE_SYMBOL_LIST: readonly string[] = [..._tradableSet].sort();

export function getAssetBySymbol(symbol: string): AssetRecord | undefined {
    return _bySymbol.get(symbol.trim().toUpperCase());
}

/** Canonical stored ticker (e.g. BTC → BTC-USD). */
export function normalizeTradableTicker(symbol: string): string {
    const u = symbol.trim().toUpperCase();
    if (u === 'BTC') return 'BTC-USD';
    if (u === 'ETH') return 'ETH-USD';
    return u;
}

export function isTradableSymbol(symbol: string): boolean {
    const u = normalizeTradableTicker(symbol.trim());
    return _tradableSet.has(u);
}

export function listAllTradableSymbols(): string[] {
    return [...TRADABLE_SYMBOL_LIST];
}
