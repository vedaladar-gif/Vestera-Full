import { supabase } from '@/lib/supabaseClient';
import { getSupabaseServiceRole } from '@/lib/supabaseServiceRole';
import { listFriends } from '@/lib/friends';
import { friendshipExists } from '@/lib/friends';
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

function db(): SupabaseClient {
    return getSupabaseServiceRole() ?? supabase;
}

/** Human-readable cause for failed portfolio-share DB writes (migration, RLS, service role). */
export function portfolioShareUserFacingError(err: PostgrestError | null): string {
    if (!err) return 'Could not save settings. Please try again.';
    const msg = (err.message || '').toLowerCase();
    const code = err.code || '';

    const missingPortfolio =
        msg.includes('portfolio_share_mode') ||
        msg.includes('portfolio_share_allowed') ||
        (msg.includes('column') && msg.includes('does not exist')) ||
        (msg.includes('relation') && msg.includes('does not exist')) ||
        code === '42703' ||
        code === '42P01' ||
        (code === 'PGRST204' && (msg.includes('portfolio') || msg.includes('column')));

    if (missingPortfolio) {
        return 'Portfolio sharing is not installed on the database yet. In Supabase, run the migration file `supabase/migrations/20260415120000_portfolio_share.sql`, then refresh and try again.';
    }
    if (
        msg.includes('row-level security') ||
        msg.includes('violates row-level security') ||
        code === '42501' ||
        msg.includes('permission denied')
    ) {
        return 'The database blocked updating your profile. Set `SUPABASE_SERVICE_ROLE_KEY` in your Next.js server environment (see `.env.local`), or relax Row Level Security on `profiles` for trusted server updates.';
    }
    if (code === '23514') {
        return 'Invalid share mode value for the database constraint.';
    }
    return 'Could not save settings. Please try again.';
}

export type PortfolioShareMode = 'all_friends' | 'no_one' | 'selected_friends';

export interface PortfolioShareSettings {
    mode: PortfolioShareMode;
    allowedFriendUserIds: string[];
}

function logErr(ctx: string, e: PostgrestError | null) {
    if (e) console.error(`[portfolioShare] ${ctx}`, e.code, e.message);
}

export async function getPortfolioShareSettings(ownerUserId: string): Promise<PortfolioShareSettings | null> {
    const { data: prof, error } = await db()
        .from('profiles')
        .select('portfolio_share_mode')
        .eq('id', ownerUserId)
        .maybeSingle();

    if (error) {
        logErr('getPortfolioShareSettings', error);
        return null;
    }
    if (!prof) {
        console.error('[portfolioShare] getPortfolioShareSettings: no profile row for user', ownerUserId);
        return null;
    }

    const raw = (prof as { portfolio_share_mode?: string }).portfolio_share_mode;
    const mode: PortfolioShareMode =
        raw === 'no_one' || raw === 'selected_friends' || raw === 'all_friends' ? raw : 'all_friends';

    const { data: rows, error: rErr } = await db()
        .from('portfolio_share_allowed')
        .select('allowed_friend_user_id')
        .eq('owner_user_id', ownerUserId);

    if (rErr) {
        logErr('getPortfolioShareSettings(allowed)', rErr);
        return { mode, allowedFriendUserIds: [] };
    }

    return {
        mode,
        allowedFriendUserIds: (rows || []).map((r: { allowed_friend_user_id: string }) => r.allowed_friend_user_id),
    };
}

export async function setPortfolioShareMode(
    ownerUserId: string,
    mode: PortfolioShareMode
): Promise<{ ok: true } | { ok: false; error: string }> {
    const { error } = await db().from('profiles').update({ portfolio_share_mode: mode }).eq('id', ownerUserId);
    if (error) {
        logErr('setPortfolioShareMode', error);
        return { ok: false, error: portfolioShareUserFacingError(error) };
    }
    if (mode !== 'selected_friends') {
        const { error: d } = await db().from('portfolio_share_allowed').delete().eq('owner_user_id', ownerUserId);
        if (d) {
            logErr('setPortfolioShareMode(clear allowed)', d);
            return { ok: false, error: portfolioShareUserFacingError(d) };
        }
    }
    return { ok: true };
}

/** Replaces allowed list; only friends of owner may appear. */
export async function replacePortfolioShareAllowedFriends(
    ownerUserId: string,
    candidateFriendIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
    const friends = await listFriends(ownerUserId);
    const friendSet = new Set(friends.map(f => f.id));

    const unique = [...new Set(candidateFriendIds.filter(id => id && id !== ownerUserId && friendSet.has(id)))];

    const { error: del } = await db().from('portfolio_share_allowed').delete().eq('owner_user_id', ownerUserId);
    if (del) {
        logErr('replacePortfolioShareAllowedFriends(delete)', del);
        return { ok: false, error: portfolioShareUserFacingError(del) };
    }

    if (unique.length === 0) {
        return { ok: true };
    }

    const rows = unique.map(allowed_friend_user_id => ({
        owner_user_id: ownerUserId,
        allowed_friend_user_id,
    }));

    const { error: ins } = await db().from('portfolio_share_allowed').insert(rows);
    if (ins) {
        logErr('replacePortfolioShareAllowedFriends(insert)', ins);
        return { ok: false, error: portfolioShareUserFacingError(ins) };
    }
    return { ok: true };
}

/**
 * True iff `viewerUserId` may see `ownerUserId`'s portfolio.
 * Requires an active friendship; then applies the owner's share mode.
 */
export async function canViewerSeePortfolio(ownerUserId: string, viewerUserId: string): Promise<boolean> {
    if (ownerUserId === viewerUserId) return true;
    if (!(await friendshipExists(ownerUserId, viewerUserId))) return false;

    const settings = await getPortfolioShareSettings(ownerUserId);
    if (!settings) return false;

    if (settings.mode === 'no_one') return false;
    if (settings.mode === 'all_friends') return true;
    return settings.allowedFriendUserIds.includes(viewerUserId);
}
