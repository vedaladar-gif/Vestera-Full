import { NextResponse } from 'next/server';
import { requireAcademyUser } from '@/lib/academy/auth';
import { getAcademyState, lessonLockState } from '@/lib/academy/store';
import { searchCatalog } from '@/lib/academy/catalog';

export async function GET(req: Request) {
    const userId = await requireAcademyUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';
    const state = await getAcademyState(userId);
    const results = searchCatalog(q).map(item => ({
        id: item.id,
        title: item.title,
        rankId: item.rankId,
        minutes: item.minutes,
        xp: item.xp,
        status: lessonLockState(state, item.id),
    }));
    return NextResponse.json({ results });
}
