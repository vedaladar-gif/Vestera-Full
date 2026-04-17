import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { addChatMessage, getUserCash, getHoldings } from '@/lib/models';
import { getCurrentPrice } from '@/lib/stocks';
import { buildSnapseSystemInstruction } from '@/lib/snapsePrompt';
import { clientMessagesToGrokMessages, lastUserContent, type SnapseClientMessage } from '@/lib/snapseConversation';
import { getGrokApiKey, grokChatCompletion } from '@/lib/grokXai';

const MAX_MSG_LEN = 8000;

function parseClientMessages(raw: unknown): SnapseClientMessage[] {
    if (!Array.isArray(raw)) return [];
    const out: SnapseClientMessage[] = [];
    for (const item of raw) {
        if (!item || typeof item !== 'object') continue;
        const role = (item as { role?: string }).role;
        const content = (item as { content?: string }).content;
        if (role !== 'user' && role !== 'assistant') continue;
        if (typeof content !== 'string') continue;
        const trimmed = content.trim().slice(0, MAX_MSG_LEN);
        if (!trimmed) continue;
        out.push({ role, content: trimmed });
    }
    return out;
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = getGrokApiKey();
    if (!apiKey) {
        return NextResponse.json(
            { error: 'AI is not configured (missing GROK_API_KEY or XAI_API_KEY on the server).' },
            { status: 503 }
        );
    }

    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const mode = typeof body.mode === 'string' ? body.mode : 'TRADING';
    const route = typeof body.route === 'string' ? body.route : '/trade';
    const stockSymbol = (typeof body.stockSymbol === 'string' ? body.stockSymbol : '').toUpperCase().slice(0, 12);

    let messages = parseClientMessages(body.messages);
    const singleMessage = typeof body.message === 'string' ? body.message.trim().slice(0, MAX_MSG_LEN) : '';

    if (messages.length === 0 && singleMessage) {
        messages = [{ role: 'user', content: singleMessage }];
    }

    const userUtterance = lastUserContent(messages);
    if (!userUtterance) {
        return NextResponse.json({ error: 'Empty message' }, { status: 400 });
    }

    const userId = session.userId;

    let grokMessages: { role: 'user' | 'assistant'; content: string }[];
    try {
        grokMessages = clientMessagesToGrokMessages(messages);
    } catch (e) {
        return NextResponse.json(
            { error: e instanceof Error ? e.message : 'Invalid conversation history' },
            { status: 400 }
        );
    }

    try {
        await addChatMessage(userId, 'user', userUtterance, mode, route);

        const cash = await getUserCash(userId);
        const holdings = await getHoldings(userId);

        const enrichedHoldings = await Promise.all(
            holdings.map(async h => {
                const price = await getCurrentPrice(h.stock);
                return { ...h, current_price: price, value: h.shares * price };
            })
        );

        const portfolioValue = enrichedHoldings.reduce((s, h) => s + h.value, 0);
        const totalAccount = cash + portfolioValue;
        const pl = totalAccount - 100000;

        const portfolioSummary =
            holdings.length > 0
                ? enrichedHoldings
                      .map(
                          h =>
                              `${h.stock} (${h.shares} sh @ ~$${h.current_price.toFixed(2)} ≈ $${h.value.toFixed(2)})`
                      )
                      .join('; ')
                : 'No current holdings';

        let stockPriceNote = '';
        if (stockSymbol) {
            try {
                const p = await getCurrentPrice(stockSymbol);
                if (p > 0) {
                    stockPriceNote = `- Reference price from Vestera app data for **${stockSymbol}** (may lag; not a live broker quote): ~$${p.toFixed(2)}`;
                }
            } catch {
                /* optional context */
            }
        }

        const systemInstruction = buildSnapseSystemInstruction({
            mode,
            cash,
            portfolioSummary,
            totalAccount,
            pl,
            stockSymbol,
            stockPriceNote,
        });

        const { text: reply } = await grokChatCompletion({
            apiKey,
            systemPrompt: systemInstruction,
            messages: grokMessages,
        });

        if (!reply) {
            return NextResponse.json({
                reply:
                    'I did not get a usable answer from the model. Try again, or shorten your question.',
            });
        }

        await addChatMessage(userId, 'assistant', reply, mode, route);
        return NextResponse.json({ reply });
    } catch (e) {
        const err = e as { message?: string; status?: number; statusText?: string };
        const msg = err?.message || String(e);
        if (process.env.NODE_ENV === 'development') {
            console.error('[Snapse] Grok error:', msg, e);
        } else {
            console.error('[Snapse] Grok error:', msg);
        }

        const lower = msg.toLowerCase();
        if (lower.includes('api key') || (lower.includes('invalid') && lower.includes('key'))) {
            return NextResponse.json(
                { error: 'AI configuration error. Check GROK_API_KEY (or XAI_API_KEY) on the server.' },
                { status: 503 }
            );
        }
        if (lower.includes('quota') || lower.includes('resource exhausted') || lower.includes('429')) {
            return NextResponse.json(
                { error: 'The AI service is temporarily busy (rate limit). Please try again in a moment.' },
                { status: 429 }
            );
        }
        if (lower.includes('fetch failed') || lower.includes('network') || lower.includes('econnreset')) {
            return NextResponse.json(
                { error: 'Could not reach the AI service. Check your network and try again.' },
                { status: 502 }
            );
        }

        return NextResponse.json(
            { error: 'AI service unavailable. Please try again later.' },
            { status: 500 }
        );
    }
}
