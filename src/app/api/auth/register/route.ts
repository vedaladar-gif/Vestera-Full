import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabase, createAuthedClient } from '@/lib/supabaseClient';
import { shouldUseLocalAuth } from '@/lib/authMode';
import { createLocalUser } from '@/lib/localStore';
import { findProfileIdByUsername, normalizeStoredUsername } from '@/lib/usernameAvailability';
import { validateUsername } from '@/utils/usernameValidation';
import { STARTING_CASH } from '@/lib/stocks';

export async function POST(request: Request) {
    try {
        const { username, email, password } = await request.json();

        if (!password?.trim()) {
            return NextResponse.json({ error: 'Password is required' }, { status: 400 });
        }
        if (!username?.trim()) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        const cleanUsername = normalizeStoredUsername(username);

        const usernameCheck = validateUsername(username.trim());
        if (!usernameCheck.valid) {
            return NextResponse.json({ error: usernameCheck.error }, { status: 400 });
        }

        if (shouldUseLocalAuth()) {
            const existing = await findProfileIdByUsername(cleanUsername);
            if (existing) {
                return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
            }

            const user = createLocalUser(cleanUsername, password.trim(), STARTING_CASH, email?.trim());
            if (!user) {
                return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
            }

            const session = await getSession();
            session.userId = user.id;
            await session.save();

            return NextResponse.json({
                success: true,
                emailConfirmationRequired: false,
                signedIn: true,
            });
        }

        if (!email?.trim()) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const cleanEmail = email.trim().toLowerCase();

        const remoteExisting = await findProfileIdByUsername(cleanUsername);
        if (remoteExisting) {
            return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
        }

        const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password: password.trim(),
            options: { data: { username: cleanUsername } },
        });

        if (error || !data.user) {
            console.error('signUp error:', error);
            return NextResponse.json(
                { error: error?.message || 'Registration failed' },
                { status: 400 }
            );
        }

        const client = data.session?.access_token
            ? createAuthedClient(data.session.access_token)
            : supabase;

        const { error: profileError } = await client
            .from('profiles')
            .insert({ id: data.user.id, username: cleanUsername, cash: STARTING_CASH });

        if (profileError && profileError.code !== '23505') {
            console.error('createProfile error during register:', profileError);
        }

        if (data.session) {
            const session = await getSession();
            session.userId = data.user.id;
            await session.save();
        }

        const emailConfirmationRequired = !data.session;

        return NextResponse.json({
            success: true,
            emailConfirmationRequired,
            signedIn: !!data.session,
        });
    } catch (e) {
        console.error('Register error:', e);
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }
}
