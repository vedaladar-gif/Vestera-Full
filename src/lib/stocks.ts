import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

// Extended stock list with popular companies
export const STOCKS = [
    'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'GOOG', 'NVDA', 'TSLA', 'META', 'AVGO', 'ASML',
    'NFLX', 'PYPL', 'INTC', 'AMD', 'CRM', 'ADBE', 'IBM', 'ORCL', 'SAP', 'CSCO',
    'QCOM', 'ADSK', 'SNPS', 'CDNS', 'MCHP', 'KLAC', 'LRCX', 'AMAT', 'LSCC', 'MPWR',
    'GE', 'BA', 'CAT', 'DE', 'MMM', 'HON', 'ABB', 'EATON', 'ETN', 'ITW',
    'WMT', 'KO', 'PEP', 'MCD', 'SBUX', 'DPZ', 'CPRT', 'YUM', 'CMG', 'ULTA',
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'BLK', 'SCHW', 'TD', 'RY', 'BNS', 'V', 'MA',
    'XOM', 'CVX', 'COP', 'EOG', 'MPC', 'PSX', 'VLO', 'HES', 'OXY', 'SLB',
    'PG', 'UN', 'COST', 'MO', 'PM', 'BTC-USD', 'ETH-USD'
];

// Human-friendly aliases for crypto
export function normalizeSymbol(symbol: string): string {
    if (symbol === 'BTC') return 'BTC-USD';
    if (symbol === 'ETH') return 'ETH-USD';
    return symbol;
}

export function displaySymbol(symbol: string): string {
    if (symbol === 'BTC-USD') return 'BTC';
    if (symbol === 'ETH-USD') return 'ETH';
    return symbol;
}

// In-memory price cache
const CACHE: Map<string, { ts: number; price: number }> = new Map();
const CACHE_TTL = 60; // 60 seconds

export async function getCurrentPrice(symbol: string): Promise<number> {
    symbol = symbol.toUpperCase();
    const yfSymbol = normalizeSymbol(symbol);

    // Check cache
    const cached = CACHE.get(yfSymbol);
    if (cached && (Date.now() / 1000 - cached.ts) < CACHE_TTL) {
        return cached.price;
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const quote: any = await yahooFinance.quote(yfSymbol);
        const price =
            quote.regularMarketPrice ??
            quote.bid ??
            quote.ask ??
            100.0;

        CACHE.set(yfSymbol, { ts: Date.now() / 1000, price });
        return price;
    } catch (e) {
        console.error(`Error fetching price for ${yfSymbol}:`, e);
        return 100.0; // Fallback
    }
}

export interface HistoricalBar {
    /** YYYY-MM-DD for daily bars; ISO datetime string for intraday. */
    date: string;
    /** Unix seconds (UTC) — required for intraday / 1D charts in lightweight-charts. */
    timeUtc?: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

function sessionTimezoneForYahooSymbol(yfSymbol: string): string {
    const u = yfSymbol.toUpperCase();
    if (u.startsWith('BTC') || u.startsWith('ETH')) return 'UTC';
    return 'America/New_York';
}

/**
 * Latest trading session as 5m bars: today if the market produced intraday data, otherwise
 * the most recent calendar day in the window that has bars (completed session when closed).
 */
export async function getIntradaySession(symbol: string): Promise<HistoricalBar[]> {
    const yfSymbol = normalizeSymbol(symbol.toUpperCase());
    const tz = sessionTimezoneForYahooSymbol(yfSymbol);

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 12);

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = await yahooFinance.chart(yfSymbol, {
            period1: start,
            period2: end,
            interval: '5m',
        });

        if (!result.quotes || result.quotes.length === 0) {
            return [];
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const quotes: any[] = result.quotes.filter((q: any) => q && (q.close ?? 0) > 0);
        if (quotes.length === 0) return [];

        const dayKey = (d: Date) =>
            d.toLocaleDateString('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });

        const groups = new Map<string, typeof quotes>();
        for (const q of quotes) {
            const t = q.date ? new Date(q.date) : null;
            if (!t || Number.isNaN(t.getTime())) continue;
            const k = dayKey(t);
            if (!groups.has(k)) groups.set(k, []);
            groups.get(k)!.push(q);
        }

        const sortedDays = [...groups.keys()].sort();
        const targetDay = sortedDays[sortedDays.length - 1];
        const dayBars = groups.get(targetDay) ?? [];

        return dayBars
            .map((q: any) => {
                const t = q.date ? new Date(q.date) : new Date();
                const iso = t.toISOString();
                return {
                    date: iso,
                    timeUtc: Math.floor(t.getTime() / 1000),
                    open: q.open ?? q.close ?? 0,
                    high: q.high ?? q.close ?? 0,
                    low: q.low ?? q.close ?? 0,
                    close: q.close ?? 0,
                    volume: q.volume ?? 0,
                } as HistoricalBar;
            })
            .filter((b: HistoricalBar) => b.close > 0)
            .sort((a, b) => (a.timeUtc ?? 0) - (b.timeUtc ?? 0));
    } catch (e) {
        console.error(`Error fetching intraday for ${yfSymbol}:`, e);
        return [];
    }
}

export async function getHistorical(symbol: string, days = 30): Promise<HistoricalBar[]> {
    symbol = symbol.toUpperCase();
    const yfSymbol = normalizeSymbol(symbol);

    try {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days - 10);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = await yahooFinance.chart(yfSymbol, {
            period1: start,
            period2: end,
            interval: '1d',
        });

        if (!result.quotes || result.quotes.length === 0) {
            return [];
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return result.quotes.slice(-days).map((q: any) => ({
            date: q.date ? new Date(q.date).toISOString().split('T')[0] : '',
            open: q.open ?? q.close ?? 0,
            high: q.high ?? q.close ?? 0,
            low: q.low ?? q.close ?? 0,
            close: q.close ?? 0,
            volume: q.volume ?? 0,
        })).filter((b: HistoricalBar) => b.close > 0);
    } catch (e) {
        console.error(`Error fetching historical for ${yfSymbol}:`, e);
        return [];
    }
}


export const STARTING_CASH = 100000.0;
export const STOCK_NAMES: Record<string, string> = {
    'AAPL': 'Apple Inc.', 'MSFT': 'Microsoft Corp', 'GOOGL': 'Alphabet Inc.', 'GOOG': 'Alphabet Inc.',
    'AMZN': 'Amazon.com Inc', 'NVDA': 'NVIDIA Corp', 'TSLA': 'Tesla Inc.', 'META': 'Meta Platforms',
    'NFLX': 'Netflix Inc.', 'INTC': 'Intel Corp', 'AMD': 'Advanced Micro', 'CRM': 'Salesforce Inc',
    'ADBE': 'Adobe Inc.', 'PYPL': 'PayPal Inc.', 'IBM': 'IBM Corp', 'ORCL': 'Oracle Corp',
    'CSCO': 'Cisco Systems', 'QCOM': 'Qualcomm Inc', 'ADSK': 'Autodesk Inc', 'SNPS': 'Synopsys Inc',
    'CDNS': 'Cadence Inc.', 'MCHP': 'Microchip Tech', 'KLAC': 'KLA Corp', 'LRCX': 'Lam Research',
    'AMAT': 'Applied Materials', 'LSCC': 'Lattice Semi', 'MPWR': 'Monolithic Power', 'ASML': 'ASML Holding',
    'AVGO': 'Broadcom Inc', 'SAP': 'SAP SE', 'ABB': 'ABB Ltd', 'EATON': 'Eaton Corp',
    'ETN': 'Eaton Tech', 'ITW': 'Illinois Tool', 'GE': 'General Electric', 'BA': 'Boeing Co.',
    'CAT': 'Caterpillar Inc', 'DE': 'Deere & Co.', 'MMM': '3M Company', 'HON': 'Honeywell Intl',
    'WMT': 'Walmart Inc.', 'KO': 'Coca-Cola Co.', 'PEP': 'PepsiCo Inc.', 'MCD': "McDonald's Corp",
    'SBUX': 'Starbucks Corp', 'DPZ': "Domino's Pizza", 'CPRT': 'Carpetright', 'YUM': 'Yum! Brands',
    'CMG': 'Chipotle Mexican', 'ULTA': 'Ulta Beauty Inc', 'JPM': 'JPMorgan Chase', 'BAC': 'Bank of America',
    'WFC': 'Wells Fargo', 'GS': 'Goldman Sachs', 'MS': 'Morgan Stanley', 'BLK': 'BlackRock Inc.',
    'SCHW': 'Schwab Corp', 'TD': 'Toronto Dominion', 'RY': 'Royal Bank Can', 'BNS': 'Bank Nova Scotia',
    'V': 'Visa Inc.', 'MA': 'Mastercard Inc.',
    'XOM': 'Exxon Mobil', 'CVX': 'Chevron Corp', 'COP': 'ConocoPhillips', 'EOG': 'EOG Resources',
    'MPC': 'Marathon Petro', 'PSX': 'Phillips 66', 'VLO': 'Valero Energy', 'HES': 'Hess Corp',
    'OXY': 'Occidental Petro', 'SLB': 'Schlumberger', 'PG': 'Procter & Gamble', 'UN': 'Unilever PLC',
    'COST': 'Costco Wholesale', 'MO': 'Altria Group', 'PM': 'Philip Morris',
    'BTC': 'Bitcoin', 'ETH': 'Ethereum', 'BTC-USD': 'Bitcoin', 'ETH-USD': 'Ethereum',
};

