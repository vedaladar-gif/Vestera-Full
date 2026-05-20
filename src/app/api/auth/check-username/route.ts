import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { validateUsername } from '@/utils/usernameValidation';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username')?.trim();
    const excludeId = searchParams.get('excludeId'); // current user's id when changing their own name

    if (!username) {
        return NextResponse.json({ available: false, error: 'No username provided' });
    }

    // Full validation: format + content moderation
    const check = validateUsername(username);
    if (!check.valid) {
        return NextResponse.json({
            available: false,
            error: check.error,
            restricted: check.reason === 'content' || check.reason === 'protected',
        });
    }

    // Case-insensitive uniqueness check using the lower index
    let query = supabase
        .from('profiles')
        .select('id')
        .ilike('username', username);

    if (excludeId) {
        query = query.neq('id', excludeId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
        console.error('check-username error:', error);
        return NextResponse.json({ available: false, error: 'Server error' }, { status: 500 });
    }

    return NextResponse.json({ available: !data });
}
