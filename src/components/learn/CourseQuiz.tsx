'use client';

import { useState } from 'react';
import type { FinalQuizQuestion } from '@/lib/courseContent';
import { QUIZ_PASS_PCT } from '@/hooks/useAcademyProgress';
import styles from './CourseQuiz.module.css';

interface CourseQuizProps {
    courseTitle: string;
    questions: FinalQuizQuestion[];
    onComplete: (scorePct: number, passed: boolean) => void;
    onBack: () => void;
}

export default function CourseQuiz({ courseTitle, questions, onComplete, onBack }: CourseQuizProps) {
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [revealed, setRevealed] = useState<Record<number, boolean>>({});
    const [finished, setFinished] = useState(false);

    const q = questions[current];
    const selected = answers[current];
    const isRevealed = revealed[current];
    const isCorrect = selected === q?.answer;

    const handleSelect = (idx: number) => {
        if (isRevealed || finished) return;
        setAnswers(prev => ({ ...prev, [current]: idx }));
        setRevealed(prev => ({ ...prev, [current]: true }));
    };

    const handleNext = () => {
        if (current < questions.length - 1) {
            setCurrent(c => c + 1);
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = () => {
        let correct = 0;
        questions.forEach((question, i) => {
            if (answers[i] === question.answer) correct++;
        });
        const scorePct = Math.round((correct / questions.length) * 100);
        const passed = scorePct >= QUIZ_PASS_PCT;
        setFinished(true);
        onComplete(scorePct, passed);
    };

    const answeredCount = Object.keys(answers).length;
    const allAnswered = answeredCount === questions.length;

    if (finished) {
        const correct = questions.filter((question, i) => answers[i] === question.answer).length;
        const scorePct = Math.round((correct / questions.length) * 100);
        const passed = scorePct >= QUIZ_PASS_PCT;

        return (
            <div className={styles.resultWrap}>
                <div className={`${styles.resultCard} ${passed ? styles.resultPass : styles.resultFail}`}>
                    <div className={styles.resultEmoji}>{passed ? '🎉' : '📚'}</div>
                    <h2 className={styles.resultTitle}>
                        {passed ? 'Course Complete!' : 'Keep Studying'}
                    </h2>
                    <p className={styles.resultScore}>
                        You scored <strong>{scorePct}%</strong> ({correct}/{questions.length} correct)
                    </p>
                    <p className={styles.resultSub}>
                        {passed
                            ? `Great work! You passed the ${courseTitle} final quiz.`
                            : `You need ${QUIZ_PASS_PCT}% to pass. Review the lessons and try again.`}
                    </p>
                    {!passed && (
                        <button type="button" className={styles.retryBtn} onClick={() => {
                            setCurrent(0);
                            setAnswers({});
                            setRevealed({});
                            setFinished(false);
                        }}>
                            Retry Quiz
                        </button>
                    )}
                    <button type="button" className={styles.backBtn} onClick={onBack}>
                        Back to Course
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.quizWrap}>
            <div className={styles.quizHeader}>
                <button type="button" className={styles.backLink} onClick={onBack}>← Back</button>
                <div className={styles.quizMeta}>
                    <span className={styles.quizLabel}>Final Quiz · {courseTitle}</span>
                    <span className={styles.quizProgress}>Question {current + 1} of {questions.length}</span>
                </div>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${((current + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            <div className={styles.questionCard}>
                <span className={styles.questionType}>
                    {q.type === 'true_false' ? 'True / False' : q.type === 'scenario' ? 'Scenario' : 'Multiple Choice'}
                </span>
                <h3 className={styles.questionText}>{q.question}</h3>

                <div className={styles.options}>
                    {q.options.map((opt, idx) => {
                        let optClass = styles.option;
                        if (isRevealed) {
                            if (idx === q.answer) optClass += ` ${styles.optionCorrect}`;
                            else if (idx === selected) optClass += ` ${styles.optionWrong}`;
                        } else if (selected === idx) {
                            optClass += ` ${styles.optionSelected}`;
                        }
                        return (
                            <button
                                key={idx}
                                type="button"
                                className={optClass}
                                onClick={() => handleSelect(idx)}
                                disabled={isRevealed}
                            >
                                {opt}
                            </button>
                        );
                    })}
                </div>

                {isRevealed && (
                    <div className={`${styles.feedback} ${isCorrect ? styles.feedbackCorrect : styles.feedbackWrong}`}>
                        <strong>{isCorrect ? '✓ Correct!' : '✗ Not quite'}</strong>
                        <p>{q.explanation}</p>
                    </div>
                )}

                {isRevealed && (
                    <button type="button" className={styles.nextBtn} onClick={handleNext}>
                        {current < questions.length - 1 ? 'Next Question →' : 'See Results'}
                    </button>
                )}
            </div>

            <div className={styles.dots}>
                {questions.map((_, i) => (
                    <div
                        key={i}
                        className={`${styles.dot} ${answers[i] !== undefined ? (answers[i] === questions[i].answer ? styles.dotCorrect : styles.dotWrong) : ''} ${i === current ? styles.dotActive : ''}`}
                    />
                ))}
            </div>

            {allAnswered && !isRevealed && (
                <button type="button" className={styles.finishEarly} onClick={finishQuiz}>
                    Finish Quiz
                </button>
            )}
        </div>
    );
}
