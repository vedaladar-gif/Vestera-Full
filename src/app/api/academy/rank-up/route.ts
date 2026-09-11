import { NextResponse } from 'next/server';
import { requireAcademyUser, stripAnswers } from '@/lib/academy/auth';
import { getAcademyState, submitRankUp, touchAcademyActivity } from '@/lib/academy/store';
import { getRankUpTest } from '@/lib/academy/rankUpTests';
import { rankById } from '@/lib/academy/ranks';
import { assertQuestionBank } from '@/lib/academy/scoring';
import { RANK_UP_SIZE } from '@/lib/academy/types';

export async function GET() {
    const userId = await requireAcademyUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const state = await getAcademyState(userId);
    if (!state.rankUpAvailable || !state.currentRank) {
        return NextResponse.json({ eligible: false, state });
    }
    const test = getRankUpTest(state.currentRank);
    if (!test) return NextResponse.json({ eligible: false, state });
    try {
        assertQuestionBank(test.questions, RANK_UP_SIZE, 'Rank-up test');
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Rank-up test is not ready.' }, { status: 500 });
    }
    await touchAcademyActivity(userId);
    return NextResponse.json({
        eligible: true,
        fromRank: test.fromRank,
        toRank: test.toRank,
        fromName: rankById(test.fromRank).name,
        toName: rankById(test.toRank).name,
        title: test.title,
        total: test.questions.length,
        questions: stripAnswers(test.questions),
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
    const singleId = (body as { questionId?: string }).questionId;
    if (typeof singleId === 'string' && !('answers' in (body as object))) {
        const selectedIndex = Number((body as { selectedIndex?: number }).selectedIndex);
        const fromRank = Number((body as { fromRank?: number }).fromRank) as 1 | 2 | 3 | 4;
        try {
            const { checkRankUpQuestion } = await import('@/lib/academy/store');
            const result = await checkRankUpQuestion(fromRank, singleId, selectedIndex);
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
        const result = await submitRankUp(userId, answers);
        return NextResponse.json(result);
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'error';
        if (msg === 'NOT_ELIGIBLE' || msg === 'TEST_MISSING') {
            return NextResponse.json({ error: msg }, { status: 403 });
        }
        console.error('rank-up submit', err);
        return NextResponse.json({ error: 'Could not score rank-up test.' }, { status: 500 });
    }
}
