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

// ==========================================
// Types
// ==========================================

export interface User {
    id: string; // Supabase auth user id (UUID)
    username: string;
    cash: number;
    created_at: string | null;
    display_name: string | null;
    avatar_color: string;
    theme: string;
    /** ISO timestamp when user accepted Terms & Conditions; null if not yet accepted */
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
    const { data, error } = await supabase
        .from('profiles')
        .select('id, username, cash, created_at')
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
        .select('id, username, cash, created_at')
        .maybeSingle();

    if (error) {
        console.error('createProfile error:', error);
        return null;
    }

    return data as User | null;
}

export async function acceptUserTerms(userId: string): Promise<boolean> {
    if (isDemo(userId)) { acceptDemoTerms(); return true; }
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
    const { error } = await supabase
        .from('profiles')
        .update({ cash: newCash })
        .eq('id', userId);
    if (error) {
        console.error('updateUserCash error:', error);
    }
}

export async function deleteUserAccount(userId: string): Promise<boolean> {
    // Deleting from auth.users will cascade to profiles (and related tables) via FK
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

/** All trade rows for many users (for leaderboard batch valuation). */
export async function getPortfolioRowsForUsers(userIds: string[]): Promise<PortfolioRow[]> {
    if (userIds.length === 0) return [];
    const CHUNK = 120;
    const out: PortfolioRow[] = [];
    for (let i = 0; i < userIds.length; i += CHUNK) {
        const chunk = userIds.slice(i, i + CHUNK);
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

/** Chronological order for average-cost and P/L math. */
export async function getUserTradesAscending(userId: string): Promise<Trade[]> {
    if (isDemo(userId)) return getDemoTrades(true);
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
    if (isDemo(userId)) return; // demo chat is not persisted
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
