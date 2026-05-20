import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabaseClient';
import { AVATAR_COLOR_KEYS, isEmailUsername } from '@/lib/avatarColors';
import { validateUsername } from '@/utils/usernameValidation';

export async function POST(request: Request) {
    const session = await getSession();
    if (!session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username, display_name, avatar_color, theme } = body;

    const update: Record<string, string | null> = {};

    if (username !== undefined) {
        const clean = username.trim().toLowerCase();

        // Full validation: format + content moderation
        const usernameCheck = validateUsername(username.trim());
        if (!usernameCheck.valid) {
            return NextResponse.json({ error: usernameCheck.error }, { status: 400 });
        }

        // Check uniqueness (excluding current user)
        const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .ilike('username', clean)
            .neq('id', session.userId)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
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

    const { error } = await supabase
        .from('profiles')
        .update(update)
        .eq('id', session.userId);

    if (error) {
        if (error.code === '23505') {
            return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
        }
        console.error('profile update error:', error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    // Return needsUsername status after update
    const newUsername = update.username ?? undefined;
    return NextResponse.json({ success: true, needsUsername: newUsername ? isEmailUsername(newUsername) : false });
}
