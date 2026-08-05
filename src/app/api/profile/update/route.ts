import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { updateUserProfile } from '@/lib/models';
import { AVATAR_COLOR_KEYS, isEmailUsername } from '@/lib/avatarColors';
import { findProfileIdByUsername, normalizeStoredUsername } from '@/lib/usernameAvailability';
import { validateUsername } from '@/utils/usernameValidation';

export async function POST(request: Request) {
    const session = await getSession();
    if (!session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username, display_name, avatar_color, theme } = body;

    const update: Partial<{
        username: string;
        display_name: string | null;
        avatar_color: string;
        theme: string;
    }> = {};

    if (username !== undefined) {
        const clean = normalizeStoredUsername(username);

        const usernameCheck = validateUsername(username.trim());
        if (!usernameCheck.valid) {
            return NextResponse.json({ error: usernameCheck.error }, { status: 400 });
        }

        try {
            const existing = await findProfileIdByUsername(clean, session.userId);
            if (existing) {
                return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
            }
        } catch (lookupError) {
            console.error('profile update username lookup error:', lookupError);
            return NextResponse.json({ error: 'Could not verify username. Please try again.' }, { status: 503 });
        }
        update.username = clean;
    }

    if (display_name !== undefined) {
        update.display_name = display_name?.trim() || null;
    }

    if (avatar_color !== undefined) {
        if (!AVATAR_COLOR_KEYS.includes(avatar_color)) {
            return NextResponse.json({ error: 'Invalid avatar color.' }, { status: 400 });
        }
        update.avatar_color = avatar_color;
    }

    if (theme !== undefined) {
        if (!['dark', 'light', 'system'].includes(theme)) {
            return NextResponse.json({ error: 'Invalid theme.' }, { status: 400 });
        }
        update.theme = theme;
    }

    if (Object.keys(update).length === 0) {
        return NextResponse.json({ success: true });
    }

    const ok = await updateUserProfile(session.userId, update);
    if (!ok) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    const newUsername = update.username ?? undefined;
    return NextResponse.json({ success: true, needsUsername: newUsername ? isEmailUsername(newUsername) : false });
}
