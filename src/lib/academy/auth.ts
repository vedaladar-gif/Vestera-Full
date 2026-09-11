import { getSession } from '@/lib/session';

export async function requireAcademyUser(): Promise<string | null> {
    const session = await getSession();
    return session.userId || null;
}

export function stripAnswers<T extends { answer?: number; explanationCorrect?: string; explanationIncorrect?: string }>(
    questions: T[],
) {
    return questions.map(({ answer: _a, explanationCorrect: _c, explanationIncorrect: _i, ...rest }) => rest);
}
