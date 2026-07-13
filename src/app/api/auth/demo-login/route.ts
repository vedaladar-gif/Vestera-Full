import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { DEMO_USER_ID, resetDemo } from '@/lib/demoStore';

/**
 * Starts a no-signup demo session: sets the iron-session to the in-memory demo
 * user and resets its portfolio to $100,000. Lets a visitor walk the full
 * authenticated app (and the onboarding tour) without a real backend.
 */
export async function POST() {
    resetDemo();
    const session = await getSession();
    session.userId = DEMO_USER_ID;
    await session.save();
    return NextResponse.json({ success: true });
}
