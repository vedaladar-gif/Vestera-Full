import { NextResponse } from 'next/server';
import { requireAcademyUser } from '@/lib/academy/auth';
import { creditHeartbeat } from '@/lib/academy/store';

export async function POST(req: Request) {
    const userId = await requireAcademyUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const b = body as { lessonId?: number | null; elapsedMs?: number; hidden?: boolean };
    const elapsedMs = typeof b.elapsedMs === 'number' ? b.elapsedMs : 0;
    const hidden = Boolean(b.hidden);
    const lessonId = typeof b.lessonId === 'number' ? b.lessonId : null;
    try {
        const result = await creditHeartbeat(userId, lessonId, elapsedMs, hidden);
        return NextResponse.json(result);
    } catch (err) {
        console.error('academy session', err);
        return NextResponse.json({ error: 'Could not record time.' }, { status: 500 });
    }
}
