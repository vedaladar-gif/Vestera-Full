import { getUserCash, getUserTradesAscending } from '@/lib/models';
import { getCurrentPrice, STARTING_CASH } from '@/lib/stocks';
import {
    plVersusStarting,
    positionsFromTradesAsc,
    returnPctVersusStarting,
    roundReturnToTenth,
    totalAccountValue,
} from '@/lib/portfolioMath';

export type PortfolioHoldingRow = {
    stock: string;
    shares: number;
    buy_price: number;
    current_price: number;
    value: number;
    gain_loss: number;
    gain_loss_pct: number;
};

export type UserPortfolioSnapshot = {
    cash: number;
    portfolio_value: number;
    total_account_value: number;
    pl: number;
    pct: number;
    starting_cash: number;
    holdings: PortfolioHoldingRow[];
};

/** Same valuation as GET /api/holdings — used for owner view and authorized friend read-only view. */
export async function computeUserPortfolioSnapshot(userId: string): Promise<UserPortfolioSnapshot> {
    const cash = await getUserCash(userId);
    const trades = await getUserTradesAscending(userId);

    const posMap = positionsFromTradesAsc(
        trades.map(t => ({
            stock: t.stock,
            shares: t.shares,
            price: t.price,
            action: t.action,
        }))
    );

    const holdings: PortfolioHoldingRow[] = [];

    for (const [stock, { shares, avgCost }] of posMap) {
        const current_price = await getCurrentPrice(stock);
        const value = shares * current_price;
        const costBasis = shares * avgCost;
        const gain_loss = value - costBasis;
        const gain_loss_pct =
            avgCost > 0 ? roundReturnToTenth(((current_price - avgCost) / avgCost) * 100) : 0;

        holdings.push({
            stock,
            shares,
            buy_price: avgCost,
            current_price,
            value,
            gain_loss,
            gain_loss_pct,
        });
    }

    holdings.sort((a, b) => b.value - a.value);

    const portfolioValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const total_account_value = totalAccountValue(cash, portfolioValue);
    const pl = plVersusStarting(total_account_value);
    const pct = returnPctVersusStarting(total_account_value);

    return {
        cash,
        portfolio_value: portfolioValue,
        total_account_value,
        pl,
        pct,
        starting_cash: STARTING_CASH,
        holdings,
    };
}
