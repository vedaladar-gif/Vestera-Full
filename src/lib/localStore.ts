import { getDb } from './db';
import bcrypt from 'bcryptjs';
import type { User, Trade, PortfolioRow } from './models';
import { toLocalUserId, parseLocalUserId } from './localUserId';
import { normalizeStoredUsername } from './usernameAvailability';

type LocalUserRow = {
    id: number;
    username: string;
    password: string;
    cash: number;
    created_at: string | null;
    email: string | null;
    display_name: string | null;
    avatar_color: string | null;
    theme: string | null;
    terms_accepted_at: string | null;
};

function rowToUser(row: LocalUserRow): User {
    return {
        id: toLocalUserId(row.id),
        username: row.username,
        cash: row.cash,
        created_at: row.created_at,
        display_name: row.display_name,
        avatar_color: row.avatar_color || 'blue',
        theme: row.theme || 'dark',
        terms_accepted_at: row.terms_accepted_at,
    };
}

export function getLocalUserById(userId: string): User | null {
    const id = parseLocalUserId(userId);
    if (!Number.isFinite(id)) return null;
    const row = getDb().prepare(
        'SELECT id, username, password, cash, created_at, email, display_name, avatar_color, theme, terms_accepted_at FROM users WHERE id = ?',
    ).get(id) as LocalUserRow | undefined;
    return row ? rowToUser(row) : null;
}

export function getLocalUserByUsername(username: string): User | null {
    const clean = normalizeStoredUsername(username);
    const row = getDb().prepare(
        'SELECT id, username, password, cash, created_at, email, display_name, avatar_color, theme, terms_accepted_at FROM users WHERE lower(username) = ?',
    ).get(clean) as LocalUserRow | undefined;
    return row ? rowToUser(row) : null;
}

export function getLocalUserByEmail(email: string): User | null {
    const clean = email.trim().toLowerCase();
    const row = getDb().prepare(
        'SELECT id, username, password, cash, created_at, email, display_name, avatar_color, theme, terms_accepted_at FROM users WHERE lower(email) = ?',
    ).get(clean) as LocalUserRow | undefined;
    return row ? rowToUser(row) : null;
}

export function isLocalUsernameTaken(username: string, excludeUserId?: string): boolean {
    const clean = normalizeStoredUsername(username);
    if (excludeUserId) {
        const id = parseLocalUserId(excludeUserId);
        const row = getDb().prepare('SELECT id FROM users WHERE lower(username) = ? AND id != ?').get(clean, id);
        return !!row;
    }
    const row = getDb().prepare('SELECT id FROM users WHERE lower(username) = ?').get(clean);
    return !!row;
}

export function createLocalUser(
    username: string,
    password: string,
    startingCash: number,
    email?: string | null,
): User | null {
    const clean = normalizeStoredUsername(username);
    const hash = bcrypt.hashSync(password, 10);
    const db = getDb();
    try {
        const result = db.prepare(
            'INSERT INTO users (username, password, cash, created_at, email, avatar_color, theme) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ).run(clean, hash, startingCash, new Date().toISOString(), email?.trim().toLowerCase() || null, 'blue', 'dark');
        return getLocalUserById(toLocalUserId(Number(result.lastInsertRowid)));
    } catch {
        return null;
    }
}

export function checkLocalPassword(identifier: string, password: string): User | null {
    const trimmed = identifier.trim();
    let row = getDb().prepare(
        'SELECT id, username, password, cash, created_at, email, display_name, avatar_color, theme, terms_accepted_at FROM users WHERE lower(username) = ?',
    ).get(normalizeStoredUsername(trimmed)) as LocalUserRow | undefined;

    if (!row && trimmed.includes('@')) {
        row = getDb().prepare(
            'SELECT id, username, password, cash, created_at, email, display_name, avatar_color, theme, terms_accepted_at FROM users WHERE lower(email) = ?',
        ).get(trimmed.toLowerCase()) as LocalUserRow | undefined;
    }

    if (!row || !bcrypt.compareSync(password, row.password)) return null;
    return rowToUser(row);
}

export function updateLocalUserProfile(
    userId: string,
    update: Partial<Pick<User, 'username' | 'display_name' | 'avatar_color' | 'theme' | 'terms_accepted_at'>>,
): boolean {
    const id = parseLocalUserId(userId);
    const fields: string[] = [];
    const values: unknown[] = [];

    if (update.username !== undefined) {
        fields.push('username = ?');
        values.push(normalizeStoredUsername(update.username));
    }
    if (update.display_name !== undefined) {
        fields.push('display_name = ?');
        values.push(update.display_name);
    }
    if (update.avatar_color !== undefined) {
        fields.push('avatar_color = ?');
        values.push(update.avatar_color);
    }
    if (update.theme !== undefined) {
        fields.push('theme = ?');
        values.push(update.theme);
    }
    if (update.terms_accepted_at !== undefined) {
        fields.push('terms_accepted_at = ?');
        values.push(update.terms_accepted_at);
    }

    if (fields.length === 0) return true;
    values.push(id);
    getDb().prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return true;
}

export function updateLocalUserCash(userId: string, cash: number): void {
    getDb().prepare('UPDATE users SET cash = ? WHERE id = ?').run(cash, parseLocalUserId(userId));
}

export function acceptLocalUserTerms(userId: string): void {
    getDb().prepare('UPDATE users SET terms_accepted_at = ? WHERE id = ?').run(new Date().toISOString(), parseLocalUserId(userId));
}

export function deleteLocalUserAccount(userId: string): boolean {
    const id = parseLocalUserId(userId);
    const db = getDb();
    try {
        const tx = db.transaction(() => {
            db.prepare('DELETE FROM chat_messages WHERE user_id = ?').run(id);
            db.prepare('DELETE FROM portfolio WHERE user_id = ?').run(id);
            db.prepare('DELETE FROM users WHERE id = ?').run(id);
        });
        tx();
        return true;
    } catch (e) {
        console.error('deleteLocalUserAccount error:', e);
        return false;
    }
}

export function addLocalTrade(userId: string, stock: string, shares: number, price: number, action: string): boolean {
    try {
        getDb().prepare(
            'INSERT INTO portfolio (user_id, stock, shares, price, action, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        ).run(parseLocalUserId(userId), stock, shares, price, action, new Date().toISOString());
        return true;
    } catch (e) {
        console.error('addLocalTrade error:', e);
        return false;
    }
}

export function getLocalUserTrades(userId: string, ascending = false): Trade[] {
    const id = parseLocalUserId(userId);
    const rows = getDb().prepare('SELECT * FROM portfolio WHERE user_id = ? ORDER BY created_at ASC').all(id) as Trade[];
    const mapped = rows.map(r => ({
        ...r,
        user_id: toLocalUserId(r.user_id as unknown as number),
    }));
    return ascending ? mapped : [...mapped].reverse();
}

export function getLocalPortfolioRowsForUsers(userIds: string[]): PortfolioRow[] {
    if (userIds.length === 0) return [];
    const ids = userIds.map(parseLocalUserId);
    const placeholders = ids.map(() => '?').join(',');
    const rows = getDb().prepare(
        `SELECT user_id, stock, shares, price, action, created_at FROM portfolio WHERE user_id IN (${placeholders}) ORDER BY created_at ASC`,
    ).all(...ids) as PortfolioRow[];

    return rows.map(r => ({
        ...r,
        user_id: toLocalUserId(r.user_id as unknown as number),
    }));
}

export function getLocalUserCash(userId: string): number {
    const row = getDb().prepare('SELECT cash FROM users WHERE id = ?').get(parseLocalUserId(userId)) as { cash: number } | undefined;
    return row?.cash ?? 0;
}

export function listLocalUsersForLeaderboard(): User[] {
    const rows = getDb().prepare(
        'SELECT id, username, password, cash, created_at, email, display_name, avatar_color, theme, terms_accepted_at FROM users ORDER BY cash DESC',
    ).all() as LocalUserRow[];
    return rows.map(rowToUser);
}

export function addLocalChatMessage(userId: string, role: string, content: string, mode: string, route?: string): void {
    getDb().prepare(
        'INSERT INTO chat_messages (user_id, role, content, mode, route, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(parseLocalUserId(userId), role, content, mode, route || null, new Date().toISOString());
}

export function getLocalChatHistory(
    userId: string,
    mode: string,
    limit = 20,
): { role: string; content: string; created_at: string }[] {
    const rows = getDb().prepare(
        'SELECT role, content, created_at FROM chat_messages WHERE user_id = ? AND mode = ? ORDER BY created_at DESC LIMIT ?',
    ).all(parseLocalUserId(userId), mode, limit) as { role: string; content: string; created_at: string }[];
    return rows.reverse();
}
