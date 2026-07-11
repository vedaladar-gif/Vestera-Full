'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    COURSE_CATALOG,
    COURSE_IDS,
    LESSONS_PER_COURSE,
    TOTAL_LESSONS,
    getCourseConfig,
    getPrevCourseId,
} from '@/lib/courseContent';

export { COURSE_CATALOG, COURSE_IDS, TOTAL_LESSONS };

// ── Progress model ────────────────────────────────────────────────────────────

export interface CourseProgress {
    lessonsDone: number;
    quizPassed: boolean;
    quizBestScore: number;
    quizAttempts: number;
}

export interface AcademyStore {
    courses: Record<string, CourseProgress>;
    xp: number;
    coins: number;
    badges: string[];
    streak: { count: number; lastDate: string };
}

// ── Rewards & thresholds ──────────────────────────────────────────────────────

export const QUIZ_PASS_PCT = 80;
export const XP_PER_LESSON = 40;
export const COINS_PER_LESSON = 10;
export const XP_QUIZ_BONUS = 100;
export const COINS_QUIZ_BONUS = 50;

const MAX_XP =
    TOTAL_LESSONS * XP_PER_LESSON + COURSE_IDS.length * XP_QUIZ_BONUS;

// ── Rank system ─────────────────────────────────────────────────────────────────

export const RANKS = [
    { name: 'Rookie Trader',    emoji: '🌱', minXP: 0   },
    { name: 'Junior Investor',  emoji: '📈', minXP: 200 },
    { name: 'Market Pro',       emoji: '⚡', minXP: 500 },
    { name: 'Wall Street Whiz', emoji: '🏆', minXP: 900 },
];

export function getRank(totalXP: number) {
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (totalXP >= RANKS[i].minXP) return RANKS[i];
    }
    return RANKS[0];
}

export function getNextRank(totalXP: number) {
    for (let i = 0; i < RANKS.length; i++) {
        if (totalXP < RANKS[i].minXP) return RANKS[i];
    }
    return null;
}

export function getTraderScore(totalXP: number) {
    return Math.min(1000, Math.round((totalXP / MAX_XP) * 1000));
}

// ── Course / lesson helpers ─────────────────────────────────────────────────────

export function emptyCourseProgress(): CourseProgress {
    return { lessonsDone: 0, quizPassed: false, quizBestScore: 0, quizAttempts: 0 };
}

export function getCourseProgress(
    courses: Record<string, CourseProgress>,
    courseId: string
): CourseProgress {
    return courses[courseId] ?? emptyCourseProgress();
}

export function isCourseUnlocked(
    courseId: string,
    courses: Record<string, CourseProgress>
): boolean {
    const prevId = getPrevCourseId(courseId);
    if (!prevId) return true;

    const prev = getCourseProgress(courses, prevId);
    return prev.quizPassed && prev.quizBestScore >= QUIZ_PASS_PCT;
}

export function isLessonUnlocked(
    courseId: string,
    lessonIndex: number,
    courses: Record<string, CourseProgress>
): boolean {
    if (!isCourseUnlocked(courseId, courses)) return false;
    return getCourseProgress(courses, courseId).lessonsDone >= lessonIndex;
}

export function isLessonDone(
    courseId: string,
    lessonIndex: number,
    courses: Record<string, CourseProgress>
): boolean {
    return lessonIndex < getCourseProgress(courses, courseId).lessonsDone;
}

export function getCourseProgressPct(
    courseId: string,
    courses: Record<string, CourseProgress>
): number {
    const cp = getCourseProgress(courses, courseId);
    const steps = LESSONS_PER_COURSE + 1;
    const completed = cp.lessonsDone + (cp.quizPassed ? 1 : 0);
    return Math.round((completed / steps) * 100);
}

// ── Storage ─────────────────────────────────────────────────────────────────────

function makeEmpty(): AcademyStore {
    return {
        courses: {},
        xp: 0,
        coins: 0,
        badges: [],
        streak: { count: 0, lastDate: '' },
    };
}

function storageKey(userId: string) {
    return `vestera_academy_v2_${userId}`;
}

function normalizeCourseProgress(raw: Partial<CourseProgress> | undefined): CourseProgress {
    const base = emptyCourseProgress();
    if (!raw || typeof raw !== 'object') return base;

    return {
        lessonsDone: Math.min(
            LESSONS_PER_COURSE,
            Math.max(0, Number(raw.lessonsDone) || 0)
        ),
        quizPassed: Boolean(raw.quizPassed),
        quizBestScore: Math.min(100, Math.max(0, Number(raw.quizBestScore) || 0)),
        quizAttempts: Math.max(0, Number(raw.quizAttempts) || 0),
    };
}

function normalizeStore(raw: Partial<AcademyStore> | null | undefined): AcademyStore {
    if (!raw || typeof raw !== 'object') return makeEmpty();

    const courses: Record<string, CourseProgress> = {};
    if (raw.courses && typeof raw.courses === 'object') {
        for (const [id, cp] of Object.entries(raw.courses)) {
            courses[id] = normalizeCourseProgress(cp);
        }
    }

    return {
        courses,
        xp: Math.max(0, Number(raw.xp) || 0),
        coins: Math.max(0, Number(raw.coins) || 0),
        badges: Array.isArray(raw.badges) ? raw.badges.filter(b => typeof b === 'string') : [],
        streak: {
            count: Math.max(0, Number(raw.streak?.count) || 0),
            lastDate: typeof raw.streak?.lastDate === 'string' ? raw.streak.lastDate : '',
        },
    };
}

function updateStreak(streak: AcademyStore['streak']): AcademyStore['streak'] {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const last = streak.lastDate;

    if (last === today) {
        return streak;
    }

    const count = last === yesterday ? streak.count + 1 : 1;
    return { count, lastDate: today };
}

// ── Hook ────────────────────────────────────────────────────────────────────────

export function useAcademyProgress(
    authenticated: boolean,
    authLoading: boolean,
    userId: string | null
) {
    const [store, setStore] = useState<AcademyStore>(makeEmpty);

    const canPersist = Boolean(authenticated && !authLoading && userId);

    useEffect(() => {
        if (!authLoading && !authenticated) setStore(makeEmpty());
    }, [authenticated, authLoading]);

    useEffect(() => {
        if (!canPersist || !userId) return;
        try {
            const raw = localStorage.getItem(storageKey(userId));
            if (raw) {
                setStore(normalizeStore(JSON.parse(raw) as Partial<AcademyStore>));
                return;
            }
        } catch { /* ignore */ }
        setStore(makeEmpty());
    }, [canPersist, userId]);

    const save = useCallback((next: AcademyStore) => {
        if (!canPersist || !userId) return;
        try {
            localStorage.setItem(storageKey(userId), JSON.stringify(next));
        } catch { /* ignore */ }
    }, [canPersist, userId]);

    const completeLesson = useCallback((courseId: string) => {
        if (!canPersist || !getCourseConfig(courseId)) return;

        setStore(prev => {
            const current = getCourseProgress(prev.courses, courseId);
            if (current.lessonsDone >= LESSONS_PER_COURSE) return prev;

            const next: AcademyStore = {
                ...prev,
                courses: {
                    ...prev.courses,
                    [courseId]: {
                        ...current,
                        lessonsDone: current.lessonsDone + 1,
                    },
                },
                xp: prev.xp + XP_PER_LESSON,
                coins: prev.coins + COINS_PER_LESSON,
                streak: updateStreak(prev.streak),
            };
            save(next);
            return next;
        });
    }, [canPersist, save]);

    const passQuiz = useCallback((courseId: string, scorePct: number) => {
        if (!canPersist || !getCourseConfig(courseId)) return;

        const pct = Math.min(100, Math.max(0, Math.round(scorePct)));
        const passed = pct >= QUIZ_PASS_PCT;
        const config = getCourseConfig(courseId)!;

        setStore(prev => {
            const current = getCourseProgress(prev.courses, courseId);
            const bestScore = Math.max(current.quizBestScore, pct);
            const alreadyPassed = current.quizPassed;

            let xp = prev.xp;
            let coins = prev.coins;
            let badges = prev.badges;

            if (passed && !alreadyPassed) {
                xp += XP_QUIZ_BONUS;
                coins += COINS_QUIZ_BONUS;
                if (!badges.includes(config.badge)) {
                    badges = [...badges, config.badge];
                }
            }

            const next: AcademyStore = {
                ...prev,
                courses: {
                    ...prev.courses,
                    [courseId]: {
                        ...current,
                        quizAttempts: current.quizAttempts + 1,
                        quizBestScore: bestScore,
                        quizPassed: current.quizPassed || passed,
                    },
                },
                xp,
                coins,
                badges,
            };
            save(next);
            return next;
        });
    }, [canPersist, save]);

    const canTakeQuiz = useCallback((courseId: string) => {
        return getCourseProgress(store.courses, courseId).lessonsDone >= LESSONS_PER_COURSE;
    }, [store.courses]);

    const courses = store.courses;
    const totalLessonsDone = COURSE_IDS.reduce(
        (sum, id) => sum + getCourseProgress(courses, id).lessonsDone,
        0
    );
    const totalXP = store.xp;
    const totalCoins = store.coins;
    const traderScore = getTraderScore(totalXP);
    const currentRank = getRank(totalXP);
    const nextRank = getNextRank(totalXP);
    const xpToNext = nextRank ? nextRank.minXP - totalXP : 0;

    return {
        courses,
        totalLessonsDone,
        totalXP,
        totalCoins,
        traderScore,
        currentRank,
        nextRank,
        xpToNext,
        streak: store.streak.count,
        badges: store.badges,
        completeLesson,
        passQuiz,
        canTakeQuiz,
    };
}
