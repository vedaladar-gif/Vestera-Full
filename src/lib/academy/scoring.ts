/** Shared scoring so diagnostic, lesson quizzes, and rank-up tests stay consistent. */

export function normalizeChoiceIndex(value: unknown): number {
    if (typeof value === 'number' && Number.isInteger(value)) return value;
    if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) {
        return Number(value.trim());
    }
    return -1;
}

export type ScoredDetail = {
    questionId: string;
    selectedIndex: number;
    correct: boolean;
    correctIndex: number;
    topic: string;
};

export function scoreKeyedAnswers<T extends { id: string; answer: number; options?: string[]; topic?: string }>(
    questions: T[],
    answers: { questionId?: string; selectedIndex?: unknown }[],
): { score: number; total: number; details: ScoredDetail[] } {
    const byId = new Map<string, unknown>();
    for (const a of answers || []) {
        if (a && typeof a.questionId === 'string') byId.set(a.questionId, a.selectedIndex);
    }

    let score = 0;
    const details = questions.map(q => {
        const selectedIndex = normalizeChoiceIndex(byId.get(q.id));
        const answer = normalizeChoiceIndex(q.answer);
        const inRange = Array.isArray(q.options) ? selectedIndex >= 0 && selectedIndex < q.options.length : selectedIndex >= 0;
        const correct = inRange && selectedIndex === answer;
        if (correct) score += 1;
        return {
            questionId: q.id,
            selectedIndex,
            correct,
            correctIndex: answer,
            topic: q.topic || '',
        };
    });

    return { score, total: questions.length, details };
}

export function scoreOneQuestion<T extends { id: string; answer: number; options?: string[]; topic?: string }>(
    question: T,
    selectedIndex: unknown,
): ScoredDetail {
    return scoreKeyedAnswers([question], [{ questionId: question.id, selectedIndex }]).details[0];
}

export function assertQuestionBank<T extends { id: string; answer: number; options: string[] }>(
    questions: T[],
    expected: number,
    label: string,
): void {
    if (questions.length !== expected) {
        throw new Error(`${label} must have exactly ${expected} questions (got ${questions.length})`);
    }
    const seen = new Set<string>();
    for (const q of questions) {
        if (!q.id || seen.has(q.id)) throw new Error(`${label} has a missing or duplicate question id`);
        seen.add(q.id);
        if (!Array.isArray(q.options) || q.options.length < 2) {
            throw new Error(`${label} question ${q.id} needs at least 2 options`);
        }
        const ans = normalizeChoiceIndex(q.answer);
        if (ans < 0 || ans >= q.options.length) {
            throw new Error(`${label} question ${q.id} has an invalid answer index`);
        }
    }
}
