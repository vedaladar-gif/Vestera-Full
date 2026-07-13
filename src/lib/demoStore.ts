// ─── Demo Mode ───────────────────────────────────────────────────────────────
// A no-signup, fully in-memory user so the whole authenticated app (trade page,
// buying, portfolio, the onboarding tour) can be exercised without a real
// backend. State lives in module scope and persists for the life of the dev
// process; it resets whenever a demo session starts.

import type { User, Trade } from './models';

export const DEMO_USER_ID = 'demo';
const STARTING_CASH = 100_000;

interface DemoState {
    cash: number;
    trades: Trade[];
    seq: number;
    termsAt: string | null;
}

const state: DemoState = {
    cash: STARTING_CASH,
    trades: [],
    seq: 1,
    termsAt: new Date().toISOString(), // pre-accept so the terms gate never blocks the demo
};

export function isDemo(userId: string | undefined | null): boolean {
    return userId === DEMO_USER_ID;
}

export function resetDemo(): void {
    state.cash = STARTING_CASH;
    state.trades = [];
    state.seq = 1;
    state.termsAt = new Date().toISOString();
}

export function getDemoUser(): User {
    return {
        id: DEMO_USER_ID,
        username: 'demo_trader',
        cash: state.cash,
        created_at: new Date().toISOString(),
        display_name: 'Demo Trader',
        avatar_color: 'blue',
        theme: 'light',
        terms_accepted_at: state.termsAt,
    };
}

export function getDemoCash(): number {
    return state.cash;
}

export function setDemoCash(cash: number): void {
    state.cash = cash;
}

export function acceptDemoTerms(): void {
    state.termsAt = new Date().toISOString();
}

/** Trades newest-first (default) or ascending. */
export function getDemoTrades(ascending = false): Trade[] {
    const copy = [...state.trades];
    copy.sort((a, b) =>
        ascending
            ? a.created_at.localeCompare(b.created_at)
            : b.created_at.localeCompare(a.created_at),
    );
    return copy;
}

export function addDemoTrade(stock: string, shares: number, price: number, action: string): void {
    state.trades.push({
        id: state.seq++,
        user_id: DEMO_USER_ID,
        stock,
        shares,
        price,
        action,
        created_at: new Date().toISOString(),
    });
}
