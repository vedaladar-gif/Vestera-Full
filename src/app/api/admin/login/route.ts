import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/adminSession';

export async function POST(request: NextRequest) {
    const { password } = await request.json().catch(() => ({ password: '' }));
    // Falls back to a default code so admin mode works out of the box; override
    // with ADMIN_PASSWORD in production for a private code only you know.
    const adminPassword = process.env.ADMIN_PASSWORD?.trim() || '4406';

    if (typeof password !== 'string' || password.trim() !== adminPassword) {
        return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    const session = await getAdminSession();
    session.isAdmin = true;
    await session.save();

    return NextResponse.json({ ok: true });
}

export async function DELETE() {
    const session = await getAdminSession();
    session.destroy();
    return NextResponse.json({ ok: true });
}

export async function GET() {
    const session = await getAdminSession();
    return NextResponse.json({ isAdmin: Boolean(session.isAdmin) });
}
