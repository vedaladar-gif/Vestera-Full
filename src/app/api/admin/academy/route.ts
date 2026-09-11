import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/adminSession';
import { getAdminOverview } from '@/lib/academy/store';

export async function GET() {
    const session = await getAdminSession();
    if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
        const overview = await getAdminOverview();
        return NextResponse.json(overview);
    } catch (err) {
        console.error('admin academy overview', err);
        return NextResponse.json({ error: 'Could not load Academy analytics.' }, { status: 500 });
    }
}
