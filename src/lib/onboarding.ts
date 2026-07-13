// ─── Onboarding tour: step definitions + localStorage state ──────────────────
// A guided, Vesta-led product tour that runs on a user's first sign-in.
// The tour spans multiple routes; progress is persisted so navigations resume it.

export interface TourStep {
    id: string;
    /** Route (pathname) this step lives on. The tour waits until the user is here. */
    route: string;
    /** Full href to navigate to when entering this step (with query string). Defaults to `route`. */
    navPath?: string;
    /** data-tour attribute value of the element to spotlight. Omit for a centered card. */
    target?: string;
    title: string;
    body: string;
    /** Button label. Omit for event-gated steps that have no button. */
    cta?: string;
    /** How the step advances. Default 'next'. */
    advanceOn?: 'next' | 'click-target' | 'event';
    /** Window event name that advances the step when advanceOn === 'event'. */
    event?: string;
    /** Preferred tooltip placement relative to the target. */
    placement?: 'top' | 'bottom' | 'left' | 'right';
    /** Final celebratory "tutorial complete" screen. */
    finish?: boolean;
}

// A scripted, Vesta-led tutorial: make a first trade → see the leaderboard →
// tour the tabs → finish. Runs on the in-memory demo user, so no signup needed.
export const TOUR_STEPS: TourStep[] = [
    {
        id: 'welcome',
        route: '/trade',
        title: "Hey, I'm Vesta! 👋",
        body: "Welcome to the Market! I set up one practice stock so we can make your very first trade together. Ready?",
        cta: "Let's go →",
    },
    {
        id: 'pick',
        route: '/trade',
        target: 'tutorial-stock',
        title: 'Step 1 — Your practice stock',
        body: "This is the stock we'll practice with. It uses real market data, but you're trading with pretend money — zero risk.",
        cta: 'Got it',
        placement: 'right',
    },
    {
        id: 'buy',
        route: '/trade',
        target: 'buy-panel',
        title: 'Step 2 — Make your first trade',
        body: "Set how many shares you want, then press BUY. Go ahead — I'll wait right here! 🛒",
        advanceOn: 'event',
        event: 'vestera:tutorial-bought',
        placement: 'left',
    },
    {
        id: 'bought',
        route: '/trade',
        title: '🎉 Boom — first trade done!',
        body: "You officially own a piece of a company. Let's see how you stack up against everyone else.",
        cta: 'See the leaderboard →',
    },
    {
        id: 'leaderboard',
        route: '/stats',
        navPath: '/stats',
        target: 'lb-me',
        title: 'Step 3 — The Leaderboard',
        body: "That's you at the top! 🥇 Everyone else here is a practice bot. Trade smart and stay #1.",
        cta: 'Next',
        placement: 'bottom',
    },
    {
        id: 'academy',
        route: '/learn',
        navPath: '/learn',
        title: 'Step 4 — The Academy',
        body: 'Lessons and quizzes live here — the fastest way to go from total beginner to confident investor.',
        cta: 'Next',
    },
    {
        id: 'journey',
        route: '/trade',
        navPath: '/trade',
        title: "You're ready! 🚀",
        body: "Start your journey now and get a little better every day. The whole market is about to open up for you.",
        cta: 'Finish',
    },
    {
        id: 'done',
        route: '/trade',
        finish: true,
        title: 'Tutorial complete! 🎉',
        body: "Real stocks are unlocked. Explore, trade smart, and ask me anything anytime from the button in the corner. Have fun!",
        cta: 'Start trading',
    },
];

const SEEN_KEY = 'vestera_tour_seen';
const STEP_KEY = 'vestera_tour_step';
const ACTIVE_KEY = 'vestera_tour_active';

export function hasSeenTour(): boolean {
    if (typeof window === 'undefined') return true;
    try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return true; }
}

export function markTourSeen(): void {
    try {
        localStorage.setItem(SEEN_KEY, '1');
        localStorage.removeItem(STEP_KEY);
        localStorage.removeItem(ACTIVE_KEY);
    } catch { /* ignore */ }
}

/** Begin (or restart) the tour from the first step. */
export function startTour(): void {
    try {
        localStorage.setItem(ACTIVE_KEY, '1');
        localStorage.setItem(STEP_KEY, '0');
        localStorage.removeItem(SEEN_KEY);
    } catch { /* ignore */ }
}

export function isTourActive(): boolean {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem(ACTIVE_KEY) === '1'; } catch { return false; }
}

/** The scripted tutorial and the tour share one active flag. */
export const isTutorialActive = isTourActive;

export function getTourStep(): number {
    if (typeof window === 'undefined') return 0;
    try { return parseInt(localStorage.getItem(STEP_KEY) || '0', 10) || 0; } catch { return 0; }
}

export function setTourStep(i: number): void {
    try { localStorage.setItem(STEP_KEY, String(i)); } catch { /* ignore */ }
}
