'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LEVELS, type LessonUnit, type Level } from '@/lib/learningContent';
import styles from './learn.module.css';
import DashNav from '@/components/DashNav';
import UpgradeModal from '@/components/UpgradeModal';
import { useAuthState } from '@/hooks/useAuthState';
import { useGuestMode } from '@/hooks/useGuestMode';
import { useLearnProgress } from '@/hooks/useLearnProgress';
import {
    LessonHeader,
    LessonTabs,
    ConceptsTab,
    VideoTab,
    LessonContentWrapper,
    type LessonViewTab,
} from './LessonViewTabs';

// Total lesson count across all levels
const TOTAL_LESSONS = LEVELS.reduce((s, l) => s + l.units.length, 0);

function CardIllustration({ level, unit }: { level: Level; unit: LessonUnit }) {
    return (
        <div
            className={styles.cardIllustration}
            style={{
                background: `linear-gradient(135deg, ${level.gradFrom ?? 'rgba(79,110,247,0.15)'}, ${level.gradTo ?? 'rgba(79,110,247,0.04)'})`,
            }}
        >
            {/* Decorative dot grid */}
            <div className={styles.illDotGrid} />
            {/* Decorative circle blobs */}
            <div className={styles.illBlob1} style={{ background: level.color + '22' }} />
            <div className={styles.illBlob2} style={{ background: level.color + '11' }} />
            <span className={styles.cardIllIcon}>{unit.icon ?? level.emoji}</span>
        </div>
    );
}

export default function LearningDashboard() {
    const [activeLevel, setActiveLevel] = useState(LEVELS[0].id);
    const [activeUnit, setActiveUnit] = useState<LessonUnit | null>(null);
    const [activeUnitLevel, setActiveUnitLevelId] = useState<string>(LEVELS[0].id);
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
    const [quizResult, setQuizResult] = useState<{ score: number; total: number; passed: boolean } | null>(null);
    const [lessonTab, setLessonTab] = useState<LessonViewTab>('concepts');
    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const router = useRouter();
    const { authenticated, userId, loading: authLoading } = useAuthState();
    const { isGuest, clearGuestMode } = useGuestMode();
    const { progressForUi: progress, updateProgress } = useLearnProgress(authenticated, authLoading, userId);

    const learnPreviewOnly = authLoading || !authenticated;

    useEffect(() => {
        if (learnPreviewOnly && lessonTab === 'video') {
            setLessonTab('concepts');
        }
    }, [learnPreviewOnly, lessonTab]);

    const level = LEVELS.find(l => l.id === activeLevel)!;

    const completedCount = level.units.filter(u => progress[`${activeLevel}-${u.id}`]?.completed).length;
    const quizzesPassed = level.units.filter(u => progress[`${activeLevel}-${u.id}`]?.quizPassed).length;
    const totalCompleted = LEVELS.reduce(
        (s, l) => s + l.units.filter(u => progress[`${l.id}-${u.id}`]?.completed).length, 0
    );

    const openUnit = (unit: LessonUnit, levelId: string) => {
        setActiveUnit(unit);
        setActiveUnitLevelId(levelId);
        setShowQuiz(false);
        setQuizResult(null);
        setQuizAnswers({});
        const key = `${levelId}-${unit.id}`;
        // Logged-in only: guests never persist completion (updateProgress is a no-op when logged out)
        updateProgress(prev => ({
            ...prev,
            [key]: { ...prev[key], completed: true },
        }));
    };

    const startQuiz = () => {
        if (learnPreviewOnly) {
            setUpgradeOpen(true);
            return;
        }
        setShowQuiz(true);
        setQuizResult(null);
        setQuizAnswers({});
    };

    const handleLessonTabChange = (t: LessonViewTab) => {
        if (learnPreviewOnly && t === 'video') {
            setUpgradeOpen(true);
            return;
        }
        setLessonTab(t);
    };

    const submitQuiz = () => {
        if (!activeUnit) return;
        let correct = 0;
        activeUnit.quiz.forEach((q, i) => { if (quizAnswers[i] === q.answer) correct++; });
        const total = activeUnit.quiz.length;
        const passed = correct === total;
        setQuizResult({ score: correct, total, passed });
        if (passed) {
            const key = `${activeUnitLevel}-${activeUnit.id}`;
            updateProgress(prev => ({
                ...prev,
                [key]: { ...prev[key], completed: true, quizScore: correct, quizPassed: true },
            }));
        }
    };

    const formatContent = (text: string) =>
        text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');

    const activeUnitLevelObj = LEVELS.find(l => l.id === activeUnitLevel) ?? LEVELS[0];

    return (
        <div className={styles.learnWrap}>
            <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
            <DashNav
                onLogout={() => router.push('/')}
                previewMode={!authenticated}
                onExitPreview={
                    isGuest
                        ? () => {
                              clearGuestMode();
                              router.push('/');
                          }
                        : undefined
                }
            />

            <div className={styles.content}>

                {/* ── Hero header ── */}
                <div className={styles.learnHero}>
                    <div className={styles.heroLeft}>
                        <div className={styles.heroEyebrow}>
                            <span className={styles.eyebrowDot} />
                            Learning Academy
                        </div>
                        <h1 className={styles.heroTitle}>Master the Markets</h1>
                        <p className={styles.heroSub}>
                            {LEVELS.length} courses · {TOTAL_LESSONS} lessons · Quizzes included
                        </p>
                    </div>
                    <div className={styles.heroStats}>
                        <div className={styles.heroStat}>
                            <strong>{totalCompleted}</strong>
                            <span>Completed</span>
                        </div>
                        <div className={styles.heroStat}>
                            <strong>{TOTAL_LESSONS - totalCompleted}</strong>
                            <span>Remaining</span>
                        </div>
                        <div className={styles.heroStat}>
                            <strong>{TOTAL_LESSONS > 0 ? Math.round((totalCompleted / TOTAL_LESSONS) * 100) : 0}%</strong>
                            <span>Progress</span>
                        </div>
                    </div>
                </div>

                {/* ── Level Tabs ── */}
                <div className={styles.levelTabs}>
                    {LEVELS.map(l => {
                        const done = l.units.filter(u => progress[`${l.id}-${u.id}`]?.completed).length;
                        return (
                            <button
                                key={l.id}
                                className={`${styles.levelTab} ${activeLevel === l.id ? styles.activeTab : ''}`}
                                onClick={() => { setActiveLevel(l.id); setActiveUnit(null); setShowQuiz(false); }}
                                style={activeLevel === l.id ? { borderColor: l.color, color: l.color } : {}}
                            >
                                <span>{l.emoji}</span>
                                <span>{l.name}</span>
                                <span
                                    className={styles.tabCount}
                                    style={activeLevel === l.id ? { background: l.color + '22', color: l.color } : {}}
                                >
                                    {done}/{l.units.length}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* ── Level progress bar ── */}
                {!activeUnit && (
                    <div className={styles.progressCard}>
                        <div className={styles.progressInfo}>
                            <div className={styles.progressLeft}>
                                <span className={styles.levelBadge} style={{ background: level.color + '18', color: level.color, border: `1px solid ${level.color}33` }}>
                                    {level.emoji} {level.name}
                                </span>
                                <span className={styles.progressText}>{completedCount}/{level.units.length} lessons completed</span>
                            </div>
                            <span className={styles.quizText}>{quizzesPassed}/{level.units.length} quizzes passed</span>
                        </div>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${(completedCount / level.units.length) * 100}%`, background: level.color }}
                            />
                        </div>
                    </div>
                )}

                {/* ── Unit viewer or course grid ── */}
                {activeUnit ? (
                    <div className={styles.unitViewer}>
                        <div className={styles.viewerHeader}>
                            <button className={styles.backBtn} onClick={() => { setActiveUnit(null); setShowQuiz(false); }}>
                                ← Back to {activeUnitLevelObj.name}
                            </button>
                            <div className={styles.viewerMeta}>
                                <span className={styles.levelBadge} style={{ background: activeUnitLevelObj.color + '18', color: activeUnitLevelObj.color, border: `1px solid ${activeUnitLevelObj.color}33` }}>
                                    {activeUnitLevelObj.emoji} {activeUnitLevelObj.name}
                                </span>
                                {activeUnit.duration && (
                                    <span className={styles.viewerDuration}>⏱ {activeUnit.duration}</span>
                                )}
                            </div>
                        </div>

                        {!showQuiz ? (
                            <>
                                <div className={styles.viewerIconRow}>
                                    <span className={styles.viewerIcon}>{activeUnit.icon ?? activeUnitLevelObj.emoji}</span>
                                    {activeUnit.topics && (
                                        <div className={styles.topicTags}>
                                            {activeUnit.topics.map(t => (
                                                <span key={t} className={styles.topicTag}>{t}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <LessonHeader
                                    title={activeUnit.title}
                                    quizAvailable={activeUnit.quiz.length > 0}
                                    onTakeQuiz={startQuiz}
                                />
                                <LessonTabs
                                    active={lessonTab}
                                    onChange={handleLessonTabChange}
                                    accentColor={activeUnitLevelObj.color}
                                />
                                <LessonContentWrapper>
                                    {lessonTab === 'concepts' && (
                                        <ConceptsTab>
                                            <div className={styles.unitContent} dangerouslySetInnerHTML={{ __html: formatContent(activeUnit.content) }} />
                                        </ConceptsTab>
                                    )}
                                    {lessonTab === 'video' && (
                                        <VideoTab lessonTitle={activeUnit.title} />
                                    )}
                                </LessonContentWrapper>
                            </>
                        ) : (
                            <div className={styles.quizSection}>
                                <h2>Quiz: {activeUnit.title}</h2>
                                {activeUnit.quiz.map((q, qi) => (
                                    <div key={qi} className={styles.quizQuestion}>
                                        <p className={styles.questionText}>{qi + 1}. {q.question}</p>
                                        <div className={styles.options}>
                                            {q.options.map((opt, oi) => (
                                                <label key={oi} className={`${styles.option} ${quizAnswers[qi] === oi ? styles.optionSelected : ''}`}>
                                                    <input
                                                        type="radio"
                                                        name={`q${qi}`}
                                                        checked={quizAnswers[qi] === oi}
                                                        onChange={() => setQuizAnswers(prev => ({ ...prev, [qi]: oi }))}
                                                    />
                                                    {opt}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    className={styles.submitQuizBtn}
                                    onClick={submitQuiz}
                                    disabled={Object.keys(quizAnswers).length < activeUnit.quiz.length}
                                >
                                    Submit Answers
                                </button>
                                {quizResult && (
                                    <div className={`${styles.quizResultCard} ${quizResult.passed ? styles.quizPassed : styles.quizFailed}`}>
                                        <h3>{quizResult.passed ? '🎉 Passed!' : 'Try Again'}</h3>
                                        <p>Score: {quizResult.score}/{quizResult.total}</p>
                                        {!quizResult.passed && (
                                            <button className={styles.retryBtn} onClick={startQuiz}>Retry Quiz</button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.unitGrid}>
                        {level.units.map((unit, idx) => {
                            const key = `${activeLevel}-${unit.id}`;
                            const p = progress[key];
                            const progressPct = p?.completed ? 100 : 0;
                            return (
                                <div
                                    key={unit.id}
                                    className={`${styles.courseCard} ${p?.completed ? styles.courseCardDone : ''}`}
                                    onClick={() => openUnit(unit, activeLevel)}
                                >
                                    {/* Illustration area */}
                                    <CardIllustration level={level} unit={unit} />

                                    {/* Card body */}
                                    <div className={styles.cardBody}>
                                        <div className={styles.cardMetaRow}>
                                            <span
                                                className={styles.levelBadge}
                                                style={{
                                                    background: level.color + '18',
                                                    color: level.color,
                                                    border: `1px solid ${level.color}33`,
                                                }}
                                            >
                                                {level.name}
                                            </span>
                                            <span className={styles.cardDuration}>
                                                {unit.duration ?? '~8 min'}
                                            </span>
                                        </div>

                                        <div className={styles.cardLessonNum}>
                                            Lesson {idx + 1} of {level.units.length}
                                        </div>

                                        <h4 className={styles.cardTitle}>{unit.title}</h4>

                                        <p className={styles.cardPreview}>
                                            {unit.content.replace(/\*\*/g, '').substring(0, 88).trimEnd()}…
                                        </p>

                                        {unit.topics && (
                                            <div className={styles.cardTopics}>
                                                {unit.topics.slice(0, 3).map(t => (
                                                    <span key={t} className={styles.cardTopicTag}>{t}</span>
                                                ))}
                                            </div>
                                        )}

                                        <div className={styles.cardFooter}>
                                            {p?.completed ? (
                                                <span className={styles.badgeDone}>✓ Completed</span>
                                            ) : (
                                                <span className={styles.cardCta}>
                                                    {p ? 'Continue' : 'Start lesson'} →
                                                </span>
                                            )}
                                            {p?.quizPassed && (
                                                <span className={styles.badgeQuiz}>Quiz ✓</span>
                                            )}
                                        </div>

                                        {/* Progress bar at bottom */}
                                        {progressPct > 0 && (
                                            <div className={styles.cardProgressBar}>
                                                <div
                                                    className={styles.cardProgressFill}
                                                    style={{ width: `${progressPct}%`, background: level.color }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
