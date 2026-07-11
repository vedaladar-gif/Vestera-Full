import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import type { SessionData } from './lib/session';

const protectedApiPaths = [
    '/api/trade',
    '/api/holdings',
    '/api/analyze-stock',
    '/api/delete-account',
    '/api/snapse',
    '/api/portfolio-share',
    '/api/friends/username',
    '/api/chat',
];

/**
 * App routes that require a signed-in user. Unauthenticated visitors are sent to
 * `/restricted` (explains why) instead of `/login`.
 */
const restrictedShellPaths = ['/trade', '/stats', '/settings', '/portfolio', '/leaderboard', '/friends'];

/** Always require iron-session (onboarding / legacy paths). */
const authOnlyPaths = ['/setup-username', '/learn-unit', '/learn-quiz', '/dashboard'];

function pathMatches(prefixes: string[], pathname: string): boolean {
    return prefixes.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isLearnPath = pathname === '/learn' || pathname.startsWith('/learn/');
    const isProtectedApi = protectedApiPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
    const isRestrictedShell = pathMatches(restrictedShellPaths, pathname);
    const isAuthOnly = pathMatches(authOnlyPaths, pathname);

    // Learn is public (concepts preview without account)
    if (isLearnPath && !isProtectedApi) {
        return NextResponse.next();
    }

    if (!isProtectedApi && !isRestrictedShell && !isAuthOnly) {
        return NextResponse.next();
    }

    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(request, response, {
        password: process.env.SECRET_KEY || 'dev-secret-key-change-in-production-at-least-32-chars',
        cookieName: 'vestera_session',
    });

    const loggedIn = Boolean(session.userId);

    if (isProtectedApi) {
        if (!loggedIn) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return response;
    }

    if (loggedIn) {
        return response;
    }

    if (isRestrictedShell) {
        return NextResponse.redirect(new URL('/restricted', request.url));
    }

    if (isAuthOnly) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/learn/:path*',
        '/trade/:path*',
        '/stats/:path*',
        '/settings',
        '/settings/:path*',
        '/portfolio',
        '/portfolio/:path*',
        '/leaderboard',
        '/leaderboard/:path*',
        '/friends',
        '/friends/:path*',
        '/setup-username',
        '/setup-username/:path*',
        '/learn-unit/:path*',
        '/learn-quiz/:path*',
        '/dashboard/:path*',
        '/api/trade/:path*',
        '/api/holdings/:path*',
        '/api/portfolio-share',
        '/api/portfolio-share/:path*',
        '/api/friends/username',
        '/api/friends/username/:path*',
        '/api/chat',
        '/api/chat/:path*',
        '/api/analyze-stock/:path*',
        '/api/delete-account/:path*',
        '/api/snapse',
        '/api/snapse/:path*',
    ],
};
