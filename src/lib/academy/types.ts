export type AcademyDifficulty = 'easy' | 'standard' | 'advanced';

export type AcademyRankId = 1 | 2 | 3 | 4 | 5;

export type LessonStatus = 'locked' | 'available' | 'current' | 'completed';

export type QuizQuestionType =
    | 'multiple_choice'
    | 'scenario'
    | 'calculation'
    | 'compare'
    | 'chart';

export interface AcademyRank {
    id: AcademyRankId;
    slug: string;
    name: string;
    shortName: string;
    tagline: string;
    lessonStart: number;
    lessonEnd: number;
    color: string;
    xpPerLesson: number;
}

export interface LessonCatalogItem {
    id: number;
    rankId: AcademyRankId;
    title: string;
    difficulty: AcademyDifficulty;
    minutes: number;
    xp: number;
    topics: string[];
    searchTerms: string[];
    practice?: { label: string; href: string };
}

export interface LessonSection {
    heading: string;
    body: string;
    callout?: string;
}

export interface LessonTryIt {
    prompt: string;
    choices: string[];
    answer: number;
    explanation: string;
}

export interface QuizQuestion {
    id: string;
    type: QuizQuestionType;
    prompt: string;
    options: string[];
    answer: number;
    explanationCorrect: string;
    explanationIncorrect: string;
    topic: string;
    chart?: {
        kind: 'bars' | 'line';
        title?: string;
        labels: string[];
        values: number[];
    };
}

export interface AcademyLesson extends LessonCatalogItem {
    intro: string;
    whyItMatters: string;
    sections: LessonSection[];
    realWorld: string;
    tryIt: LessonTryIt;
    takeaways: string[];
    quiz: QuizQuestion[];
}

export interface PublicQuizQuestion {
    id: string;
    type: QuizQuestionType;
    prompt: string;
    options: string[];
    topic: string;
    chart?: QuizQuestion['chart'];
}

export interface TopicScore {
    topic: string;
    correct: number;
    total: number;
}

export interface DiagnosticQuestion extends QuizQuestion {
    band: 'beginner' | 'basic' | 'intermediate' | 'advanced';
}

export interface AcademyUserState {
    userId: string;
    username: string;
    displayName: string | null;
    diagnosticCompleted: boolean;
    diagnosticScore: number | null;
    diagnosticTotal: number | null;
    diagnosticCompletedAt: string | null;
    startingRank: AcademyRankId | null;
    currentRank: AcademyRankId | null;
    xp: number;
    lessonsCompleted: number;
    lessonsAttempted: number;
    quizAverage: number | null;
    currentLesson: number | null;
    lastActiveAt: string | null;
    timeSpentMs: number;
    rankUpAvailable: boolean;
    rankUpFromRank: AcademyRankId | null;
    completedLessonIds: number[];
    bestScores: Record<number, number>;
    achievements: string[];
    reviewTopics: { topic: string; lessonId: number; title: string }[];
    streakDays: number;
}

export interface LessonProgressRow {
    lessonId: number;
    status: 'started' | 'completed';
    startedAt: string | null;
    completedAt: string | null;
    bestScore: number | null;
    lastScore: number | null;
    timeSpentMs: number;
    xpAwarded: number;
    attempts: number;
}

export const LESSON_PASS_SCORE = 6;
export const LESSON_QUIZ_SIZE = 10;
export const DIAGNOSTIC_SIZE = 15;
export const RANK_UP_SIZE = 25;
export const RANK_UP_PASS_SCORE = 16;
export const TOTAL_LESSONS = 100;
export const LESSONS_PER_RANK = 20;
export const HEARTBEAT_MAX_CREDIT_MS = 45_000;
export const HEARTBEAT_IDLE_CAP_MS = 60_000;
