import { NextResponse } from 'next/server';
import { validateUsername } from '@/utils/usernameValidation';
import { findProfileIdByUsername } from '@/lib/usernameAvailability';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username')?.trim();
    const excludeId = searchParams.get('excludeId') ?? undefined;

    if (!username) {
        return NextResponse.json({ available: false, error: 'No username provided' });
    }

    const check = validateUsername(username);
    if (!check.valid) {
        return NextResponse.json({
            available: false,
            error: check.error,
            restricted: check.reason === 'content' || check.reason === 'protected',
        });
    }

    try {
        const existing = await findProfileIdByUsername(username, excludeId);
        return NextResponse.json({ available: !existing });
    } catch (error) {
        console.error('check-username error:', error);
        return NextResponse.json(
            { available: false, error: 'Could not verify username right now. Try again.', checkFailed: true },
            { status: 503 },
        );
    }
}
