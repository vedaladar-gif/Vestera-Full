/**
 * Piggy Bank Boss — pure game rules (no React, no DOM).
 *
 * 10 weeks of save-or-spend, then a boss fight where
 *   coins -> health   and   stars -> damage.
 * Every function returns a new Game, so it plays nicely with React state.
 */

export const ROUNDS = 10;
export const START_COINS = 10;
export const SPEND_COST = 2;

/** Boss-fight tuning. Raise POWER_* to make fights shorter, HP_* to make them safer. */
export const HERO_HP_BASE = 20;
export const HP_PER_COIN = 4;
export const POWER_BASE = 9;
export const POWER_PER_STAR = 5;

export const BOSS = {
    name: 'Gobbles',
    title: 'the Coin Gobbler',
    emoji: '👾',
    hp: 120,
    minHit: 8,
    maxHit: 14,
    missChance: 0.1,
} as const;

export type Rng = () => number;
export type Choice = 'save' | 'spend';
export type Phase = 'start' | 'choose' | 'result' | 'boss-intro' | 'battle' | 'end';

export interface Surprise { emoji: string; text: string; coins: number }

/** One row in a "what happened" list. */
export interface Line {
    emoji: string;
    text: string;
    amount: number | null;
    unit: 'coin' | 'star' | 'hp' | null;
    /** Overrides the default green (positive) / red (negative) colouring. */
    tone?: 'good' | 'bad';
}

export interface Fight {
    heroMax: number;
    hero: number;
    power: number;
    bossMax: number;
    boss: number;
    turns: number;
    lines: Line[];
    hit: 'none' | 'boss' | 'both';
    over: boolean;
    won: boolean | null;
}

export interface Game {
    phase: Phase;
    round: number;
    coins: number;
    stars: number;
    history: number[];
    surprises: Surprise[];
    last: { choice: Choice; lines: Line[]; tip: string } | null;
    fight: Fight | null;
}

export const SURPRISES: readonly Surprise[] = [
    { emoji: '🎁', text: 'Birthday card with money inside!', coins: 3 },
    { emoji: '🍋', text: 'Your lemonade stand did great!', coins: 2 },
    { emoji: '🪙', text: 'You found coins on the playground!', coins: 2 },
    { emoji: '🧹', text: 'You did chores and got paid!', coins: 2 },
    { emoji: '🐶', text: 'You walked a neighbor’s dog!', coins: 2 },
    { emoji: '🎨', text: 'You sold a drawing at school!', coins: 3 },
    { emoji: '🚲', text: 'Your bike needs a new tire.', coins: -2 },
    { emoji: '🛋️', text: 'A coin fell behind the sofa.', coins: -1 },
    { emoji: '🎲', text: 'You bought a game for the family.', coins: -2 },
    { emoji: '🎈', text: 'You bought balloons for a party.', coins: -2 },
    { emoji: '🧸', text: 'You lost a toy and bought a new one.', coins: -1 },
];

export const TIPS: Record<Choice, readonly string[]> = {
    save: [
        'Saved coins grow on their own. The more you save, the more you earn!',
        'Nice! Your bank is growing while you do nothing. That is the magic of saving.',
        'Saving a little each week adds up fast. Coins will become your health!',
    ],
    spend: [
        'Treats are fun! Stars will make your boss attacks stronger.',
        'You earned a star! Spending on things you love is okay when you plan for it.',
        'Fun now, or growth later? You get to choose.',
    ],
};
export const LOW_COINS_TIP = 'Not enough coins for a treat, so saving is the move this week.';

// ---- helpers ---------------------------------------------------------------

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
    const a = items.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
const pick = <T>(list: readonly T[], rng: Rng): T => list[Math.floor(rng() * list.length)];
const randInt = (lo: number, hi: number, rng: Rng) => lo + Math.floor(rng() * (hi - lo + 1));

// ---- the 10 weeks ----------------------------------------------------------

/** Start screen state. Deterministic, so it is safe to render on the server. */
export function idleGame(): Game {
    return { phase: 'start', round: 0, coins: START_COINS, stars: 0, history: [START_COINS], surprises: [], last: null, fight: null };
}

export function startGame(rng: Rng = Math.random): Game {
    return { ...idleGame(), phase: 'choose', surprises: shuffle(SURPRISES, rng).slice(0, ROUNDS) };
}

export const canSpend = (g: Game) => g.coins >= SPEND_COST;

export function play(g: Game, choice: Choice, rng: Rng = Math.random): Game {
    if (g.phase !== 'choose') return g;
    if (choice === 'spend' && !canSpend(g)) return g;

    let coins = g.coins;
    let stars = g.stars;
    const lines: Line[] = [];

    if (choice === 'save') {
        const interest = Math.max(1, Math.round(coins * 0.1));
        coins += interest;
        lines.push({ emoji: '🏦', text: 'You saved! Your coins grew.', amount: interest, unit: 'coin' });
    } else {
        coins -= SPEND_COST;
        stars += 1;
        lines.push({ emoji: '🍦', text: 'You bought a treat!', amount: -SPEND_COST, unit: 'coin' });
        lines.push({ emoji: '⭐', text: 'You earned a star!', amount: 1, unit: 'star' });
    }

    const surprise = g.surprises[g.round];
    const applied = Math.max(-coins, surprise.coins); // never drop below zero
    coins += applied;
    lines.push({ emoji: surprise.emoji, text: `Surprise! ${surprise.text}`, amount: applied, unit: 'coin' });

    return {
        ...g,
        phase: 'result',
        round: g.round + 1,
        coins,
        stars,
        history: [...g.history, coins],
        last: { choice, lines, tip: pick(TIPS[choice], rng) },
    };
}

/** After a week's results: next week, or (after week 10) the boss intro. */
export function next(g: Game): Game {
    if (g.phase !== 'result') return g;
    if (g.round >= ROUNDS) return { ...g, phase: 'boss-intro', fight: makeFight(g) };
    return { ...g, phase: 'choose' };
}

// ---- the boss fight --------------------------------------------------------

export function makeFight(g: Pick<Game, 'coins' | 'stars'>): Fight {
    const hp = HERO_HP_BASE + g.coins * HP_PER_COIN;
    return {
        heroMax: hp,
        hero: hp,
        power: POWER_BASE + g.stars * POWER_PER_STAR,
        bossMax: BOSS.hp,
        boss: BOSS.hp,
        turns: 0,
        lines: [],
        hit: 'none',
        over: false,
        won: null,
    };
}

export function startFight(g: Game): Game {
    return g.phase === 'boss-intro' ? { ...g, phase: 'battle' } : g;
}

export function attack(g: Game, rng: Rng = Math.random): Game {
    const f = g.fight;
    if (g.phase !== 'battle' || !f || f.over) return g;

    const dmg = Math.max(1, f.power + randInt(-2, 2, rng));
    const boss = Math.max(0, f.boss - dmg);
    const lines: Line[] = [{ emoji: '⚔️', text: `You hit ${BOSS.name}!`, amount: -dmg, unit: 'hp', tone: 'good' }];
    let hero = f.hero;
    let hit: Fight['hit'] = 'boss';
    let over = false;
    let won: boolean | null = null;

    if (boss <= 0) {
        over = true;
        won = true;
        lines.push({ emoji: '🎉', text: `${BOSS.name} is defeated!`, amount: null, unit: null });
    } else if (rng() < BOSS.missChance) {
        lines.push({ emoji: '💨', text: `${BOSS.name} missed you!`, amount: null, unit: null });
    } else {
        const bossDmg = randInt(BOSS.minHit, BOSS.maxHit, rng);
        hero = Math.max(0, hero - bossDmg);
        hit = 'both';
        lines.push({ emoji: BOSS.emoji, text: `${BOSS.name} hit you!`, amount: -bossDmg, unit: 'hp', tone: 'bad' });
        if (hero <= 0) {
            over = true;
            won = false;
        }
    }

    return { ...g, fight: { ...f, boss, hero, turns: f.turns + 1, lines, hit, over, won } };
}

export function finish(g: Game): Game {
    return g.phase === 'battle' && g.fight?.over ? { ...g, phase: 'end' } : g;
}

// ---- results & messages ----------------------------------------------------

export function rank(g: Pick<Game, 'stars'>): { name: string; message: string } {
    if (g.stars >= 6) return { name: 'Treat Champion 🍦', message: 'You love treats, and your stars hit hard! Try saving a bit more too, since coins keep you healthy.' };
    if (g.stars <= 2) return { name: 'Super Saver 🏦', message: 'Saving early helps your coins grow! A few more stars would make your hits stronger too.' };
    return { name: 'Balanced Boss 👑', message: 'Great mix! You saved and you had fun. That is what smart money habits look like.' };
}

export function defeatTip(g: Pick<Game, 'coins' | 'stars'>): string {
    if (g.stars <= 2) return 'Stars give you power! Next time, spend on a few treats to hit harder.';
    if (g.coins < 8) return 'Coins are your health! Next time, save a bit more so you can take more hits.';
    return 'So close! Try a different mix of saving and spending next time.';
}

export function introTip(g: Pick<Game, 'coins' | 'stars'>): string {
    if (g.stars <= 2) return 'You saved a lot, so you have lots of health! Your hits will be small, though.';
    if (g.coins < 8) return 'You spent a lot, so your hits are strong! But you don’t have much health. Be quick!';
    return 'A nice mix of health and power. Good luck!';
}