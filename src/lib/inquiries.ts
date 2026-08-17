import { getDb } from './db';
import { supabase } from './supabaseClient';
import { getSupabaseServiceRole } from './supabaseServiceRole';
import { shouldUseLocalAuth } from './authMode';

export type InquiryType = 'partnership' | 'chapter';

export interface Inquiry {
    id: string;
    type: InquiryType;
    fullName: string;
    organization: string | null;
    email: string;
    message: string | null;
    createdAt: string;
}

export interface NewInquiry {
    type: InquiryType;
    fullName: string;
    organization?: string | null;
    email: string;
    message?: string | null;
}

function db() {
    return getSupabaseServiceRole() ?? supabase;
}

/**
 * True when Supabase can't fulfill the request because of setup/config issues
 * (missing table, or a row-level-security policy blocking the anon key) rather
 * than a real data problem. In these cases we fall back to local SQLite so the
 * public-facing forms never fail for the visitor.
 */
function isRecoverableSupabaseError(error: unknown): boolean {
    const err = error as { code?: string; message?: string } | null;
    if (!err) return false;
    if (['PGRST205', '42P01', '42501', 'PGRST301'].includes(err.code || '')) return true;
    return typeof err.message === 'string' && /could not find the table|row-level security/i.test(err.message);
}

function localCreateInquiry(input: NewInquiry, createdAt: string): void {
    getDb().prepare(
        'INSERT INTO inquiries (type, full_name, organization, email, message, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(input.type, input.fullName, input.organization || null, input.email, input.message || null, createdAt);
}

function localListInquiries(): Inquiry[] {
    const rows = getDb().prepare(
        'SELECT id, type, full_name, organization, email, message, created_at FROM inquiries ORDER BY id DESC',
    ).all() as LocalInquiryRow[];
    return rows.map(rowToInquiry);
}

type LocalInquiryRow = {
    id: number;
    type: string;
    full_name: string;
    organization: string | null;
    email: string;
    message: string | null;
    created_at: string;
};

function rowToInquiry(row: LocalInquiryRow): Inquiry {
    return {
        id: String(row.id),
        type: row.type as InquiryType,
        fullName: row.full_name,
        organization: row.organization,
        email: row.email,
        message: row.message,
        createdAt: row.created_at,
    };
}

export async function createInquiry(input: NewInquiry): Promise<void> {
    const createdAt = new Date().toISOString();

    if (shouldUseLocalAuth()) {
        localCreateInquiry(input, createdAt);
        return;
    }

    const { error } = await db().from('inquiries').insert({
        type: input.type,
        full_name: input.fullName,
        organization: input.organization || null,
        email: input.email,
        message: input.message || null,
        created_at: createdAt,
    });

    if (error) {
        if (isRecoverableSupabaseError(error)) {
            console.warn(
                `inquiries: Supabase insert failed (${error.code}: ${error.message}) — saving to local SQLite ` +
                'instead. Check that the "inquiries" table exists and has an insert policy for anon/authenticated, ' +
                'or set SUPABASE_SERVICE_ROLE_KEY to bypass RLS entirely.',
            );
            localCreateInquiry(input, createdAt);
            return;
        }
        throw error;
    }
}

/** Best-effort fetch from Supabase — returns [] instead of throwing so local results still show. */
async function tryListSupabaseInquiries(): Promise<Inquiry[]> {
    const { data, error } = await db()
        .from('inquiries')
        .select('id, type, full_name, organization, email, message, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        if (isRecoverableSupabaseError(error)) return [];
        throw error;
    }

    return (data || []).map((row: {
        id: string | number;
        type: string;
        full_name: string;
        organization: string | null;
        email: string;
        message: string | null;
        created_at: string;
    }) => ({
        id: String(row.id),
        type: row.type as InquiryType,
        fullName: row.full_name,
        organization: row.organization,
        email: row.email,
        message: row.message,
        createdAt: row.created_at,
    }));
}

export async function listInquiries(): Promise<Inquiry[]> {
    if (shouldUseLocalAuth()) {
        return localListInquiries();
    }

    // Merge both sources: submissions may have landed in Supabase (when it's
    // configured correctly) or fallen back to local SQLite (when it wasn't),
    // so the admin view should never silently miss one or the other.
    const [remote, local] = await Promise.all([
        tryListSupabaseInquiries(),
        Promise.resolve().then(localListInquiries),
    ]);

    return [...remote, ...local].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}
