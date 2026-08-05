import { shouldUseLocalAuth } from '@/lib/authMode';
import { isLocalUser } from '@/lib/localUserId';
import { isLocalUsernameTaken } from '@/lib/localStore';
import { supabase } from '@/lib/supabaseClient';
import { getSupabaseServiceRole } from '@/lib/supabaseServiceRole';

function db() {
    return getSupabaseServiceRole() ?? supabase;
}

export function normalizeStoredUsername(username: string): string {
    return username.trim().toLowerCase();
}

export async function findProfileIdByUsername(
    username: string,
    excludeId?: string,
): Promise<{ id: string } | null> {
    const clean = normalizeStoredUsername(username);

    if (shouldUseLocalAuth()) {
        const taken = isLocalUsernameTaken(clean, excludeId);
        return taken ? { id: 'local:0' } : null;
    }

    let query = db().from('profiles').select('id').eq('username', clean);
    if (excludeId && !isLocalUser(excludeId)) {
        query = query.neq('id', excludeId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data;
}
