/** Client-safe helpers — do not import Yahoo or Node-only modules here. */
export function displaySymbol(symbol: string): string {
    if (symbol === 'BTC-USD') return 'BTC';
    if (symbol === 'ETH-USD') return 'ETH';
    return symbol;
}
