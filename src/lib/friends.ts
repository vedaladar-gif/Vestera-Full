import { supabase } from '@/lib/supabaseClient';
import { getSupabaseServiceRole } from '@/lib/supabaseServiceRole';
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

export interface FriendProfile {
    id: string;
    username: string;
    display_name: string | null;
    avatar_color: string | null;
}

export interface FriendRequestRow {
    id: number;
    sender_id: string;
    recipient_id: string;
    status: FriendRequestStatus;
    created_at: string;
    updated_at: string;
}

/** Prefer service role so RLS cannot block server-side friend ops (no Supabase JWT on API routes). */
function friendsDb(): SupabaseClient {
    return getSupabaseServiceRole() ?? supabase;
}

/** Remove every friend_requests row between two users (any status). Full reset for re-adding later. */
async function deleteAllFriendRequestsBetweenPair(db: SupabaseClient, userA: string, userB: string): Promise<PostgrestError | null> {
    const { error: e1 } = await db.from('friend_requests').delete().eq('sender_id', userA).eq('recipient_id', userB);
    if (e1) return e1;
    const { error: e2 } = await db.from('friend_requests').delete().eq('sender_id', userB).eq('recipient_id', userA);
    return e2 ?? null;
}

/**
 * If there is no active friendship, delete stale `accepted` request rows between the pair.
 * Those rows otherwise make sendFriendRequest think the users are still "already friends."
 */
async function deleteStaleAcceptedFriendRequestsBetween(db: SupabaseClient, userA: string, userB: string): Promise<void> {
    if (await friendshipExists(userA, userB)) return;
    await db.from('friend_requests').delete().eq('sender_id', userA).eq('recipient_id', userB).eq('status', 'accepted');
    await db.from('friend_requests').delete().eq('sender_id', userB).eq('recipient_id', userA).eq('status', 'accepted');
}

function logFriendsError(context: string, err: PostgrestError | null) {
    if (!err) return;
    console.error(`[friends] ${context}`, {
        code: err.code,
        message: err.message,
        details: err.details,
        hint: err.hint,
    });
}

function userFacingDbError(err: PostgrestError | null): string {
    if (!err) return 'Could not complete this action. Please try again.';
    const msg = (err.message || '').toLowerCase();
    const code = err.code || '';

    if (
        code === '42P01' ||
        msg.includes('does not exist') ||
        msg.includes('schema cache') ||
        (code === 'PGRST205' && msg.includes('friend'))
    ) {
        return 'Friends tables are missing. Run the Supabase migrations for friend_requests and friendships.';
    }
    if (
        msg.includes('row-level security') ||
        msg.includes('violates row-level security') ||
        code === '42501' ||
        msg.includes('permission denied')
    ) {
        return 'Database blocked this action. Add SUPABASE_SERVICE_ROLE_KEY to your server environment, or run the migration that disables RLS on friend tables.';
    }
    if (code === '23505') {
        return 'This action conflicts with existing data.';
    }
    if (code === '23503') {
        return 'Invalid user reference — the account may have been removed.';
    }
    return 'Could not complete this action. Please try again.';
}

/** UUID v4-ish check (profiles use Supabase auth UUIDs). */
function looksLikeUuid(s: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s.trim());
}

/** UUID lexicographic order — matches DB check constraint. */
export function friendshipPair(userId1: string, userId2: string): { user_a_id: string; user_b_id: string } {
    const a = userId1 < userId2 ? userId1 : userId2;
    const b = userId1 < userId2 ? userId2 : userId1;
    return { user_a_id: a, user_b_id: b };
}

export function normalizeUsernameQuery(raw: string): string {
    return raw.trim().replace(/^@+/, '').toLowerCase();
}

async function getFriendIds(userId: string): Promise<Set<string>> {
    const db = friendsDb();
    const { data: asA, error: e1 } = await db
        .from('friendships')
        .select('user_b_id')
        .eq('user_a_id', userId);
    const { data: asB, error: e2 } = await db
        .from('friendships')
        .select('user_a_id')
        .eq('user_b_id', userId);
    if (e1) logFriendsError('getFriendIds(asA)', e1);
    if (e2) logFriendsError('getFriendIds(asB)', e2);
    const out = new Set<string>();
    for (const r of asA || []) out.add((r as { user_b_id: string }).user_b_id);
    for (const r of asB || []) out.add((r as { user_a_id: string }).user_a_id);
    return out;
}

export async function listFriends(userId: string): Promise<FriendProfile[]> {
    const ids = [...(await getFriendIds(userId))];
    if (ids.length === 0) return [];

    const { data, error } = await friendsDb()
        .from('profiles')
        .select('id, username, display_name, avatar_color')
        .in('id', ids);

    if (error || !data) {
        if (error) logFriendsError('listFriends', error);
        return [];
    }

    return (data as FriendProfile[]).sort((x, y) => x.username.localeCompare(y.username));
}

export async function listIncomingRequests(userId: string): Promise<(FriendRequestRow & { sender: FriendProfile })[]> {
    const { data: rows, error } = await friendsDb()
        .from('friend_requests')
        .select('id, sender_id, recipient_id, status, created_at, updated_at')
        .eq('recipient_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        logFriendsError('listIncomingRequests', error);
        return [];
    }
    if (!rows?.length) return [];

    const senderIds = [...new Set(rows.map(r => (r as FriendRequestRow).sender_id))];
    const { data: profs, error: pe } = await friendsDb()
        .from('profiles')
        .select('id, username, display_name, avatar_color')
        .in('id', senderIds);

    if (pe) logFriendsError('listIncomingRequests(profiles)', pe);

    const byId = new Map((profs as FriendProfile[] | null)?.map(p => [p.id, p]) || []);

    return (rows as FriendRequestRow[]).map(r => ({
        ...r,
        sender: byId.get(r.sender_id) || {
            id: r.sender_id,
            username: 'user',
            display_name: null,
            avatar_color: null,
        },
    }));
}

export async function listOutgoingPendingRecipients(userId: string): Promise<Set<string>> {
    const { data, error } = await friendsDb()
        .from('friend_requests')
        .select('recipient_id')
        .eq('sender_id', userId)
        .eq('status', 'pending');

    if (error) {
        logFriendsError('listOutgoingPendingRecipients', error);
        return new Set();
    }
    return new Set((data || []).map((r: { recipient_id: string }) => r.recipient_id));
}

export type UserRelation = SearchRelation | 'self';

export async function getUserRelation(
    viewerId: string,
    targetId: string
): Promise<{ relation: UserRelation; incomingRequestId?: number }> {
    if (viewerId === targetId) return { relation: 'self' };
    if (await friendshipExists(viewerId, targetId)) return { relation: 'friend' };

    const outgoing = await listOutgoingPendingRecipients(viewerId);
    if (outgoing.has(targetId)) return { relation: 'outgoing_pending' };

    const { data, error } = await friendsDb()
        .from('friend_requests')
        .select('id')
        .eq('sender_id', targetId)
        .eq('recipient_id', viewerId)
        .eq('status', 'pending')
        .maybeSingle();

    if (error) logFriendsError('getUserRelation(incoming)', error);
    if (data) {
        return { relation: 'incoming_pending', incomingRequestId: (data as { id: number }).id };
    }

    return { relation: 'none' };
}

export async function friendshipExists(userId1: string, userId2: string): Promise<boolean> {
    const { user_a_id, user_b_id } = friendshipPair(userId1, userId2);
    const { data, error } = await friendsDb()
        .from('friendships')
        .select('id')
        .eq('user_a_id', user_a_id)
        .eq('user_b_id', user_b_id)
        .maybeSingle();
    if (error) {
        logFriendsError('friendshipExists', error);
        return false;
    }
    return data != null;
}

export type SendRequestResult =
    | { ok: true; requestId: number; state: 'created' | 'reactivated' }
    | { ok: false; error: string; code: string };

export type SendFriendRequestInput = {
    /** Lookup recipient by username (normalized). */
    username?: string;
    /** Prefer this when known from search — avoids username mismatch. */
    recipientUserId?: string;
};

export async function sendFriendRequest(senderId: string, input: SendFriendRequestInput): Promise<SendRequestResult> {
    const db = friendsDb();
    let recipientId: string | null = null;

    if (input.recipientUserId?.trim()) {
        const rid = input.recipientUserId.trim();
        if (!looksLikeUuid(rid)) {
            return { ok: false, error: 'Invalid user id', code: 'INVALID' };
        }
        const { data: byId, error: idErr } = await db.from('profiles').select('id, username').eq('id', rid).maybeSingle();
        if (idErr) {
            logFriendsError('sendFriendRequest(profileById)', idErr);
            return { ok: false, error: userFacingDbError(idErr), code: 'DB' };
        }
        if (!byId) {
            return { ok: false, error: 'User not found', code: 'NOT_FOUND' };
        }
        recipientId = (byId as { id: string }).id;
    } else {
        const clean = normalizeUsernameQuery(input.username || '');
        if (!clean) {
            return { ok: false, error: 'Username or user id required', code: 'INVALID' };
        }
        const { data: recipient, error: re } = await db.from('profiles').select('id, username').eq('username', clean).maybeSingle();

        if (re) {
            logFriendsError('sendFriendRequest(profileByUsername)', re);
            return { ok: false, error: userFacingDbError(re), code: 'DB' };
        }
        if (!recipient) {
            return { ok: false, error: 'User not found', code: 'NOT_FOUND' };
        }
        recipientId = (recipient as { id: string }).id;
    }

    if (recipientId === senderId) {
        return { ok: false, error: 'You cannot add yourself', code: 'SELF' };
    }

    if (await friendshipExists(senderId, recipientId)) {
        return { ok: false, error: 'Already friends', code: 'ALREADY_FRIENDS' };
    }

    await deleteStaleAcceptedFriendRequestsBetween(db, senderId, recipientId);

    const { data: existing, error: exErr } = await db
        .from('friend_requests')
        .select('id, status')
        .eq('sender_id', senderId)
        .eq('recipient_id', recipientId)
        .maybeSingle();

    if (exErr) {
        logFriendsError('sendFriendRequest(existingRow)', exErr);
        return { ok: false, error: userFacingDbError(exErr), code: 'DB' };
    }

    if (existing) {
        const st = (existing as { status: FriendRequestStatus }).status;
        if (st === 'pending') {
            return { ok: false, error: 'Request already sent', code: 'DUPLICATE' };
        }
        if (st === 'accepted') {
            return { ok: false, error: 'Already friends', code: 'ALREADY_FRIENDS' };
        }
        const { error: upErr } = await db
            .from('friend_requests')
            .update({ status: 'pending', updated_at: new Date().toISOString() })
            .eq('id', (existing as { id: number }).id);

        if (upErr) {
            logFriendsError('sendFriendRequest(reactivate)', upErr);
            return { ok: false, error: userFacingDbError(upErr), code: 'DB' };
        }
        return { ok: true, requestId: (existing as { id: number }).id, state: 'reactivated' };
    }

    const { data: reverse } = await db
        .from('friend_requests')
        .select('id')
        .eq('sender_id', recipientId)
        .eq('recipient_id', senderId)
        .eq('status', 'pending')
        .maybeSingle();

    if (reverse) {
        return { ok: false, error: 'This user already sent you a request — accept it below', code: 'INCOMING_EXISTS' };
    }

    const { data: inserted, error: insErr } = await db
        .from('friend_requests')
        .insert({
            sender_id: senderId,
            recipient_id: recipientId,
            status: 'pending',
            updated_at: new Date().toISOString(),
        })
        .select('id')
        .maybeSingle();

    if (insErr) {
        logFriendsError('sendFriendRequest(insert)', insErr);
        if (insErr.code === '23505') {
            return { ok: false, error: 'Request already sent', code: 'DUPLICATE' };
        }
        return { ok: false, error: userFacingDbError(insErr), code: 'DB' };
    }
    if (!inserted) {
        return { ok: false, error: 'Could not send request', code: 'DB' };
    }

    return { ok: true, requestId: (inserted as { id: number }).id, state: 'created' };
}

export type AcceptResult = { ok: true } | { ok: false; error: string; code: string };

export async function acceptFriendRequest(requestId: number, recipientUserId: string): Promise<AcceptResult> {
    const db = friendsDb();
    const { data: row, error: fe } = await db
        .from('friend_requests')
        .select('id, sender_id, recipient_id, status')
        .eq('id', requestId)
        .maybeSingle();

    if (fe) {
        logFriendsError('acceptFriendRequest(fetch)', fe);
        return { ok: false, error: userFacingDbError(fe), code: 'DB' };
    }
    if (!row) {
        return { ok: false, error: 'Request not found', code: 'NOT_FOUND' };
    }

    const r = row as { id: number; sender_id: string; recipient_id: string; status: FriendRequestStatus };
    if (r.recipient_id !== recipientUserId) {
        return { ok: false, error: 'Not authorized', code: 'FORBIDDEN' };
    }
    if (r.status !== 'pending') {
        return { ok: false, error: 'Request is no longer pending', code: 'INVALID_STATE' };
    }

    const { user_a_id, user_b_id } = friendshipPair(r.sender_id, r.recipient_id);

    const { error: fErr } = await db.from('friendships').insert({
        user_a_id,
        user_b_id,
    });

    if (fErr && fErr.code !== '23505') {
        logFriendsError('acceptFriendRequest(friendship insert)', fErr);
        return { ok: false, error: userFacingDbError(fErr), code: 'DB' };
    }

    const now = new Date().toISOString();
    const { error: u1 } = await db.from('friend_requests').update({ status: 'accepted', updated_at: now }).eq('id', requestId);

    if (u1) {
        logFriendsError('acceptFriendRequest(update accepted)', u1);
        return { ok: false, error: userFacingDbError(u1), code: 'DB' };
    }

    const declineOther = {
        status: 'declined' as const,
        updated_at: now,
    };
    await db
        .from('friend_requests')
        .update(declineOther)
        .eq('status', 'pending')
        .eq('sender_id', r.sender_id)
        .eq('recipient_id', r.recipient_id)
        .neq('id', requestId);
    await db
        .from('friend_requests')
        .update(declineOther)
        .eq('status', 'pending')
        .eq('sender_id', r.recipient_id)
        .eq('recipient_id', r.sender_id);

    return { ok: true };
}

export async function declineFriendRequest(requestId: number, recipientUserId: string): Promise<AcceptResult> {
    const db = friendsDb();
    const { data: row, error: fe } = await db
        .from('friend_requests')
        .select('id, recipient_id, status')
        .eq('id', requestId)
        .maybeSingle();

    if (fe) {
        logFriendsError('declineFriendRequest(fetch)', fe);
        return { ok: false, error: userFacingDbError(fe), code: 'DB' };
    }
    if (!row) return { ok: false, error: 'Request not found', code: 'NOT_FOUND' };
    const r = row as { id: number; recipient_id: string; status: FriendRequestStatus };
    if (r.recipient_id !== recipientUserId) {
        return { ok: false, error: 'Not authorized', code: 'FORBIDDEN' };
    }
    if (r.status !== 'pending') {
        return { ok: false, error: 'Request is no longer pending', code: 'INVALID_STATE' };
    }

    const { error } = await db
        .from('friend_requests')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', requestId);

    if (error) {
        logFriendsError('declineFriendRequest(update)', error);
        return { ok: false, error: userFacingDbError(error), code: 'DB' };
    }
    return { ok: true };
}

export async function removeFriendship(userId: string, friendUserId: string): Promise<AcceptResult> {
    const db = friendsDb();
    const { user_a_id, user_b_id } = friendshipPair(userId, friendUserId);

    const { error: fsErr } = await db.from('friendships').delete().eq('user_a_id', user_a_id).eq('user_b_id', user_b_id);

    if (fsErr) {
        logFriendsError('removeFriendship(delete friendship)', fsErr);
        return { ok: false, error: userFacingDbError(fsErr), code: 'DB' };
    }

    const reqErr = await deleteAllFriendRequestsBetweenPair(db, userId, friendUserId);
    if (reqErr) {
        logFriendsError('removeFriendship(delete friend_requests)', reqErr);
        return { ok: false, error: userFacingDbError(reqErr), code: 'DB' };
    }

    await db.from('portfolio_share_allowed').delete().eq('owner_user_id', userId).eq('allowed_friend_user_id', friendUserId);
    await db.from('portfolio_share_allowed').delete().eq('owner_user_id', friendUserId).eq('allowed_friend_user_id', userId);

    return { ok: true };
}

/** Public profile fields by normalized username (no friendship check). */
export async function getProfileByUsername(username: string): Promise<FriendProfile | null> {
    const q = normalizeUsernameQuery(username);
    if (q.length < 1) return null;
    const db = friendsDb();
    const { data, error } = await db
        .from('profiles')
        .select('id, username, display_name, avatar_color')
        .eq('username', q)
        .maybeSingle();
    if (error) {
        logFriendsError('getProfileByUsername', error);
        return null;
    }
    return (data as FriendProfile | null) ?? null;
}

export type SearchRelation = 'none' | 'friend' | 'outgoing_pending' | 'incoming_pending';

export type UserSearchHit = FriendProfile & {
    relation: SearchRelation;
    incomingRequestId?: number;
};

export async function searchUsersByUsername(viewerId: string, query: string, limit = 15): Promise<UserSearchHit[]> {
    const q = normalizeUsernameQuery(query);
    if (q.length < 1) return [];

    const escaped = q.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    const db = friendsDb();

    const { data: profiles, error } = await db
        .from('profiles')
        .select('id, username, display_name, avatar_color')
        .ilike('username', `%${escaped}%`)
        .neq('id', viewerId)
        .limit(limit + 10);

    if (error || !profiles) {
        if (error) logFriendsError('searchUsersByUsername(profiles)', error);
        return [];
    }

    const friendIds = await getFriendIds(viewerId);
    const outgoing = await listOutgoingPendingRecipients(viewerId);
    const { data: incomingRows, error: inErr } = await db
        .from('friend_requests')
        .select('id, sender_id')
        .eq('recipient_id', viewerId)
        .eq('status', 'pending');

    if (inErr) logFriendsError('searchUsersByUsername(incoming)', inErr);

    const incomingReqBySender = new Map<string, number>();
    for (const row of incomingRows || []) {
        const x = row as { id: number; sender_id: string };
        incomingReqBySender.set(x.sender_id, x.id);
    }

    const out: UserSearchHit[] = [];
    for (const p of profiles as FriendProfile[]) {
        let relation: SearchRelation = 'none';
        let incomingRequestId: number | undefined;
        if (friendIds.has(p.id)) relation = 'friend';
        else if (outgoing.has(p.id)) relation = 'outgoing_pending';
        else if (incomingReqBySender.has(p.id)) {
            relation = 'incoming_pending';
            incomingRequestId = incomingReqBySender.get(p.id);
        }
        out.push({ ...p, relation, incomingRequestId });
        if (out.length >= limit) break;
    }

    return out;
}
