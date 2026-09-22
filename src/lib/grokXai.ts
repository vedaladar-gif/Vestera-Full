/**
 * Groq via OpenAI-compatible Chat Completions API.
 * @see https://console.groq.com/docs/openai
 */

const GROQ_API_BASE = 'https://api.groq.com/openai/v1';

// Groq periodically retires older model IDs (llama-3.x-*, llama3-70b-8192, and
// mixtral-8x7b-32768 have all since been decommissioned). Keep this list to
// currently-active, general-purpose text models — verify against
// GET https://api.groq.com/openai/v1/models if chat starts failing with a
// "has been decommissioned" error again.
const DEFAULT_MODELS = [
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
];

export function getGrokApiKey(): string | null {
    const k = (
        process.env.GROQ_API_KEY ||
        process.env.GROK_API_KEY ||
        process.env.XAI_API_KEY ||
        ''
    ).trim();
    return k || null;
}

type ChatRole = 'user' | 'assistant';

type XaiErrorBody = { error?: { message?: string; type?: string } };

function normalizeModelList(models: string[]): string[] {
    const seen = new Set<string>();
    return models.filter(m => {
        const id = m.trim();
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
    });
}

/**
 * `systemPrompt` becomes a `system` message; `messages` are user/assistant turns (OpenAI roles).
 */
export async function grokChatCompletion(params: {
    apiKey: string;
    systemPrompt: string;
    messages: Array<{ role: ChatRole; content: string }>;
}): Promise<{ text: string; modelUsed: string }> {
    const envModel = process.env.GROK_MODEL?.trim();
    const modelsToTry = envModel ? [envModel, ...DEFAULT_MODELS] : [...DEFAULT_MODELS];
    const ordered = normalizeModelList(modelsToTry);

    const bodyMessages: Array<{ role: 'system' | ChatRole; content: string }> = [
        { role: 'system', content: params.systemPrompt.trim() },
        ...params.messages.map(m => ({
            role: m.role,
            content: m.content.trim(),
        })),
    ];

    let lastError: unknown;
    for (const model of ordered) {
        try {
            const res = await fetch(`${GROQ_API_BASE}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${params.apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    messages: bodyMessages,
                    temperature: 0.65,
                    max_tokens: 2048,
                }),
            });

            const data: unknown = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg =
                    (data as XaiErrorBody)?.error?.message ||
                    (typeof (data as { message?: string })?.message === 'string'
                        ? (data as { message: string }).message
                        : null) ||
                    res.statusText;
                throw new Error(typeof msg === 'string' ? msg : `HTTP ${res.status}`);
            }

            const choices = (data as { choices?: Array<{ message?: { content?: string } }> })?.choices;
            const text = choices?.[0]?.message?.content;
            if (typeof text === 'string' && text.trim()) {
                return { text: text.trim(), modelUsed: model };
            }
            lastError = new Error('Empty completion from Grok');
        } catch (e) {
            lastError = e;
        }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
