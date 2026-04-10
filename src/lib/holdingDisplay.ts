/**
 * Market value of a position at a given quote.
 */
export function positionMarketValue(shares: number, currentPrice: number): number {
    return shares * currentPrice;
}

/**
 * Unrealized P&L in dollars: (current − average cost) × shares.
 */
export function positionGainLossDollars(shares: number, avgCost: number, currentPrice: number): number {
    return (currentPrice - avgCost) * shares;
}

/** `true` when we can show dollar P&L (valid live or stale quote). */
export function hasUsablePrice(price: number): boolean {
    return Number.isFinite(price) && price > 0;
}

/**
 * Format signed currency for P&L (positive and zero use + / plain $0.00 per product rules).
 */
export function formatPositionPnL(gainLoss: number): string {
    if (gainLoss > 0) return `+$${gainLoss.toFixed(2)}`;
    if (gainLoss < 0) return `-$${Math.abs(gainLoss).toFixed(2)}`;
    return '$0.00';
}

/** Green for ≥ 0, red for negative */
export function isPnLNonNegative(gainLoss: number): boolean {
    return gainLoss >= 0;
}
