'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashNav from '@/components/DashNav';
import UpgradeModal from '@/components/UpgradeModal';
import { useAuthState } from '@/hooks/useAuthState';
import { useGuestMode } from '@/hooks/useGuestMode';
import { ACADEMY_RANKS, journeyProgress, rankById } from '@/lib/academy/ranks';
import type { AcademyRankId, AcademyUserState, LessonCatalogItem } from '@/lib/academy/types';
import styles from './learn.module.css';

type CatalogRow = Pick<LessonCatalogItem, 'id' | 'title' | 'rankId' | 'difficulty' | 'minutes' | 'xp' | 'topics'> & {
    status: 'locked' | 'available' | 'current' | 'completed';
    practice?: { label: string; href: string } | null;
};

type LessonPayload = {
    id: number;
    rankId: AcademyRankId;
    title: string;
    difficulty: string;
    minutes: number;
    xp: number;
    intro: string;
    whyItMatters: string;
    sections: { heading: string; body: string; callout?: string }[];
    realWorld: string;
    tryIt: { prompt: string; choices: string[]; answer: number; explanation: string };
    takeaways: string[];
    practice?: { label: string; href: string };
};

type PublicQ = {
    id: string;
    type: string;
    prompt: string;
    options: string[];
    topic: string;
    band?: 'beginner' | 'basic' | 'intermediate' | 'advanced';
    chart?: { kind: 'bars' | 'line'; title?: string; labels: string[]; values: number[] };
};

type View =
    | { kind: 'home' }
    | { kind: 'diagnostic' }
    | { kind: 'diag-results' }
    | { kind: 'lesson'; id: number }
    | { kind: 'quiz'; id: number }
    | { kind: 'quiz-results'; id: number }
    | { kind: 'rankup-gate' }
    | { kind: 'rankup' }
    | { kind: 'rankup-success' };

function MiniChart({ chart }: { chart: NonNullable<PublicQ['chart']> }) {
    const max = Math.max(...chart.values, 1);
    return (
        <div className={styles.chartBox} aria-hidden>
            {chart.title && <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>{chart.title}</div>}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 88 }}>
                {chart.values.map((v, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                        <div
                            style={{
                                height: `${(v / max) * 72}px`,
                                background: chart.kind === 'line' ? 'var(--vt-vblue)' : '#7CE0C6',
                                borderRadius: 8,
                            }}
                        />
                        <div style={{ fontSize: 10, fontWeight: 800, marginTop: 4 }}>{chart.labels[i]}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RankBar({
    currentRank,
    completedInRank,
    xp,
    completed,
    rankUpAvailable,
    onRankUp,
}: {
    currentRank: AcademyRankId | null;
    completedInRank: number;
    xp: number;
    completed: number;
    rankUpAvailable: boolean;
    onRankUp: () => void;
}) {
    const pct = journeyProgress(currentRank, completedInRank);
    return (
        <section className={styles.journeyCard}>
            <div className={styles.journeyTop}>
                <div>
                    <div className={styles.journeyKicker}>Your progress</div>
                    <h2 className={styles.journeyTitle}>
                        {currentRank ? rankById(currentRank).name : 'Unranked'}
                    </h2>
                </div>
                {rankUpAvailable && (
                    <button type="button" className={styles.rankUpBtn} onClick={onRankUp}>
                        Take Rank-Up Test
                    </button>
                )}
            </div>
            {rankUpAvailable && (
                <p className={styles.rankUpHint}>Rank Up Available! You&apos;ve completed this rank. Are you ready to prove what you learned?</p>
            )}
            <div className={styles.track}>
                {ACADEMY_RANKS.map((rank, i) => {
                    const start = i / 5;
                    const end = (i + 1) / 5;
                    const fill = Math.max(0, Math.min(1, (pct - start) / (end - start)));
                    return (
                        <div key={rank.id} className={styles.seg}>
                            <div
                                className={styles.segFill}
                                style={{ width: `${fill * 100}%`, background: rank.color }}
                            />
                        </div>
                    );
                })}
            </div>
            <div className={styles.segLabels}>
                {ACADEMY_RANKS.map(r => (
                    <div key={r.id} className={`${styles.segLabel} ${currentRank === r.id ? styles.segLabelOn : ''}`}>
                        {r.shortName}
                    </div>
                ))}
            </div>
            <div className={styles.metaRow}>
                <div className={styles.metaItem}>
                    <strong>{completedInRank} / 20</strong>
                    <span>Level progress</span>
                </div>
                <div className={styles.metaItem}>
                    <strong>{completed} / 100</strong>
                    <span>Lessons completed</span>
                </div>
                <div className={styles.metaItem}>
                    <strong>{xp.toLocaleString()} XP</strong>
                    <span>XP earned</span>
                </div>
            </div>
        </section>
    );
}

function openVesta(message: string, lesson?: { id: number; title: string; excerpt: string }) {
    if (lesson) {
        sessionStorage.setItem(
            'vestera_academy_lesson',
            JSON.stringify(lesson),
        );
        window.dispatchEvent(new CustomEvent('vestera:academy-lesson', { detail: lesson }));
    }
    window.dispatchEvent(new CustomEvent('openVestaChat', { detail: { message } }));
}

export default function LearningDashboard() {
    const router = useRouter();
    const { authenticated, loading: authLoading } = useAuthState();
    const { isGuest, clearGuestMode } = useGuestMode();
    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const [view, setView] = useState<View>({ kind: 'home' });
    const [state, setState] = useState<AcademyUserState | null>(null);
    const [catalog, setCatalog] = useState<CatalogRow[]>([]);
    const [nextLessonId, setNextLessonId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [diagQs, setDiagQs] = useState<PublicQ[]>([]);
    const [diagIndex, setDiagIndex] = useState(0);
    const [diagFeedback, setDiagFeedback] = useState<{ ok: boolean; text: string } | null>(null);
    const [diagResult, setDiagResult] = useState<{
        score: number;
        total: number;
        startingRank: AcademyRankId;
        startingRankName: string;
        aiSummary: string | null;
    } | null>(null);

    const [lesson, setLesson] = useState<LessonPayload | null>(null);
    // Tracks which lesson node the user just clicked so we can show instant feedback (spinner/disabled)
    // while the start+fetch requests are in flight — without this, a slow connection makes clicking a
    // lesson look like it did nothing until the network round trips finish.
    const [openingLessonId, setOpeningLessonId] = useState<number | null>(null);
    const [tryPick, setTryPick] = useState<number | null>(null);
    const [quizQs, setQuizQs] = useState<PublicQ[]>([]);
    const [quizIndex, setQuizIndex] = useState(0);
    const [quizFeedback, setQuizFeedback] = useState<{ ok: boolean; text: string } | null>(null);
    const [quizSubmitting, setQuizSubmitting] = useState(false);
    const [complete, setComplete] = useState<{
        score: number;
        total: number;
        xpAwarded: number;
        passed: boolean;
        alreadyComplete: boolean;
        nextLessonId: number | null;
        rankUpAvailable: boolean;
    } | null>(null);
    const [rankUpInfo, setRankUpInfo] = useState<{
        questions: PublicQ[];
        fromName: string;
        toName: string;
        title: string;
        fromRank: number;
    } | null>(null);
    const [rankUpIndex, setRankUpIndex] = useState(0);
    const [rankUpFb, setRankUpFb] = useState<{ ok: boolean; text: string } | null>(null);
    const [rankUpResult, setRankUpResult] = useState<{
        passed: boolean;
        score: number;
        total: number;
        toRankName: string;
        weakTopics: string[];
        xp: number;
        lessonsCompleted: number;
    } | null>(null);
    const [search, setSearch] = useState('');
    const [hits, setHits] = useState<{ id: number; title: string; status: string }[]>([]);
    const heartbeatLesson = useRef<number | null>(null);
    const diagAnswersRef = useRef<{ questionId: string; selectedIndex: number }[]>([]);
    const quizAnswersRef = useRef<{ questionId: string; selectedIndex: number }[]>([]);
    const rankUpAnswersRef = useRef<{ questionId: string; selectedIndex: number }[]>([]);

    const loadProgress = useCallback(async () => {
        const res = await fetch('/api/academy/progress', { credentials: 'same-origin' });
        if (res.status === 401) return false;
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        setState(data.state);
        setCatalog(data.catalog || []);
        setNextLessonId(data.nextLessonId);
        return data.state as AcademyUserState;
    }, []);

    useEffect(() => {
        if (authLoading) return;
        if (!authenticated) {
            setLoading(false);
            setState(null);
            return;
        }
        (async () => {
            try {
                const s = await loadProgress();
                if (s && !s.diagnosticCompleted) {
                    const d = await fetch('/api/academy/diagnostic', { credentials: 'same-origin' });
                    const data = await d.json();
                    setDiagQs(data.questions || []);
                    setView({ kind: 'diagnostic' });
                    setDiagIndex(0);
                    diagAnswersRef.current = [];
                } else {
                    setView({ kind: 'home' });
                }
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not load Academy.');
            } finally {
                setLoading(false);
            }
        })();
    }, [authenticated, authLoading, loadProgress]);

    useEffect(() => {
        if (!authenticated) return;
        const tick = () => {
            const hidden = document.visibilityState !== 'visible';
            const lessonId = view.kind === 'lesson' || view.kind === 'quiz' ? view.id : heartbeatLesson.current;
            fetch('/api/academy/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ lessonId, elapsedMs: 20000, hidden }),
            }).catch(() => {});
        };
        const id = setInterval(tick, 20000);
        return () => clearInterval(id);
    }, [authenticated, view]);

    const completedInRank = useMemo(() => {
        if (!state?.currentRank) return 0;
        const start = (state.currentRank - 1) * 20 + 1;
        const end = state.currentRank * 20;
        return state.completedLessonIds.filter(id => id >= start && id <= end).length;
    }, [state]);

    const nextLesson = catalog.find(l => l.id === nextLessonId) || catalog.find(l => l.status === 'current');

    const startDiagnostic = async () => {
        if (!authenticated) {
            setUpgradeOpen(true);
            return;
        }
        const d = await fetch('/api/academy/diagnostic', { credentials: 'same-origin' });
        const data = await d.json();
        if (data.completed) {
            await loadProgress();
            setView({ kind: 'home' });
            return;
        }
        setDiagQs(data.questions || []);
        setDiagIndex(0);
        diagAnswersRef.current = [];
        setDiagFeedback(null);
        setView({ kind: 'diagnostic' });
    };

    const pickDiag = async (selectedIndex: number) => {
        const q = diagQs[diagIndex];
        if (!q || diagFeedback) return;
        const nextAnswers = [...diagAnswersRef.current.filter(a => a.questionId !== q.id), { questionId: q.id, selectedIndex }];
        diagAnswersRef.current = nextAnswers;
        const res = await fetch('/api/academy/diagnostic', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ questionId: q.id, selectedIndex }),
        });
        const data = await res.json();
        setDiagFeedback({ ok: Boolean(data.correct), text: data.explanation || (data.correct ? 'Correct!' : 'Not quite.') });
    };

    const continueDiag = () => {
        if (!diagFeedback) return;
        setDiagFeedback(null);
        if (diagIndex + 1 < diagQs.length) setDiagIndex(i => i + 1);
        else void finishDiagnostic(diagAnswersRef.current);
    };

    const finishDiagnostic = async (answers: { questionId: string; selectedIndex: number }[]) => {
        const res = await fetch('/api/academy/diagnostic', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ answers }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error || 'Could not save diagnostic.');
            return;
        }
        setDiagResult({
            score: data.score,
            total: data.total,
            startingRank: data.startingRank,
            startingRankName: data.startingRankName,
            aiSummary: data.aiSummary,
        });
        await loadProgress();
        setView({ kind: 'diag-results' });
    };

    const openLesson = async (id: number) => {
        if (openingLessonId != null) return; // already opening a lesson — avoid duplicate/overlapping requests
        const row = catalog.find(l => l.id === id);
        if (row?.status === 'locked') return;
        setOpeningLessonId(id);
        setError('');
        try {
            heartbeatLesson.current = id;
            await fetch(`/api/academy/lessons/${id}`, { method: 'POST', credentials: 'same-origin' });
            const res = await fetch(`/api/academy/lessons/${id}`, { credentials: 'same-origin' });
            const data = await res.json();
            if (!res.ok) {
                setError(
                    res.status === 401
                        ? 'Your session expired. Please log in again.'
                        : data.error || 'Could not open lesson. Please try again.',
                );
                return;
            }
            setLesson(data.lesson);
            setTryPick(null);
            setComplete(null);
            setView({ kind: 'lesson', id });
            sessionStorage.setItem(
                'vestera_academy_lesson',
                JSON.stringify({
                    id,
                    title: data.lesson.title,
                    excerpt: `${data.lesson.intro}\n${data.lesson.sections?.[0]?.body || ''}`,
                }),
            );
        } catch {
            setError('Could not open lesson. Check your connection and try again.');
        } finally {
            setOpeningLessonId(null);
        }
    };

    const startQuiz = async (id: number) => {
        const res = await fetch(`/api/academy/lessons/${id}/quiz`, { credentials: 'same-origin' });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error || 'Could not load quiz.');
            return;
        }
        setQuizQs(data.questions || []);
        setQuizIndex(0);
        quizAnswersRef.current = [];
        setQuizFeedback(null);
        setQuizSubmitting(false);
        setComplete(null);
        setView({ kind: 'quiz', id });
    };

    const pickQuiz = async (selectedIndex: number) => {
        const q = quizQs[quizIndex];
        if (!q || quizFeedback || view.kind !== 'quiz') return;
        const nextAnswers = [...quizAnswersRef.current.filter(a => a.questionId !== q.id), { questionId: q.id, selectedIndex }];
        quizAnswersRef.current = nextAnswers;
        const res = await fetch(`/api/academy/lessons/${view.id}/quiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ questionId: q.id, selectedIndex }),
        });
        const data = await res.json();
        setQuizFeedback({ ok: Boolean(data.correct), text: data.explanation || (data.correct ? 'Correct!' : 'Not quite.') });
    };

    const continueQuiz = async () => {
        if (!quizFeedback || view.kind !== 'quiz' || quizSubmitting) return;
        if (quizIndex + 1 < quizQs.length) {
            setQuizFeedback(null);
            setQuizIndex(i => i + 1);
            return;
        }
        setQuizSubmitting(true);
        setError('');
        const lessonId = view.id;
        try {
            const res = await fetch(`/api/academy/lessons/${lessonId}/quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ answers: quizAnswersRef.current }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Could not score quiz.');
                setQuizSubmitting(false);
                return;
            }
            setComplete({
                score: Number(data.score) || 0,
                total: Number(data.total) || 10,
                xpAwarded: Number(data.xpAwarded) || 0,
                passed: Boolean(data.passed),
                alreadyComplete: Boolean(data.alreadyComplete),
                nextLessonId: data.nextLessonId ?? null,
                rankUpAvailable: Boolean(data.rankUpAvailable),
            });
            setView({ kind: 'quiz-results', id: lessonId });
            await loadProgress();
        } catch {
            setError('Could not score quiz. Try again.');
        } finally {
            setQuizSubmitting(false);
        }
    };

    const openRankUp = () => setView({ kind: 'rankup-gate' });

    const startRankUpTest = async () => {
        const res = await fetch('/api/academy/rank-up', { credentials: 'same-origin' });
        const data = await res.json();
        if (!data.eligible) return;
        setRankUpInfo({
            questions: data.questions,
            fromName: data.fromName,
            toName: data.toName,
            title: data.title,
            fromRank: data.fromRank,
        });
        setRankUpIndex(0);
        rankUpAnswersRef.current = [];
        setRankUpFb(null);
        setView({ kind: 'rankup' });
    };

    const pickRankUp = async (selectedIndex: number) => {
        const q = rankUpInfo?.questions[rankUpIndex];
        if (!q || rankUpFb || !rankUpInfo) return;
        const nextAnswers = [...rankUpAnswersRef.current.filter(a => a.questionId !== q.id), { questionId: q.id, selectedIndex }];
        rankUpAnswersRef.current = nextAnswers;
        const res = await fetch('/api/academy/rank-up', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ questionId: q.id, selectedIndex, fromRank: rankUpInfo.fromRank }),
        });
        const data = await res.json();
        setRankUpFb({ ok: Boolean(data.correct), text: data.explanation || (data.correct ? 'Correct!' : 'Not quite.') });
    };

    const continueRankUp = async () => {
        if (!rankUpFb || !rankUpInfo) return;
        if (rankUpIndex + 1 < rankUpInfo.questions.length) {
            setRankUpFb(null);
            setRankUpIndex(i => i + 1);
            return;
        }
        const res = await fetch('/api/academy/rank-up', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ answers: rankUpAnswersRef.current }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error || 'Could not score test.');
            return;
        }
        setRankUpResult({
            passed: data.passed,
            score: data.score,
            total: data.total,
            toRankName: data.toRankName,
            weakTopics: data.weakTopics || [],
            xp: data.xp,
            lessonsCompleted: data.lessonsCompleted,
        });
        await loadProgress();
        setView({ kind: 'rankup-success' });
    };

    const runSearch = async (q: string) => {
        setSearch(q);
        if (!q.trim()) {
            setHits([]);
            return;
        }
        const res = await fetch(`/api/academy/search?q=${encodeURIComponent(q)}`, { credentials: 'same-origin' });
        const data = await res.json();
        setHits(data.results || []);
    };

    const name = state?.displayName || state?.username || 'there';

    return (
        <div className={styles.learnWrap}>
            <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
            {/* Authenticated users get nav from the global sidebar (AppFrame) — this
                header is only needed for the logged-out guest preview flow. */}
            {!authenticated && (
                <DashNav
                    onLogout={() => router.push('/')}
                    previewMode
                    onExitPreview={isGuest ? () => { clearGuestMode(); router.push('/'); } : undefined}
                />
            )}
            <div className={styles.content}>
                {loading && <div className={styles.centerState}>Loading Academy…</div>}
                {error && <p className={styles.centerState}>{error}</p>}

                {!loading && !authenticated && (
                    <div className={styles.lockedCard}>
                        <div className={styles.journeyKicker}>Vestera Academy</div>
                        <h1>Discover Your Investing Level</h1>
                        <p>Take the 15-question diagnostic to build your personalized learning path.</p>
                        <button type="button" className={styles.primaryBtn} onClick={() => setUpgradeOpen(true)}>
                            Take Diagnostic
                        </button>
                    </div>
                )}

                {!loading && authenticated && view.kind === 'diagnostic' && (
                    <div>
                        <div className={styles.diagHero}>
                            <div className={styles.journeyKicker}>Diagnostic · cannot skip</div>
                            <h1>Discover Your Investing Level</h1>
                            <p>15 questions. We will place you at the right starting rank — no guessing.</p>
                        </div>
                        <div className={styles.progressMini}>
                            Question {diagIndex + 1} / {diagQs.length || 15}
                            {diagQs[diagIndex]?.band === 'basic' && ' · A little harder'}
                            {diagQs[diagIndex]?.band === 'intermediate' && ' · Getting harder'}
                            {diagQs[diagIndex]?.band === 'advanced' && ' · Hardest questions'}
                        </div>
                        <div className={styles.barTrack}><div className={styles.barFill} style={{ width: `${((diagIndex) / 15) * 100}%` }} /></div>
                        {diagQs[diagIndex] && (
                            <div className={styles.qCard}>
                                {diagQs[diagIndex].chart && <MiniChart chart={diagQs[diagIndex].chart!} />}
                                <p className={styles.qPrompt}>{diagQs[diagIndex].prompt}</p>
                                {diagQs[diagIndex].options.map((opt, i) => (
                                    <button key={i} type="button" className={styles.opt} onClick={() => void pickDiag(i)} disabled={Boolean(diagFeedback)}>
                                        {opt}
                                    </button>
                                ))}
                                {diagFeedback && (
                                    <>
                                        <div className={`${styles.feedback} ${diagFeedback.ok ? styles.feedbackGood : styles.feedbackBad}`}>{diagFeedback.text}</div>
                                        <button type="button" className={styles.primaryBtn} onClick={continueDiag}>Continue</button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {!loading && authenticated && view.kind === 'diag-results' && diagResult && state && (
                    <div className={styles.successHero}>
                        <div className={styles.journeyKicker}>Your investing level</div>
                        <h1>{diagResult.startingRankName}</h1>
                        <p>You scored {diagResult.score} / {diagResult.total}</p>
                        <RankBar
                            currentRank={diagResult.startingRank}
                            completedInRank={0}
                            xp={0}
                            completed={0}
                            rankUpAvailable={false}
                            onRankUp={() => {}}
                        />
                        <p>{diagResult.aiSummary}</p>
                        <p>Your learning path has been personalized based on your results.</p>
                        <button type="button" className={styles.primaryBtn} onClick={() => setView({ kind: 'home' })}>
                            Start my learning path
                        </button>
                    </div>
                )}

                {!loading && authenticated && state && view.kind === 'home' && (
                    <>
                        <div className={styles.welcome}>
                            <div className={styles.journeyKicker}>Welcome back</div>
                            <h1>Welcome back, {name}</h1>
                        </div>
                        <div className={styles.statGrid}>
                            <div className={styles.statCard}><span>Your rank</span><b>{state.currentRank ? rankById(state.currentRank).name : 'UNRANKED'}</b></div>
                            <div className={styles.statCard}><span>XP</span><b>{state.xp.toLocaleString()}</b></div>
                            <div className={styles.statCard}><span>Lessons</span><b>{state.lessonsCompleted} / 100</b></div>
                            <div className={styles.statCard}><span>Quiz average</span><b>{state.quizAverage == null ? '—' : `${state.quizAverage.toFixed(1)} / 10`}</b></div>
                        </div>
                        <RankBar
                            currentRank={state.currentRank}
                            completedInRank={completedInRank}
                            xp={state.xp}
                            completed={state.lessonsCompleted}
                            rankUpAvailable={state.rankUpAvailable}
                            onRankUp={openRankUp}
                        />
                        {state.reviewTopics.length > 0 && (
                            <div className={styles.reviewBanner}>
                                <strong>Review recommended.</strong>{' '}
                                You&apos;ve missed several {state.reviewTopics[0].topic} questions. Review Lesson {state.reviewTopics[0].lessonId}: {state.reviewTopics[0].title} before your next rank-up test.
                            </div>
                        )}
                        {nextLesson && (
                            <div className={styles.continueCard}>
                                <div>
                                    <div className={styles.continueKicker}>Recommended for you</div>
                                    <h2>Continue learning</h2>
                                    <div>Lesson {nextLesson.id}</div>
                                    <p><strong>{nextLesson.title}</strong></p>
                                    <div className={styles.continueMeta}>{nextLesson.minutes} min · {nextLesson.xp} XP</div>
                                </div>
                                <button
                                    type="button"
                                    className={styles.primaryBtn}
                                    disabled={openingLessonId != null}
                                    onClick={() => void openLesson(nextLesson.id)}
                                >
                                    {openingLessonId === nextLesson.id ? 'Opening…' : 'Continue'}
                                </button>
                            </div>
                        )}
                        <div className={styles.searchWrap}>
                            <input
                                className={styles.searchInput}
                                placeholder="Search concepts, e.g. ETF"
                                value={search}
                                onChange={e => void runSearch(e.target.value)}
                            />
                            {hits.length > 0 && (
                                <div className={styles.searchResults}>
                                    {hits.map(h => (
                                        <button
                                            key={h.id}
                                            type="button"
                                            className={styles.searchHit}
                                            disabled={h.status === 'locked' || openingLessonId != null}
                                            onClick={() => void openLesson(h.id)}
                                        >
                                            {openingLessonId === h.id ? 'Opening…' : `Lesson ${h.id} — ${h.title} ${h.status === 'locked' ? '🔒' : ''}`}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <h3 className={styles.pathHead}>Your lessons</h3>
                        <div className={styles.path}>
                            {catalog
                                .filter(l => state.currentRank && l.rankId <= state.currentRank + 1)
                                .map((l, i, arr) => (
                                <div key={l.id} className={styles.node}>
                                    <div className={styles.rail}>
                                        <div className={`${styles.dot} ${l.status === 'completed' ? styles.dotDone : ''} ${l.status === 'current' ? styles.dotCurrent : ''}`}>
                                            {l.status === 'completed' ? '✓' : l.status === 'locked' ? '🔒' : l.id}
                                        </div>
                                        {i < arr.length - 1 && <div className={styles.line} />}
                                    </div>
                                    <button
                                        type="button"
                                        className={`${styles.nodeCard} ${l.status === 'current' ? styles.nodeCardCurrent : ''} ${l.status === 'locked' ? styles.nodeCardLocked : ''}`}
                                        onClick={() => void openLesson(l.id)}
                                        disabled={l.status === 'locked' || openingLessonId != null}
                                    >
                                        <h3>Lesson {l.id} · {l.title}</h3>
                                        <div className={styles.nodeMeta}>
                                            {openingLessonId === l.id ? 'Opening…' : `${l.minutes} min · ${l.xp} XP · ${l.difficulty}`}
                                        </div>
                                        {l.status === 'locked' && (
                                            <div className={styles.lockNote}>🔒 Complete Rank {l.rankId - 1} to unlock</div>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {!loading && authenticated && view.kind === 'lesson' && lesson && (
                    <article>
                        <div className={styles.lessonTop}>
                            <button type="button" className={styles.ghostBtn} onClick={() => setView({ kind: 'home' })}>← Academy</button>
                            <div className={styles.chips}>
                                <span className={styles.chip}>Lesson {lesson.id}</span>
                                <span className={styles.chip}>{rankById(lesson.rankId).name}</span>
                                <span className={styles.chip}>{lesson.difficulty}</span>
                                <span className={styles.chip}>{lesson.minutes} min</span>
                                <span className={styles.chip}>{lesson.xp} XP</span>
                            </div>
                        </div>
                        <h1 className={styles.lessonTitle}>{lesson.title}</h1>
                        <div className={styles.vestaRow}>
                            <button type="button" className={styles.vestaBtn} onClick={() => openVesta('Explain this simpler', { id: lesson.id, title: lesson.title, excerpt: lesson.intro })}>Explain this simpler</button>
                            <button type="button" className={styles.vestaBtn} onClick={() => openVesta('Give me an example', { id: lesson.id, title: lesson.title, excerpt: lesson.intro })}>Give me an example</button>
                            <button type="button" className={styles.vestaBtn} onClick={() => openVesta('Quiz me on this lesson', { id: lesson.id, title: lesson.title, excerpt: lesson.intro })}>Quiz me</button>
                            <button type="button" className={styles.vestaBtn} onClick={() => openVesta('Explain the hard part', { id: lesson.id, title: lesson.title, excerpt: lesson.sections.map(s => s.heading).join(', ') })}>Explain the hard part</button>
                            <button type="button" className={styles.vestaBtn} onClick={() => openVesta('Why does this matter?', { id: lesson.id, title: lesson.title, excerpt: lesson.whyItMatters })}>Why does this matter?</button>
                        </div>
                        <div className={styles.block}>
                            <h3>What you&apos;re about to learn</h3>
                            <p>{lesson.intro}</p>
                        </div>
                        <div className={styles.block}>
                            <h3>Why it matters</h3>
                            <p>{lesson.whyItMatters}</p>
                        </div>
                        {lesson.sections.map(s => (
                            <div key={s.heading} className={styles.block}>
                                <h3>{s.heading}</h3>
                                <p>{s.body}</p>
                                {s.callout && <div className={styles.callout}>{s.callout}</div>}
                            </div>
                        ))}
                        <div className={styles.block}>
                            <h3>Real world example</h3>
                            <p>{lesson.realWorld}</p>
                        </div>
                        <div className={styles.block}>
                            <h3>Try it</h3>
                            <p>{lesson.tryIt.prompt}</p>
                            {lesson.tryIt.choices.map((c, i) => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`${styles.tryChoice} ${tryPick === i ? (i === lesson.tryIt.answer ? styles.optGood : styles.optBad) : ''}`}
                                    onClick={() => setTryPick(i)}
                                >
                                    {c}
                                </button>
                            ))}
                            {tryPick != null && <div className={`${styles.feedback} ${tryPick === lesson.tryIt.answer ? styles.feedbackGood : styles.feedbackBad}`}>{lesson.tryIt.explanation}</div>}
                        </div>
                        <div className={styles.block}>
                            <h3>Key takeaways</h3>
                            <ul className={styles.takeaways}>
                                {lesson.takeaways.map(t => <li key={t}>{t}</li>)}
                            </ul>
                        </div>
                        {lesson.practice && (
                            <a className={styles.practiceLink} href={lesson.practice.href}>{lesson.practice.label} →</a>
                        )}
                        <div className={styles.actions}>
                            <button type="button" className={styles.primaryBtn} onClick={() => startQuiz(lesson.id)}>Start quiz</button>
                        </div>
                    </article>
                )}

                {!loading && authenticated && view.kind === 'quiz' && (
                    <div>
                        <button type="button" className={styles.ghostBtn} onClick={() => setView({ kind: 'lesson', id: view.id })}>← Review lesson</button>
                        <div className={styles.progressMini}>Question {quizIndex + 1} / 10 · Pass with 6 / 10</div>
                        <div className={styles.barTrack}><div className={styles.barFill} style={{ width: `${(quizIndex / 10) * 100}%` }} /></div>
                        {quizQs[quizIndex] && (
                            <div className={styles.qCard}>
                                {quizQs[quizIndex].chart && <MiniChart chart={quizQs[quizIndex].chart!} />}
                                <p className={styles.qPrompt}>{quizQs[quizIndex].prompt}</p>
                                {quizQs[quizIndex].options.map((opt, i) => (
                                    <button key={i} type="button" className={styles.opt} onClick={() => void pickQuiz(i)} disabled={Boolean(quizFeedback)}>{opt}</button>
                                ))}
                                {quizFeedback && (
                                    <>
                                        <div className={`${styles.feedback} ${quizFeedback.ok ? styles.feedbackGood : styles.feedbackBad}`}>{quizFeedback.text}</div>
                                        <button type="button" className={styles.primaryBtn} disabled={quizSubmitting} onClick={() => void continueQuiz()}>
                                            {quizSubmitting ? 'Scoring…' : quizIndex + 1 >= quizQs.length ? 'See my score' : 'Continue'}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {!loading && authenticated && view.kind === 'quiz-results' && complete && (
                    <div className={styles.scoreScreen}>
                        <div className={styles.journeyKicker}>{complete.passed ? 'Passed' : 'Not complete'}</div>
                        {complete.passed ? (
                            <>
                                <h1>Lesson Completed!</h1>
                                <p className={styles.scoreLine}>Your score</p>
                                <div className={styles.xpBurst}>{complete.score} / {complete.total}</div>
                                <p>You passed. This lesson is now saved as complete.</p>
                                <div className={styles.xpBurst}>{complete.alreadyComplete ? 'Already earned' : `+${complete.xpAwarded} XP`}</div>
                                <div className={styles.barTrack}>
                                    <div className={styles.barFill} style={{ width: `${(completedInRank / 20) * 100}%` }} />
                                </div>
                                <p>Rank progress</p>
                                <div className={styles.actions} style={{ justifyContent: 'center' }}>
                                    <button
                                        type="button"
                                        className={styles.primaryBtn}
                                        onClick={() => {
                                            setComplete(null);
                                            setView({ kind: 'home' });
                                        }}
                                    >
                                        Back to Academy
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h1>You have to retry</h1>
                                <p className={styles.scoreLine}>Your score</p>
                                <div className={styles.xpBurst}>{complete.score} / {complete.total}</div>
                                <p>You need 6 / 10 to pass. This lesson is not complete and no XP was added.</p>
                                <div className={styles.actions} style={{ justifyContent: 'center' }}>
                                    <button type="button" className={styles.ghostBtn} onClick={() => { setComplete(null); setView({ kind: 'lesson', id: view.id }); }}>Review lesson</button>
                                    <button type="button" className={styles.primaryBtn} onClick={() => { setComplete(null); void startQuiz(view.id); }}>Try again</button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {!loading && authenticated && view.kind === 'rankup-gate' && (
                    <div className={styles.backdrop}>
                        <div className={styles.modal}>
                            <h2>RANK UP AVAILABLE!</h2>
                            <p>You&apos;ve completed this rank. Are you ready to prove what you learned?</p>
                            <div className={styles.actions} style={{ justifyContent: 'center' }}>
                                <button type="button" className={styles.primaryBtn} onClick={() => void startRankUpTest()}>Take Rank-Up Test</button>
                                <button type="button" className={styles.ghostBtn} onClick={() => setView({ kind: 'home' })}>Keep Studying</button>
                            </div>
                        </div>
                    </div>
                )}

                {!loading && authenticated && view.kind === 'rankup' && rankUpInfo && (
                    <div>
                        <div className={styles.diagHero}>
                            <h1>{rankUpInfo.title}</h1>
                            <p>25 questions covering this rank. You need 16/25 to rank up.</p>
                        </div>
                        <div className={styles.progressMini}>Question {rankUpIndex + 1} / 25</div>
                        <div className={styles.barTrack}><div className={styles.barFill} style={{ width: `${(rankUpIndex / 25) * 100}%` }} /></div>
                        {rankUpInfo.questions[rankUpIndex] && (
                            <div className={styles.qCard}>
                                {rankUpInfo.questions[rankUpIndex].chart && <MiniChart chart={rankUpInfo.questions[rankUpIndex].chart!} />}
                                <p className={styles.qPrompt}>{rankUpInfo.questions[rankUpIndex].prompt}</p>
                                {rankUpInfo.questions[rankUpIndex].options.map((opt, i) => (
                                    <button key={i} type="button" className={styles.opt} disabled={Boolean(rankUpFb)} onClick={() => void pickRankUp(i)}>{opt}</button>
                                ))}
                                {rankUpFb && (
                                    <>
                                        <div className={`${styles.feedback} ${rankUpFb.ok ? styles.feedbackGood : styles.feedbackBad}`}>{rankUpFb.text}</div>
                                        <button type="button" className={styles.primaryBtn} onClick={() => void continueRankUp()}>Continue</button>
                                    </>
                                )}
                            </div>
                        )}
                        <button type="button" className={styles.ghostBtn} style={{ marginTop: 16 }} onClick={() => setView({ kind: 'home' })}>
                            Keep studying
                        </button>
                    </div>
                )}

                {!loading && authenticated && view.kind === 'rankup-success' && rankUpResult && (
                    <div className={styles.successHero}>
                        {rankUpResult.passed ? (
                            <>
                                <h1>RANK UP!</h1>
                                <p>You are now:</p>
                                <h2>{rankUpResult.toRankName}</h2>
                                <p>25/25 questions reviewed · {rankUpResult.score}/25 correct · {rankUpResult.lessonsCompleted} lessons completed · {rankUpResult.xp.toLocaleString()} XP earned</p>
                                <button type="button" className={styles.primaryBtn} onClick={() => setView({ kind: 'home' })}>Start next rank</button>
                            </>
                        ) : (
                            <>
                                <h1>Not yet</h1>
                                <p>You scored {rankUpResult.score}/25. You need 16 to rank up. Your completed lessons stay saved.</p>
                                {rankUpResult.weakTopics.length > 0 && (
                                    <p>Review: {rankUpResult.weakTopics.slice(0, 4).join(', ')}</p>
                                )}
                                <button type="button" className={styles.primaryBtn} onClick={() => setView({ kind: 'home' })}>Keep studying</button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
