import { isLocalUser } from '@/lib/localUserId';

/** Local SQLite auth is opt-in only (dev / offline). Supabase is the default. */
export function shouldUseLocalAuth(): boolean {
    const flag = process.env.USE_LOCAL_AUTH?.trim().toLowerCase();
    return flag === 'true' || flag === '1';
}

/** Route data reads/writes for legacy local: sessions. */
export function sessionUsesLocalStore(userId: string | undefined | null): boolean {
    return isLocalUser(userId);
}
