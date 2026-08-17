import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/adminSession';
import { supabase } from '@/lib/supabaseClient';
import { shouldUseLocalAuth } from '@/lib/authMode';
import { listLocalUsersForLeaderboard } from '@/lib/localStore';
import { computeAccountValues, type ProfileLite } from '@/lib/accountValue';

export async function GET() {
    const session = await getAdminSession();
    if (!session.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        let profiles: ProfileLite[];

        if (shouldUseLocalAuth()) {
            profiles = listLocalUsersForLeaderboard().map(u => ({
                id: u.id,
                username: u.username,
                displayName: u.display_name,
                avatarColor: u.avatar_color || 'blue',
                cash: u.cash,
            }));
        } else {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, display_name, avatar_color, cash')
                .limit(2000);
            if (error) throw error;

            profiles = (data || []).map((p: {
                id: string;
                username: string | null;
                display_name: string | null;
                avatar_color: string | null;
                cash: number | null;
            }) => ({
                id: p.id,
                username: p.username || '(no username)',
                displayName: p.display_name,
                avatarColor: p.avatar_color || 'blue',
                cash: Number(p.cash) || 0,
            }));
        }

        const accounts = await computeAccountValues(profiles);
        return NextResponse.json({ accounts });
    } catch (err) {
        console.error('admin accounts error:', err);
        return NextResponse.json({ error: 'Could not load accounts.' }, { status: 503 });
    }
}
