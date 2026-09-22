import { getDb } from '@/lib/db';
import { supabase } from '@/lib/supabaseClient';
import { getSupabaseServiceRole } from '@/lib/supabaseServiceRole';
import { shouldUseLocalAuth } from '@/lib/authMode';
import { isLocalUser } from '@/lib/localUserId';
import { isDemo } from '@/lib/demoStore';
import { initAcademySqlite } from './schema';
import {
    ACHIEVEMENTS,
    firstLessonForRank,
    lastLessonForRank,
    rankById,
    rankUpTarget,
    startingRankFromScore,
} from './ranks';
import { LESSON_CATALOG, getCatalogItem, topicToLessonId } from './catalog';
import { DIAGNOSTIC_QUESTIONS } from './diagnosticQuestions';
import { getLessonById } from './content';
import { getRankUpTest } from './rankUpTests';
import {
    DIAGNOSTIC_SIZE,
    HEARTBEAT_IDLE_CAP_MS,
    HEARTBEAT_MAX_CREDIT_MS,
    LESSON_PASS_SCORE,
    RANK_UP_PASS_SCORE,
    RANK_UP_SIZE,
    TOTAL_LESSONS,
    type AcademyRankId,
    type AcademyUserState,
    type TopicScore,
} from './types';
import { getUserById } from '@/lib/models';
import { assertQuestionBank, scoreKeyedAnswers, scoreOneQuestion } from './scoring';

function nowIso() {
    return new Date().toISOString();
}

function dayKey(d = new Date()) {
    return d.toISOString().slice(0, 10);
}

/** Once Supabase academy tables are missing, keep using local SQLite so quizzes can finish. */
let academySqliteForced = false;

function useSqlite(userId: string) {
    return academySqliteForced || shouldUseLocalAuth() || isLocalUser(userId) || isDemo(userId);
}

function sb() {
    return getSupabaseServiceRole() ?? supabase;
}

function isRecoverable(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const err = error as { code?: string; message?: string; error?: unknown };
    if (err.error && err.error !== error) return isRecoverable(err.error);
    if (['PGRST205', '42P01', '42501', 'PGRST301'].includes(err.code || '')) return true;
    return typeof err.message === 'string' && /could not find the table|row-level security|schema cache/i.test(err.message);
}

function sqlite() {
    const db = getDb();
    initAcademySqlite(db);
    return db;
}

type ProgressRow = {
    user_id: string;
    diagnostic_completed: number | boolean;
    diagnostic_score: number | null;
    diagnostic_total: number | null;
    diagnostic_completed_at: string | null;
    starting_rank: number | null;
    current_rank: number | null;
    xp: number;
    current_lesson: number | null;
    last_active_at: string | null;
    created_at: string;
    updated_at: string;
};

async function ensureProgress(userId: string): Promise<ProgressRow> {
    if (useSqlite(userId)) {
        const db = sqlite();
        const existing = db.prepare('SELECT * FROM academy_progress WHERE user_id = ?').get(userId) as ProgressRow | undefined;
        if (existing) return existing;
        const t = nowIso();
        db.prepare(
            `INSERT INTO academy_progress (user_id, diagnostic_completed, xp, created_at, updated_at)
             VALUES (?, 0, 0, ?, ?)`,
        ).run(userId, t, t);
        return db.prepare('SELECT * FROM academy_progress WHERE user_id = ?').get(userId) as ProgressRow;
    }
    const db = sb();
    const { data, error } = await db.from('academy_progress').select('*').eq('user_id', userId).maybeSingle();
    if (error && isRecoverable(error)) return ensureProgressSqliteFallback(userId);
    if (error) throw error;
    if (data) return data as ProgressRow;
    const t = nowIso();
    const insert = {
        user_id: userId,
        diagnostic_completed: false,
        xp: 0,
        created_at: t,
        updated_at: t,
    };
    const { data: created, error: e2 } = await db.from('academy_progress').insert(insert).select('*').maybeSingle();
    if (e2 && isRecoverable(e2)) return ensureProgressSqliteFallback(userId);
    if (e2) throw e2;
    return created as ProgressRow;
}

function ensureProgressSqliteFallback(userId: string): ProgressRow {
    academySqliteForced = true;
    const db = sqlite();
    const existing = db.prepare('SELECT * FROM academy_progress WHERE user_id = ?').get(userId) as ProgressRow | undefined;
    if (existing) return existing;
    const t = nowIso();
    db.prepare(
        `INSERT INTO academy_progress (user_id, diagnostic_completed, xp, created_at, updated_at)
         VALUES (?, 0, 0, ?, ?)`,
    ).run(userId, t, t);
    return db.prepare('SELECT * FROM academy_progress WHERE user_id = ?').get(userId) as ProgressRow;
}

export async function touchAcademyActivity(userId: string, currentLesson?: number | null) {
    const t = nowIso();
    const day = dayKey();
    if (useSqlite(userId)) {
        const db = sqlite();
        await ensureProgress(userId);
        db.prepare(
            `UPDATE academy_progress SET last_active_at = ?, updated_at = ?, current_lesson = COALESCE(?, current_lesson) WHERE user_id = ?`,
        ).run(t, t, currentLesson ?? null, userId);
        db.prepare('INSERT OR IGNORE INTO academy_daily_activity (user_id, day) VALUES (?, ?)').run(userId, day);
        return;
    }
    const db = sb();
    await ensureProgress(userId);
    const patch: Record<string, unknown> = { last_active_at: t, updated_at: t };
    if (currentLesson != null) patch.current_lesson = currentLesson;
    const { error } = await db.from('academy_progress').update(patch).eq('user_id', userId);
    if (error && isRecoverable(error)) {
        await touchAcademyActivitySqlite(userId, currentLesson);
        return;
    }
    await db.from('academy_daily_activity').upsert({ user_id: userId, day }, { onConflict: 'user_id,day' });
}

async function touchAcademyActivitySqlite(userId: string, currentLesson?: number | null) {
    const db = sqlite();
    const t = nowIso();
    db.prepare(
        `UPDATE academy_progress SET last_active_at = ?, updated_at = ?, current_lesson = COALESCE(?, current_lesson) WHERE user_id = ?`,
    ).run(t, t, currentLesson ?? null, userId);
    db.prepare('INSERT OR IGNORE INTO academy_daily_activity (user_id, day) VALUES (?, ?)').run(userId, dayKey());
}

function truthy(v: unknown) {
    return v === true || v === 1 || v === '1';
}

function completedInRank(completedIds: number[], rank: AcademyRankId) {
    const start = firstLessonForRank(rank);
    const end = lastLessonForRank(rank);
    return completedIds.filter(id => id >= start && id <= end).length;
}

function isLessonUnlocked(currentRank: AcademyRankId | null, lessonId: number, completedIds: number[]) {
    if (!currentRank) return false;
    const item = getCatalogItem(lessonId);
    if (!item) return false;
    if (item.rankId < currentRank) return true;
    if (item.rankId > currentRank) return false;
    const start = firstLessonForRank(currentRank);
    if (lessonId === start) return true;
    const prev = lessonId - 1;
    if (prev < start) return true;
    return completedIds.includes(prev) || completedIds.includes(lessonId);
}

function rankUpEligible(currentRank: AcademyRankId | null, completedIds: number[]) {
    if (!currentRank || currentRank >= 5) return false;
    return completedInRank(completedIds, currentRank) >= 20;
}

function listCompletedSqlite(userId: string) {
    const rows = sqlite()
        .prepare('SELECT lesson_id, status, best_score, attempts, time_spent_ms FROM academy_lesson_progress WHERE user_id = ?')
        .all(userId) as { lesson_id: number; status: string; best_score: number | null; attempts: number; time_spent_ms: number }[];
    return foldProgressRows(rows);
}

function mergeProgressRows(
    a: { ids: number[]; best: Record<number, number>; attempted: number; avg: number | null; timeMs: number },
    b: { ids: number[]; best: Record<number, number>; attempted: number; avg: number | null; timeMs: number },
) {
    const ids = [...new Set([...a.ids, ...b.ids])];
    const best: Record<number, number> = { ...a.best };
    for (const [k, v] of Object.entries(b.best)) {
        const id = Number(k);
        best[id] = Math.max(best[id] ?? 0, v);
    }
    const scores = Object.values(best);
    return {
        ids,
        best,
        attempted: Math.max(a.attempted, b.attempted),
        avg: scores.length ? scores.reduce((s, n) => s + n, 0) / scores.length : null,
        timeMs: Math.max(a.timeMs, b.timeMs),
    };
}

async function listCompleted(userId: string): Promise<{ ids: number[]; best: Record<number, number>; attempted: number; avg: number | null; timeMs: number }> {
    const local = listCompletedSqlite(userId);
    if (useSqlite(userId)) return local;
    try {
        const { data, error } = await sb().from('academy_lesson_progress').select('lesson_id, status, best_score, attempts, time_spent_ms').eq('user_id', userId);
        if (error && isRecoverable(error)) return local;
        if (error) throw error;
        return mergeProgressRows(
            foldProgressRows((data || []) as { lesson_id: number; status: string; best_score: number | null; attempts: number; time_spent_ms: number }[]),
            local,
        );
    } catch (err) {
        if (isRecoverable(err)) return local;
        throw err;
    }
}

function foldProgressRows(rows: { lesson_id: number; status: string; best_score: number | null; attempts: number; time_spent_ms: number }[]) {
    const ids: number[] = [];
    const best: Record<number, number> = {};
    let attempted = 0;
    let scoreSum = 0;
    let scoreN = 0;
    let timeMs = 0;
    for (const r of rows) {
        timeMs += Number(r.time_spent_ms) || 0;
        if ((r.attempts || 0) > 0) attempted += 1;
        if (r.best_score != null) {
            best[r.lesson_id] = r.best_score;
            scoreSum += r.best_score;
            scoreN += 1;
        }
        if (r.status === 'completed') ids.push(r.lesson_id);
    }
    return { ids, best, attempted, avg: scoreN ? scoreSum / scoreN : null, timeMs };
}

async function listAchievements(userId: string): Promise<string[]> {
    const fromSqlite = () => (sqlite().prepare('SELECT achievement_id FROM academy_achievements WHERE user_id = ?').all(userId) as { achievement_id: string }[]).map(r => r.achievement_id);
    if (useSqlite(userId)) return fromSqlite();
    try {
        const { data, error } = await sb().from('academy_achievements').select('achievement_id').eq('user_id', userId);
        if (error && isRecoverable(error)) return fromSqlite();
        if (error) throw error;
        return (data || []).map((r: { achievement_id: string }) => r.achievement_id);
    } catch (err) {
        if (isRecoverable(err)) return fromSqlite();
        throw err;
    }
}

async function grantAchievement(userId: string, id: string) {
    const t = nowIso();
    if (useSqlite(userId)) {
        sqlite().prepare('INSERT OR IGNORE INTO academy_achievements (user_id, achievement_id, earned_at) VALUES (?, ?, ?)').run(userId, id, t);
        return;
    }
    try {
        const { error } = await sb().from('academy_achievements').upsert({ user_id: userId, achievement_id: id, earned_at: t }, { onConflict: 'user_id,achievement_id' });
        if (error && isRecoverable(error)) {
            sqlite().prepare('INSERT OR IGNORE INTO academy_achievements (user_id, achievement_id, earned_at) VALUES (?, ?, ?)').run(userId, id, t);
        }
    } catch (err) {
        if (isRecoverable(err)) {
            sqlite().prepare('INSERT OR IGNORE INTO academy_achievements (user_id, achievement_id, earned_at) VALUES (?, ?, ?)').run(userId, id, t);
        }
    }
}

async function evaluateAchievements(userId: string, completedCount: number, currentRank: AcademyRankId | null, perfect: boolean, rankedUp: boolean) {
    if (completedCount >= 1) await grantAchievement(userId, 'first-lesson');
    if (completedCount >= 10) await grantAchievement(userId, 'lessons-10');
    if (completedCount >= 20) await grantAchievement(userId, 'lessons-20');
    if (completedCount >= 25) await grantAchievement(userId, 'quiz-master');
    if (completedCount >= 50) await grantAchievement(userId, 'lessons-50');
    if (completedCount >= 100) await grantAchievement(userId, 'lessons-100');
    if (perfect) await grantAchievement(userId, 'perfect-score');
    if (rankedUp) await grantAchievement(userId, 'first-rank-up');
    if (currentRank === 5) await grantAchievement(userId, 'investing-pro');

    let days = 0;
    if (useSqlite(userId)) {
        days = (sqlite().prepare('SELECT COUNT(*) AS n FROM academy_daily_activity WHERE user_id = ?').get(userId) as { n: number }).n;
    } else {
        const { count, error } = await sb().from('academy_daily_activity').select('*', { count: 'exact', head: true }).eq('user_id', userId);
        days = error ? 0 : (count || 0);
    }
    if (days >= 7) await grantAchievement(userId, 'streak-7');
}

async function reviewTopicsFor(userId: string): Promise<{ topic: string; lessonId: number; title: string }[]> {
    let rows: { topic: string; hits: number; misses: number }[] = [];
    if (useSqlite(userId)) {
        rows = sqlite().prepare('SELECT topic, hits, misses FROM academy_topic_stats WHERE user_id = ?').all(userId) as { topic: string; hits: number; misses: number }[];
    } else {
        try {
            const { data, error } = await sb().from('academy_topic_stats').select('topic, hits, misses').eq('user_id', userId);
            if (error && isRecoverable(error)) {
                rows = sqlite().prepare('SELECT topic, hits, misses FROM academy_topic_stats WHERE user_id = ?').all(userId) as { topic: string; hits: number; misses: number }[];
            } else {
                rows = (data || []) as { topic: string; hits: number; misses: number }[];
            }
        } catch {
            rows = sqlite().prepare('SELECT topic, hits, misses FROM academy_topic_stats WHERE user_id = ?').all(userId) as { topic: string; hits: number; misses: number }[];
        }
    }
    return rows
        .filter(r => r.misses >= 3 && r.misses > r.hits)
        .sort((a, b) => b.misses - a.misses)
        .slice(0, 3)
        .map(r => {
            const lessonId = topicToLessonId(r.topic) || 19;
            const item = getCatalogItem(lessonId);
            return { topic: r.topic, lessonId, title: item?.title || 'Related lesson' };
        });
}

export async function getAcademyState(userId: string): Promise<AcademyUserState> {
    const user = await getUserById(userId);
    const progress = await ensureProgress(userId);
    const { ids, best, attempted, avg, timeMs } = await listCompleted(userId);
    const achievements = await listAchievements(userId);
    const currentRank = progress.current_rank ? (progress.current_rank as AcademyRankId) : null;
    const reviewTopics = await reviewTopicsFor(userId);
    let streakDays = 0;
    if (useSqlite(userId)) {
        streakDays = (sqlite().prepare('SELECT COUNT(*) AS n FROM academy_daily_activity WHERE user_id = ?').get(userId) as { n: number }).n;
    } else {
        try {
            const { count, error } = await sb().from('academy_daily_activity').select('*', { count: 'exact', head: true }).eq('user_id', userId);
            streakDays = error ? 0 : (count || 0);
        } catch {
            streakDays = 0;
        }
    }

    return {
        userId,
        username: user?.username || 'student',
        displayName: user?.display_name ?? null,
        diagnosticCompleted: truthy(progress.diagnostic_completed),
        diagnosticScore: progress.diagnostic_score,
        diagnosticTotal: progress.diagnostic_total,
        diagnosticCompletedAt: progress.diagnostic_completed_at,
        startingRank: progress.starting_rank as AcademyRankId | null,
        currentRank,
        xp: progress.xp || 0,
        lessonsCompleted: ids.length,
        lessonsAttempted: attempted,
        quizAverage: avg,
        currentLesson: progress.current_lesson,
        lastActiveAt: progress.last_active_at,
        timeSpentMs: timeMs,
        rankUpAvailable: rankUpEligible(currentRank, ids),
        rankUpFromRank: rankUpEligible(currentRank, ids) ? currentRank : null,
        completedLessonIds: ids,
        bestScores: best,
        achievements,
        reviewTopics,
        streakDays,
    };
}

export function lessonLockState(state: AcademyUserState, lessonId: number): 'locked' | 'available' | 'current' | 'completed' {
    if (state.completedLessonIds.includes(lessonId)) return 'completed';
    if (!state.currentRank) return 'locked';
    if (!isLessonUnlocked(state.currentRank, lessonId, state.completedLessonIds)) return 'locked';
    const next = nextRecommendedLesson(state);
    if (next === lessonId) return 'current';
    return 'available';
}

export function nextRecommendedLesson(state: AcademyUserState): number | null {
    if (!state.currentRank) return null;
    const start = firstLessonForRank(state.currentRank);
    const end = lastLessonForRank(state.currentRank);
    for (let id = start; id <= end; id++) {
        if (!state.completedLessonIds.includes(id) && isLessonUnlocked(state.currentRank, id, state.completedLessonIds)) {
            return id;
        }
    }
    return null;
}

export async function submitDiagnostic(userId: string, answers: { questionId: string; selectedIndex: number }[], aiSummary?: string | null) {
    const existing = await getAcademyState(userId);
    if (existing.diagnosticCompleted) {
        return { alreadyCompleted: true as const, state: existing };
    }

    assertQuestionBank(DIAGNOSTIC_QUESTIONS, DIAGNOSTIC_SIZE, 'Diagnostic');
    const { score, details } = scoreKeyedAnswers(DIAGNOSTIC_QUESTIONS, answers);
    const topicMap = new Map<string, { correct: number; total: number }>();
    let advancedCorrect = 0;
    let advancedTotal = 0;
    const rows: { question_id: string; selected_index: number; is_correct: boolean; topic: string }[] = [];

    for (const q of DIAGNOSTIC_QUESTIONS) {
        const d = details.find(item => item.questionId === q.id)!;
        if (q.band === 'advanced') {
            advancedTotal += 1;
            if (d.correct) advancedCorrect += 1;
        }
        const t = topicMap.get(q.topic) || { correct: 0, total: 0 };
        t.total += 1;
        if (d.correct) t.correct += 1;
        topicMap.set(q.topic, t);
        rows.push({ question_id: q.id, selected_index: d.selectedIndex, is_correct: d.correct, topic: q.topic });
    }

    const topics: TopicScore[] = [...topicMap.entries()].map(([topic, v]) => ({ topic, correct: v.correct, total: v.total }));
    const startingRank = startingRankFromScore(score, advancedTotal > 0 && advancedCorrect === advancedTotal);
    const firstLesson = firstLessonForRank(startingRank);
    const t = nowIso();

    if (useSqlite(userId)) {
        saveDiagnosticSqlite(userId, score, startingRank, firstLesson, t, topics, aiSummary, rows);
    } else {
        const db = sb();
        const { error } = await db.from('academy_progress').update({
            diagnostic_completed: true,
            diagnostic_score: score,
            diagnostic_total: DIAGNOSTIC_SIZE,
            diagnostic_completed_at: t,
            starting_rank: startingRank,
            current_rank: startingRank,
            current_lesson: firstLesson,
            last_active_at: t,
            updated_at: t,
        }).eq('user_id', userId);
        if (error && isRecoverable(error)) {
            return submitDiagnosticSqlite(userId, score, startingRank, firstLesson, t, topics, aiSummary, rows);
        }
        if (error) throw error;
        await db.from('academy_diagnostic_results').upsert({
            user_id: userId,
            score,
            total: DIAGNOSTIC_SIZE,
            starting_rank: startingRank,
            topic_performance: topics,
            ai_summary: aiSummary || null,
            completed_at: t,
        }, { onConflict: 'user_id' });
        for (const r of rows) {
            await db.from('academy_diagnostic_answers').upsert({
                user_id: userId,
                question_id: r.question_id,
                selected_index: r.selected_index,
                is_correct: r.is_correct,
                topic: r.topic,
            }, { onConflict: 'user_id,question_id' });
        }
        await db.from('academy_daily_activity').upsert({ user_id: userId, day: dayKey() }, { onConflict: 'user_id,day' });
    }

    const state = await getAcademyState(userId);
    return {
        alreadyCompleted: false as const,
        score,
        total: DIAGNOSTIC_SIZE,
        startingRank,
        startingRankName: rankById(startingRank).name,
        topics,
        firstLesson,
        aiSummary: aiSummary || null,
        state,
    };
}

function saveDiagnosticSqlite(
    userId: string,
    score: number,
    startingRank: AcademyRankId,
    firstLesson: number,
    t: string,
    topics: TopicScore[],
    aiSummary: string | null | undefined,
    rows: { question_id: string; selected_index: number; is_correct: boolean; topic: string }[],
) {
    const db = sqlite();
    db.exec('BEGIN');
    try {
        db.prepare(
            `UPDATE academy_progress SET diagnostic_completed = 1, diagnostic_score = ?, diagnostic_total = ?, diagnostic_completed_at = ?,
             starting_rank = ?, current_rank = ?, current_lesson = ?, last_active_at = ?, updated_at = ? WHERE user_id = ?`,
        ).run(score, DIAGNOSTIC_SIZE, t, startingRank, startingRank, firstLesson, t, t, userId);
        db.prepare(
            `INSERT INTO academy_diagnostic_results (user_id, score, total, starting_rank, topic_performance, ai_summary, completed_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(user_id) DO UPDATE SET score = excluded.score, starting_rank = excluded.starting_rank, topic_performance = excluded.topic_performance, ai_summary = excluded.ai_summary, completed_at = excluded.completed_at`,
        ).run(userId, score, DIAGNOSTIC_SIZE, startingRank, JSON.stringify(topics), aiSummary || null, t);
        const ins = db.prepare(
            `INSERT OR REPLACE INTO academy_diagnostic_answers (user_id, question_id, selected_index, is_correct, topic)
             VALUES (?, ?, ?, ?, ?)`,
        );
        for (const r of rows) ins.run(userId, r.question_id, r.selected_index, r.is_correct ? 1 : 0, r.topic);
        db.prepare('INSERT OR IGNORE INTO academy_daily_activity (user_id, day) VALUES (?, ?)').run(userId, dayKey());
        db.exec('COMMIT');
    } catch (e) {
        db.exec('ROLLBACK');
        throw e;
    }
}

function submitDiagnosticSqlite(
    userId: string,
    score: number,
    startingRank: AcademyRankId,
    firstLesson: number,
    t: string,
    topics: TopicScore[],
    aiSummary: string | null | undefined,
    rows: { question_id: string; selected_index: number; is_correct: boolean; topic: string }[],
) {
    saveDiagnosticSqlite(userId, score, startingRank, firstLesson, t, topics, aiSummary, rows);
    return getAcademyState(userId).then(state => ({
        alreadyCompleted: false as const,
        score,
        total: DIAGNOSTIC_SIZE,
        startingRank,
        startingRankName: rankById(startingRank).name,
        topics,
        firstLesson,
        aiSummary: aiSummary || null,
        state,
    }));
}

function bumpTopicSqlite(userId: string, topic: string, correct: boolean, t: string) {
    sqlite().prepare(
        `INSERT INTO academy_topic_stats (user_id, topic, hits, misses, updated_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id, topic) DO UPDATE SET
           hits = hits + excluded.hits,
           misses = misses + excluded.misses,
           updated_at = excluded.updated_at`,
    ).run(userId, topic, correct ? 1 : 0, correct ? 0 : 1, t);
}

async function bumpTopic(userId: string, topic: string, correct: boolean) {
    const t = nowIso();
    if (useSqlite(userId)) {
        bumpTopicSqlite(userId, topic, correct, t);
        return;
    }
    try {
        const db = sb();
        const { data, error } = await db.from('academy_topic_stats').select('hits, misses').eq('user_id', userId).eq('topic', topic).maybeSingle();
        if (error) {
            if (isRecoverable(error)) {
                bumpTopicSqlite(userId, topic, correct, t);
                return;
            }
            throw error;
        }
        const hits = (data?.hits || 0) + (correct ? 1 : 0);
        const misses = (data?.misses || 0) + (correct ? 0 : 1);
        const { error: upErr } = await db.from('academy_topic_stats').upsert({ user_id: userId, topic, hits, misses, updated_at: t }, { onConflict: 'user_id,topic' });
        if (upErr) {
            if (isRecoverable(upErr)) {
                bumpTopicSqlite(userId, topic, correct, t);
                return;
            }
            throw upErr;
        }
    } catch (err) {
        if (isRecoverable(err)) {
            bumpTopicSqlite(userId, topic, correct, t);
            return;
        }
        throw err;
    }
}

export async function checkLessonQuestion(lessonId: number, questionId: string, selectedIndex: unknown) {
    const lesson = await getLessonById(lessonId);
    if (!lesson) throw new Error('NOT_FOUND');
    assertQuestionBank(lesson.quiz, 10, `Lesson ${lessonId} quiz`);
    const q = lesson.quiz.find(item => item.id === questionId);
    if (!q) throw new Error('NOT_FOUND');
    const { correct } = scoreOneQuestion(q, selectedIndex);
    return {
        correct,
        explanation: correct ? q.explanationCorrect : q.explanationIncorrect,
        topic: q.topic,
    };
}

export async function checkDiagnosticQuestion(questionId: string, selectedIndex: unknown) {
    const q = DIAGNOSTIC_QUESTIONS.find(item => item.id === questionId);
    if (!q) throw new Error('NOT_FOUND');
    const { correct } = scoreOneQuestion(q, selectedIndex);
    return {
        correct,
        explanation: correct ? q.explanationCorrect : q.explanationIncorrect,
    };
}

export async function checkRankUpQuestion(fromRank: AcademyRankId, questionId: string, selectedIndex: unknown) {
    const test = getRankUpTest(fromRank);
    if (!test) throw new Error('NOT_FOUND');
    assertQuestionBank(test.questions, RANK_UP_SIZE, `Rank-up ${fromRank}`);
    const q = test.questions.find(item => item.id === questionId);
    if (!q) throw new Error('NOT_FOUND');
    const { correct } = scoreOneQuestion(q, selectedIndex);
    return {
        correct,
        explanation: correct ? q.explanationCorrect : q.explanationIncorrect,
    };
}

type QuizDetailRow = {
    questionId: string;
    selectedIndex: number;
    correct: boolean;
    topic: string;
};

function syncSqliteProgressFromState(userId: string, state: AcademyUserState, t: string, xpDelta: number, lessonId: number) {
    const db = sqlite();
    const existing = db.prepare('SELECT * FROM academy_progress WHERE user_id = ?').get(userId) as ProgressRow | undefined;
    const xp = (existing?.xp ?? state.xp ?? 0) + xpDelta;
    db.prepare(
        `INSERT INTO academy_progress (
            user_id, diagnostic_completed, diagnostic_score, diagnostic_total, diagnostic_completed_at,
            starting_rank, current_rank, xp, current_lesson, last_active_at, created_at, updated_at
         ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           xp = excluded.xp,
           current_lesson = excluded.current_lesson,
           last_active_at = excluded.last_active_at,
           updated_at = excluded.updated_at`,
    ).run(
        userId,
        state.diagnosticScore,
        state.diagnosticTotal,
        state.diagnosticCompletedAt,
        state.startingRank,
        state.currentRank,
        xp,
        lessonId,
        t,
        existing?.created_at || t,
        t,
    );
}

function persistLessonQuizLocal(
    userId: string,
    state: AcademyUserState,
    lessonId: number,
    score: number,
    passed: boolean,
    xpAwarded: number,
    details: QuizDetailRow[],
    t: string,
) {
    const db = sqlite();
    db.exec('BEGIN');
    try {
        syncSqliteProgressFromState(userId, state, t, xpAwarded, lessonId);
        const ins = db.prepare(
            `INSERT INTO academy_quiz_attempts (user_id, lesson_id, score, total, passed, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        ).run(userId, lessonId, score, 10, passed ? 1 : 0, t);
        const attemptId = Number(ins.lastInsertRowid);
        const ans = db.prepare(
            `INSERT INTO academy_quiz_answers (attempt_id, question_id, selected_index, is_correct, topic) VALUES (?, ?, ?, ?, ?)`,
        );
        for (const d of details) ans.run(attemptId, d.questionId, d.selectedIndex, d.correct ? 1 : 0, d.topic);

        const prev = db.prepare('SELECT * FROM academy_lesson_progress WHERE user_id = ? AND lesson_id = ?').get(userId, lessonId) as {
            status: string; best_score: number | null; xp_awarded: number; attempts: number; started_at: string | null;
        } | undefined;
        const best = Math.max(prev?.best_score ?? 0, score);
        const xp = (prev?.xp_awarded || 0) + xpAwarded;
        const status = passed || prev?.status === 'completed' ? 'completed' : 'started';
        db.prepare(
            `INSERT INTO academy_lesson_progress (user_id, lesson_id, status, started_at, completed_at, best_score, last_score, time_spent_ms, xp_awarded, attempts)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
             ON CONFLICT(user_id, lesson_id) DO UPDATE SET
               status = excluded.status,
               completed_at = CASE WHEN excluded.status = 'completed' THEN COALESCE(academy_lesson_progress.completed_at, excluded.completed_at) ELSE academy_lesson_progress.completed_at END,
               best_score = CASE WHEN COALESCE(academy_lesson_progress.best_score, 0) > excluded.best_score THEN academy_lesson_progress.best_score ELSE excluded.best_score END,
               last_score = excluded.last_score,
               xp_awarded = excluded.xp_awarded,
               attempts = academy_lesson_progress.attempts + 1`,
        ).run(
            userId,
            lessonId,
            status,
            prev?.started_at || t,
            passed ? t : null,
            best,
            score,
            xp,
            (prev?.attempts || 0) + 1,
        );
        db.prepare('INSERT OR IGNORE INTO academy_daily_activity (user_id, day) VALUES (?, ?)').run(userId, dayKey());
        db.exec('COMMIT');
    } catch (e) {
        db.exec('ROLLBACK');
        throw e;
    }
}

async function persistLessonQuizRemote(
    userId: string,
    lessonId: number,
    score: number,
    passed: boolean,
    xpAwarded: number,
    t: string,
) {
    const db = sb();
    try {
        const { error } = await db.from('academy_quiz_attempts').insert({
            user_id: userId,
            lesson_id: lessonId,
            score,
            total: 10,
            passed,
            created_at: t,
        });
        if (error && !isRecoverable(error)) throw error;
    } catch (err) {
        if (!isRecoverable(err)) throw err;
    }

    const patch: Record<string, unknown> = { last_active_at: t, current_lesson: lessonId, updated_at: t };
    if (xpAwarded) {
        try {
            const { data: prog, error: progErr } = await db.from('academy_progress').select('xp').eq('user_id', userId).maybeSingle();
            if (!progErr) patch.xp = (prog?.xp || 0) + xpAwarded;
        } catch {
            patch.xp = xpAwarded;
        }
    }
    try {
        const { error: pErr } = await db.from('academy_progress').update(patch).eq('user_id', userId);
        if (pErr && !isRecoverable(pErr)) throw pErr;
    } catch (err) {
        if (!isRecoverable(err)) throw err;
    }

    try {
        await db.from('academy_daily_activity').upsert({ user_id: userId, day: dayKey() }, { onConflict: 'user_id,day' });
    } catch {
        /* optional */
    }

    try {
        const res = await db.from('academy_lesson_progress').select('*').eq('user_id', userId).eq('lesson_id', lessonId).maybeSingle();
        if (res.error) throw res.error;
        const prev = res.data as { best_score?: number | null; xp_awarded?: number; status?: string; started_at?: string | null; completed_at?: string | null; time_spent_ms?: number; attempts?: number } | null;
        const best = Math.max(prev?.best_score ?? 0, score);
        const xp = (prev?.xp_awarded || 0) + xpAwarded;
        const status = passed || prev?.status === 'completed' ? 'completed' : 'started';
        const { error: upErr } = await db.from('academy_lesson_progress').upsert({
            user_id: userId,
            lesson_id: lessonId,
            status,
            started_at: prev?.started_at || t,
            completed_at: passed ? (prev?.completed_at || t) : prev?.completed_at || null,
            best_score: best,
            last_score: score,
            time_spent_ms: prev?.time_spent_ms || 0,
            xp_awarded: xp,
            attempts: (prev?.attempts || 0) + 1,
        }, { onConflict: 'user_id,lesson_id' });
        if (upErr) throw upErr;
    } catch (err) {
        if (!isRecoverable(err)) throw err;
    }
}

export async function startLesson(userId: string, lessonId: number) {
    const state = await getAcademyState(userId);
    if (!state.diagnosticCompleted) throw new Error('DIAGNOSTIC_REQUIRED');
    const status = lessonLockState(state, lessonId);
    if (status === 'locked') throw new Error('LOCKED');
    const t = nowIso();
    await touchAcademyActivity(userId, lessonId);
    // Local mirror row (used as the fallback source of truth if Supabase's academy tables are
    // missing). This must never block a Supabase-backed user's request — if the local write fails
    // for any reason, log it and keep going instead of 500ing the whole "start lesson" request.
    try {
        sqlite().prepare(
            `INSERT INTO academy_lesson_progress (user_id, lesson_id, status, started_at, time_spent_ms, xp_awarded, attempts)
             VALUES (?, ?, 'started', ?, 0, 0, 0)
             ON CONFLICT(user_id, lesson_id) DO UPDATE SET started_at = COALESCE(academy_lesson_progress.started_at, excluded.started_at)`,
        ).run(userId, lessonId, t);
    } catch (err) {
        console.error('academy start lesson sqlite mirror', err);
    }
    if (useSqlite(userId)) return;
    try {
        const { data, error } = await sb().from('academy_lesson_progress').select('lesson_id').eq('user_id', userId).eq('lesson_id', lessonId).maybeSingle();
        if (error) return;
        if (!data) {
            await sb().from('academy_lesson_progress').insert({
                user_id: userId,
                lesson_id: lessonId,
                status: 'started',
                started_at: t,
                time_spent_ms: 0,
                xp_awarded: 0,
                attempts: 0,
            });
        }
    } catch {
        /* lesson_progress table may be missing; sqlite row is enough */
    }
}

export async function submitLessonQuiz(userId: string, lessonId: number, answers: { questionId: string; selectedIndex: number }[]) {
    const state = await getAcademyState(userId);
    if (!state.diagnosticCompleted) throw new Error('DIAGNOSTIC_REQUIRED');
    const lock = lessonLockState(state, lessonId);
    if (lock === 'locked') throw new Error('LOCKED');

    const lesson = await getLessonById(lessonId);
    if (!lesson) throw new Error('NOT_FOUND');
    assertQuestionBank(lesson.quiz, 10, `Lesson ${lessonId} quiz`);

    const scored = scoreKeyedAnswers(lesson.quiz, answers);
    const score = scored.score;
    const details = scored.details.map(d => {
        const q = lesson.quiz.find(item => item.id === d.questionId)!;
        return {
            ...d,
            explanation: d.correct ? q.explanationCorrect : q.explanationIncorrect,
            correctExplanation: q.explanationCorrect,
        };
    });

    const passed = score >= LESSON_PASS_SCORE;
    const alreadyComplete = state.completedLessonIds.includes(lessonId);
    const xpAwarded = passed && !alreadyComplete ? lesson.xp : 0;
    const t = nowIso();

    try {
        for (const d of details) await bumpTopic(userId, d.topic, d.correct);
    } catch (err) {
        console.error('academy topic stats', err);
    }

    if (!useSqlite(userId)) {
        try {
            await persistLessonQuizRemote(userId, lessonId, score, passed, xpAwarded, t);
        } catch (err) {
            console.error('academy quiz supabase persist', err);
        }
    }
    try {
        persistLessonQuizLocal(userId, state, lessonId, score, passed, xpAwarded, details, t);
    } catch (err) {
        console.error('academy quiz sqlite persist', err);
    }

    let finalState = state;
    try {
        finalState = await getAcademyState(userId);
        try {
            await evaluateAchievements(userId, finalState.lessonsCompleted, state.currentRank, score === 10, false);
        } catch (err) {
            console.error('academy achievements', err);
        }
        finalState = await getAcademyState(userId);
    } catch (err) {
        console.error('academy state after quiz', err);
        if (passed && !alreadyComplete) {
            finalState = {
                ...state,
                lessonsCompleted: state.lessonsCompleted + 1,
                completedLessonIds: [...state.completedLessonIds, lessonId],
                xp: state.xp + xpAwarded,
                currentLesson: lessonId,
            };
        }
    }

    return {
        score,
        total: 10,
        passed,
        xpAwarded,
        alreadyComplete,
        details,
        rankUpAvailable: finalState.rankUpAvailable,
        state: finalState,
        nextLessonId: nextRecommendedLesson(finalState),
    };
}

export async function submitRankUp(userId: string, answers: { questionId: string; selectedIndex: number }[]) {
    const state = await getAcademyState(userId);
    if (!state.rankUpAvailable || !state.currentRank || state.currentRank >= 5) {
        throw new Error('NOT_ELIGIBLE');
    }
    const fromRank = state.currentRank;
    const toRank = rankUpTarget(fromRank);
    if (!toRank) throw new Error('NOT_ELIGIBLE');
    const test = getRankUpTest(fromRank);
    if (!test) throw new Error('TEST_MISSING');
    assertQuestionBank(test.questions, RANK_UP_SIZE, `Rank-up ${fromRank}`);

    const scored = scoreKeyedAnswers(test.questions, answers);
    const score = scored.score;
    const topicMiss: Record<string, number> = {};
    const details = scored.details.map(d => {
        const q = test.questions.find(item => item.id === d.questionId)!;
        if (!d.correct) topicMiss[q.topic] = (topicMiss[q.topic] || 0) + 1;
        return {
            ...d,
            explanation: d.correct ? q.explanationCorrect : q.explanationIncorrect,
            topic: q.topic,
        };
    });
    const passed = score >= RANK_UP_PASS_SCORE;
    const t = nowIso();
    const weakTopics = Object.entries(topicMiss).sort((a, b) => b[1] - a[1]).map(([topic]) => topic);

    if (!useSqlite(userId)) {
        try {
            const { error } = await sb().from('academy_rank_up_attempts').insert({
                user_id: userId,
                from_rank: fromRank,
                to_rank: toRank,
                score,
                total: RANK_UP_SIZE,
                passed,
                weak_topics: weakTopics,
                created_at: t,
            });
            if (error && !isRecoverable(error)) throw error;
        } catch (err) {
            if (!isRecoverable(err)) throw err;
        }
        try {
            if (passed) {
                await sb().from('academy_progress').update({
                    current_rank: toRank,
                    current_lesson: firstLessonForRank(toRank),
                    last_active_at: t,
                    updated_at: t,
                }).eq('user_id', userId);
            } else {
                await sb().from('academy_progress').update({ last_active_at: t, updated_at: t }).eq('user_id', userId);
            }
        } catch (err) {
            console.error('academy rank-up progress', err);
        }
    }

    try {
        const db = sqlite();
        db.prepare(
            `INSERT INTO academy_rank_up_attempts (user_id, from_rank, to_rank, score, total, passed, weak_topics, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(userId, fromRank, toRank, score, RANK_UP_SIZE, passed ? 1 : 0, JSON.stringify(weakTopics), t);
        if (passed) {
            db.prepare(
                `UPDATE academy_progress SET current_rank = ?, current_lesson = ?, last_active_at = ?, updated_at = ? WHERE user_id = ?`,
            ).run(toRank, firstLessonForRank(toRank), t, t, userId);
        } else {
            db.prepare('UPDATE academy_progress SET last_active_at = ?, updated_at = ? WHERE user_id = ?').run(t, t, userId);
        }
    } catch (err) {
        console.error('academy rank-up sqlite', err);
    }

    try {
        if (passed) await evaluateAchievements(userId, state.lessonsCompleted, toRank, false, true);
    } catch (err) {
        console.error('academy achievements', err);
    }
    const finalState = await getAcademyState(userId);
    return {
        score,
        total: RANK_UP_SIZE,
        passed,
        fromRank,
        toRank,
        toRankName: rankById(toRank).name,
        weakTopics,
        details,
        state: finalState,
        xp: finalState.xp,
        lessonsCompleted: finalState.lessonsCompleted,
    };
}

export async function creditHeartbeat(userId: string, lessonId: number | null, elapsedMs: number, hidden: boolean) {
    if (hidden) return { creditedMs: 0 };
    const raw = Math.min(HEARTBEAT_MAX_CREDIT_MS, Math.max(0, elapsedMs));
    const credit = Math.min(HEARTBEAT_IDLE_CAP_MS, raw);
    if (credit < 1000) return { creditedMs: 0 };
    const t = nowIso();
    await touchAcademyActivity(userId, lessonId);
    if (lessonId && useSqlite(userId)) {
        const db = sqlite();
        const prev = db.prepare('SELECT time_spent_ms FROM academy_lesson_progress WHERE user_id = ? AND lesson_id = ?').get(userId, lessonId) as { time_spent_ms: number } | undefined;
        if (prev) {
            db.prepare('UPDATE academy_lesson_progress SET time_spent_ms = time_spent_ms + ? WHERE user_id = ? AND lesson_id = ?').run(credit, userId, lessonId);
        }
        db.prepare(
            `INSERT INTO academy_sessions (user_id, lesson_id, started_at, last_heartbeat_at, credited_ms) VALUES (?, ?, ?, ?, ?)`,
        ).run(userId, lessonId, t, t, credit);
    } else if (lessonId) {
        const db = sb();
        const { data } = await db.from('academy_lesson_progress').select('time_spent_ms').eq('user_id', userId).eq('lesson_id', lessonId).maybeSingle();
        if (data) {
            await db.from('academy_lesson_progress').update({ time_spent_ms: (data.time_spent_ms || 0) + credit }).eq('user_id', userId).eq('lesson_id', lessonId);
        }
        await db.from('academy_sessions').insert({
            user_id: userId,
            lesson_id: lessonId,
            started_at: t,
            last_heartbeat_at: t,
            credited_ms: credit,
        });
    }
    return { creditedMs: credit };
}

export async function getAdminOverview() {
    const empty = {
        totalUsers: 0,
        rankedUsers: 0,
        unrankedUsers: 0,
        averageDiagnosticScore: null as number | null,
        averageQuizScore: null as number | null,
        lessonsCompleted: 0,
        totalAcademyHours: 0,
        rankDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, unranked: 0 },
        rankUpSuccessRate: null as number | null,
        rankUpAttempts: 0,
        popularLessons: [] as { id: number; title: string; completions: number }[],
        hardestLessons: [] as { id: number; title: string; passRate: number; attempts: number }[],
        dailyActive: 0,
        weeklyActive: 0,
        monthlyActive: 0,
    };

    const db = sqlite();
    initAcademySqlite(db);

    const progressRows = db.prepare('SELECT * FROM academy_progress').all() as ProgressRow[];
    if (shouldUseLocalAuth() || progressRows.length) {
        return foldAdmin(progressRows, db);
    }

    const remote = sb();
    const { data, error } = await remote.from('academy_progress').select('*');
    if (error || !data) return empty;
    return foldAdminRemote(data as ProgressRow[]);
}

function foldAdmin(progressRows: ProgressRow[], db: ReturnType<typeof sqlite>) {
    const ranked = progressRows.filter(p => truthy(p.diagnostic_completed) && p.current_rank);
    const unranked = progressRows.filter(p => !truthy(p.diagnostic_completed));
    const diag = progressRows.filter(p => p.diagnostic_score != null);
    const avgDiag = diag.length ? diag.reduce((s, p) => s + (p.diagnostic_score || 0), 0) / diag.length : null;
    const completed = db.prepare(`SELECT COUNT(*) AS n FROM academy_lesson_progress WHERE status = 'completed'`).get() as { n: number };
    const time = db.prepare(`SELECT COALESCE(SUM(time_spent_ms), 0) AS n FROM academy_lesson_progress`).get() as { n: number };
    const quiz = db.prepare(`SELECT AVG(score) AS a FROM academy_quiz_attempts`).get() as { a: number | null };
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, unranked: unranked.length };
    for (const p of ranked) {
        const r = p.current_rank as 1 | 2 | 3 | 4 | 5;
        if (r >= 1 && r <= 5) dist[r] += 1;
    }
    const ru = db.prepare('SELECT COUNT(*) AS n, SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) AS p FROM academy_rank_up_attempts').get() as { n: number; p: number | null };
    const popular = db.prepare(
        `SELECT lesson_id, COUNT(*) AS n FROM academy_lesson_progress WHERE status = 'completed' GROUP BY lesson_id ORDER BY n DESC LIMIT 8`,
    ).all() as { lesson_id: number; n: number }[];
    const hardest = db.prepare(
        `SELECT lesson_id, AVG(score) AS avg_score, COUNT(*) AS n FROM academy_quiz_attempts GROUP BY lesson_id HAVING n >= 1 ORDER BY avg_score ASC LIMIT 8`,
    ).all() as { lesson_id: number; avg_score: number; n: number }[];

    const day = dayKey();
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const dailyActive = (db.prepare('SELECT COUNT(*) AS n FROM academy_daily_activity WHERE day = ?').get(day) as { n: number }).n;
    const weeklyActive = (db.prepare('SELECT COUNT(DISTINCT user_id) AS n FROM academy_progress WHERE last_active_at >= ?').get(weekAgo) as { n: number }).n;
    const monthlyActive = (db.prepare('SELECT COUNT(DISTINCT user_id) AS n FROM academy_progress WHERE last_active_at >= ?').get(monthAgo) as { n: number }).n;

    return {
        totalUsers: progressRows.length,
        rankedUsers: ranked.length,
        unrankedUsers: unranked.length,
        averageDiagnosticScore: avgDiag,
        averageQuizScore: quiz.a,
        lessonsCompleted: completed.n,
        totalAcademyHours: time.n / 3_600_000,
        rankDistribution: dist,
        rankUpSuccessRate: ru.n ? (ru.p || 0) / ru.n : null,
        rankUpAttempts: ru.n,
        popularLessons: popular.map(r => ({ id: r.lesson_id, title: getCatalogItem(r.lesson_id)?.title || `Lesson ${r.lesson_id}`, completions: r.n })),
        hardestLessons: hardest.map(r => ({
            id: r.lesson_id,
            title: getCatalogItem(r.lesson_id)?.title || `Lesson ${r.lesson_id}`,
            passRate: r.avg_score / 10,
            attempts: r.n,
        })),
        dailyActive,
        weeklyActive,
        monthlyActive,
        achievementCatalog: ACHIEVEMENTS,
    };
}

async function foldAdminRemote(progressRows: ProgressRow[]) {
    const remote = sb();
    const ranked = progressRows.filter(p => truthy(p.diagnostic_completed) && p.current_rank);
    const unranked = progressRows.filter(p => !truthy(p.diagnostic_completed));
    const diag = progressRows.filter(p => p.diagnostic_score != null);
    const { data: completed } = await remote.from('academy_lesson_progress').select('lesson_id, time_spent_ms, status');
    const { data: attempts } = await remote.from('academy_quiz_attempts').select('lesson_id, score, passed');
    const { data: ru } = await remote.from('academy_rank_up_attempts').select('passed');
    const lessonRows = (completed || []) as { lesson_id: number; time_spent_ms: number; status: string }[];
    const quizRows = (attempts || []) as { lesson_id: number; score: number; passed: boolean }[];
    const ruRows = (ru || []) as { passed: boolean }[];
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, unranked: unranked.length };
    for (const p of ranked) {
        const r = p.current_rank as 1 | 2 | 3 | 4 | 5;
        if (r >= 1 && r <= 5) dist[r] += 1;
    }
    const popMap: Record<number, number> = {};
    let time = 0;
    let done = 0;
    for (const r of lessonRows) {
        time += Number(r.time_spent_ms) || 0;
        if (r.status === 'completed') {
            done += 1;
            popMap[r.lesson_id] = (popMap[r.lesson_id] || 0) + 1;
        }
    }
    const quizMap: Record<number, { sum: number; n: number }> = {};
    for (const r of quizRows) {
        quizMap[r.lesson_id] = quizMap[r.lesson_id] || { sum: 0, n: 0 };
        quizMap[r.lesson_id].sum += r.score;
        quizMap[r.lesson_id].n += 1;
    }
    const popularLessons = Object.entries(popMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([id, n]) => ({ id: Number(id), title: getCatalogItem(Number(id))?.title || `Lesson ${id}`, completions: n }));
    const hardestLessons = Object.entries(quizMap)
        .sort((a, b) => a[1].sum / a[1].n - b[1].sum / b[1].n)
        .slice(0, 8)
        .map(([id, v]) => ({
            id: Number(id),
            title: getCatalogItem(Number(id))?.title || `Lesson ${id}`,
            passRate: v.sum / v.n / 10,
            attempts: v.n,
        }));
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const daily = dayKey();
    const { count: dailyActive } = await remote.from('academy_daily_activity').select('*', { count: 'exact', head: true }).eq('day', daily);
    return {
        totalUsers: progressRows.length,
        rankedUsers: ranked.length,
        unrankedUsers: unranked.length,
        averageDiagnosticScore: diag.length ? diag.reduce((s, p) => s + (p.diagnostic_score || 0), 0) / diag.length : null,
        averageQuizScore: quizRows.length ? quizRows.reduce((s, r) => s + r.score, 0) / quizRows.length : null,
        lessonsCompleted: done,
        totalAcademyHours: time / 3_600_000,
        rankDistribution: dist,
        rankUpSuccessRate: ruRows.length ? ruRows.filter(r => r.passed).length / ruRows.length : null,
        rankUpAttempts: ruRows.length,
        popularLessons,
        hardestLessons,
        dailyActive: dailyActive || 0,
        weeklyActive: progressRows.filter(p => p.last_active_at && p.last_active_at >= weekAgo).length,
        monthlyActive: progressRows.filter(p => p.last_active_at && p.last_active_at >= monthAgo).length,
        achievementCatalog: ACHIEVEMENTS,
    };
}

export async function getAdminUserAcademy(userId: string) {
    const state = await getAcademyState(userId);
    let rankUpHistory: { fromRank: number; toRank: number; score: number; total: number; passed: boolean; createdAt: string }[] = [];
    if (useSqlite(userId)) {
        rankUpHistory = (sqlite()
            .prepare('SELECT from_rank, to_rank, score, total, passed, created_at FROM academy_rank_up_attempts WHERE user_id = ? ORDER BY id DESC')
            .all(userId) as { from_rank: number; to_rank: number; score: number; total: number; passed: number; created_at: string }[]
        ).map(r => ({
            fromRank: r.from_rank,
            toRank: r.to_rank,
            score: r.score,
            total: r.total,
            passed: truthy(r.passed),
            createdAt: r.created_at,
        }));
    } else {
        const { data } = await sb().from('academy_rank_up_attempts').select('from_rank, to_rank, score, total, passed, created_at').eq('user_id', userId).order('id', { ascending: false });
        rankUpHistory = (data || []).map((r: { from_rank: number; to_rank: number; score: number; total: number; passed: boolean; created_at: string }) => ({
            fromRank: r.from_rank,
            toRank: r.to_rank,
            score: r.score,
            total: r.total,
            passed: r.passed,
            createdAt: r.created_at,
        }));
    }

    const passedTests = rankUpHistory.filter(r => r.passed).length;
    return {
        rank: state.currentRank ? rankById(state.currentRank).name : 'UNRANKED',
        rankId: state.currentRank,
        unranked: !state.diagnosticCompleted,
        xp: state.xp,
        lessonsCompleted: state.lessonsCompleted,
        lessonsAttempted: state.lessonsAttempted,
        completionPct: Math.round((state.lessonsCompleted / TOTAL_LESSONS) * 100),
        quizAverage: state.quizAverage,
        diagnosticCompleted: state.diagnosticCompleted,
        diagnosticScore: state.diagnosticScore,
        diagnosticTotal: state.diagnosticTotal,
        diagnosticDate: state.diagnosticCompletedAt,
        timeSpentMs: state.timeSpentMs,
        lastActiveAt: state.lastActiveAt,
        currentLesson: state.currentLesson,
        rankUpAvailable: state.rankUpAvailable,
        rankUpHistory,
        rankUpTestsPassed: passedTests,
        achievements: state.achievements,
        reviewTopics: state.reviewTopics,
        startingRank: state.startingRank ? rankById(state.startingRank).name : null,
    };
}

export { LESSON_CATALOG };
