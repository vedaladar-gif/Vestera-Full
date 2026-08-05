import { supabase } from './supabaseClient';
import {
    isDemo,
    getDemoUser,
    getDemoCash,
    setDemoCash,
    getDemoTrades,
    addDemoTrade,
    acceptDemoTerms,
} from './demoStore';
import { isLocalUser } from './localUserId';
import {
    getLocalUserById,
    getLocalUserByUsername,
    updateLocalUserCash,
    acceptLocalUserTerms,
    deleteLocalUserAccount,
    addLocalTrade,
    getLocalUserTrades,
    getLocalPortfolioRowsForUsers,
    getLocalUserCash,
    addLocalChatMessage,
    getLocalChatHistory,
    updateLocalUserProfile,
} from './localStore';

// ==========================================
// Types
// ==========================================

export interface User {
    id: string;
    username: string;
    cash: number;
    created_at: string | null;
    display_name: string | null;
    avatar_color: string;
    theme: string;
    terms_accepted_at?: string | null;
}

export interface Trade {
    id: number;
    user_id: string;
    stock: string;
    shares: number;
    price: number;
    action: string;
    created_at: string;
}

export interface Holding {
    stock: string;
    shares: number;
    current_price?: number;
    value?: number;
}

export interface ChatMessage {
    id: number;
    user_id: string;
    role: string;
    content: string;
    mode: string;
    route: string | null;
    created_at: string;
}

// ==========================================
// User / Profile Functions
// ==========================================

export async function getUserById(userId: string): Promise<User | null> {
    if (isDemo(userId)) return getDemoUser();
    if (isLocalUser(userId)) return getLocalUserById(userId);
    const { data, error } = await supabase
        .from('profiles')
        .select('id, username, cash, created_at, display_name, avatar_color, theme, terms_accepted_at')
        .eq('id', userId)
        .maybeSingle();
    if (error) {
        console.error('getUserById error:', error);
        return null;
    }
    return (data as User | null) ?? null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
    const local = getLocalUserByUsername(username);
    if (local) return local;
    const { data, error } = await supabase
        .from('profiles')
        .select('id, username, cash, created_at, display_name, avatar_color, theme, terms_accepted_at')
        .eq('username', username)
        .maybeSingle();
    if (error) {
        console.error('getUserByUsername error:', error);
        return null;
    }
    return (data as User | null) ?? null;
}

export async function createProfile(userId: string, username: string, startingCash: number): Promise<User | null> {
    const { data, error } = await supabase
        .from('profiles')
        .insert({
            id: userId,
            username,
            cash: startingCash,
        })
        .select('id, username, cash, created_at, display_name, avatar_color, theme, terms_accepted_at')
        .maybeSingle();

    if (error) {
        console.error('createProfile error:', error);
        return null;
    }

    return data as User | null;
}

export async function updateUserProfile(
    userId: string,
    update: Partial<Pick<User, 'username' | 'display_name' | 'avatar_color' | 'theme' | 'terms_accepted_at'>>,
): Promise<boolean> {
    if (isLocalUser(userId)) return updateLocalUserProfile(userId, update);
    const { error } = await supabase.from('profiles').update(update).eq('id', userId);
    if (error) {
        console.error('updateUserProfile error:', error);
        return false;
    }
    return true;
}

export async function acceptUserTerms(userId: string): Promise<boolean> {
    if (isDemo(userId)) { acceptDemoTerms(); return true; }
    if (isLocalUser(userId)) { acceptLocalUserTerms(userId); return true; }
    const { error } = await supabase
        .from('profiles')
        .update({ terms_accepted_at: new Date().toISOString() })
        .eq('id', userId);
    if (error) {
        console.error('acceptUserTerms error:', error);
        return false;
    }
    return true;
}

export async function updateUserCash(userId: string, newCash: number): Promise<void> {
    if (isDemo(userId)) { setDemoCash(newCash); return; }
    if (isLocalUser(userId)) { updateLocalUserCash(userId, newCash); return; }
    const { error } = await supabase
        .from('profiles')
        .update({ cash: newCash })
        .eq('id', userId);
    if (error) {
        console.error('updateUserCash error:', error);
    }
}

export async function deleteUserAccount(userId: string): Promise<boolean> {
    if (isLocalUser(userId)) return deleteLocalUserAccount(userId);
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
        console.error('deleteUserAccount error:', error);
        return false;
    }
    return true;
}

// ==========================================
// Trade / Portfolio Functions
// ==========================================

export async function addTrade(userId: string, stock: string, shares: number, price: number, action: string): Promise<boolean> {
    if (isDemo(userId)) { addDemoTrade(stock, shares, price, action); return true; }
    if (isLocalUser(userId)) return addLocalTrade(userId, stock, shares, price, action);
    const { error } = await supabase.from('portfolio').insert({
        user_id: userId,
        stock,
        shares,
        price,
        action,
    });
    if (error) {
        console.error('addTrade error:', error);
        return false;
    }
    return true;
}

export type PortfolioRow = {
    user_id: string;
    stock: string;
    shares: number;
    price: number;
    action: string;
    created_at: string;
};

export async function getPortfolioRowsForUsers(userIds: string[]): Promise<PortfolioRow[]> {
    if (userIds.length === 0) return [];
    const localIds = userIds.filter(isLocalUser);
    const remoteIds = userIds.filter(id => !isLocalUser(id));
    const out: PortfolioRow[] = [];

    if (localIds.length > 0) {
        out.push(...getLocalPortfolioRowsForUsers(localIds));
    }

    if (remoteIds.length === 0) return out;

    const CHUNK = 120;
    for (let i = 0; i < remoteIds.length; i += CHUNK) {
        const chunk = remoteIds.slice(i, i + CHUNK);
        const { data, error } = await supabase
            .from('portfolio')
            .select('user_id, stock, shares, price, action, created_at')
            .in('user_id', chunk);
        if (error) {
            console.error('getPortfolioRowsForUsers error:', error);
            continue;
        }
        for (const row of data || []) {
            out.push(row as PortfolioRow);
        }
    }
    return out;
}

export async function getUserTrades(userId: string): Promise<Trade[]> {
    if (isDemo(userId)) return getDemoTrades(false);
    if (isLocalUser(userId)) return getLocalUserTrades(userId, false);
    const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) {
        console.error('getUserTrades error:', error);
        return [];
    }
    return (data as Trade[]) ?? [];
}

export async function getUserTradesAscending(userId: string): Promise<Trade[]> {
    if (isDemo(userId)) return getDemoTrades(true);
    if (isLocalUser(userId)) return getLocalUserTrades(userId, true);
    const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
    if (error) {
        console.error('getUserTradesAscending error:', error);
        return [];
    }
    return (data as Trade[]) ?? [];
}

export async function getHoldings(userId: string): Promise<Holding[]> {
    const rows: { stock: string; shares: number; action: string }[] = isDemo(userId)
        ? getDemoTrades(false).map(t => ({ stock: t.stock, shares: t.shares, action: t.action }))
        : isLocalUser(userId)
            ? getLocalUserTrades(userId, true).map(t => ({ stock: t.stock, shares: t.shares, action: t.action }))
            : (await (async () => {
                const { data, error } = await supabase
                    .from('portfolio')
                    .select('stock, shares, action')
                    .eq('user_id', userId);
                if (error) {
                    console.error('getHoldings error:', error);
                    return [];
                }
                return data as { stock: string; shares: number; action: string }[];
            })());

    const map = new Map<string, number>();
    for (const row of rows) {
        const sign = row.action === 'BUY' ? 1 : -1;
        map.set(row.stock, (map.get(row.stock) ?? 0) + sign * row.shares);
    }

    return Array.from(map.entries())
        .filter(([, shares]) => shares > 0)
        .map(([stock, shares]) => ({ stock, shares }));
}

export async function getUserCash(userId: string): Promise<number> {
    if (isDemo(userId)) return getDemoCash();
    if (isLocalUser(userId)) return getLocalUserCash(userId);
    const { data, error } = await supabase
        .from('profiles')
        .select('cash')
        .eq('id', userId)
        .maybeSingle<{ cash: number }>();
    if (error || !data) return 0.0;
    return data.cash ?? 0.0;
}

// ==========================================
// Chat Functions
// ==========================================

export async function addChatMessage(userId: string, role: string, content: string, mode: string, route?: string): Promise<void> {
    if (isDemo(userId)) return;
    if (isLocalUser(userId)) { addLocalChatMessage(userId, role, content, mode, route); return; }
    const { error } = await supabase.from('chat_messages').insert({
        user_id: userId,
        role,
        content,
        mode,
        route: route || null,
    });
    if (error) {
        console.error('addChatMessage error:', error);
    }
}

export async function getChatHistory(
    userId: string,
    mode: string,
    limit = 20
): Promise<{ role: string; content: string; created_at: string }[]> {
    if (isDemo(userId)) return [];
    if (isLocalUser(userId)) return getLocalChatHistory(userId, mode, limit);
    const { data, error } = await supabase
        .from('chat_messages')
        .select('role, content, created_at')
        .eq('user_id', userId)
        .eq('mode', mode)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error || !data) {
        if (error) console.error('getChatHistory error:', error);
        return [];
    }

    return (data as { role: string; content: string; created_at: string }[]).reverse();
}
