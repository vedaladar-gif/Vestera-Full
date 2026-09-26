import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabaseClient';

export interface HistoryPoint {
    date: string; // YYYY-MM-DD
    value: number; // total portfolio value in USD
}

const STARTING_CASH = 100_000;

export async function GET() {
    const session = await getSession();
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch all trades for this user, ascending by date
    const { data: trades, error } = await supabase
        .from('portfolio')
        .select('stock, shares, price, action, created_at')
        .eq('user_id', session.userId)
        .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // No trades yet — return a single point so the chart can show an empty state
    if (!trades || trades.length === 0) {
        return NextResponse.json({ history: [] });
    }

    // ── Replay trades to reconstruct portfolio value at each trade event ──────
    // We use trade prices as proxies for the value of each holding at each point.
    // This is an approximation — it won't reflect price movements between trades,
    // but it gives an accurate picture of the impact of each trade decision.

    let cash = STARTING_CASH;
    const shareMap: Record<string, number> = {}; // stock → current shares
    const lastPrice: Record<string, number> = {}; // stock → most recent trade price

    const points: HistoryPoint[] = [];

    // Add the starting point one day before the first trade
    const firstTradeDate = new Date(trades[0].created_at);
    firstTradeDate.setUTCDate(firstTradeDate.getUTCDate() - 1);
    points.push({
        date: firstTradeDate.toISOString().slice(0, 10),
        value: STARTING_CASH,
    });

    for (const trade of trades) {
        const { stock, shares, price, action } = trade as {
            stock: string; shares: number; price: number; action: string; created_at: string;
        };

        if (action === 'BUY') {
            cash -= shares * price;
            shareMap[stock] = (shareMap[stock] ?? 0) + shares;
        } else if (action === 'SELL') {
            cash += shares * price;
            shareMap[stock] = (shareMap[stock] ?? 0) - shares;
        }
        lastPrice[stock] = price;

        // Portfolio value = cash + Σ(shares_held × last_known_price)
        const holdingsValue = Object.entries(shareMap)
            .filter(([, sh]) => sh > 0)
            .reduce((sum, [s, sh]) => sum + sh * (lastPrice[s] ?? 0), 0);

        const totalValue = Math.max(0, cash + holdingsValue);
        const dateStr = (trade as { created_at: string }).created_at.slice(0, 10);

        // Merge same-day trades: keep only the last value for each calendar day
        const last = points[points.length - 1];
        if (last && last.date === dateStr) {
            last.value = totalValue;
        } else {
            points.push({ date: dateStr, value: totalValue });
        }
    }

    return NextResponse.json({ history: points });
}
