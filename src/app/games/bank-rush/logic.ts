/**
 * Bank Rush: classroom rules. No React, no DOM.
 * One presenter runs three levels. Each correct first choice earns one star.
 * A second click on the same challenge cannot add another star.
 */

export const STAR_MAX = 9;

export type Look = 'maya' | 'jordan' | 'ava' | 'emma' | 'leo' | 'sophia';
export type Phase = 'title' | 'howto' | 'intro' | 'play' | 'result' | 'levelDone' | 'boss' | 'victory';

type Base = {
    id: string;
    name: string;
    look: Look;
    speech: string;
    success: string;
    mistake: string;
};

export type TellerChallenge = Base & {
    kind: 'teller';
    account: number;
    cash: number;
    amount: number;
    correctId: 'deposit' | 'withdraw';
    afterAccount: number;
    afterCash: number;
};

export type AccountChallenge = Base & {
    kind: 'accounts';
    mode: 'save' | 'spend';
    checking: number;
    savings: number;
    amount: number;
    correctId: 'checking' | 'savings';
    afterChecking: number;
    afterSavings: number;
};

export type MathChallenge = Base & {
    kind: 'math';
    checking: number;
    spend: number;
    options: number[];
    correctId: string;
    after: number;
};

export type SecurityChallenge = Base & {
    kind: 'security';
    from: string;
    headline: string;
    body: string;
    correctId: 'safe' | 'block';
};

export type Challenge = TellerChallenge | AccountChallenge | MathChallenge | SecurityChallenge;

export type LevelInfo = {
    id: 1 | 2 | 3;
    name: string;
    kicker: string;
    intro: string;
    challenges: Challenge[];
};

export const LEVELS: LevelInfo[] = [
    {
        id: 1,
        name: 'Teller Trouble',
        kicker: 'Deposits and withdrawals',
        intro: 'The class is the teller team. A customer walks up, and you decide together. Deposit puts money into the account. Withdraw takes money out as cash.',
        challenges: [
            {
                kind: 'teller',
                id: 'maya',
                name: 'Maya',
                look: 'maya',
                speech: 'Hi! I earned $30 from doing chores. I want to put it into my bank account!',
                account: 40,
                cash: 30,
                amount: 30,
                correctId: 'deposit',
                afterAccount: 70,
                afterCash: 0,
                success: 'Great job! A deposit puts money into the account. $40 + $30 = $70.',
                mistake: 'Withdraw means taking money out. Maya wants her chore money put in, so this is a deposit. $40 + $30 = $70.',
            },
            {
                kind: 'teller',
                id: 'jordan',
                name: 'Jordan',
                look: 'jordan',
                speech: 'I have $70 in my account. May I take out $15 in cash, please?',
                account: 70,
                cash: 0,
                amount: 15,
                correctId: 'withdraw',
                afterAccount: 55,
                afterCash: 15,
                success: 'Yes! A withdrawal takes money out and hands it over as cash. $70 − $15 = $55.',
                mistake: 'Jordan wants cash in his hand. Deposit would put more money in. Withdraw $15. $70 − $15 = $55.',
            },
            {
                kind: 'teller',
                id: 'ava',
                name: 'Ava',
                look: 'ava',
                speech: 'I saved another $20 for a bicycle. Please add it to my account!',
                account: 45,
                cash: 20,
                amount: 20,
                correctId: 'deposit',
                afterAccount: 65,
                afterCash: 0,
                success: 'Another deposit. Adding money makes the balance grow. $45 + $20 = $65.',
                mistake: 'Ava is adding bicycle money, not taking it out. Deposit it. $45 + $20 = $65.',
            },
        ],
    },
    {
        id: 2,
        name: 'Account Chaos',
        kicker: 'Checking and savings',
        intro: 'The Money Muncher mixed up the accounts. Checking is for everyday spending, like a debit card. Savings is money set aside for a later goal, and it can earn a little extra called interest.',
        challenges: [
            {
                kind: 'accounts',
                mode: 'save',
                id: 'emma',
                name: 'Emma',
                look: 'emma',
                speech: 'I want to save $50 for a new bicycle I plan to buy later.',
                checking: 40,
                savings: 20,
                amount: 50,
                correctId: 'savings',
                afterChecking: 40,
                afterSavings: 70,
                success: 'Savings is for a goal you will buy later. The $50 goes into the savings vault. Savings is now $70.',
                mistake: 'Checking is for spending soon. A bicycle later belongs in savings. $20 + $50 = $70 in savings.',
            },
            {
                kind: 'accounts',
                mode: 'spend',
                id: 'leo',
                name: 'Leo',
                look: 'leo',
                speech: 'I need to buy $12 of groceries with my debit card.',
                checking: 36,
                savings: 80,
                amount: 12,
                correctId: 'checking',
                afterChecking: 24,
                afterSavings: 80,
                success: 'A debit card pays from checking. $36 − $12 = $24 left in checking. Savings stays $80.',
                mistake: 'Groceries are an everyday purchase, so they come out of checking, not savings. $36 − $12 = $24.',
            },
            {
                kind: 'math',
                id: 'sophia',
                name: 'Sophia',
                look: 'sophia',
                speech: 'I have $80 in my checking account. I spent $25 on school supplies. How much is left?',
                checking: 80,
                spend: 25,
                options: [55, 105, 25],
                correctId: '55',
                after: 55,
                success: 'Spending takes money out. $80 − $25 = $55. Checking is now $55.',
                mistake: '$105 would mean the $25 was added. $25 is what she spent, not what is left. $80 − $25 = $55.',
            },
        ],
    },
    {
        id: 3,
        name: 'Protect the Bank!',
        kicker: 'Safety and scams',
        intro: 'The Money Muncher is sending tricks. A real bank never asks for a password in a random message. A strange link that wants banking details gets blocked. The real bank website, with a trusted adult, is safe.',
        challenges: [
            {
                kind: 'security',
                id: 'prize',
                name: 'Prize message',
                look: 'maya',
                speech: 'A message just popped up on the bank screen.',
                from: 'Prize Team',
                headline: 'You won $500!',
                body: 'Congratulations! You have won $500! Send us your bank password to collect your prize!',
                correctId: 'block',
                success: 'Never share a banking password. A real bank does not ask for a password in a random message.',
                mistake: 'That prize is a trick. A password lets someone open the account. Block the message.',
            },
            {
                kind: 'security',
                id: 'official',
                name: 'Official sign-in',
                look: 'leo',
                speech: 'A student wants to see a savings balance.',
                from: 'First City Bank',
                headline: 'Official website',
                body: 'They sign in on the bank\'s own website, with a trusted adult beside them, and they keep the password private.',
                correctId: 'safe',
                success: 'The real bank website, a trusted adult, and a private password: that is a safe way to check a balance.',
                mistake: 'This one is safe. It is the bank\'s own website, a trusted adult is there, and the password stays private.',
            },
            {
                kind: 'security',
                id: 'text',
                name: 'Strange text',
                look: 'ava',
                speech: 'A phone on the counter just buzzed.',
                from: 'Unknown number',
                headline: 'Text message',
                body: 'A stranger texts: Click this link and type your banking details so we can fix your account.',
                correctId: 'block',
                success: 'Block it. A strange link that asks for banking details is a scam. Do not click it, and do not type a password.',
                mistake: 'A stranger\'s link is not the bank. Clicking it can steal the login. Block the text.',
            },
        ],
    },
];

export type GameState = {
    phase: Phase;
    level: 1 | 2 | 3;
    index: number;
    stars: number;
    levelStars: [number, number, number];
    solved: number;
    choice: string | null;
    correct: boolean;
    shielded: boolean;
    sound: boolean;
    present: boolean;
    skip: boolean;
};

export const initialState: GameState = {
    phase: 'title',
    level: 1,
    index: 0,
    stars: 0,
    levelStars: [0, 0, 0],
    solved: 0,
    choice: null,
    correct: false,
    shielded: false,
    sound: false,
    present: false,
    skip: false,
};

export type Action =
    | { type: 'start' }
    | { type: 'howto' }
    | { type: 'closeHow' }
    | { type: 'begin' }
    | { type: 'choose'; id: string }
    | { type: 'next' }
    | { type: 'continue' }
    | { type: 'shield' }
    | { type: 'celebrate' }
    | { type: 'restart' }
    | { type: 'toggle'; key: 'sound' | 'present' | 'skip' };

export function levelOf(level: number) {
    return LEVELS[level - 1];
}

export function challengeOf(state: Pick<GameState, 'level' | 'index'>) {
    return levelOf(state.level).challenges[state.index];
}

export function isCorrect(challenge: Challenge, id: string) {
    return challenge.correctId === id;
}

export function reputation(solved: number) {
    if (solved >= 9) return 'Bank saved';
    if (solved >= 7) return 'Shields up';
    if (solved >= 4) return 'Accounts in order';
    if (solved >= 1) return 'Learning the counter';
    return 'Open for business';
}

function addStar(state: GameState, correct: boolean): Pick<GameState, 'stars' | 'levelStars'> {
    if (!correct) return { stars: state.stars, levelStars: state.levelStars };
    const levelStars = [...state.levelStars] as [number, number, number];
    levelStars[state.level - 1] += 1;
    return { stars: state.stars + 1, levelStars };
}

export function reducer(state: GameState, action: Action): GameState {
    switch (action.type) {
        case 'toggle':
            return { ...state, [action.key]: !state[action.key] };
        case 'howto':
            return state.phase === 'title' ? { ...state, phase: 'howto' } : state;
        case 'closeHow':
            return state.phase === 'howto' ? { ...state, phase: 'title' } : state;
        case 'start':
            return state.phase === 'title' ? { ...state, phase: 'intro', level: 1, index: 0 } : state;
        case 'begin':
            return state.phase === 'intro'
                ? { ...state, phase: 'play', index: 0, choice: null, correct: false }
                : state;
        case 'choose': {
            if (state.phase !== 'play' || state.choice !== null) return state;
            const challenge = challengeOf(state);
            const known = challenge.kind === 'math'
                ? challenge.options.map(String)
                : challenge.kind === 'teller'
                    ? ['deposit', 'withdraw']
                    : challenge.kind === 'accounts'
                        ? ['checking', 'savings']
                        : ['safe', 'block'];
            if (!known.includes(action.id)) return state;
            const correct = isCorrect(challenge, action.id);
            return {
                ...state,
                phase: 'result',
                choice: action.id,
                correct,
                solved: state.solved + 1,
                ...addStar(state, correct),
            };
        }
        case 'next': {
            if (state.phase !== 'result') return state;
            const last = state.index >= 2;
            if (!last) {
                return { ...state, phase: 'play', index: state.index + 1, choice: null, correct: false };
            }
            if (state.level === 3) return { ...state, phase: 'boss', choice: null, shielded: false };
            return { ...state, phase: 'levelDone' };
        }
        case 'continue': {
            if (state.phase !== 'levelDone' || state.level >= 3) return state;
            const level = (state.level + 1) as 2 | 3;
            return { ...state, phase: 'intro', level, index: 0, choice: null, correct: false };
        }
        case 'shield':
            return state.phase === 'boss' && !state.shielded ? { ...state, shielded: true } : state;
        case 'celebrate':
            return state.phase === 'boss' && state.shielded ? { ...state, phase: 'victory' } : state;
        case 'restart':
            return {
                ...initialState,
                sound: state.sound,
                present: state.present,
                skip: state.skip,
            };
        default:
            return state;
    }
}

export function selfCheck() {
    const problems: string[] = [];
    if (LEVELS.length !== 3) problems.push('level count');
    for (const level of LEVELS) {
        if (level.challenges.length !== 3) problems.push(`${level.name} count`);
        for (const challenge of level.challenges) {
            if (challenge.kind === 'teller') {
                const into = challenge.correctId === 'deposit';
                const account = challenge.account + (into ? challenge.amount : -challenge.amount);
                const cash = challenge.cash + (into ? -challenge.amount : challenge.amount);
                if (account !== challenge.afterAccount || cash !== challenge.afterCash) problems.push(`${challenge.id} math`);
            }
            if (challenge.kind === 'accounts') {
                const checking = challenge.checking + (challenge.correctId === 'checking' && challenge.mode === 'spend' ? -challenge.amount : 0);
                const savings = challenge.savings + (challenge.correctId === 'savings' && challenge.mode === 'save' ? challenge.amount : 0);
                if (checking !== challenge.afterChecking || savings !== challenge.afterSavings) problems.push(`${challenge.id} math`);
            }
            if (challenge.kind === 'math') {
                if (challenge.checking - challenge.spend !== challenge.after) problems.push(`${challenge.id} math`);
                if (!challenge.options.map(String).includes(challenge.correctId)) problems.push(`${challenge.id} option`);
            }
        }
    }

    const perfectChoices = ['deposit', 'withdraw', 'deposit', 'savings', 'checking', '55', 'block', 'safe', 'block'];
    let state = initialState;
    state = initialState;
    state = reducer(state, { type: 'start' });
    state = reducer(state, { type: 'begin' });
    perfectChoices.forEach((id, i) => {
        const before = state.stars;
        state = reducer(state, { type: 'choose', id });
        state = reducer(state, { type: 'choose', id });
        if (state.stars !== before + 1) problems.push(`star ${id}`);
        state = reducer(state, { type: 'next' });
        if (i === 2 || i === 5) {
            if (state.phase !== 'levelDone') problems.push(`level done ${i}`);
            state = reducer(state, { type: 'continue' });
            state = reducer(state, { type: 'begin' });
        }
    });
    if (state.phase !== 'boss') problems.push(`expected boss, got ${state.phase}`);
    state = reducer(state, { type: 'shield' });
    state = reducer(state, { type: 'shield' });
    if (!state.shielded) problems.push('shield');
    state = reducer(state, { type: 'celebrate' });
    if (state.phase !== 'victory' || state.stars !== 9 || state.solved !== 9) problems.push(`victory ${state.stars}/${state.solved}`);
    if (state.levelStars.join(',') !== '3,3,3') problems.push('level stars');

    state = initialState;
    state = reducer(state, { type: 'start' });
    state = reducer(state, { type: 'begin' });
    state = reducer(state, { type: 'choose', id: 'withdraw' });
    if (state.stars !== 0 || state.correct) problems.push('wrong maya');
    state = reducer(state, { type: 'restart' });
    if (state.phase !== 'title' || state.stars !== 0 || state.solved !== 0) problems.push('restart');

    if (problems.length) throw new Error(problems.join('; '));
}
