import { NextResponse } from 'next/server';
import { DIAGNOSTIC_QUESTIONS } from '@/lib/academy/diagnosticQuestions';
import { requireAcademyUser, stripAnswers } from '@/lib/academy/auth';
import { getAcademyState, submitDiagnostic, touchAcademyActivity } from '@/lib/academy/store';
import { diagnosticAiSummary } from '@/lib/academy/ai';
import { assertQuestionBank } from '@/lib/academy/scoring';
import { DIAGNOSTIC_SIZE } from '@/lib/academy/types';

export async function GET() {
    const userId = await requireAcademyUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const state = await getAcademyState(userId);
    if (state.diagnosticCompleted) {
        return NextResponse.json({ completed: true, state, questions: [] });
    }
    try {
        assertQuestionBank(DIAGNOSTIC_QUESTIONS, DIAGNOSTIC_SIZE, 'Diagnostic');
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Diagnostic is not ready.' }, { status: 500 });
    }
    await touchAcademyActivity(userId);
    return NextResponse.json({
        completed: false,
        total: DIAGNOSTIC_QUESTIONS.length,
        questions: stripAnswers(DIAGNOSTIC_QUESTIONS),
    });
}

export async function POST(req: Request) {
    const userId = await requireAcademyUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const checkId = (body as { questionId?: string }).questionId;
    if (typeof checkId === 'string' && !('answers' in (body as object))) {
        const selectedIndex = Number((body as { selectedIndex?: number }).selectedIndex);
        try {
            const { checkDiagnosticQuestion } = await import('@/lib/academy/store');
            const result = await checkDiagnosticQuestion(checkId, selectedIndex);
            return NextResponse.json(result);
        } catch {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }
    }

    const answers = (body as { answers?: { questionId: string; selectedIndex: number }[] }).answers;
    if (!Array.isArray(answers)) {
        return NextResponse.json({ error: 'Send answers as an array.' }, { status: 400 });
    }

    try {
        const preliminary = await submitDiagnostic(userId, answers, null);
        if (preliminary.alreadyCompleted) {
            return NextResponse.json(preliminary);
        }
        const aiSummary = await diagnosticAiSummary({
            score: preliminary.score,
            total: preliminary.total,
            startingRank: preliminary.startingRank,
            topics: preliminary.topics,
        });
        return NextResponse.json({
            ...preliminary,
            aiSummary: aiSummary || preliminary.aiSummary,
        });
    } catch (err) {
        console.error('academy diagnostic submit', err);
        return NextResponse.json({ error: 'Could not save diagnostic.' }, { status: 500 });
    }
}
