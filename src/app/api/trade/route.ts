import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserCash, getHoldings, updateUserCash, addTrade } from '@/lib/models';
import { isDemo } from '@/lib/demoStore';
import { isTradableSymbol, normalizeTradableTicker } from '@/lib/assetCatalog';
import { isMarketOpen, MARKET_CLOSED_TRADE_MESSAGE } from '@/lib/marketStatus';

export async function POST(request: Request) {
    const session = await getSession();
    if (!session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.userId;
    const data = await request.json();

    // Demo users and the guided tutorial can trade anytime so onboarding never stalls.
    const isTutorialTrade = isDemo(userId) || data.tutorial === true;
    if (!isTutorialTrade && !isMarketOpen()) {
        return NextResponse.json(
            { success: false, error: 'MARKET_CLOSED', message: MARKET_CLOSED_TRADE_MESSAGE },
            { status: 403 },
        );
    }

    const ticker = normalizeTradableTicker(data.ticker || '');
    const quantity = parseInt(data.quantity || '0', 10);
    const action = (data.action || '').toUpperCase();
    const price = parseFloat(data.price || '0');

    if (!isTradableSymbol(ticker) || quantity <= 0 || !['BUY', 'SELL'].includes(action) || price <= 0) {
        return NextResponse.json({ error: 'Invalid trade parameters' }, { status: 400 });
    }

    const currentCash = await getUserCash(userId);
    const tradeCost = quantity * price;

    if (action === 'SELL') {
        const holdings = await getHoldings(userId);
        const userShares = holdings.find(h => h.stock === ticker)?.shares || 0;
        if (userShares < quantity) {
            return NextResponse.json({ error: `Insufficient shares. You have ${userShares}` }, { status: 400 });
        }
        const newCash = currentCash + tradeCost;
        const recorded = await addTrade(userId, ticker, quantity, price, action);
        if (!recorded) {
            return NextResponse.json({ error: 'Failed to record trade' }, { status: 500 });
        }
        await updateUserCash(userId, newCash);
        return NextResponse.json({
            success: true, action, ticker, quantity, price,
            cash_before: currentCash, cash_after: newCash,
        });
    } else {
        if (currentCash < tradeCost) {
            return NextResponse.json({ error: `Insufficient cash. You have $${currentCash.toFixed(2)}` }, { status: 400 });
        }
        const newCash = currentCash - tradeCost;
        const recorded = await addTrade(userId, ticker, quantity, price, action);
        if (!recorded) {
            return NextResponse.json({ error: 'Failed to record trade' }, { status: 500 });
        }
        await updateUserCash(userId, newCash);
        return NextResponse.json({
            success: true, action, ticker, quantity, price,
            cash_before: currentCash, cash_after: newCash,
        });
    }
}
