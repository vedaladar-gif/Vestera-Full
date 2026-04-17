import { GoogleGenerativeAI, type Content, type GenerateContentResult } from '@google/generative-ai';

/**
 * Models for `generativelanguage.googleapis.com` (AI Studio API key).
 * Avoid aliases like `gemini-1.5-flash-latest` — they often return 404.
 * Order: newest stable first; versioned IDs as backup.
 */
const DEFAULT_MODELS = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-001',
    'gemini-1.5-flash-8b',
    'gemini-1.5-flash-002',
    'gemini-1.5-flash',
];

/** Aliases that commonly 404 on the v1beta API; skipped so fallbacks still run. */
const UNSUPPORTED_MODEL_IDS = new Set(['gemini-1.5-flash-latest']);

function normalizeModelList(models: string[]): string[] {
    const seen = new Set<string>();
    return models.filter(m => {
        const id = m.trim();
        if (!id || seen.has(id) || UNSUPPORTED_MODEL_IDS.has(id)) return false;
        seen.add(id);
        return true;
    });
}

function extractTextFromResult(result: GenerateContentResult): string {
    const response = result.response;
    try {
        const t = response.text();
        if (t?.trim()) return t.trim();
    } catch {
        // blocked or missing candidates
    }

    const block = response.promptFeedback?.blockReason;
    if (block) {
        return `I couldn't answer that (content policy: ${block}). Try rephrasing, or ask about general investing concepts or your paper portfolio.`;
    }

    const finish = response.candidates?.[0]?.finishReason;
    if (finish === 'SAFETY' || finish === 'RECITATION') {
        return 'That request was filtered for safety. Try a broader investing-education question instead.';
    }

    const parts = response.candidates?.[0]?.content?.parts;
    const inline = parts?.map(p => ('text' in p && p.text ? p.text : '')).join('');
    if (inline?.trim()) return inline.trim();

    return '';
}

export async function generateSnapseReply(params: {
    apiKey: string;
    systemInstruction: string;
    contents: Content[];
}): Promise<{ text: string; modelUsed: string }> {
    const envModel = process.env.GEMINI_MODEL?.trim();
    const modelsToTry = envModel ? [envModel, ...DEFAULT_MODELS] : [...DEFAULT_MODELS];
    const ordered = normalizeModelList(modelsToTry);

    let lastError: unknown;
    for (const modelName of ordered) {
        try {
            const genAI = new GoogleGenerativeAI(params.apiKey);
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: params.systemInstruction,
                generationConfig: {
                    maxOutputTokens: 2048,
                    temperature: 0.65,
                },
            });
            const result = await model.generateContent({ contents: params.contents });
            const text = extractTextFromResult(result);
            if (text) {
                return { text, modelUsed: modelName };
            }
            lastError = new Error('Empty model response');
        } catch (e) {
            lastError = e;
        }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/** Single-string prompt (used by `/api/chat` widget). Tries GEMINI_MODEL then known Flash IDs. */
export async function generateGeminiSimplePromptReply(params: {
    apiKey: string;
    prompt: string;
}): Promise<{ text: string; modelUsed: string }> {
    const envModel = process.env.GEMINI_MODEL?.trim();
    const modelsToTry = envModel ? [envModel, ...DEFAULT_MODELS] : [...DEFAULT_MODELS];
    const ordered = normalizeModelList(modelsToTry);

    let lastError: unknown;
    for (const modelName of ordered) {
        try {
            const genAI = new GoogleGenerativeAI(params.apiKey);
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    maxOutputTokens: 2048,
                    temperature: 0.65,
                },
            });
            const result = await model.generateContent(params.prompt);
            const text = extractTextFromResult(result);
            if (text) {
                return { text, modelUsed: modelName };
            }
            lastError = new Error('Empty model response');
        } catch (e) {
            lastError = e;
        }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
