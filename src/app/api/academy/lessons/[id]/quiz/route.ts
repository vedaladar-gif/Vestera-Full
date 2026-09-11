import { NextResponse } from 'next/server';
import { getLessonById } from '@/lib/academy/content';
import { requireAcademyUser } from '@/lib/academy/auth';
import { getAcademyState, lessonLockState, submitLessonQuiz, touchAcademyActivity } from '@/lib/academy/store';
import { publicQuiz } from '@/lib/academy/content/assemble';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    const userId = await requireAcademyUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const lessonId = Number((await ctx.params).id);
    const state = await getAcademyState(userId);
    if (!state.diagnosticCompleted) return NextResponse.json({ error: 'DIAGNOSTIC_REQUIRED' }, { status: 403 });
    if (lessonLockState(state, lessonId) === 'locked') return NextResponse.json({ error: 'LOCKED' }, { status: 403 });
    const lesson = await getLessonById(lessonId);
    if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await touchAcademyActivity(userId, lessonId);
    return NextResponse.json({ questions: publicQuiz(lesson) });
}

export async function POST(req: Request, ctx: Ctx) {
    const userId = await requireAcademyUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const lessonId = Number((await ctx.params).id);
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const singleId = (body as { questionId?: string }).questionId;
    if (typeof singleId === 'string' && !('answers' in (body as object))) {
        const selectedIndex = Number((body as { selectedIndex?: number }).selectedIndex);
        try {
            const { checkLessonQuestion } = await import('@/lib/academy/store');
            const result = await checkLessonQuestion(lessonId, singleId, selectedIndex);
            return NextResponse.json(result);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'error';
            return NextResponse.json({ error: msg }, { status: 404 });
        }
    }

    const answers = (body as { answers?: { questionId: string; selectedIndex: number }[] }).answers;
    if (!Array.isArray(answers)) {
        return NextResponse.json({ error: 'Send answers as an array.' }, { status: 400 });
    }
    try {
        const result = await submitLessonQuiz(userId, lessonId, answers);
        return NextResponse.json(result);
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'error';
        if (msg === 'DIAGNOSTIC_REQUIRED' || msg === 'LOCKED' || msg === 'NOT_FOUND') {
            return NextResponse.json({ error: msg }, { status: 403 });
        }
        console.error('submit quiz', err);
        return NextResponse.json({ error: 'Could not score quiz.' }, { status: 500 });
    }
}
