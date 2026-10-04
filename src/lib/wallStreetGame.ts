import { getDb } from './db';
import { getUserById } from './models';
import {
    TOTAL_ROUNDS,
    TOTAL_YEARS,
    type AssetCategory,
    type AssetId,
    type AssetView,
    type GamePhase,
    type GameSnapshot,
    type RoundView,
} from './wallStreetTypes';
import { COMPANIES, companyPrice, type Company } from './wallStreetCompanies';
import { FIRST_YEAR, INDEX_FIRST_HALF, INDEX_RETURNS, LAST_YEAR, YEAR_NEWS } from './wallStreetHistory';

export type { AssetCategory, AssetId, AssetView, GamePhase, GameSnapshot, RoundView } from './wallStreetTypes';
export { TOTAL_ROUNDS, TOTAL_YEARS } from './wallStreetTypes';

const HALVES_PER_ROUND = 5;
const TOTAL_HALVES = TOTAL_ROUNDS * HALVES_PER_ROUND;
const PRICE_STEPS = 30;
const MAX_MOVE = 0.3;
const CATCH_UP = 0.35;
const SMOOTHING = 0.5;
const GROWTH_SCALE = 0.6;
const COMPUTER_ID = 'computer';
const COMPUTER_NAME = 'Steady Investor';
const RISKY: AssetCategory[] = ['Stocks', 'Funds', 'Commodities'];

type AssetDef = {
    id: AssetId;
    name: string;
    category: AssetCategory;
    description: string;
    risk: AssetView['risk'];
    unlockRound: number;
    start: number;
    drift: number;
    vol: number;
    beta: number;
    floor: number;
};

type Holding = { units: number; contributed: number };
type Move = { half: number; id: AssetId; side: 'buy' | 'sell'; amount: number };
type PlayerMeta = { paidHalf: number; moves: Move[] };
type Market = { roundStartedAt: number | null; pauseEndsAt: number | null };
type RoomRow = {
    code: string;
    host_id: string;
    status: string;
    slow_mode: number;
    round: number;
    market_json: string;
    seed: number;
};
type PlayerRow = {
    user_id: string;
    display_name: string;
    cash: number;
    holdings_json: string;
    decisions_json: string;
};

const ASSETS: AssetDef[] = [
    ...(['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'] as const).map((id, slot): AssetDef => ({
        id, name: `Stock ${slot + 1}`, category: 'Stocks', risk: 'Medium', unlockRound: slot < 4 ? 2 : slot < 6 ? 4 : 5,
        start: 50, drift: 0, vol: 0.07, beta: 0, floor: -1, description: '',
    })),
    { id: 'GOVB', name: 'Government Bond Fund', category: 'Bonds', risk: 'Low', unlockRound: 1, start: 50, drift: 0.018, vol: 0.01, beta: -0.1, floor: -0.05, description: 'Loans to the government. You earn steady interest. The price can dip a little when interest rates rise.' },
    { id: 'CORP', name: 'Corporate Bond Fund', category: 'Bonds', risk: 'Low', unlockRound: 3, start: 48, drift: 0.024, vol: 0.02, beta: 0.15, floor: -0.07, description: 'Loans to large companies. It pays a bit more interest than government bonds, with a bit more risk.' },
    { id: 'GOLD', name: 'Gold', category: 'Commodities', risk: 'Medium', unlockRound: 3, start: 180, drift: 0.015, vol: 0.05, beta: -0.3, floor: -0.12, description: 'A precious metal. It does not pay interest, and it often holds up when stocks are falling.' },
    { id: 'ENRG', name: 'Energy Basket', category: 'Commodities', risk: 'High', unlockRound: 5, start: 72.5, drift: 0.005, vol: 0.1, beta: 0, floor: -0.2, description: 'A mix of oil and natural gas. It jumps around with fuel news.' },
    { id: 'VMKT', name: 'Vestera Market Fund', category: 'Funds', risk: 'Medium', unlockRound: 1, start: 100, drift: 0, vol: 0.03, beta: 0, floor: -1, description: 'An index fund that owns hundreds of large companies at once. One company having a bad year barely matters. The whole market having a bad year does.' },
    { id: 'SAVE', name: 'High-Yield Savings', category: 'Savings', risk: 'Very low', unlockRound: 1, start: 10, drift: 0.012, vol: 0.001, beta: 0, floor: 0.005, description: 'A savings account. It grows slowly and does not fall.' },
];

const ASSET_IDS = ASSETS.map(asset => asset.id);

const ROUND_GUIDE: Array<{ action: string; tip: string }> = [
    { action: 'Decide where your first $2,000 should go. You can change your mind later.', tip: 'The Market Fund owns hundreds of companies, so it follows the whole market.' },
    { action: 'Individual stocks are now available. Decide how much of your money you want tied to single companies.', tip: 'A single stock can move much more than the Market Fund, in both directions.' },
    { action: 'Corporate bonds and gold are now available. Think about how this news could affect each investment.', tip: 'Bonds and gold often move differently from stocks.' },
    { action: 'Two more companies just joined the market. Check how much of your money depends on one company.', tip: 'Even famous companies can fall behind when the world changes.' },
    { action: 'Energy investments are now available. Check which of your investments could gain from this news and which could lose.', tip: 'The same news can push two investments in opposite directions.' },
    { action: 'Look at how your investments have reacted over the past few years.', tip: 'Selling after a drop locks in the loss. Buying during a drop gets shares at lower prices.' },
    { action: 'Compare your results with the Steady Investor, who buys the Market Fund every paycheck.', tip: 'Recoveries often start before the news feels good.' },
    { action: 'This is the last stretch. The market closes at the end of this round.', tip: 'Your final score is your cash plus the value of everything you own.' },
];

function setup() {
    const db = getDb();
    db.pragma('busy_timeout = 4000');
    db.exec(`
        CREATE TABLE IF NOT EXISTS game_rooms (
            code TEXT PRIMARY KEY,
            host_id TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'lobby',
            slow_mode INTEGER NOT NULL DEFAULT 0,
            round INTEGER NOT NULL DEFAULT 0,
            phase_ends_at TEXT,
            market_json TEXT NOT NULL,
            seed INTEGER NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS game_players (
            room_code TEXT NOT NULL,
            user_id TEXT NOT NULL,
            display_name TEXT NOT NULL,
            cash REAL NOT NULL,
            holdings_json TEXT NOT NULL,
            decisions_json TEXT NOT NULL,
            joined_at TEXT NOT NULL,
            PRIMARY KEY (room_code, user_id)
        );
    `);
    const columns = db.prepare('PRAGMA table_info(game_rooms)').all() as Array<{ name: string }>;
    const names = new Set(columns.map(column => column.name));
    if (!names.has('slow_mode')) db.exec('ALTER TABLE game_rooms ADD COLUMN slow_mode INTEGER NOT NULL DEFAULT 0');
    if (!names.has('market_json')) db.exec(`ALTER TABLE game_rooms ADD COLUMN market_json TEXT NOT NULL DEFAULT '{}'`);
    if (!names.has('seed')) db.exec('ALTER TABLE game_rooms ADD COLUMN seed INTEGER NOT NULL DEFAULT 1');
    return db;
}

function halfMs(slow: boolean) {
    return slow ? 45_000 : 30_000;
}

function pauseMs(slow: boolean) {
    return slow ? 90_000 : 60_000;
}

function paycheck(half: number) {
    const base = half < 10 ? 2000 : half < 20 ? 2500 : half < 30 ? 3000 : 3500;
    return base + (half === 10 || half === 20 || half === 30 ? 1500 : 0);
}

function rng(seed: number) {
    let value = seed >>> 0;
    value = (value + 0x6D2B79F5) >>> 0;
    let t = Math.imul(value ^ (value >>> 15), value | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function startYearOf(seed: number) {
    return FIRST_YEAR + Math.floor(rng(seed * 31 + 7) * (LAST_YEAR - FIRST_YEAR - TOTAL_YEARS + 2));
}

function yearOf(half: number, seed: number) {
    return startYearOf(seed) + Math.floor(half / 2);
}

function indexHalf(year: number, firstHalf: boolean) {
    const annual = INDEX_RETURNS[year - FIRST_YEAR];
    const first = INDEX_FIRST_HALF[year] ?? Math.sqrt(1 + annual) - 1;
    return firstHalf ? first : (1 + annual) / (1 + first) - 1;
}

function stockHalf(company: Company, year: number, firstHalf: boolean) {
    const before = companyPrice(company, year - 1);
    const after = companyPrice(company, year);
    if (before === null || after === null || year > company.lastYear) return 0;
    const yearLog = Math.log((after / before) * (1 + company.dividend));
    const annual = INDEX_RETURNS[year - FIRST_YEAR];
    const marketTilt = Math.log(1 + indexHalf(year, true)) - 0.5 * Math.log(1 + annual);
    const noise = (rng(company.key * 7907 + year * 131) - 0.5) * 0.12;
    const firstLog = 0.5 * yearLog + company.beta * marketTilt + noise;
    return Math.exp(firstHalf ? firstLog : yearLog - firstLog) - 1;
}

const OIL_MAJOR = COMPANIES.find(company => company.realName === 'Exxon')!;
const STOCK_SLOTS = ASSETS.filter(asset => asset.category === 'Stocks');
const MAX_PER_SECTOR = 2;
const picksCache = new Map<number, Company[]>();
const assetsCache = new Map<number, AssetDef[]>();

function unlockYearOf(unlockRound: number, seed: number) {
    return startYearOf(seed) + Math.floor(((unlockRound - 1) * HALVES_PER_ROUND) / 2);
}

function canFill(company: Company, unlockYear: number, endYear: number) {
    if (company.firstYear > unlockYear - 1) return false;
    return company.fate === 'bankrupt' ? company.lastYear > unlockYear : company.lastYear >= endYear;
}

function picksFor(seed: number) {
    const cached = picksCache.get(seed);
    if (cached) return cached;
    const endYear = startYearOf(seed) + TOTAL_YEARS - 1;
    const order = COMPANIES
        .map(company => ({ company, roll: rng(seed * 7 + company.key * 7919 + 3) }))
        .sort((a, b) => a.roll - b.roll)
        .map(entry => entry.company);
    const picks: Company[] = [];
    const sectors = new Map<string, number>();
    for (const slot of STOCK_SLOTS) {
        const unlockYear = unlockYearOf(slot.unlockRound, seed);
        const open = order.filter(company => !picks.includes(company) && canFill(company, unlockYear, endYear));
        const pick = open.find(company => (sectors.get(company.sector) ?? 0) < MAX_PER_SECTOR) ?? open[0];
        picks.push(pick);
        sectors.set(pick.sector, (sectors.get(pick.sector) ?? 0) + 1);
    }
    picksCache.set(seed, picks);
    return picks;
}

function companyAt(index: number, seed: number) {
    const slot = STOCK_SLOTS.indexOf(ASSETS[index]);
    return slot < 0 ? null : picksFor(seed)[slot];
}

function assetsFor(seed: number) {
    const cached = assetsCache.get(seed);
    if (cached) return cached;
    const assets = ASSETS.map((asset, index) => {
        const company = companyAt(index, seed);
        if (!company) return asset;
        const risky = company.beta >= 1.15 || company.vol >= 0.2;
        return {
            ...asset,
            name: company.codeName,
            description: company.description,
            risk: risky ? 'High' : 'Medium',
            vol: risky ? 0.09 : 0.06,
            start: Math.round((20 + rng(seed * 13 + index * 101) * 100) * 100) / 100,
        } satisfies AssetDef;
    });
    assetsCache.set(seed, assets);
    return assets;
}

function halfReturn(index: number, half: number, seed: number) {
    const asset = ASSETS[index];
    const year = yearOf(half, seed);
    const firstHalf = half % 2 === 0;
    if (asset.id === 'VMKT') return indexHalf(year, firstHalf);
    const company = companyAt(index, seed);
    if (company) return stockHalf(company, year, firstHalf);
    const market = indexHalf(year, firstHalf) - 0.045;
    const own = (rng(seed + half * 97 + index * 1013) - 0.5) * asset.vol;
    const oil = asset.id === 'ENRG' ? 0.6 * (stockHalf(OIL_MAJOR, year, firstHalf) - 0.04) : 0;
    return Math.max(asset.floor, asset.drift * 0.7 + asset.beta * market * 0.4 + oil + own);
}

function dropRound(seed: number) {
    let worst = 1;
    let worstMove = Infinity;
    for (let round = 1; round <= TOTAL_ROUNDS; round += 1) {
        let growth = 1;
        for (let half = (round - 1) * HALVES_PER_ROUND; half < round * HALVES_PER_ROUND; half += 1) {
            growth *= 1 + indexHalf(yearOf(half, seed), half % 2 === 0);
        }
        if (growth < worstMove) {
            worstMove = growth;
            worst = round;
        }
    }
    return worst;
}

type Curves = number[][];

function buildCurves(seed: number, throughHalf: number): Curves {
    const last = Math.min(TOTAL_HALVES, Math.max(0, throughHalf) + 1);
    return assetsFor(seed).map((asset, index) => {
        const company = companyAt(index, seed);
        const shaped = Boolean(company) || asset.id === 'VMKT';
        const curve = [asset.start];
        const dips = shaped ? pullbacks(index, seed, company ? 1 : 0.5) : null;
        const history = Array.from({ length: TOTAL_HALVES }, (_, half) => Math.log(1 + halfReturn(index, half, seed)));
        const normal = history.filter((value, half) => value !== 0 && !(company?.fate === 'bankrupt' && yearOf(half, seed) >= company.lastYear));
        const historyAverage = normal.length ? normal.reduce((sum, value) => sum + value, 0) / normal.length : 0;
        const average = shaped && historyAverage > 0 ? historyAverage * GROWTH_SCALE : historyAverage;
        const raws = history.map(value => (shaped && value !== 0 ? value - historyAverage + average : value));
        const smoothing = company ? SMOOTHING : 1;
        let target = asset.start;
        for (let half = 0; half < last; half += 1) {
            if (isDefunct(index, half, seed)) {
                curve.push(curve[half]);
                continue;
            }
            const behind = Math.log((target * (dips?.[half] ?? 1)) / curve[half]);
            target *= Math.exp(raws[half]);
            const collapsing = company?.fate === 'bankrupt' && yearOf(half, seed) >= company.lastYear;
            const step = shaped && !collapsing ? average + smoothing * (raws[half] - average) : raws[half];
            const dipStep = Math.log((dips?.[half + 1] ?? 1) / (dips?.[half] ?? 1));
            const wanted = Math.exp(step + dipStep + behind * (collapsing ? 1 : CATCH_UP)) - 1;
            const move = Math.min(MAX_MOVE, collapsing ? wanted : Math.max(-MAX_MOVE, wanted));
            curve.push(curve[half] * (1 + move));
        }
        return curve;
    });
}

// Temporary drops that recover a few half-years later, so the shape of the history is kept.
function pullbacks(index: number, seed: number, strength: number) {
    const levels = Array<number>(TOTAL_HALVES + 1).fill(1);
    const phase = Math.floor(rng(seed * 5 + index * 31) * 4);
    for (let from = phase; from + 4 <= TOTAL_HALVES; from += 4) {
        const roll = (n: number) => rng(seed * 3 + index * 4099 + from * 61 + n);
        if (roll(0) > 0.95) continue;
        const fall = roll(1) < 0.75 ? 2 : 1;
        const climb = 2;
        const drop = (0.08 + roll(3) * 0.06) * strength;
        const bottom = (1 - drop) ** fall;
        for (let step = 1; step <= fall + climb; step += 1) {
            levels[from + step] = step <= fall ? (1 - drop) ** step : bottom ** (1 - (step - fall) / climb);
        }
    }
    for (let slump = 0; slump < 2; slump += 1) {
        const roll = (n: number) => rng(seed * 17 + index * 919 + slump * 7001 + n);
        const begin = 2 + Math.floor(((slump + roll(1)) / 2) * (TOTAL_HALVES - 10));
        const drop = (0.1 + roll(2) * 0.05) * strength;
        for (let step = 1; step <= 7; step += 1) {
            levels[begin + step] *= step <= 3 ? (1 - drop) ** step : (1 - drop) ** (3 * (1 - (step - 3) / 4));
        }
    }
    return levels;
}

function isDefunct(index: number, half: number, seed: number) {
    const company = companyAt(index, seed);
    return company?.fate === 'bankrupt' && yearOf(half, seed) > company.lastYear;
}

function swingOf(asset: AssetDef) {
    if (asset.id === 'SAVE') return 0;
    if (asset.category === 'Bonds') return asset.vol;
    if (asset.id === 'VMKT') return 0.06;
    return Math.min(0.18, asset.vol * 1.8);
}

function shock(seed: number, half: number, index: number, step: number) {
    const base = seed + half * 131 + index * 17 + step * 7919;
    return (rng(base) + rng(base + 1) + rng(base + 2) - 1.5) * 2;
}

// A short sell-off inside a half-year that is fully recovered by the end of it.
function intraDip(index: number, half: number, tick: number, seed: number) {
    const asset = ASSETS[index];
    if (asset.category !== 'Stocks' && asset.id !== 'VMKT' && asset.id !== 'GOLD' && asset.id !== 'ENRG') return 1;
    const roll = (n: number) => rng(seed * 11 + half * 197 + index * 3779 + n);
    if (roll(0) > 0.8) return 1;
    const begin = 0.05 + roll(1) * 0.45;
    const width = 0.3 + roll(2) * 0.2;
    if (tick <= begin || tick >= begin + width) return 1;
    const depth = (asset.category === 'Stocks' ? 0.04 + roll(3) * 0.1 : 0.02 + roll(3) * 0.05);
    return 1 - depth * Math.sin((Math.PI * (tick - begin)) / width);
}

function priceAt(curves: Curves, index: number, half: number, progress: number, seed: number) {
    const curve = curves[index];
    if (half >= TOTAL_HALVES || progress <= 0) return Math.round(curve[Math.min(half, curve.length - 1)] * 100) / 100;
    const base = curve[half];
    const end = curve[half + 1] ?? base;
    const step = Math.min(PRICE_STEPS, Math.floor(progress * PRICE_STEPS));
    const tick = step / PRICE_STEPS;
    const defunct = isDefunct(index, half, seed);
    const swing = defunct ? 0 : swingOf(assetsFor(seed)[index]);
    let walk = 0;
    let total = 0;
    for (let at = 1; at <= PRICE_STEPS; at += 1) {
        total += shock(seed, half, index, at) / Math.sqrt(PRICE_STEPS);
        if (at === step) walk = total;
    }
    const bridge = walk - tick * total;
    const trend = Math.exp(Math.log(end / base) * tick);
    const ratio = trend * Math.exp(swing * bridge) * (defunct ? 1 : intraDip(index, half, tick, seed));
    const bounded = Math.max(Math.min(1 - MAX_MOVE, trend), Math.min(Math.max(1 + MAX_MOVE, trend), ratio));
    return Math.round(base * bounded * 100) / 100;
}

function blankHoldings() {
    return Object.fromEntries(ASSET_IDS.map(id => [id, { units: 0, contributed: 0 }])) as Record<AssetId, Holding>;
}

function readHoldings(raw: string) {
    const holdings = blankHoldings();
    try {
        const parsed = JSON.parse(raw) as Record<string, Holding>;
        ASSET_IDS.forEach(id => {
            const item = parsed?.[id];
            if (item && typeof item === 'object') {
                holdings[id] = { units: Math.max(0, Number(item.units) || 0), contributed: Math.max(0, Number(item.contributed) || 0) };
            }
        });
    } catch { /* older game rows */ }
    return holdings;
}

function readMeta(raw: string): PlayerMeta {
    try {
        const parsed = JSON.parse(raw) as Partial<PlayerMeta>;
        if (parsed && !Array.isArray(parsed)) {
            return {
                paidHalf: typeof parsed.paidHalf === 'number' ? parsed.paidHalf : -1,
                moves: Array.isArray(parsed.moves) ? parsed.moves.filter(move => move && ASSET_IDS.includes(move.id) && (move.side === 'buy' || move.side === 'sell')) : [],
            };
        }
    } catch { /* older game rows */ }
    return { paidHalf: -1, moves: [] };
}

function readMarket(raw: string): Market {
    try {
        const parsed = JSON.parse(raw) as Partial<Market>;
        return {
            roundStartedAt: typeof parsed.roundStartedAt === 'number' ? parsed.roundStartedAt : null,
            pauseEndsAt: typeof parsed.pauseEndsAt === 'number' ? parsed.pauseEndsAt : null,
        };
    } catch {
        return { roundStartedAt: null, pauseEndsAt: null };
    }
}

function roomByCode(code: string) {
    return setup().prepare('SELECT code, host_id, status, slow_mode, round, market_json, seed FROM game_rooms WHERE code = ?').get(code) as RoomRow | undefined;
}

function phaseOf(status: string): GamePhase {
    return status === 'lobby' || status === 'briefing' || status === 'event' || status === 'playing' || status === 'finished' ? status : 'finished';
}

function clockOf(room: RoomRow, now = Date.now()) {
    const phase = phaseOf(room.status);
    const slow = Boolean(room.slow_mode);
    const market = readMarket(room.market_json);
    const round = Math.min(TOTAL_ROUNDS, Math.max(1, room.round || 1));
    const roundFirstHalf = (round - 1) * HALVES_PER_ROUND;
    if (phase === 'lobby' || phase === 'briefing') {
        return { phase, slow, market, round: 1, simHalf: 0, progress: 0, paidThrough: -1 };
    }
    if (phase === 'event') {
        return { phase, slow, market, round, simHalf: roundFirstHalf, progress: 0, paidThrough: roundFirstHalf - 1 };
    }
    if (phase === 'playing' && market.roundStartedAt) {
        const inRound = Math.min(HALVES_PER_ROUND, Math.max(0, (now - market.roundStartedAt) / halfMs(slow)));
        const whole = Math.min(HALVES_PER_ROUND - 1, Math.floor(inRound));
        const progress = inRound >= HALVES_PER_ROUND ? 1 : inRound - whole;
        return { phase, slow, market, round, simHalf: roundFirstHalf + whole, progress, paidThrough: roundFirstHalf + whole };
    }
    return { phase: 'finished' as GamePhase, slow, market, round: TOTAL_ROUNDS, simHalf: TOTAL_HALVES, progress: 0, paidThrough: TOTAL_HALVES - 1 };
}

function syncRoom(code: string) {
    const db = setup();
    const run = db.transaction(() => {
        const room = roomByCode(code);
        if (!room) return;
        const slow = Boolean(room.slow_mode);
        const market = readMarket(room.market_json);
        let status = room.status;
        let round = room.round;
        const now = Date.now();
        let changed = false;
        for (let guard = 0; guard < 40; guard += 1) {
            if (status === 'briefing' && market.pauseEndsAt && now >= market.pauseEndsAt) {
                status = 'event';
                round = 1;
                market.pauseEndsAt += pauseMs(slow);
            } else if (status === 'event' && market.pauseEndsAt && now >= market.pauseEndsAt) {
                status = 'playing';
                market.roundStartedAt = market.pauseEndsAt;
                market.pauseEndsAt = null;
            } else if (status === 'playing' && market.roundStartedAt && now >= market.roundStartedAt + HALVES_PER_ROUND * halfMs(slow)) {
                const end = market.roundStartedAt + HALVES_PER_ROUND * halfMs(slow);
                market.roundStartedAt = null;
                if (round >= TOTAL_ROUNDS) {
                    status = 'finished';
                } else {
                    round += 1;
                    status = 'event';
                    market.pauseEndsAt = end + pauseMs(slow);
                }
            } else if (!['lobby', 'briefing', 'event', 'playing', 'finished'].includes(status) || (status === 'playing' && !market.roundStartedAt)) {
                status = 'finished';
            } else {
                break;
            }
            changed = true;
        }
        if (changed) {
            db.prepare('UPDATE game_rooms SET status = ?, round = ?, market_json = ? WHERE code = ?').run(status, round, JSON.stringify(market), code);
        }
        const clock = clockOf({ ...room, status, round, market_json: JSON.stringify(market) }, now);
        if (clock.paidThrough < 0) return;
        const players = db.prepare('SELECT user_id, cash, decisions_json FROM game_players WHERE room_code = ?').all(code) as Array<Pick<PlayerRow, 'user_id' | 'cash' | 'decisions_json'>>;
        const write = db.prepare('UPDATE game_players SET cash = ?, decisions_json = ? WHERE room_code = ? AND user_id = ?');
        players.forEach(player => {
            const meta = readMeta(player.decisions_json);
            if (meta.paidHalf >= clock.paidThrough) return;
            let cash = player.cash;
            while (meta.paidHalf < clock.paidThrough) {
                meta.paidHalf += 1;
                cash += paycheck(meta.paidHalf);
            }
            write.run(Math.round(cash * 100) / 100, JSON.stringify(meta), code, player.user_id);
        });
    });
    run.immediate();
}

async function playerName(userId: string) {
    const user = await getUserById(userId);
    return user?.display_name || user?.username || 'Player';
}

function makeCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 20; attempt += 1) {
        const code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
        if (!roomByCode(code)) return code;
    }
    throw new Error('Could not create a unique game code.');
}

function insertPlayer(code: string, userId: string, name: string) {
    setup().prepare(`
        INSERT INTO game_players (room_code, user_id, display_name, cash, holdings_json, decisions_json, joined_at)
        VALUES (?, ?, ?, 0, ?, ?, ?)
    `).run(code, userId, name, JSON.stringify(blankHoldings()), JSON.stringify({ paidHalf: -1, moves: [] }), new Date().toISOString());
}

export async function createGame(userId: string, slowMode: boolean) {
    const db = setup();
    const code = makeCode();
    const columns = db.prepare('PRAGMA table_info(game_rooms)').all() as Array<{ name: string }>;
    const names = new Set(columns.map(column => column.name));
    const fields = ['code', 'host_id', 'status', 'slow_mode', 'round', 'phase_ends_at', 'market_json', 'seed', 'created_at'];
    const values: Array<string | number | null> = [code, userId, 'lobby', slowMode ? 1 : 0, 0, null, JSON.stringify({ roundStartedAt: null, pauseEndsAt: null }), Math.floor(Math.random() * 1_000_000_000), new Date().toISOString()];
    if (names.has('prices_json')) {
        fields.push('prices_json');
        values.push('{}');
    }
    db.prepare(`INSERT INTO game_rooms (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`).run(...values);
    insertPlayer(code, userId, await playerName(userId));
    return code;
}

export async function joinGame(userId: string, rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    const room = roomByCode(code);
    if (!room) throw new Error('Game code not found.');
    const db = setup();
    if (db.prepare('SELECT 1 FROM game_players WHERE room_code = ? AND user_id = ?').get(code, userId)) return code;
    if (phaseOf(room.status) !== 'lobby') throw new Error('This game has already started.');
    const count = (db.prepare('SELECT COUNT(*) AS count FROM game_players WHERE room_code = ?').get(code) as { count: number }).count;
    if (count >= 8) throw new Error('This lobby is full.');
    insertPlayer(code, userId, await playerName(userId));
    return code;
}

export function startGame(userId: string, code: string) {
    const room = roomByCode(code);
    if (!room || room.host_id !== userId) throw new Error('Only the host can start the game.');
    if (phaseOf(room.status) !== 'lobby') throw new Error('The game has already started.');
    const market: Market = { roundStartedAt: null, pauseEndsAt: Date.now() + 120_000 };
    setup().prepare(`UPDATE game_rooms SET status = 'briefing', round = 1, market_json = ? WHERE code = ?`).run(JSON.stringify(market), code);
}

export function continueGame(userId: string, code: string) {
    syncRoom(code);
    const room = roomByCode(code);
    if (!room || room.host_id !== userId) throw new Error('Only the host can continue.');
    const slow = Boolean(room.slow_mode);
    const market = readMarket(room.market_json);
    const now = Date.now();
    if (room.status === 'briefing') {
        market.pauseEndsAt = now + pauseMs(slow);
        setup().prepare(`UPDATE game_rooms SET status = 'event', round = 1, market_json = ? WHERE code = ?`).run(JSON.stringify(market), code);
    } else if (room.status === 'event') {
        market.pauseEndsAt = null;
        market.roundStartedAt = now;
        setup().prepare(`UPDATE game_rooms SET status = 'playing', market_json = ? WHERE code = ?`).run(JSON.stringify(market), code);
        syncRoom(code);
    }
}

export function tradeInGame(userId: string, code: string, id: AssetId, side: 'buy' | 'sell', amount: number, shares?: number | 'max') {
    const index = ASSET_IDS.indexOf(id);
    if (index < 0) throw new Error('Unknown investment.');
    syncRoom(code);
    const db = setup();
    const room = roomByCode(code);
    if (!room) throw new Error('Game not found.');
    const clock = clockOf(room);
    if (clock.phase !== 'playing') throw new Error('The market is paused right now.');
    if (ASSETS[index].unlockRound > clock.round) throw new Error('This investment is not available yet.');
    const player = db.prepare('SELECT * FROM game_players WHERE room_code = ? AND user_id = ?').get(code, userId) as PlayerRow | undefined;
    if (!player) throw new Error('You are not in this game.');
    const curves = buildCurves(room.seed, clock.simHalf);
    const price = priceAt(curves, index, clock.simHalf, clock.progress, room.seed);
    const holdings = readHoldings(player.holdings_json);
    const meta = readMeta(player.decisions_json);
    let cash = player.cash;
    let dollars: number;
    if (side === 'buy') {
        dollars = shares === 'max' ? cash : shares ? shares * price : amount;
        dollars = Math.floor(dollars * 100) / 100;
        if (dollars < 1) throw new Error(shares === 'max' ? 'You do not have any cash to invest.' : 'Enter at least $1.');
        if (dollars > cash + 0.001) throw new Error(shares ? `Not enough pocket cash for ${shares} shares.` : 'You do not have that much cash.');
        holdings[id].units += dollars / price;
        holdings[id].contributed += dollars;
        cash -= dollars;
    } else {
        const ownedUnits = holdings[id].units;
        const balance = ownedUnits * price;
        let sellUnits: number;
        if (shares === 'max') sellUnits = ownedUnits;
        else if (shares) {
            if (shares > ownedUnits + 1e-6) throw new Error(`You only own ${ownedUnits.toFixed(2)} shares.`);
            sellUnits = shares;
        } else {
            if (amount > balance + 0.01) throw new Error('You do not own that much of this investment.');
            sellUnits = amount / price;
        }
        sellUnits = Math.min(sellUnits, ownedUnits);
        dollars = Math.floor(sellUnits * price * 100) / 100;
        if (dollars < 0.01) throw new Error('You do not own any of this investment.');
        const share = sellUnits / Math.max(ownedUnits, 1e-9);
        holdings[id].units = share >= 0.9999 ? 0 : ownedUnits - sellUnits;
        holdings[id].contributed = share >= 0.9999 ? 0 : holdings[id].contributed * (1 - share);
        cash += dollars;
    }
    meta.moves.push({ half: clock.simHalf, id, side, amount: dollars });
    db.prepare('UPDATE game_players SET cash = ?, holdings_json = ?, decisions_json = ? WHERE room_code = ? AND user_id = ?')
        .run(Math.round(cash * 100) / 100, JSON.stringify(holdings), JSON.stringify(meta), code, userId);
}

function valueOf(cash: number, holdings: Record<AssetId, Holding>, prices: number[]) {
    const invested = ASSETS.reduce((sum, asset, index) => sum + holdings[asset.id].units * prices[index], 0);
    return { invested, value: cash + invested };
}

function computerValue(curves: Curves, prices: number[], paidThrough: number, seed: number) {
    const fund = ASSET_IDS.indexOf('VMKT');
    let units = 0;
    for (let half = 0; half <= paidThrough; half += 1) units += paycheck(half) / priceAt(curves, fund, half, 0, seed);
    return units * prices[fund];
}

function paidTotal(paidThrough: number) {
    let total = 0;
    for (let half = 0; half <= paidThrough; half += 1) total += paycheck(half);
    return total;
}

function roundView(round: number, seed: number): RoundView {
    const firstYear = (round - 1) * 2.5;
    const years = `Years ${Math.floor(firstYear) + 1}–${Math.ceil(firstYear + 2.5)}`;
    const news = YEAR_NEWS[yearOf((round - 1) * HALVES_PER_ROUND, seed) - FIRST_YEAR];
    const guide = ROUND_GUIDE[round - 1];
    return {
        number: round,
        title: news.title,
        years,
        headline: news.headline,
        meaning: news.meaning,
        action: guide.action,
        tip: guide.tip,
        impacts: [],
        unlocks: assetsFor(seed).filter(asset => asset.unlockRound === round).map(asset => ({ id: asset.id, name: asset.name, category: asset.category, description: asset.description })),
    };
}

const isRisky = (id: AssetId) => RISKY.includes(ASSETS.find(asset => asset.id === id)?.category as AssetCategory);

function dropWindow(seed: number) {
    const round = dropRound(seed);
    return { round, start: (round - 1) * HALVES_PER_ROUND, end: round * HALVES_PER_ROUND };
}

function achievementsFor(meta: PlayerMeta, round: number, finished: boolean, value: number, rival: number, seed: number) {
    const bought = meta.moves.filter(move => move.side === 'buy');
    const kinds = new Set(bought.map(move => ASSETS.find(asset => asset.id === move.id)?.category));
    const drop = dropWindow(seed);
    const riskyBefore = bought.some(move => move.half < drop.end && isRisky(move.id));
    const soldInDrop = meta.moves.some(move => move.side === 'sell' && move.half >= drop.start && move.half < drop.end && isRisky(move.id));
    const pastDrop = finished || round > drop.round;
    return [
        { id: 'first', label: 'Made a first investment', done: bought.length > 0 },
        { id: 'mix', label: 'Invested in 3 kinds of assets', done: kinds.size >= 3 },
        { id: 'steady', label: 'Stayed invested through the worst stretch', done: pastDrop && riskyBefore && !soldInDrop },
        { id: 'rival', label: 'Ahead of the Steady Investor', done: value > rival && value > 0 },
    ];
}

function lessonsFor(meta: PlayerMeta, holdings: Record<AssetId, Holding>, value: number, cash: number, rival: number, seed: number) {
    const lessons: string[] = [];
    const contributed = assetsFor(seed).map(asset => ({ asset, amount: holdings[asset.id].contributed }));
    const total = contributed.reduce((sum, item) => sum + item.amount, 0);
    const kinds = new Set(contributed.filter(item => item.amount > 1).map(item => item.asset.category));
    const largest = [...contributed].sort((a, b) => b.amount - a.amount)[0];
    if (largest && total > 1 && largest.amount / total > 0.6 && largest.asset.category === 'Stocks') {
        lessons.push(`Most of your invested money was in ${largest.asset.name}. When one company carries your portfolio, its bad years become your bad years.`);
    } else if (kinds.size >= 3) {
        lessons.push('You spread your money across different kinds of investments. When one fell, the others softened the drop.');
    } else if (total > 1) {
        lessons.push('Your money sat in only one or two kinds of investments. A wider mix can reduce the effect of any single drop.');
    }
    const drop = dropWindow(seed);
    const inDrop = meta.moves.filter(move => move.half >= drop.start && move.half < drop.end);
    if (inDrop.some(move => move.side === 'sell' && isRisky(move.id))) {
        lessons.push(`You sold during round ${drop.round}, the worst stretch for the market in your 20 years. Selling after a drop locks in the loss.`);
    } else if (inDrop.some(move => move.side === 'buy')) {
        lessons.push(`You kept buying during round ${drop.round}, the worst stretch for the market. Buying while prices are low gets you more shares for the same money.`);
    }
    if (value > 0 && cash / value > 0.35) lessons.push('A large share of your money stayed as cash. Cash never drops, and it never grows either.');
    if (rival > 0) {
        lessons.push(value >= rival
            ? 'You finished ahead of the Steady Investor, who put every paycheck into the Vestera Market Fund and never sold.'
            : 'The Steady Investor put every paycheck into the Vestera Market Fund and never sold. Compare that simple plan with how often you changed yours.');
    }
    return lessons.slice(0, 3);
}

export function getGame(userId: string, rawCode: string): GameSnapshot {
    const code = rawCode.trim().toUpperCase();
    syncRoom(code);
    const room = roomByCode(code);
    if (!room) throw new Error('Game not found.');
    const clock = clockOf(room);
    const rows = setup().prepare('SELECT * FROM game_players WHERE room_code = ? ORDER BY joined_at').all(code) as PlayerRow[];
    const mine = rows.find(player => player.user_id === userId);
    if (!mine) throw new Error('You are not in this game.');
    const seed = room.seed || 1;
    const started = clock.phase === 'event' || clock.phase === 'playing' || clock.phase === 'finished';
    const curves = buildCurves(seed, clock.simHalf);
    const prices = ASSETS.map((_, index) => priceAt(curves, index, clock.simHalf, clock.progress, seed));
    const roundStartHalf = (clock.round - 1) * HALVES_PER_ROUND;
    const roundStartPrices = ASSETS.map((_, index) => priceAt(curves, index, Math.min(roundStartHalf, TOTAL_HALVES), 0, seed));
    const holdings = readHoldings(mine.holdings_json);
    const meta = readMeta(mine.decisions_json);
    const mineValue = valueOf(mine.cash, holdings, prices);
    const rival = started ? computerValue(curves, prices, clock.paidThrough, seed) : 0;
    const contributed = paidTotal(clock.paidThrough);

    const standings = rows.map(player => ({
        userId: player.user_id,
        name: player.display_name,
        portfolioValue: valueOf(player.cash, readHoldings(player.holdings_json), prices).value,
        isHost: player.user_id === room.host_id,
        isYou: player.user_id === userId,
        isComputer: false,
    }));
    if (started) standings.push({ userId: COMPUTER_ID, name: COMPUTER_NAME, portfolioValue: rival, isHost: false, isYou: false, isComputer: true });
    standings.sort((a, b) => b.portfolioValue - a.portfolioValue);
    const players = standings.map((player, index) => ({ ...player, rank: index + 1 }));
    const myRank = players.find(player => player.isYou)?.rank ?? 1;

    const assets: AssetView[] = assetsFor(seed).map((asset, index) => {
        const unlocked = asset.unlockRound <= clock.round;
        const owned = holdings[asset.id].units * prices[index];
        const history: number[] = [];
        for (let half = Math.max(0, clock.simHalf - 2); half <= Math.min(clock.simHalf, TOTAL_HALVES - 1); half += 1) {
            for (let step = 0; step < 10; step += 1) {
                const at = step / 10;
                if (half < clock.simHalf || at <= clock.progress) history.push(priceAt(curves, index, half, at, seed));
            }
        }
        history.push(prices[index]);
        return {
            id: asset.id,
            name: asset.name,
            category: asset.category,
            description: asset.description,
            risk: asset.risk,
            unlockRound: asset.unlockRound,
            unlocked,
            price: prices[index],
            changePct: ((prices[index] - roundStartPrices[index]) / roundStartPrices[index]) * 100,
            totalChangePct: ((prices[index] - asset.start) / asset.start) * 100,
            history: history.length > 1 ? history : [prices[index], prices[index]],
            units: holdings[asset.id].units,
            owned,
            contributed: holdings[asset.id].contributed,
            profit: owned - holdings[asset.id].contributed,
            inNews: false,
        };
    });

    const base = Math.max(mineValue.value, 0.01);
    const mix = [
        { id: 'CASH', name: 'Cash', value: mine.cash },
        ...assets.filter(asset => asset.owned >= 0.5).map(asset => ({ id: asset.id, name: asset.name, value: asset.owned })),
    ].filter(part => part.value >= 0.5).map(part => ({ ...part, pct: (part.value / base) * 100 }));

    const fundIndex = ASSET_IDS.indexOf('VMKT');
    const fundMove = assets[fundIndex].changePct;
    const marketStatus: GameSnapshot['marketStatus'] = clock.phase === 'lobby' || clock.phase === 'briefing'
        ? 'Opening soon'
        : clock.phase === 'event' ? 'Paused'
            : clock.phase === 'finished' ? 'Closed'
                : fundMove > 1 ? 'Rising' : fundMove < -1 ? 'Falling' : 'Steady';

    const roundEndsAt = clock.phase === 'playing' && clock.market.roundStartedAt
        ? clock.market.roundStartedAt + HALVES_PER_ROUND * halfMs(clock.slow)
        : null;
    const inRoundHalf = clock.simHalf - roundStartHalf;
    const nextPayAt = clock.phase === 'playing' && clock.market.roundStartedAt && inRoundHalf + 1 < HALVES_PER_ROUND
        ? clock.market.roundStartedAt + (inRoundHalf + 1) * halfMs(clock.slow)
        : null;
    const year = clock.phase === 'finished' ? TOTAL_YEARS : Math.min(TOTAL_YEARS, Math.floor(clock.simHalf / 2) + 1);

    return {
        code,
        phase: clock.phase,
        slowMode: clock.slow,
        isHost: room.host_id === userId,
        canStart: room.host_id === userId && clock.phase === 'lobby',
        round: clock.round,
        totalRounds: TOTAL_ROUNDS,
        year,
        totalYears: TOTAL_YEARS,
        roundEndsAt: roundEndsAt ? new Date(roundEndsAt).toISOString() : null,
        pauseEndsAt: (clock.phase === 'event' || clock.phase === 'briefing') && clock.market.pauseEndsAt ? new Date(clock.market.pauseEndsAt).toISOString() : null,
        nextPayAt: nextPayAt ? new Date(nextPayAt).toISOString() : null,
        nextPayAmount: nextPayAt ? paycheck(clock.simHalf + 1) : null,
        marketStatus,
        roundInfo: started ? roundView(clock.round, seed) : null,
        paycheckNotice: clock.phase === 'playing' && clock.progress < 0.25
            ? `You received ${paycheck(clock.simHalf).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}. Where should it go?`
            : null,
        me: {
            userId,
            name: mine.display_name,
            cash: mine.cash,
            invested: mineValue.invested,
            contributed,
            portfolioValue: mineValue.value,
            gain: mineValue.value - contributed,
            gainPct: contributed > 0 ? ((mineValue.value - contributed) / contributed) * 100 : 0,
            rank: myRank,
        },
        assets,
        mix,
        achievements: achievementsFor(meta, clock.round, clock.phase === 'finished', mineValue.value, rival, seed),
        players,
        ...(clock.phase === 'finished' ? {
            results: {
                finalValue: mineValue.value,
                contributed,
                gain: mineValue.value - contributed,
                returnPct: contributed > 0 ? ((mineValue.value - contributed) / contributed) * 100 : 0,
                rank: myRank,
                computerValue: rival,
                lessons: lessonsFor(meta, holdings, mineValue.value, mine.cash, rival, seed),
                mix: mix.map(part => ({ name: part.name, pct: part.pct })),
                era: { startYear: startYearOf(seed), endYear: startYearOf(seed) + TOTAL_YEARS - 1 },
                reveal: assetsFor(seed)
                    .map((asset, index) => ({ asset, index, company: companyAt(index, seed) }))
                    .filter(({ asset, company }) => asset.id === 'VMKT' || company)
                    .map(({ asset, index, company }) => {
                        const curve = curves[index];
                        const startYear = startYearOf(seed);
                        const endYear = startYear + TOTAL_YEARS - 1;
                        const note = !company ? null
                            : company.fate === 'bankrupt' && company.lastYear <= endYear ? `Went bankrupt in ${company.lastYear}`
                            : company.firstYear >= startYear ? `First sold shares in ${company.firstYear}`
                            : null;
                        return {
                            id: asset.id,
                            codeName: asset.name,
                            realName: company ? company.realName : 'S&P 500 index',
                            changePct: ((curve[curve.length - 1] - asset.start) / asset.start) * 100,
                            note,
                        };
                    }),
            },
        } : {}),
    };
}
