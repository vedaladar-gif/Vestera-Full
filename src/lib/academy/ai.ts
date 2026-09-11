import { getGrokApiKey, grokChatCompletion } from '@/lib/grokXai';
import { rankById } from './ranks';
import type { AcademyRankId, TopicScore } from './types';

export async function diagnosticAiSummary(input: {
    score: number;
    total: number;
    startingRank: AcademyRankId;
    topics: TopicScore[];
}): Promise<string> {
    const rank = rankById(input.startingRank);
    const fallback = fallbackSummary(input.score, input.total, rank.name, input.topics);
    const apiKey = getGrokApiKey();
    if (!apiKey) return fallback;

    const weak = input.topics.filter(t => t.correct < t.total).map(t => `${t.topic} (${t.correct}/${t.total})`).join(', ');
    const strong = input.topics.filter(t => t.correct === t.total && t.total > 0).map(t => t.topic).join(', ');

    try {
        const { text } = await grokChatCompletion({
            apiKey,
            systemPrompt: `You write one short paragraph for a student learning investing on Vestera.
Rules:
- Simple language a 10-year-old can follow.
- Do not give personalized financial advice.
- Do not change their rank. Their starting rank is already decided: ${rank.name}.
- Do not say stocks always go up.
- 2-4 sentences. No bullet lists.`,
            messages: [
                {
                    role: 'user',
                    content: `Score ${input.score}/${input.total}. Starting rank: ${rank.name}. Strong topics: ${strong || 'none listed'}. Weaker topics: ${weak || 'none'}. Write a kind explanation of why they are starting here.`,
                },
            ],
        });
        const cleaned = (text || '').trim();
        return cleaned || fallback;
    } catch {
        return fallback;
    }
}

function fallbackSummary(score: number, total: number, rankName: string, topics: TopicScore[]): string {
    const weak = topics.filter(t => t.total > 0 && t.correct / t.total < 0.5).map(t => t.topic);
    if (score <= 4) {
        return `You are just getting started, and that is a great place to be. We will begin with money basics so every later idea has a solid foundation. Your learning path has been personalized based on your results.`;
    }
    if (weak.length) {
        return `You already know some investing ideas, so we are starting you at ${rankName}. You may want extra practice with ${weak.slice(0, 2).join(' and ')}. Your learning path has been personalized based on your results.`;
    }
    return `You scored ${score}/${total}, so we are starting you at ${rankName}. We will keep building from what you already understand. Your learning path has been personalized based on your results.`;
}

export function lessonVestaSystem(lessonTitle: string, lessonId: number, excerpt: string) {
    return `
The student is in Vestera Academy, Lesson ${lessonId}: "${lessonTitle}".
Teach this topic in simple language. You may explain, give examples, quiz them, or rephrase the hard part.
Do NOT give personalized financial advice (no "you should buy this stock").
Do NOT claim live prices. Simulated practice is not real-world performance.
Investing can lose money. Never say stocks always go up.
Keep answers short. Stay on this lesson unless they ask otherwise.

Lesson excerpt:
${excerpt.slice(0, 1800)}
`.trim();
}
