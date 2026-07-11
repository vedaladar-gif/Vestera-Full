'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    COURSE_CATALOG,
    TOTAL_LESSONS,
    getCourseById,
    type Course,
    type CourseLesson,
} from '@/lib/courseContent';
import styles from './learn.module.css';
import DashNav from '@/components/DashNav';
import UpgradeModal from '@/components/UpgradeModal';
import { useAuthState } from '@/hooks/useAuthState';
import { useGuestMode } from '@/hooks/useGuestMode';
import { LessonRenderer } from '@/components/learn/LessonRenderer';
import CourseQuiz from '@/components/learn/CourseQuiz';
import {
    useAcademyProgress,
    RANKS,
    QUIZ_PASS_PCT,
    XP_PER_LESSON,
    COINS_PER_LESSON,
    XP_QUIZ_BONUS,
    COINS_QUIZ_BONUS,
    isCourseUnlocked,
    isLessonUnlocked,
    isLessonDone,
    getCourseProgressPct,
    getCourseProgress,
} from '@/hooks/useAcademyProgress';

type View = 'catalog' | 'course' | 'lesson' | 'quiz';

function LockIcon({ size = 16 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
            <rect x="3" y="7" width="10" height="8" rx="2" fill="currentColor" />
            <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
    );
}

export default function AcademyPage() {
    const router = useRouter();
    const { authenticated, userId, loading: authLoading } = useAuthState();
    const { isGuest, clearGuestMode } = useGuestMode();

    const {
        courses,
        totalLessonsDone,
        totalXP,
        totalCoins,
        traderScore,
        currentRank,
        nextRank,
        xpToNext,
        streak,
        badges,
        completeLesson,
        passQuiz,
        canTakeQuiz,
    } = useAcademyProgress(authenticated, authLoading, userId);

    const [view, setView] = useState<View>('catalog');
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const [completionModal, setCompletionModal] = useState<{
        course: Course;
        scorePct: number;
    } | null>(null);

    const learnPreviewOnly = authLoading || !authenticated;
    const selectedCourse = selectedCourseId ? getCourseById(selectedCourseId) : null;

    const openCourse = (course: Course) => {
        if (!isCourseUnlocked(course.id, courses)) return;
        setSelectedCourseId(course.id);
        setView('course');
    };

    const openLesson = (lesson: CourseLesson) => {
        if (!selectedCourseId) return;
        const idx = lesson.id - 1;
        if (!isLessonUnlocked(selectedCourseId, idx, courses)) return;
        setSelectedLesson(lesson);
        setView('lesson');
    };

    const handleCompleteLesson = () => {
        if (!selectedCourseId || !selectedLesson || learnPreviewOnly) {
            if (learnPreviewOnly) setUpgradeOpen(true);
            return;
        }
        const idx = selectedLesson.id - 1;
        if (!isLessonDone(selectedCourseId, idx, courses)) {
            completeLesson(selectedCourseId);
        }
        setView('course');
        setSelectedLesson(null);
    };

    const handleQuizComplete = (scorePct: number, passed: boolean) => {
        if (!selectedCourse || learnPreviewOnly) return;
        passQuiz(selectedCourse.id, scorePct);
        if (passed) {
            setCompletionModal({ course: selectedCourse, scorePct });
        }
    };

    const dashNav = (
        <DashNav
            onLogout={() => router.push('/')}
            previewMode={!authenticated}
            onExitPreview={isGuest ? () => { clearGuestMode(); router.push('/'); } : undefined}
        />
    );

    // ── Lesson viewer ─────────────────────────────────────────────────────
    if (view === 'lesson' && selectedCourse && selectedLesson) {
        const lessonIdx = selectedLesson.id - 1;
        const done = isLessonDone(selectedCourse.id, lessonIdx, courses);

        return (
            <div className={styles.learnWrap}>
                <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
                {dashNav}
                <div className={styles.content}>
                    <div className={styles.unitViewer}>
                        <div className={styles.viewerHeader}>
                            <button className={styles.backBtn} onClick={() => { setView('course'); setSelectedLesson(null); }}>
                                ← Back to {selectedCourse.title}
                            </button>
                            <div className={styles.viewerMeta}>
                                <span className={styles.levelBadge} style={{ background: selectedCourse.color + '18', color: selectedCourse.color, border: `1px solid ${selectedCourse.color}33` }}>
                                    {selectedCourse.emoji} {selectedCourse.title}
                                </span>
                                <span className={styles.viewerDuration}>⏱ {selectedLesson.duration}</span>
                                <span className={styles.viewerDuration}>📊 {selectedLesson.difficulty}</span>
                            </div>
                        </div>

                        <div className={styles.lessonHeaderBar}>
                            <span className={styles.lessonNumBadge}>Lesson {selectedLesson.id} of 5</span>
                            <h2 className={styles.lessonViewerTitle}>{selectedLesson.title}</h2>
                            <div className={styles.topicTags}>
                                {selectedLesson.topics.map(t => (
                                    <span key={t} className={styles.topicTag}>{t}</span>
                                ))}
                            </div>
                        </div>

                        <LessonRenderer
                            content={selectedLesson.content}
                            unitId={selectedLesson.id}
                            levelId={selectedCourse.id}
                            accentColor={selectedCourse.color}
                        />

                        <div className={styles.lessonCompleteBar}>
                            {done ? (
                                <div className={styles.lessonDoneMsg}>✓ Lesson completed</div>
                            ) : (
                                <button type="button" className={styles.completeLessonBtn} onClick={handleCompleteLesson}>
                                    Mark Lesson Complete →
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Final quiz ────────────────────────────────────────────────────────
    if (view === 'quiz' && selectedCourse) {
        return (
            <div className={styles.learnWrap}>
                {dashNav}
                <div className={styles.content}>
                    <CourseQuiz
                        courseTitle={selectedCourse.title}
                        questions={selectedCourse.finalQuiz}
                        onComplete={handleQuizComplete}
                        onBack={() => setView('course')}
                    />
                </div>
            </div>
        );
    }

    // ── Course detail ─────────────────────────────────────────────────────
    if (view === 'course' && selectedCourse) {
        const cp = getCourseProgress(courses, selectedCourse.id);
        const pct = getCourseProgressPct(selectedCourse.id, courses);
        const quizReady = canTakeQuiz(selectedCourse.id);
        const quizPassed = cp.quizPassed;

        return (
            <div className={styles.learnWrap}>
                <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
                {dashNav}
                <div className={styles.content}>
                    <button className={styles.backBtn} onClick={() => { setView('catalog'); setSelectedCourseId(null); }}>
                        ← All Courses
                    </button>

                    <div className={styles.courseDetailHeader}>
                        <div className={styles.courseDetailIcon} style={{ background: selectedCourse.color + '18' }}>
                            {selectedCourse.emoji}
                        </div>
                        <div>
                            <h1 className={styles.courseDetailTitle}>{selectedCourse.title}</h1>
                            <p className={styles.courseDetailSub}>{selectedCourse.description}</p>
                            <div className={styles.courseDetailMeta}>
                                <span>{selectedCourse.difficulty}</span>
                                <span>·</span>
                                <span>{selectedCourse.estimatedMinutes} min total</span>
                                <span>·</span>
                                <span>+{selectedCourse.xpReward} XP · +{selectedCourse.coinReward} coins</span>
                            </div>
                        </div>
                    </div>

                    {/* Course progress bar */}
                    <div className={styles.courseProgressCard}>
                        <div className={styles.courseProgressTop}>
                            <span className={styles.courseProgressLabel}>Course Progress</span>
                            <span className={styles.courseProgressPct}>{pct}%</span>
                        </div>
                        <div className={styles.courseProgressTrack}>
                            <div className={styles.courseProgressFill} style={{ width: `${pct}%`, background: selectedCourse.color }} />
                        </div>
                        <div className={styles.courseProgressSub}>
                            {cp.lessonsDone}/5 lessons · {quizPassed ? 'Quiz passed ✓' : quizReady ? 'Quiz ready!' : `${5 - cp.lessonsDone} lessons to quiz`}
                        </div>
                    </div>

                    {/* Lesson list */}
                    <div className={styles.lessonList}>
                        {selectedCourse.lessons.map((lesson, idx) => {
                            const unlocked = isLessonUnlocked(selectedCourse.id, idx, courses);
                            const done = isLessonDone(selectedCourse.id, idx, courses);
                            const active = unlocked && !done;

                            return (
                                <div
                                    key={lesson.id}
                                    className={`${styles.lessonListItem} ${done ? styles.lessonListDone : ''} ${!unlocked ? styles.lessonListLocked : ''} ${active ? styles.lessonListActive : ''}`}
                                    onClick={() => unlocked && openLesson(lesson)}
                                    role={unlocked ? 'button' : undefined}
                                >
                                    <div className={styles.lessonListNum}>
                                        {done ? '✓' : !unlocked ? <LockIcon size={12} /> : lesson.id}
                                    </div>
                                    <div className={styles.lessonListBody}>
                                        <div className={styles.lessonListTitle}>{lesson.title}</div>
                                        <div className={styles.lessonListMeta}>
                                            {lesson.duration} · {lesson.difficulty}
                                        </div>
                                    </div>
                                    {active && <span className={styles.lessonListCta}>Start →</span>}
                                    {done && <span className={styles.lessonListDoneBadge}>Done</span>}
                                    {!unlocked && <span className={styles.lessonListLockText}>Locked</span>}
                                </div>
                            );
                        })}

                        {/* Final quiz row */}
                        <div
                            className={`${styles.lessonListItem} ${styles.quizListItem} ${quizPassed ? styles.lessonListDone : ''} ${!quizReady ? styles.lessonListLocked : ''}`}
                            onClick={() => quizReady && setView('quiz')}
                            role={quizReady ? 'button' : undefined}
                        >
                            <div className={styles.lessonListNum}>📝</div>
                            <div className={styles.lessonListBody}>
                                <div className={styles.lessonListTitle}>Final Quiz — 10 Questions</div>
                                <div className={styles.lessonListMeta}>
                                    {quizPassed
                                        ? `Passed · Best score ${cp.quizBestScore}%`
                                        : quizReady
                                            ? `Need ${QUIZ_PASS_PCT}% to pass · Unlimited retries`
                                            : 'Complete all 5 lessons first'}
                                </div>
                            </div>
                            {quizReady && !quizPassed && <span className={styles.lessonListCta}>Take Quiz →</span>}
                            {quizPassed && <span className={styles.lessonListDoneBadge}>Passed ✓</span>}
                            {!quizReady && <span className={styles.lessonListLockText}>🔒 Locked</span>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Course catalog (main view) ────────────────────────────────────────
    return (
        <div className={styles.learnWrap}>
            <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
            {dashNav}

            <div className={styles.content}>
                <motion.div className={styles.academyHeader} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
                    <div className={styles.academyEyebrow}>THE ACADEMY</div>
                    <h1 className={styles.academyTitle}>Master the Markets</h1>
                    <p className={styles.academySubtitle}>
                        {COURSE_CATALOG.length} courses · {TOTAL_LESSONS} lessons · Pass each quiz to unlock the next
                    </p>
                </motion.div>

                {/* Progress stats */}
                <div className={styles.progressRow}>
                    <div className={styles.progressCardAccent}>
                        <div className={styles.progressCardLabel} style={{ color: '#4C8DFF' }}>Trader Score</div>
                        <div className={styles.progressBigNum}>{traderScore}</div>
                        <div className={styles.progressBarTrack}>
                            <div className={styles.progressBarFill} style={{ width: `${traderScore / 10}%`, background: '#4C8DFF' }} />
                        </div>
                    </div>
                    <div className={styles.progressCardWhite}>
                        <div className={styles.progressCardLabel}>XP</div>
                        <div className={styles.progressBigNum} style={{ fontSize: 26 }}>{totalXP}</div>
                        <div className={styles.progressCardSub}>{nextRank ? `${xpToNext} XP to ${nextRank.name}` : 'Max rank!'}</div>
                    </div>
                    <div className={styles.progressCardWhite}>
                        <div className={styles.progressCardLabel}>Coins</div>
                        <div className={styles.progressBigNum} style={{ fontSize: 26 }}>🪙 {totalCoins}</div>
                    </div>
                    <div className={styles.progressCardWhite}>
                        <div className={styles.progressCardLabel}>Streak</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                            <div className={styles.flameIcon} />
                            <div className={styles.progressBigNum} style={{ fontSize: 26 }}>{streak}</div>
                        </div>
                    </div>
                </div>

                <div className={styles.progressRow} style={{ marginTop: -12 }}>
                    <div className={styles.progressCardWhite} style={{ gridColumn: '1 / -1' }}>
                        <div className={styles.progressCardLabel}>Current Rank</div>
                        <div className={styles.progressRankName}>{currentRank.emoji} {currentRank.name}</div>
                        <div className={styles.rankLadder}>
                            {RANKS.map(r => (
                                <span key={r.name} className={styles.rankPip} style={{ opacity: currentRank.name === r.name ? 1 : 0.35 }}>
                                    {r.emoji} {r.name}
                                </span>
                            ))}
                        </div>
                        {badges.length > 0 && (
                            <div className={styles.badgesRow}>
                                {badges.map(b => (
                                    <span key={b} className={styles.badgeChip}>🏅 {b}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Course cards */}
                <div className={styles.courseGrid}>
                    {COURSE_CATALOG.map((course, i) => {
                        const unlocked = isCourseUnlocked(course.id, courses);
                        const pct = getCourseProgressPct(course.id, courses);
                        const cp = getCourseProgress(courses, course.id);
                        const prevCourse = course.prerequisite ? getCourseById(course.prerequisite) : null;

                        return (
                            <motion.div
                                key={course.id}
                                className={`${styles.courseCard} ${!unlocked ? styles.courseCardLocked : ''} ${cp.quizPassed ? styles.courseCardComplete : ''}`}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                onClick={() => unlocked && openCourse(course)}
                                role={unlocked ? 'button' : undefined}
                            >
                                <div className={styles.courseCardTop} style={{ background: unlocked ? `linear-gradient(135deg, ${course.color}18, #F4F6FC)` : 'linear-gradient(135deg,#EDEFF6,#F4F6FC)' }}>
                                    <span className={styles.courseCardEmoji}>{unlocked ? course.emoji : '🔒'}</span>
                                    {cp.quizPassed && <span className={styles.courseCardCompleteBadge}>✓ Complete</span>}
                                </div>
                                <div className={styles.courseCardBody}>
                                    <div className={styles.courseCardDifficulty} style={{ color: unlocked ? course.color : '#a7acc9' }}>
                                        {course.difficulty}
                                    </div>
                                    <h3 className={styles.courseCardTitle} style={{ color: unlocked ? '#20264D' : '#a7acc9' }}>
                                        {course.title}
                                    </h3>
                                    <p className={styles.courseCardDesc}>{course.description.substring(0, 100)}…</p>

                                    <div className={styles.courseCardStats}>
                                        <span>📚 5 lessons</span>
                                        <span>⏱ {course.estimatedMinutes} min</span>
                                    </div>
                                    <div className={styles.courseCardRewards}>
                                        <span>+{course.xpReward} XP</span>
                                        <span>🪙 {course.coinReward}</span>
                                        <span>{course.badgeEmoji} {course.badgeName}</span>
                                    </div>

                                    {unlocked ? (
                                        <>
                                            <div className={styles.courseCardProgressTrack}>
                                                <div className={styles.courseCardProgressFill} style={{ width: `${pct}%`, background: course.color }} />
                                            </div>
                                            <div className={styles.courseCardProgressLabel}>{pct}% complete</div>
                                        </>
                                    ) : (
                                        <div className={styles.courseCardLockedMsg}>
                                            <LockIcon size={12} />
                                            Complete {prevCourse?.title ?? 'previous course'} to unlock
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Completion modal */}
            <AnimatePresence>
                {completionModal && (
                    <motion.div
                        className={styles.completionOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setCompletionModal(null)}
                    >
                        <motion.div
                            className={styles.completionModal}
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className={styles.completionEmoji}>🎉</div>
                            <h2 className={styles.completionTitle}>Course Complete!</h2>
                            <p className={styles.completionSub}>
                                You passed <strong>{completionModal.course.title}</strong> with {completionModal.scorePct}%
                            </p>
                            <div className={styles.completionRewards}>
                                <div className={styles.completionReward}>+{XP_QUIZ_BONUS} XP</div>
                                <div className={styles.completionReward}>🪙 +{COINS_QUIZ_BONUS} coins</div>
                                <div className={styles.completionReward}>
                                    {completionModal.course.badgeEmoji} {completionModal.course.badgeName}
                                </div>
                            </div>
                            <p className={styles.completionUnlock}>
                                {COURSE_CATALOG.findIndex(c => c.id === completionModal.course.id) < COURSE_CATALOG.length - 1
                                    ? '🔓 Next course unlocked!'
                                    : '🏆 You completed the entire Academy!'}
                            </p>
                            <button type="button" className={styles.completionBtn} onClick={() => setCompletionModal(null)}>
                                Continue
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
