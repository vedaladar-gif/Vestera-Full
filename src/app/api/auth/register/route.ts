import { NextResponse } from 'next/server';
import { supabase, createAuthedClient } from '@/lib/supabaseClient';
import { validateUsername } from '@/utils/usernameValidation';

const STARTING_CASH = 100_000;

export async function POST(request: Request) {
    try {
        const { username, email, password } = await request.json();

        if (!email?.trim() || !password?.trim()) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }
        if (!username?.trim()) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanUsername = username.trim().toLowerCase();

        // Validate username (format + content moderation)
        const usernameCheck = validateUsername(username.trim());
        if (!usernameCheck.valid) {
            return NextResponse.json({ error: usernameCheck.error }, { status: 400 });
        }

        // Check username uniqueness before creating the auth user
        const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .ilike('username', cleanUsername)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
        }

        // Create the Supabase auth user — store username in metadata for self-heal on first login
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

        // Create profile. Use authed client if we have a session (email-confirm disabled).
        // If email-confirm is enabled we still attempt the insert; the login self-heal will
        // pick up the correct username from auth metadata if this fails.
        const client = data.session?.access_token
            ? createAuthedClient(data.session.access_token)
            : supabase;

        const { error: profileError } = await client
            .from('profiles')
            .insert({ id: data.user.id, username: cleanUsername, cash: STARTING_CASH });

        if (profileError && profileError.code !== '23505') {
            console.error('createProfile error during register:', profileError);
        }

        // No session until email is confirmed (when Supabase email confirmation is on)
        const emailConfirmationRequired = !data.session;

        return NextResponse.json({ success: true, emailConfirmationRequired });
    } catch (e) {
        console.error('Register error:', e);
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }
}
