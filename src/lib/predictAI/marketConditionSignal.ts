/**
 * Market-condition and sector-performance components for Vestera Predict AI.
 * Both are derived from real index/sector-ETF price history (SPY + SPDR
 * Select Sector ETFs) — never hardcoded per symbol.
 */
import { getHistoricalData } from '@/lib/marketData';
import { annualizedVolatility, clamp, momentum } from '@/lib/predictionEngine/indicators';
import { sectorEtfForSymbol } from './sectorMap';

export interface MarketConditionResult {
    score: number; // -1..1 — broad market trend/regime
    available: boolean;
    spyChangePct: number | null;
}

/** Broad market regime: S&P 500 short-term trend, penalized when index volatility is elevated (risk-off regime). */
export function computeMarketConditionSignal(spyCloses: number[] | null): MarketConditionResult {
    if (!spyCloses || spyCloses.length < 30) return { score: 0, available: false, spyChangePct: null };

    const m5 = momentum(spyCloses, 5) ?? 0;
    const m20 = momentum(spyCloses, 20) ?? 0;
    const trendScore = clamp((m5 / 0.02) * 0.5 + (m20 / 0.05) * 0.5, -1, 1);

    const vol = annualizedVolatility(spyCloses, 30);
    const volPenalty = vol !== null ? clamp((vol - 0.14) / 0.3, 0, 0.5) : 0;

    const score = clamp(trendScore * (1 - volPenalty), -1, 1);
    const n = spyCloses.length;
    return { score, available: true, spyChangePct: n >= 2 ? ((spyCloses[n - 1] - spyCloses[n - 2]) / spyCloses[n - 2]) * 100 : null };
}

export interface SectorSignalResult {
    score: number; // -1..1 — sector's relative strength vs the broad market
    available: boolean;
    sector: string | null;
    etf: string | null;
}

/** Sector performance relative to the broad market — real sector-ETF data via the market-data provider. */
export async function computeSectorSignal(symbol: string, spyCloses: number[] | null): Promise<SectorSignalResult> {
    const mapping = sectorEtfForSymbol(symbol);
    if (!mapping || !spyCloses || spyCloses.length < 30) {
        return { score: 0, available: false, sector: mapping?.sector ?? null, etf: mapping?.etf ?? null };
    }

    try {
        const sectorBars = await getHistoricalData(mapping.etf, 90);
        const sectorCloses = sectorBars.map(b => b.close).filter(c => c > 0);
        if (sectorCloses.length < 25) {
            return { score: 0, available: false, sector: mapping.sector, etf: mapping.etf };
        }
        const sectorRet = momentum(sectorCloses, 20) ?? 0;
        const spyRet = momentum(spyCloses, 20) ?? 0;
        const relativeStrength = sectorRet - spyRet;
        return { score: clamp(relativeStrength / 0.08, -1, 1), available: true, sector: mapping.sector, etf: mapping.etf };
    } catch {
        return { score: 0, available: false, sector: mapping.sector, etf: mapping.etf };
    }
}
