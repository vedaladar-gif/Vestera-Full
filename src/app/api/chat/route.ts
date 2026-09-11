import { NextResponse } from 'next/server';
import { getGrokApiKey, grokChatCompletion } from '@/lib/grokXai';

type Role = 'user' | 'assistant';

interface ChatMessage {
    role: Role;
    content: string;
}

function isChatMessage(v: unknown): v is ChatMessage {
    if (!v || typeof v !== 'object') return false;
    const m = v as { role?: unknown; content?: unknown };
    if (m.role !== 'user' && m.role !== 'assistant') return false;
    if (typeof m.content !== 'string') return false;
    return true;
}

const SYSTEM_PROMPT = `
You are Vesta, a friendly investing education assistant. You help users understand stocks, trading, and financial concepts in a clear and simple way.
- Do not guarantee profits.
- Do not invent real-time prices or claim you have live market data.
- Be helpful, conversational, and concise.
- You may use **bold** sparingly for key terms when it helps readability.
`.trim();

const MAX_MESSAGES = 10;
const MAX_MESSAGE_CHARS = 8000;

export async function POST(req: Request) {
    const apiKey = getGrokApiKey();
    if (!apiKey) {
        return NextResponse.json(
            {
                error:
                    'Missing GROK_API_KEY (or XAI_API_KEY). Add it to .env.local and restart the dev server.',
            },
            { status: 500 }
        );
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    let rawMessages = (body as { messages?: unknown }).messages;
    const singleMessage = (body as { message?: unknown }).message;
    if ((!Array.isArray(rawMessages) || rawMessages.length === 0) && typeof singleMessage === 'string') {
        const t = singleMessage.trim();
        if (t) rawMessages = [{ role: 'user' as const, content: t }];
    }
    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
        return NextResponse.json(
            {
                error:
                    'Send { messages: [{ role, content }, ...] } or { message: string } with a non-empty message.',
            },
            { status: 400 }
        );
    }

    const messages: ChatMessage[] = [];
    for (const item of rawMessages) {
        if (!isChatMessage(item)) {
            return NextResponse.json(
                { error: 'Each message must have role "user" or "assistant" and a string content' },
                { status: 400 }
            );
        }
        const text = item.content.trim();
        if (!text) {
            return NextResponse.json({ error: 'Empty message content is not allowed' }, { status: 400 });
        }
        if (text.length > MAX_MESSAGE_CHARS) {
            return NextResponse.json(
                { error: `Message exceeds maximum length (${MAX_MESSAGE_CHARS} characters)` },
                { status: 400 }
            );
        }
        messages.push({ role: item.role, content: text });
    }

    const recent = messages.slice(-MAX_MESSAGES);

    const ctx = (body as { context?: unknown }).context;
    let contextBlock = '';
    if (ctx && typeof ctx === 'object' && ctx !== null) {
        const c = ctx as {
            route?: unknown;
            mode?: unknown;
            stockSymbol?: unknown;
            lessonId?: unknown;
            lessonTitle?: unknown;
            lessonExcerpt?: unknown;
        };
        const route = typeof c.route === 'string' ? c.route : '';
        const mode = typeof c.mode === 'string' ? c.mode : '';
        const sym = typeof c.stockSymbol === 'string' ? c.stockSymbol.trim().toUpperCase() : '';
        const lessonTitle = typeof c.lessonTitle === 'string' ? c.lessonTitle : '';
        const lessonId = typeof c.lessonId === 'number' ? c.lessonId : (typeof c.lessonId === 'string' ? c.lessonId : '');
        const excerpt = typeof c.lessonExcerpt === 'string' ? c.lessonExcerpt.slice(0, 1800) : '';
        const parts: string[] = [];
        if (route) parts.push(`Site route: ${route}.`);
        if (mode) parts.push(`UI mode hint: ${mode}.`);
        if (sym) parts.push(`User may be viewing ticker ${sym} (context only — do not invent live quotes).`);
        if (lessonTitle) {
            parts.push(`The student is studying Academy lesson ${lessonId}: "${lessonTitle}". Stay on this topic. Teach concepts, do not give personalized financial advice, and never say stocks always go up. Simulated practice is not real-world performance.`);
            if (excerpt) parts.push(`Lesson excerpt:\n${excerpt}`);
        }
        if (parts.length) contextBlock = `\n\n${parts.join(' ')}`;
    }

    const systemPrompt = `${SYSTEM_PROMPT}${contextBlock}`;

    try {
        const { text } = await grokChatCompletion({
            apiKey,
            systemPrompt,
            messages: recent,
        });
        return NextResponse.json({ reply: text });
    } catch (err) {
        console.error('[api/chat] Grok error:', err);
        const hint =
            err instanceof Error && err.message
                ? err.message.slice(0, 280)
                : 'Failed to get AI response';
        return NextResponse.json({ error: hint }, { status: 500 });
    }
}
