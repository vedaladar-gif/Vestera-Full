import type { Content } from '@google/generative-ai';

export interface SnapseClientMessage {
    role: 'user' | 'assistant';
    content: string;
}

const MAX_MESSAGES = 24;

/** Build Gemini `contents` from client chat; skips leading assistant (e.g. welcome). Collapses same-role runs. */
export function clientMessagesToGeminiContents(messages: SnapseClientMessage[]): Content[] {
    const slice = messages.slice(-MAX_MESSAGES);
    let start = 0;
    while (start < slice.length && slice[start].role === 'assistant') {
        start += 1;
    }
    const relevant = slice.slice(start).filter(m => typeof m.content === 'string' && m.content.trim().length > 0);
    if (relevant.length === 0) {
        throw new Error('No messages to send');
    }

    const collapsed: SnapseClientMessage[] = [];
    for (const m of relevant) {
        const text = m.content.trim();
        const last = collapsed[collapsed.length - 1];
        if (last && last.role === m.role) {
            last.content = `${last.content}\n\n${text}`;
        } else {
            collapsed.push({ role: m.role, content: text });
        }
    }

    const last = collapsed[collapsed.length - 1];
    if (!last || last.role !== 'user') {
        throw new Error('Last message must be from the user');
    }

    return collapsed.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
    }));
}

export function lastUserContent(messages: SnapseClientMessage[]): string {
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
            return messages[i].content.trim();
        }
    }
    return '';
}

/**
 * OpenAI/xAI chat roles for Grok. Keeps leading assistant (e.g. welcome); collapses same-role runs.
 * Last turn must be from the user.
 */
export function clientMessagesToGrokMessages(
    messages: SnapseClientMessage[]
): { role: 'user' | 'assistant'; content: string }[] {
    const slice = messages.slice(-MAX_MESSAGES);
    const trimmed = slice.filter(m => typeof m.content === 'string' && m.content.trim().length > 0);
    if (trimmed.length === 0) {
        throw new Error('No messages to send');
    }

    const collapsed: SnapseClientMessage[] = [];
    for (const m of trimmed) {
        const text = m.content.trim();
        const last = collapsed[collapsed.length - 1];
        if (last && last.role === m.role) {
            last.content = `${last.content}\n\n${text}`;
        } else {
            collapsed.push({ role: m.role, content: text });
        }
    }

    const last = collapsed[collapsed.length - 1];
    if (!last || last.role !== 'user') {
        throw new Error('Last message must be from the user');
    }

    return collapsed.map(m => ({ role: m.role, content: m.content }));
}
