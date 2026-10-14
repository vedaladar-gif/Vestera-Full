/**
 * Piggy Bank Boss: pure game rules (no React, no DOM).
 *
 * Part 1: 10 weeks. Each week you are dealt 3 cards and pick one
 *         (save, odd job, lemonade stand, treat, emergency fund).
 * Part 2: a boss fight against Gobbles.
 *         coins -> health, stars -> attack power and Power Strike charges.
 *         Gobbles shows his next move, so you choose Attack, Power Strike or Guard.
 *
 * Every function returns a new Game, so it plays nicely with React state.
 */

export const ROUNDS = 10;
export const START_COINS = 10;

// ---- week cards ------------------------------------------------------------
export const TREAT_COST = 2;
export const FUND_COST = 1;
export const JOB_PAY = 2;
export const STAND_WIN = 5;
export const STAND_LOSS = 2;

// ---- boss fight tuning -----------------------------------------------------
export const HERO_HP_BASE = 30;
export const HP_PER_COIN = 3;
export const ATTACK_BASE = 14;
export const ATTACK_PER_STAR = 2;
export const STRIKE_MULT = 2;
export const COUNTING_BONUS = 1.5;
export const GUARD_HEAL = 6;
/** Stars above this still add attack power, but give no extra Power Strikes. */
export const MAX_STRIKES = 3;

export const BOSS = {
    name: 'Gobbles',
    title: 'the Coin Gobbler',
    hp: 140,
    hitMin: 7,
    hitMax: 11,
    bigMin: 22,
    bigMax: 28,
    heal: 10,
} as const;

export type Rng = () => number;
export type CardId = 'save' | 'job' | 'stand' | 'treat' | 'fund';
export type Move = 'attack' | 'strike' | 'guard';
export type IntentId = 'hit' | 'big' | 'count';
export type Phase = 'start' | 'choose' | 'boss-intro' | 'battle' | 'end';

export interface Surprise { text: string; coins: number }

/** One row in a "what happened" list. */
export interface Line {
    text: string;
    amount: number | null;
    unit: 'coin' | 'star' | 'hp' | null;
    /** Overrides the default green (positive) / red (negative) colouring. */
    tone?: 'good' | 'bad';
}

export interface Popup { text: string; tone: 'good' | 'bad' }

export interface Fight {
    heroMax: number;
    hero: number;
    power: number;
    strikes: number;
    strikesMax: number;
    bossMax: number;
    boss: number;
    turns: number;
    intent: IntentId;
    lines: Line[];
    popups: { hero: Popup | null; boss: Popup | null };
    over: boolean;
    won: boolean | null;
}

export interface Recap { card: CardId; lines: Line[]; tip: string }

export interface Game {
    phase: Phase;
    round: number;
    coins: number;
    stars: number;
    fund: boolean;
    history: number[];
    surprises: Surprise[];
    hand: CardId[];
    last: Recap | null;
    fight: Fight | null;
}

// ---- content ---------------------------------------------------------------

export const SURPRISES: readonly Surprise[] = [
    { text: 'Birthday card with money inside.', coins: 3 },
    { text: 'Your lemonade stand did great.', coins: 2 },
    { text: 'You found coins on the playground.', coins: 2 },
    { text: 'You did chores and got paid.', coins: 2 },
    { text: 'You walked a neighbor’s dog.', coins: 2 },
    { text: 'You sold a drawing at school.', coins: 3 },
    { text: 'Your bike needs a new tire.', coins: -2 },
    { text: 'A coin fell behind the sofa.', coins: -1 },
    { text: 'You bought a game for the family.', coins: -2 },
    { text: 'You bought balloons for a party.', coins: -2 },
    { text: 'You lost a toy and bought a new one.', coins: -1 },
];

export const CARD_IDS: readonly CardId[] = ['save', 'job', 'stand', 'treat', 'fund'];

export const CARD_INFO: Record<CardId, { title: string; tag: string; risky?: boolean }> = {
    save: { title: 'Save', tag: 'Safe' },
    job: { title: 'Odd job', tag: 'Safe' },
    stand: { title: 'Lemonade stand', tag: 'Risky', risky: true },
    treat: { title: 'Treat', tag: `Costs ${TREAT_COST} coins` },
    fund: { title: 'Emergency fund', tag: `Costs ${FUND_COST} coin` },
};

export const TIPS: Record<CardId, readonly string[]> = {
    save: [
        'Saved coins earn interest. The more you have, the more you earn each week.',
        'Interest grows on top of interest. That is compounding.',
    ],
    job: [
        'An odd job pays the same every time. Early on it beats interest, later saving wins.',
        'Earning is great, but it does not grow by itself like savings do.',
    ],
    stand: [
        'Risky choices can pay off big or cost you. Only risk what you can afford to lose.',
        'A coin flip is a gamble. Winning pays more than losing costs, but it is never a sure thing.',
    ],
    treat: [
        'Treats are fun, and each star makes your boss attacks stronger.',
        'Spending on things you enjoy is okay when it is a plan and not a habit.',
    ],
    fund: [
        'An emergency fund is money set aside for surprises, so a bad week does not hurt.',
        'Saving a little for a rainy day protects everything else you have built.',
    ],
};

export const INTENTS: Record<IntentId, { label: string; hint: string; weight: number }> = {
    hit: { label: 'Coin Grab', hint: 'A normal hit.', weight: 5 },
    big: { label: 'Mega Gobble', hint: 'A huge hit is coming. Guard to block it.', weight: 3 },
    count: { label: 'Counting Coins', hint: 'He heals and cannot attack. Hit him with a Power Strike for bonus damage.', weight: 2 },
};

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

/** Weekly interest on savings: 10%, at least 1 coin. */
export const interest = (coins: number) => Math.max(1, Math.round(coins * 0.1));

function dealHand(rng: Rng): CardId[] {
    // 3 of 5 cards. Only 2 cards cost coins, so at least one card is always playable.
    return shuffle(CARD_IDS, rng).slice(0, 3);
}

function rollIntent(rng: Rng, previous: IntentId | null): IntentId {
    const ids = Object.keys(INTENTS) as IntentId[];
    const pool = ids.filter(id => !(id === 'big' && previous === 'big')); // never two Mega Gobbles in a row
    const total = pool.reduce((sum, id) => sum + INTENTS[id].weight, 0);
    let roll = rng() * total;
    for (const id of pool) {
        roll -= INTENTS[id].weight;
        if (roll < 0) return id;
    }
    return pool[0];
}

// ---- the 10 weeks ----------------------------------------------------------

/** Start screen state. Deterministic, so it is safe to render on the server. */
export function idleGame(): Game {
    return {
        phase: 'start', round: 0, coins: START_COINS, stars: 0, fund: false,
        history: [START_COINS], surprises: [], hand: [], last: null, fight: null,
    };
}

export function startGame(rng: Rng = Math.random): Game {
    return { ...idleGame(), phase: 'choose', surprises: shuffle(SURPRISES, rng).slice(0, ROUNDS), hand: dealHand(rng) };
}

export function canPlay(g: Pick<Game, 'coins' | 'fund'>, id: CardId): boolean {
    if (id === 'treat') return g.coins >= TREAT_COST;
    if (id === 'fund') return g.coins >= FUND_COST && !g.fund;
    return true;
}

/** Short, live description of what a card will do right now. */
export function cardText(g: Pick<Game, 'coins' | 'fund'>, id: CardId): string {
    switch (id) {
        case 'save': return `Earn interest: about +${interest(g.coins)} ${interest(g.coins) === 1 ? 'coin' : 'coins'}.`;
        case 'job': return `Do chores for +${JOB_PAY} coins. No interest.`;
        case 'stand': return `Coin flip: win +${STAND_WIN} coins or lose ${STAND_LOSS}.`;
        case 'treat': return `Pay ${TREAT_COST} coins to earn 1 star. Stars power your fight.`;
        case 'fund': return g.fund ? 'Already active.' : `Pay ${FUND_COST} coin. Blocks your next bad surprise.`;
    }
}

export function play(g: Game, id: CardId, rng: Rng = Math.random): Game {
    if (g.phase !== 'choose' || !g.hand.includes(id) || !canPlay(g, id)) return g;

    let coins = g.coins;
    let stars = g.stars;
    let fund = g.fund;
    const lines: Line[] = [];

    if (id === 'save') {
        const gain = interest(coins);
        coins += gain;
        lines.push({ text: 'You saved. Your coins grew.', amount: gain, unit: 'coin' });
    } else if (id === 'job') {
        coins += JOB_PAY;
        lines.push({ text: 'You did chores and got paid.', amount: JOB_PAY, unit: 'coin' });
    } else if (id === 'stand') {
        if (rng() < 0.5) {
            coins += STAND_WIN;
            lines.push({ text: 'Your lemonade stand sold out.', amount: STAND_WIN, unit: 'coin' });
        } else {
            const loss = Math.min(STAND_LOSS, coins);
            coins -= loss;
            lines.push({ text: 'It rained all day. No customers.', amount: -loss, unit: 'coin' });
        }
    } else if (id === 'treat') {
        coins -= TREAT_COST;
        stars += 1;
        lines.push({ text: 'You bought a treat.', amount: -TREAT_COST, unit: 'coin' });
        lines.push({ text: 'You earned a star.', amount: 1, unit: 'star' });
    } else {
        coins -= FUND_COST;
        fund = true;
        lines.push({ text: 'You started an emergency fund.', amount: -FUND_COST, unit: 'coin' });
    }

    const surprise = g.surprises[g.round];
    if (surprise.coins < 0 && fund) {
        fund = false;
        lines.push({ text: `Your emergency fund covered it: ${surprise.text}`, amount: null, unit: null });
    } else {
        const applied = Math.max(-coins, surprise.coins); // never drop below zero
        coins += applied;
        lines.push({ text: `Surprise: ${surprise.text}`, amount: applied, unit: 'coin' });
    }

    const round = g.round + 1;
    const done = round >= ROUNDS;
    const next: Game = {
        ...g,
        round,
        coins,
        stars,
        fund,
        history: [...g.history, coins],
        last: { card: id, lines, tip: pick(TIPS[id], rng) },
        hand: done ? [] : dealHand(rng),
        phase: done ? 'boss-intro' : 'choose',
        fight: null,
    };
    return done ? { ...next, fight: makeFight(next, rng) } : next;
}

// ---- the boss fight --------------------------------------------------------

export const attackDamage = (power: number) => power;
export const strikeDamage = (power: number) => Math.round(power * STRIKE_MULT);

export function makeFight(g: Pick<Game, 'coins' | 'stars'>, rng: Rng = Math.random): Fight {
    const hp = HERO_HP_BASE + g.coins * HP_PER_COIN;
    return {
        heroMax: hp,
        hero: hp,
        power: ATTACK_BASE + g.stars * ATTACK_PER_STAR,
        strikes: Math.min(g.stars, MAX_STRIKES),
        strikesMax: Math.min(g.stars, MAX_STRIKES),
        bossMax: BOSS.hp,
        boss: BOSS.hp,
        turns: 0,
        intent: rollIntent(rng, null),
        lines: [],
        popups: { hero: null, boss: null },
        over: false,
        won: null,
    };
}

export function startFight(g: Game): Game {
    return g.phase === 'boss-intro' ? { ...g, phase: 'battle' } : g;
}

/** Fight again with the same coins and stars. */
export function rematch(g: Game, rng: Rng = Math.random): Game {
    if (g.phase !== 'end') return g;
    return { ...g, phase: 'battle', fight: makeFight(g, rng) };
}

export const canMove = (f: Fight, m: Move) => !f.over && (m !== 'strike' || f.strikes > 0);

export function move(g: Game, m: Move, rng: Rng = Math.random): Game {
    const f = g.fight;
    if (g.phase !== 'battle' || !f || !canMove(f, m)) return g;

    const lines: Line[] = [];
    const popups: Fight['popups'] = { hero: null, boss: null };
    let boss = f.boss;
    let hero = f.hero;
    let strikes = f.strikes;

    // 1. your move
    if (m === 'attack') {
        const dmg = Math.max(1, attackDamage(f.power) + randInt(-2, 2, rng));
        boss = Math.max(0, boss - dmg);
        lines.push({ text: `You attack ${BOSS.name}.`, amount: -dmg, unit: 'hp', tone: 'good' });
        popups.boss = { text: `−${dmg}`, tone: 'good' };
    } else if (m === 'strike') {
        const bonus = f.intent === 'count' ? COUNTING_BONUS : 1;
        const dmg = Math.max(1, Math.round(strikeDamage(f.power) * bonus) + randInt(-3, 3, rng));
        boss = Math.max(0, boss - dmg);
        strikes -= 1;
        lines.push({ text: f.intent === 'count' ? 'Power Strike. He was counting coins, so it hits extra hard.' : 'You use a Power Strike.', amount: -dmg, unit: 'hp', tone: 'good' });
        popups.boss = { text: `−${dmg}`, tone: 'good' };
    } else {
        lines.push({ text: 'You raise your guard.', amount: null, unit: null });
    }

    let over = false;
    let won: boolean | null = null;

    // 2. Gobbles acts on the move he showed you
    if (boss <= 0) {
        over = true;
        won = true;
        lines.push({ text: `${BOSS.name} is defeated.`, amount: null, unit: null });
    } else {
        const intent = INTENTS[f.intent];
        if (f.intent === 'count') {
            const healed = Math.min(BOSS.heal, f.bossMax - boss);
            boss += healed;
            lines.push({ text: `${BOSS.name} uses ${intent.label} and heals.`, amount: healed, unit: 'hp', tone: 'bad' });
            popups.boss = popups.boss ?? { text: `+${healed}`, tone: 'bad' };
        } else if (m === 'guard') {
            lines.push({ text: `${BOSS.name} uses ${intent.label}. You block it.`, amount: null, unit: null });
        } else {
            const dmg = f.intent === 'big' ? randInt(BOSS.bigMin, BOSS.bigMax, rng) : randInt(BOSS.hitMin, BOSS.hitMax, rng);
            hero = Math.max(0, hero - dmg);
            lines.push({ text: `${BOSS.name} uses ${intent.label}.`, amount: -dmg, unit: 'hp', tone: 'bad' });
            popups.hero = { text: `−${dmg}`, tone: 'bad' };
            if (hero <= 0) {
                over = true;
                won = false;
            }
        }
        if (m === 'guard' && !over) {
            const healed = Math.min(GUARD_HEAL, f.heroMax - hero);
            hero += healed;
            if (healed > 0) lines.push({ text: 'Guarding helps you recover.', amount: healed, unit: 'hp', tone: 'good' });
            popups.hero = f.intent === 'count' ? { text: `+${healed}`, tone: 'good' } : { text: healed > 0 ? `Blocked +${healed}` : 'Blocked', tone: 'good' };
        }
    }

    return {
        ...g,
        fight: {
            ...f, boss, hero, strikes, turns: f.turns + 1, lines, popups, over, won,
            intent: over ? f.intent : rollIntent(rng, f.intent),
        },
    };
}

export function finish(g: Game): Game {
    return g.phase === 'battle' && g.fight?.over ? { ...g, phase: 'end' } : g;
}

// ---- results & messages ----------------------------------------------------

export interface ScoreRow { label: string; value: number }

export function score(g: Game): { rows: ScoreRow[]; total: number } {
    const f = g.fight;
    if (!f) return { rows: [], total: 0 };
    const rows: ScoreRow[] = [
        { label: f.won ? 'Victory' : 'Victory (not yet)', value: f.won ? 300 : 0 },
        { label: 'Damage dealt', value: f.bossMax - f.boss },
        { label: 'Health left', value: f.hero * 2 },
        { label: 'Power Strikes saved', value: f.strikes * 15 },
        { label: 'Speed bonus', value: f.won ? Math.max(0, 16 - f.turns) * 10 : 0 },
    ];
    return { rows, total: rows.reduce((sum, r) => sum + r.value, 0) };
}

export function rank(g: Pick<Game, 'stars'>): { name: string; message: string } {
    if (g.stars >= 5) return { name: 'Treat Champion', message: 'You love treats, and your stars hit hard. Try saving a bit more too, since coins keep you healthy.' };
    if (g.stars <= 1) return { name: 'Super Saver', message: 'Saving early grows your coins. A few more stars would give you more Power Strikes.' };
    return { name: 'Balanced Boss', message: 'Great mix. You saved and you had fun. That is what smart money habits look like.' };
}

export function defeatTip(g: Pick<Game, 'coins' | 'stars'>): string {
    if (g.stars <= 1) return 'Stars give you power and Power Strikes. Next time, buy a few treats to hit harder.';
    if (g.coins < 8) return 'Coins are your health. Next time, save a bit more so you can take more hits.';
    return 'Watch what Gobbles plans. Guard against Mega Gobble, and use Power Strikes when he counts coins.';
}

export function introTip(g: Pick<Game, 'coins' | 'stars'>): string {
    if (g.stars <= 1) return 'You saved a lot, so you have lots of health. But you have few Power Strikes, so be patient.';
    if (g.coins < 8) return 'You spent a lot, so your hits are strong. But you do not have much health. Guard against big hits.';
    return 'A nice mix of health and power. Watch what Gobbles plans each turn.';
}