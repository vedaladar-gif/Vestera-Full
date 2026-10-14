'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import VestaBlob from '@/components/VestaBlob';
import {
    BOSS, CARD_INFO, GUARD_HEAL, INTENTS, ROUNDS, START_COINS, TREAT_COST,
    attackDamage, canMove, canPlay, cardText, defeatTip, finish, idleGame, introTip,
    move, play, rank, rematch, score, startFight, startGame, strikeDamage,
    type CardId, type Fight, type Game, type Line, type Move,
} from './logic';
import styles from './piggyBankBoss.module.css';

const BEST_KEY = 'vestera-piggy-bank-boss-best';

const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}`;

function amountText(line: Line): string {
    if (line.amount === null || line.unit === null) return '';
    const n = Math.abs(line.amount);
    const word = line.unit === 'hp' ? 'health'
        : line.unit === 'star' ? (n === 1 ? 'star' : 'stars')
        : (n === 1 ? 'coin' : 'coins');
    return `${signed(line.amount)} ${word}`;
}

function toneClass(line: Line): string {
    if (line.unit === 'star') return styles.star;
    const tone = line.tone ?? ((line.amount ?? 0) >= 0 ? 'good' : 'bad');
    return tone === 'good' ? styles.up : styles.down;
}

function VestaTip({ children }: { children: ReactNode }) {
    return (
        <div className={styles.vesta}>
            <VestaBlob mini size={34} />
            <p>
                <span className={styles.vestaName}>Vesta</span>
                {children}
            </p>
        </div>
    );
}

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
    return (
        <div className={styles.stat}>
            <span>{label}</span>
            <b>{value}</b>
            {note && <small>{note}</small>}
        </div>
    );
}

function Hud({ g }: { g: Game }) {
    const week = Math.min(g.round + 1, ROUNDS);
    return (
        <div className={styles.hud}>
            <div className={styles.progress}>
                <span>Week {week} of {ROUNDS}</span>
                <div className={styles.track} role="img" aria-label={`${g.round} of ${ROUNDS} weeks finished`}>
                    <i style={{ width: `${(g.round / ROUNDS) * 100}%` }} />
                </div>
            </div>
            <div className={styles.stats}>
                <Stat label="Coins" value={g.coins} />
                <Stat label="Stars" value={g.stars} />
            </div>
            {g.fund && <span className={styles.fundBadge}>Emergency fund active: your next bad surprise is blocked</span>}
        </div>
    );
}

function Events({ lines }: { lines: Line[] }) {
    return (
        <div className={styles.events}>
            {lines.map((line, i) => (
                <div className={styles.ev} key={i}>
                    <span>{line.text}</span>
                    {line.amount !== null && <b className={toneClass(line)}>{amountText(line)}</b>}
                </div>
            ))}
        </div>
    );
}

function Fighter({ role, name, hp, max, popup, turn, boss }: {
    role: string; name: string; hp: number; max: number; popup: Fight['popups']['hero']; turn: number; boss?: boolean;
}) {
    return (
        <div className={`${styles.fighter} ${boss ? styles.boss : ''}`}>
            <span className={styles.role}>{role}</span>
            <div className={styles.fighterName}>{name}</div>
            <div className={styles.hpNumber}>{hp}<small> / {max}</small></div>
            <div className={styles.bar} role="img" aria-label={`${name} health ${hp} of ${max}`}>
                <i style={{ width: `${Math.round((hp / max) * 100)}%` }} />
            </div>
            {popup && (
                <span key={turn} className={`${styles.popup} ${popup.tone === 'good' ? styles.popGood : styles.popBad}`}>{popup.text}</span>
            )}
        </div>
    );
}

function CoinChart({ history }: { history: number[] }) {
    const max = Math.max(...history);
    return (
        <div className={styles.chartBox}>
            <div className={styles.chart} role="img" aria-label={`Your coins at the end of each week: ${history.join(', ')}`}>
                {history.map((coins, i) => (
                    <div key={i} style={{ height: `${Math.max(8, Math.round((coins / max) * 100))}%` }}><span>{coins}</span></div>
                ))}
            </div>
            <div className={styles.chartLabels} aria-hidden>
                {history.map((_, i) => <span key={i}>{i}</span>)}
            </div>
            <div className={styles.chartCaption}>Coins at the end of each week (0 is the start)</div>
        </div>
    );
}

function tagText(id: CardId): string {
    return CARD_INFO[id].tag;
}

export default function PiggyBankBossPage() {
    const [g, setG] = useState<Game>(idleGame);
    const [best, setBest] = useState<number | null>(null);
    const [isNewBest, setIsNewBest] = useState(false);

    const fight = g.fight;
    const total = g.phase === 'end' ? score(g).total : 0;

    // Save the best score on this device. Storage can be blocked, so every access is guarded.
    useEffect(() => {
        if (g.phase !== 'end' || g.fight?.won !== true) {
            setIsNewBest(false);
            return;
        }
        try {
            const old = Number(window.localStorage.getItem(BEST_KEY));
            const prev = Number.isFinite(old) && old > 0 ? old : null;
            if (prev === null || total > prev) {
                window.localStorage.setItem(BEST_KEY, String(total));
                setBest(total);
                setIsNewBest(prev !== null);
            } else {
                setBest(prev);
                setIsNewBest(false);
            }
        } catch {
            setBest(null);
            setIsNewBest(false);
        }
    }, [g.phase, g.fight?.won, total]);

    let screen: ReactNode = null;

    if (g.phase === 'start') {
        screen = (
            <>
                <div className={styles.mascot}><VestaBlob size={64} /></div>
                <h1>Piggy Bank <em>Boss</em></h1>
                <p>
                    Start with {START_COINS} coins. Each week you get 3 cards. Pick one, then a surprise happens.
                    After week {ROUNDS}, you fight {BOSS.name} {BOSS.title}.
                </p>
                <div className={styles.how}>
                    <div>
                        <strong>Coins become health</strong>
                        <span>Saved coins earn interest, so they grow faster the more you have.</span>
                    </div>
                    <div>
                        <strong>Stars become power</strong>
                        <span>A treat costs {TREAT_COST} coins and earns 1 star. Stars give you harder hits and Power Strikes.</span>
                    </div>
                    <div>
                        <strong>Outsmart Gobbles</strong>
                        <span>He shows his next move every turn. Pick the right answer to it.</span>
                    </div>
                </div>
                <button className={styles.primary} autoFocus onClick={() => setG(startGame())}>Start game</button>
            </>
        );
    } else if (g.phase === 'choose') {
        screen = (
            <>
                <Hud g={g} />
                {g.last && (
                    <div className={styles.recap}>
                        <span className={styles.recapTitle}>Last week</span>
                        <Events lines={g.last.lines} />
                        <p className={styles.recapTip}><b>Vesta:</b> {g.last.tip}</p>
                    </div>
                )}
                <h2>Pick a card</h2>
                <div className={styles.cards}>
                    {g.hand.map((id, i) => {
                        const ok = canPlay(g, id);
                        return (
                            <button
                                key={id}
                                className={`${styles.cardBtn} ${CARD_INFO[id].risky ? styles.cardRisky : ''}`}
                                disabled={!ok}
                                autoFocus={i === 0}
                                onClick={() => setG(play(g, id))}
                            >
                                <strong>{CARD_INFO[id].title}</strong>
                                <span>{cardText(g, id)}</span>
                                <em>{ok ? tagText(id) : 'Not available'}</em>
                            </button>
                        );
                    })}
                </div>
            </>
        );
    } else if (g.phase === 'boss-intro' && fight) {
        screen = (
            <>
                <p className={styles.eyebrow}>Final fight</p>
                <h2>{BOSS.name} {BOSS.title}</h2>
                {g.last && (
                    <div className={styles.recap}>
                        <span className={styles.recapTitle}>Week {ROUNDS}</span>
                        <Events lines={g.last.lines} />
                    </div>
                )}
                <div className={styles.stats3}>
                    <Stat label="Health" value={fight.heroMax} note={`from ${g.coins} coins`} />
                    <Stat label="Attack" value={fight.power} note={`from ${g.stars} ${g.stars === 1 ? 'star' : 'stars'}`} />
                    <Stat label="Power Strikes" value={fight.strikesMax} note="one use each" />
                </div>
                <div className={styles.how}>
                    <div><strong>Attack</strong><span>A normal hit. Always available.</span></div>
                    <div><strong>Power Strike</strong><span>About {strikeDamage(fight.power)} damage. You only have a few. Best against Counting Coins.</span></div>
                    <div><strong>Guard</strong><span>Blocks Coin Grab and Mega Gobble, and heals you {GUARD_HEAL}.</span></div>
                </div>
                <VestaTip>{introTip(g)}</VestaTip>
                <button className={styles.primary} autoFocus onClick={() => setG(startFight(g))}>Start fight</button>
            </>
        );
    } else if (g.phase === 'battle' && fight) {
        const intent = INTENTS[fight.intent];
        const moves: { id: Move; title: string; note: string }[] = [
            { id: 'attack', title: 'Attack', note: `About ${attackDamage(fight.power)} damage` },
            { id: 'strike', title: 'Power Strike', note: fight.strikes > 0 ? `About ${strikeDamage(fight.power)} damage · ${fight.strikes} left` : 'None left' },
            { id: 'guard', title: 'Guard', note: `Block, heal ${GUARD_HEAL}` },
        ];
        screen = (
            <>
                <h2>{fight.over ? (fight.won ? 'Victory' : `${BOSS.name} wins this round`) : `Turn ${fight.turns + 1}`}</h2>
                <div className={styles.arena}>
                    <Fighter role="You" name="Your piggy bank" hp={fight.hero} max={fight.heroMax} popup={fight.popups.hero} turn={fight.turns} />
                    <Fighter role="Boss" name={BOSS.name} hp={fight.boss} max={fight.bossMax} popup={fight.popups.boss} turn={fight.turns} boss />
                </div>
                {!fight.over && (
                    <div className={`${styles.intent} ${styles[`intent_${fight.intent}`]}`}>
                        <span className={styles.intentLabel}>Gobbles plans</span>
                        <strong>{intent.label}</strong>
                        <span>{intent.hint}</span>
                    </div>
                )}
                {fight.turns > 0 && <Events lines={fight.lines} />}
                {fight.over ? (
                    <button className={styles.primary} autoFocus onClick={() => setG(finish(g))}>
                        {fight.won ? 'See my results' : 'See what happened'}
                    </button>
                ) : (
                    <div className={styles.moves}>
                        {moves.map((m, i) => (
                            <button
                                key={m.id}
                                className={`${styles.moveBtn} ${styles[`move_${m.id}`]}`}
                                disabled={!canMove(fight, m.id)}
                                autoFocus={i === 0}
                                onClick={() => setG(move(g, m.id))}
                            >
                                <strong>{m.title}</strong>
                                <span>{m.note}</span>
                            </button>
                        ))}
                    </div>
                )}
            </>
        );
    } else if (g.phase === 'end' && fight) {
        const won = fight.won === true;
        const r = rank(g);
        const result = score(g);
        screen = (
            <>
                <span className={styles.badge}>{won ? r.name : 'Try again'}</span>
                <h2>{won ? `You beat ${BOSS.name}` : `${BOSS.name} won this time`}</h2>
                <div className={styles.scoreTable}>
                    {result.rows.map(row => (
                        <div key={row.label}><span>{row.label}</span><b>{row.value}</b></div>
                    ))}
                    <div className={styles.scoreTotal}><span>Total score</span><b>{result.total}</b></div>
                </div>
                {won && (
                    <p className={styles.bestLine}>
                        {isNewBest ? 'New best score.' : best !== null ? `Best on this device: ${best}` : ''}
                    </p>
                )}
                <CoinChart history={g.history} />
                <VestaTip>{won ? r.message : defeatTip(g)}</VestaTip>
                <div className={styles.endButtons}>
                    <button className={`${styles.primary} ${styles.attack}`} autoFocus onClick={() => setG(rematch(g))}>Rematch</button>
                    <button className={`${styles.primary} ${styles.ghost}`} onClick={() => setG(startGame())}>New game</button>
                </div>
                <p className={styles.footnote}>Rematch keeps your {g.coins} coins and {g.stars} {g.stars === 1 ? 'star' : 'stars'}. New game starts over.</p>
            </>
        );
    }

    return (
        <main className={styles.page}>
            <div className={styles.wrap}>
                <Link href="/games" className={styles.back}>Back to Games</Link>
                <section className={styles.card} aria-live="polite">{screen}</section>
                <p className={styles.footnote}>Free to play. No real money, ever.</p>
            </div>
        </main>
    );
}
