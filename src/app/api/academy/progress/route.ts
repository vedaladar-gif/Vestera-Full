import { NextResponse } from 'next/server';
import { requireAcademyUser } from '@/lib/academy/auth';
import { getAcademyState, lessonLockState, nextRecommendedLesson } from '@/lib/academy/store';
import { LESSON_CATALOG } from '@/lib/academy/catalog';
import { ACADEMY_RANKS } from '@/lib/academy/ranks';

export async function GET() {
    const userId = await requireAcademyUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const state = await getAcademyState(userId);
        const catalog = LESSON_CATALOG.map(item => ({
            id: item.id,
            title: item.title,
            rankId: item.rankId,
            difficulty: item.difficulty,
            minutes: item.minutes,
            xp: item.xp,
            topics: item.topics,
            practice: item.practice || null,
            status: lessonLockState(state, item.id),
        }));
        return NextResponse.json({
            state,
            catalog,
            ranks: ACADEMY_RANKS,
            nextLessonId: nextRecommendedLesson(state),
        });
    } catch (err) {
        console.error('academy progress', err);
        return NextResponse.json({ error: 'Could not load Academy progress.' }, { status: 500 });
    }
}
