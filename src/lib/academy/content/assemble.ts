import type { AcademyLesson, LessonSection, QuizQuestion, QuizQuestionType } from '../types';
import { getCatalogItem } from '../catalog';
import { normalizeChoiceIndex } from '../scoring';

export interface LessonSpec {
    id: number;
    intro: string;
    why: string;
    sections: { h: string; p: string; callout?: string }[];
    real: string;
    try: { prompt: string; choices: string[]; answer: number; explanation: string };
    takeaways: string[];
    quiz: {
        type?: QuizQuestionType;
        prompt: string;
        options: string[];
        answer: number;
        ok: string;
        bad: string;
        topic: string;
        chart?: QuizQuestion['chart'];
    }[];
}

export function assembleLesson(spec: LessonSpec): AcademyLesson {
    const cat = getCatalogItem(spec.id);
    if (!cat) throw new Error(`Unknown lesson ${spec.id}`);
    if (spec.quiz.length !== 10) {
        throw new Error(`Lesson ${spec.id} must have exactly 10 quiz questions`);
    }
    if (spec.sections.length < 3) {
        throw new Error(`Lesson ${spec.id} needs at least 3 teaching sections`);
    }
    const tryAnswer = normalizeChoiceIndex(spec.try.answer);
    if (tryAnswer < 0 || tryAnswer >= spec.try.choices.length) {
        throw new Error(`Lesson ${spec.id} Try It has an invalid answer index`);
    }

    const sections: LessonSection[] = spec.sections.map(s => ({
        heading: s.h,
        body: s.p,
        callout: s.callout,
    }));

    const quiz: QuizQuestion[] = spec.quiz.map((q, i) => {
        const answer = normalizeChoiceIndex(q.answer);
        if (!Array.isArray(q.options) || q.options.length < 2) {
            throw new Error(`Lesson ${spec.id} question ${i + 1} needs at least 2 options`);
        }
        if (answer < 0 || answer >= q.options.length) {
            throw new Error(`Lesson ${spec.id} question ${i + 1} has an invalid answer index`);
        }
        return {
            id: `l${spec.id}-q${i + 1}`,
            type: q.type || 'multiple_choice',
            prompt: q.prompt,
            options: q.options,
            answer,
            explanationCorrect: q.ok,
            explanationIncorrect: q.bad,
            topic: q.topic,
            chart: q.chart,
        };
    });

    return {
        ...cat,
        intro: spec.intro,
        whyItMatters: spec.why,
        sections,
        realWorld: spec.real,
        tryIt: {
            prompt: spec.try.prompt,
            choices: spec.try.choices,
            answer: tryAnswer,
            explanation: spec.try.explanation,
        },
        takeaways: spec.takeaways,
        quiz,
    };
}

export function publicQuiz(lesson: AcademyLesson) {
    return lesson.quiz.map(({ answer, explanationCorrect, explanationIncorrect, ...rest }) => rest);
}
