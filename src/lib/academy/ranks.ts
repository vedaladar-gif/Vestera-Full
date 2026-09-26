import type { AcademyRank, AcademyRankId } from './types';

export const ACADEMY_RANKS: AcademyRank[] = [
    {
        id: 1,
        slug: 'just-starting',
        name: 'Just Starting',
        shortName: 'Just Starting',
        tagline: 'Money, saving, and what a stock actually is.',
        lessonStart: 1,
        lessonEnd: 20,
        color: '#4576E7',
        xpPerLesson: 50,
    },
    {
        id: 2,
        slug: 'money-explorer',
        name: 'Money Explorer',
        shortName: 'Money Explorer',
        tagline: 'Funds, company numbers, and how trades work.',
        lessonStart: 21,
        lessonEnd: 40,
        color: '#4576E7',
        xpPerLesson: 75,
    },
    {
        id: 3,
        slug: 'investing-builder',
        name: 'Investing Builder',
        shortName: 'Investing Builder',
        tagline: 'Portfolios, risk, and how markets move over time.',
        lessonStart: 41,
        lessonEnd: 60,
        color: '#7C3AED',
        xpPerLesson: 75,
    },
    {
        id: 4,
        slug: 'market-analyst',
        name: 'Market Analyst',
        shortName: 'Market Analyst',
        tagline: 'How to study companies, charts, and investor habits.',
        lessonStart: 61,
        lessonEnd: 80,
        color: '#FFB84C',
        xpPerLesson: 100,
    },
    {
        id: 5,
        slug: 'investing-pro',
        name: 'Investing Pro',
        shortName: 'Investing Pro',
        tagline: 'Build, test, and defend a long-term plan.',
        lessonStart: 81,
        lessonEnd: 100,
        color: '#E0637A',
        xpPerLesson: 100,
    },
];

export function rankById(id: AcademyRankId): AcademyRank {
    return ACADEMY_RANKS[id - 1];
}

export function rankForLesson(lessonId: number): AcademyRank {
    const idx = Math.min(4, Math.max(0, Math.floor((lessonId - 1) / 20)));
    return ACADEMY_RANKS[idx];
}

export function lessonXp(lessonId: number): number {
    const rank = rankForLesson(lessonId);
    if (rank.id === 1) return 50;
    if (rank.id === 2) return lessonId <= 24 ? 50 : 75;
    if (rank.id === 3) return 75;
    return 100;
}

export function lessonDifficulty(lessonId: number): 'easy' | 'standard' | 'advanced' {
    if (lessonId <= 20) return 'easy';
    if (lessonId <= 60) return 'standard';
    return 'advanced';
}

export function lessonMinutes(lessonId: number): number {
    if (lessonId <= 20) return 6 + (lessonId % 3);
    if (lessonId <= 60) return 7 + (lessonId % 3);
    return 8 + (lessonId % 3);
}

/**
 * Progress along the 5-segment journey bar (0–1).
 * Unranked users stay at 0.
 */
export function journeyProgress(currentRank: AcademyRankId | null, completedInRank: number): number {
    if (!currentRank) return 0;
    const inRank = Math.max(0, Math.min(20, completedInRank));
    return ((currentRank - 1) + inRank / 20) / 5;
}

export function rankUpTarget(currentRank: AcademyRankId): AcademyRankId | null {
    if (currentRank >= 5) return null;
    return (currentRank + 1) as AcademyRankId;
}

/** Transparent diagnostic → starting rank. Never auto-assigns Rank 5 without a perfect paper. */
export function startingRankFromScore(score: number, advancedAllCorrect: boolean): AcademyRankId {
    if (score <= 4) return 1;
    if (score <= 8) return 2;
    if (score <= 12) return 3;
    if (score <= 14) return 4;
    if (score >= 15 && advancedAllCorrect) return 5;
    return 4;
}

export function firstLessonForRank(rank: AcademyRankId): number {
    return (rank - 1) * 20 + 1;
}

export function lastLessonForRank(rank: AcademyRankId): number {
    return rank * 20;
}

export const ACHIEVEMENTS = [
    { id: 'first-lesson', name: 'First Lesson', description: 'Passed your first Academy quiz.' },
    { id: 'lessons-10', name: '10 Lessons Completed', description: 'Passed 10 lesson quizzes.' },
    { id: 'lessons-20', name: '20 Lessons Completed', description: 'Finished a full rank of lessons.' },
    { id: 'first-rank-up', name: 'First Rank Up', description: 'Passed your first rank-up test.' },
    { id: 'quiz-master', name: 'Quiz Master', description: 'Passed 25 lesson quizzes.' },
    { id: 'perfect-score', name: 'Perfect Score', description: 'Scored 10/10 on a lesson quiz.' },
    { id: 'streak-7', name: '7-Day Learning Streak', description: 'Learned on 7 different days.' },
    { id: 'lessons-50', name: '50 Lessons Completed', description: 'Halfway through the Academy.' },
    { id: 'lessons-100', name: '100 Lessons Completed', description: 'Finished every lesson.' },
    { id: 'investing-pro', name: 'Investing Pro', description: 'Reached the highest Academy rank.' },
] as const;
