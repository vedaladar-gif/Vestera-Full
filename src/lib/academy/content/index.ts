import type { AcademyLesson } from '../types';
import type { LessonSpec } from './assemble';
import { assembleLesson } from './assemble';

const loaders: Record<number, () => Promise<{ SPECS: LessonSpec[] }>> = {
    1: () => import('./rank1'),
    2: () => import('./rank2'),
    3: () => import('./rank3'),
    4: () => import('./rank4'),
    5: () => import('./rank5'),
};

const cache = new Map<number, AcademyLesson[]>();

export async function lessonsForRankNumber(rank: number): Promise<AcademyLesson[]> {
    const hit = cache.get(rank);
    if (hit) return hit;
    const loader = loaders[rank];
    if (!loader) return [];
    const mod = await loader();
    const lessons = mod.SPECS.map(assembleLesson);
    cache.set(rank, lessons);
    return lessons;
}

export async function getLessonById(id: number): Promise<AcademyLesson | null> {
    if (id < 1 || id > 100) return null;
    const rank = Math.ceil(id / 20);
    const lessons = await lessonsForRankNumber(rank);
    return lessons.find(l => l.id === id) ?? null;
}

export async function getLessonsByIds(ids: number[]): Promise<AcademyLesson[]> {
    const unique = [...new Set(ids)];
    const ranks = new Set(unique.map(id => Math.ceil(id / 20)));
    await Promise.all([...ranks].map(r => lessonsForRankNumber(rankSafe(r))));
    const out: AcademyLesson[] = [];
    for (const id of unique) {
        const lesson = await getLessonById(id);
        if (lesson) out.push(lesson);
    }
    return out;
}

function rankSafe(n: number) {
    return Math.min(5, Math.max(1, n));
}
