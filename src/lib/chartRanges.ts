/** Trade chart timeframe selector — maps to `/api/history` query params. */
export type TradeChartTimeframe = '1D' | '1W' | '1M' | '3M' | '1Y';

export const TRADE_CHART_TIMEFRAMES: TradeChartTimeframe[] = ['1D', '1W', '1M', '3M', '1Y'];

export function isIntradayTimeframe(tf: TradeChartTimeframe): boolean {
    return tf === '1D';
}

/** Query string fragment for `GET /api/history/[stock]?...` */
export function historyQueryForTimeframe(tf: TradeChartTimeframe): string {
    if (tf === '1D') return 'range=1d';
    const days = tf === '1W' ? 7 : tf === '1M' ? 30 : tf === '3M' ? 90 : 365;
    return `days=${days}`;
}

/** lightweight-charts `Time`: business day string for daily bars, Unix seconds for intraday. */
export function barChartTime(bar: { date: string; timeUtc?: number }, intraday: boolean): number | string {
    if (intraday) {
        if (typeof bar.timeUtc === 'number') return bar.timeUtc;
        const ms = Date.parse(bar.date);
        return Number.isFinite(ms) ? Math.floor(ms / 1000) : bar.date;
    }
    return bar.date.length >= 10 ? bar.date.slice(0, 10) : bar.date;
}
