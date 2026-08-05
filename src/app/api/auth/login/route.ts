import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserById, updateUserProfile } from '@/lib/models';
import { STARTING_CASH } from '@/lib/stocks';
import { shouldUseLocalAuth } from '@/lib/authMode';
import { checkLocalPassword } from '@/lib/localStore';
import { supabase, createAuthedClient } from '@/lib/supabaseClient';
import { isEmailUsername } from '@/lib/avatarColors';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        if (!username?.trim() || !password) {
            return NextResponse.json({ error: 'Email/username and password required' }, { status: 400 });
        }

        if (shouldUseLocalAuth()) {
            const user = checkLocalPassword(username.trim(), password);
            if (!user) {
                return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
            }

            const session = await getSession();
            session.userId = user.id;
            await session.save();

            return NextResponse.json({
                success: true,
                user: { id: user.id, username: user.username },
                needsUsername: isEmailUsername(user.username),
            });
        }

        const email = username.trim().toLowerCase();

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error || !data.user) {
            console.error('signInWithPassword error:', error);
            const message =
                (error as { message?: string })?.message ||
                'Invalid email or password';
            return NextResponse.json({ error: message }, { status: 401 });
        }

        let user = await getUserById(data.user.id);

        if (!user) {
            const authedClient = createAuthedClient(data.session!.access_token);
            const metaUsername = (data.user.user_metadata?.username as string | undefined) || email;

            const { data: profileData, error: profileError } = await authedClient
                .from('profiles')
                .insert({ id: data.user.id, username: metaUsername, cash: STARTING_CASH })
                .select('id, username, cash, created_at, display_name, avatar_color, theme, terms_accepted_at')
                .maybeSingle();

            if (profileError) {
                console.error('Self-heal createProfile error:', profileError);
                return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
            }

            user = profileData;
        }

        if (!user) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 401 });
        }

        const session = await getSession();
        session.userId = user.id;
        await session.save();

        return NextResponse.json({
            success: true,
            user: { id: user.id, username: user.username },
            needsUsername: isEmailUsername(user.username),
        });
    } catch (e) {
        console.error('Login error:', e);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}
