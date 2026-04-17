import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { isTradableSymbol, normalizeTradableTicker } from '@/lib/assetCatalog';
import { getCurrentPrice } from '@/lib/stocks';

export async function POST(request: Request) {
    const session = await getSession();
    if (!session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const ticker = normalizeTradableTicker(data.ticker || '');
    const message = (data.message || '').trim();

    if (!ticker || !isTradableSymbol(ticker)) {
        return NextResponse.json({ error: 'Invalid stock ticker' }, { status: 400 });
    }

    const currentPrice = await getCurrentPrice(ticker);

    // Rule-based fallback analysis
    const analysis = generateBasicAnalysis(ticker, currentPrice, message);
    return NextResponse.json({ success: true, ticker, current_price: currentPrice, analysis });
}

function generateBasicAnalysis(ticker: string, price: number, message: string): string {
    let signal = 'HOLD';
    let confidence = 55;
    let reasoning = `Analysis of ${ticker}:`;

    const lower = message.toLowerCase();
    if (lower.includes('buy')) {
        signal = 'HOLD'; confidence = 45;
        reasoning = `Before buying ${ticker}, consider:`;
    } else if (lower.includes('sell')) {
        signal = 'HOLD'; confidence = 50;
        reasoning = `Selling requires careful timing. For ${ticker}:`;
    } else if (lower.includes('risk')) {
        signal = 'EDUCATIONAL'; confidence = 100;
        reasoning = `Risk management for ${ticker}:`;
    }

    return `Basic Analysis for ${ticker}

Current Price: $${price.toFixed(2)}

Signal: ${signal} (Confidence: ${confidence}%)

${reasoning}
• Monitor recent earnings reports
• Watch sector trends
• Assess your risk tolerance
• Consider your time horizon

Risk Management:
1. Entry Strategy: Buy after a pullback of 1-2%, not at the top
2. Exit Strategy: Set a target of 2-3% gain from entry
3. Stop Loss: Always set a stop loss 1-2% below your entry price
4. Position Sizing: Only risk 1-2% of your account per trade

Remember: The best traders focus on consistent wins, not home runs. Small, consistent profits beat big, risky trades.

Check the chart patterns and volume before entering any position.`;
}
