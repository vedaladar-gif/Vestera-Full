import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/adminSession';
import { getAdminUserAcademy } from '@/lib/academy/store';
import { getUserById } from '@/lib/models';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    const session = await getAdminSession();
    if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ error: 'Missing user' }, { status: 400 });
    try {
        const user = await getUserById(id);
        const academy = await getAdminUserAcademy(id);
        return NextResponse.json({
            user: user
                ? { id: user.id, username: user.username, displayName: user.display_name }
                : { id, username: 'unknown', displayName: null },
            academy,
        });
    } catch (err) {
        console.error('admin academy user', err);
        return NextResponse.json({ error: 'Could not load user Academy data.' }, { status: 500 });
    }
}
