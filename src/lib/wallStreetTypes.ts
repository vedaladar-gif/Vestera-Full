export const TOTAL_ROUNDS = 8;
export const TOTAL_YEARS = 20;

export type GamePhase = 'lobby' | 'briefing' | 'event' | 'playing' | 'finished';
export type AssetCategory = 'Stocks' | 'Bonds' | 'Commodities' | 'Funds' | 'Savings';
export type AssetId =
    | 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8'
    | 'GOVB' | 'CORP' | 'GOLD' | 'ENRG' | 'VMKT' | 'SAVE';

export type AssetView = {
    id: AssetId;
    name: string;
    category: AssetCategory;
    description: string;
    risk: 'Very low' | 'Low' | 'Medium' | 'High';
    unlockRound: number;
    unlocked: boolean;
    price: number;
    changePct: number;
    totalChangePct: number;
    history: number[];
    units: number;
    owned: number;
    contributed: number;
    profit: number;
    inNews: boolean;
};

export type RoundView = {
    number: number;
    title: string;
    years: string;
    headline: string;
    meaning: string;
    action: string;
    tip: string;
    impacts: Array<{ id: AssetId; name: string; pct: number }>;
    unlocks: Array<{ id: AssetId; name: string; category: AssetCategory; description: string }>;
};

export type GameSnapshot = {
    code: string;
    phase: GamePhase;
    slowMode: boolean;
    isHost: boolean;
    canStart: boolean;
    round: number;
    totalRounds: number;
    year: number;
    totalYears: number;
    roundEndsAt: string | null;
    pauseEndsAt: string | null;
    nextPayAt: string | null;
    nextPayAmount: number | null;
    marketStatus: 'Opening soon' | 'Paused' | 'Rising' | 'Falling' | 'Steady' | 'Closed';
    roundInfo: RoundView | null;
    paycheckNotice: string | null;
    me: {
        userId: string;
        name: string;
        cash: number;
        invested: number;
        contributed: number;
        portfolioValue: number;
        gain: number;
        gainPct: number;
        rank: number;
    };
    assets: AssetView[];
    mix: Array<{ id: string; name: string; value: number; pct: number }>;
    achievements: Array<{ id: string; label: string; done: boolean }>;
    players: Array<{
        userId: string;
        name: string;
        portfolioValue: number;
        rank: number;
        isHost: boolean;
        isYou: boolean;
        isComputer: boolean;
    }>;
    results?: {
        finalValue: number;
        contributed: number;
        gain: number;
        returnPct: number;
        rank: number;
        computerValue: number;
        lessons: string[];
        mix: Array<{ name: string; pct: number }>;
        era: { startYear: number; endYear: number };
        reveal: Array<{ id: AssetId; codeName: string; realName: string; changePct: number; note: string | null }>;
    };
};
