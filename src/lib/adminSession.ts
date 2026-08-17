import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface AdminSessionData {
    isAdmin?: boolean;
}

const adminSessionOptions = {
    password: process.env.SECRET_KEY || 'dev-secret-key-change-in-production-at-least-32-chars',
    cookieName: 'vestera_admin_session',
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax' as const,
        maxAge: 60 * 60 * 12, // 12 hours
    },
};

export async function getAdminSession(): Promise<IronSession<AdminSessionData>> {
    const cookieStore = await cookies();
    return getIronSession<AdminSessionData>(cookieStore, adminSessionOptions);
}
