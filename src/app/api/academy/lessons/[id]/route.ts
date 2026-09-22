import { NextResponse } from 'next/server';
import { getLessonById } from '@/lib/academy/content';
import { requireAcademyUser } from '@/lib/academy/auth';
import { getAcademyState, lessonLockState, startLesson, touchAcademyActivity } from '@/lib/academy/store';
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    const userId = await requireAcademyUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await ctx.params;
    const lessonId = Number(id);
    if (!Number.isInteger(lessonId)) return NextResponse.json({ error: 'Invalid lesson' }, { status: 400 });

    try {
        const state = await getAcademyState(userId);
        const status = lessonLockState(state, lessonId);
        if (!state.diagnosticCompleted) return NextResponse.json({ error: 'DIAGNOSTIC_REQUIRED' }, { status: 403 });
        if (status === 'locked') return NextResponse.json({ error: 'LOCKED' }, { status: 403 });

        const lesson = await getLessonById(lessonId);
        if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await touchAcademyActivity(userId, lessonId);
        const { quiz: _q, ...rest } = lesson;
        return NextResponse.json({
            lesson: rest,
            quizCount: lesson.quiz.length,
            status,
            alreadyCompleted: status === 'completed',
            bestScore: state.bestScores[lessonId] ?? null,
        });
    } catch (err) {
        // Always return valid JSON here — the frontend calls res.json() unconditionally, and an
        // empty/HTML 500 body throws a confusing "check your connection" error instead of a real one.
        console.error('get lesson', err);
        return NextResponse.json({ error: 'Could not open lesson.' }, { status: 500 });
    }
}

export async function POST(_req: Request, ctx: Ctx) {
    const userId = await requireAcademyUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await ctx.params;
    const lessonId = Number(id);
    try {
        await startLesson(userId, lessonId);
        return NextResponse.json({ ok: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'error';
        if (msg === 'DIAGNOSTIC_REQUIRED' || msg === 'LOCKED') {
            return NextResponse.json({ error: msg }, { status: 403 });
        }
        console.error('start lesson', err);
        return NextResponse.json({ error: 'Could not start lesson.' }, { status: 500 });
    }
}
