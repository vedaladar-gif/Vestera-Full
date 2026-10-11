'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import VestaBlob from '@/components/VestaBlob';
import {
    BOSS, LOW_COINS_TIP, ROUNDS, SPEND_COST,
    attack, canSpend, defeatTip, finish, idleGame, introTip, next, play, rank, startFight, startGame,
    type Choice, type Fight, type Game, type Line,
} from './logic';
import styles from './piggyBankBoss.module.css';

const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}`;

function VestaTip({ children }: { children: ReactNode }) {
    return (
        <div className={styles.vesta}>
            <VestaBlob mini size={40} />
            <div className={styles.bubble}>
                <span className={styles.vestaName}>Vesta</span>
                {children}
            </div>
        </div>
    );
}

function Stat({ value, label }: { value: string; label: string }) {
    return (
        <div className={styles.stat}>
            <b>{value}</b>
            <span>{label}</span>
        </div>
    );
}

function Hud({ g }: { g: Game }) {
    const week = g.phase === 'result' ? g.round : Math.min(g.round + 1, ROUNDS);
    return (
        <>
            <div className={styles.hud}>
                <Stat value={`${week}/${ROUNDS}`} label="Week" />
                <Stat value={`🪙 ${g.coins}`} label="Coins" />
                <Stat value={`⭐ ${g.stars}`} label="Stars" />
            </div>
            <div className={styles.dots} aria-hidden>
                {Array.from({ length: ROUNDS }, (_, i) => (
                    <i key={i} className={i < g.round ? styles.done : i === g.round ? styles.now : undefined} />
                ))}
            </div>
        </>
    );
}

function Events({ lines }: { lines: Line[] }) {
    return (
        <div className={styles.events}>
            {lines.map((line, i) => {
                const tone = line.unit === 'star' ? styles.star : (line.tone ?? ((line.amount ?? 0) >= 0 ? 'good' : 'bad')) === 'good' ? styles.up : styles.down;
                const unit = line.unit === 'star' ? '⭐' : line.unit === 'hp' ? '❤️' : '🪙';
                return (
                    <div className={styles.ev} key={i}>
                        <span className={styles.evEmoji} aria-hidden>{line.emoji}</span>
                        <span className={styles.evText}>{line.text}</span>
                        {line.amount !== null && <span className={`${styles.evAmount} ${tone}`}>{signed(line.amount)} {unit}</span>}
                    </div>
                );
            })}
        </div>
    );
}

function Fighter({ emoji, name, hp, max, shake, boss }: { emoji: string; name: string; hp: number; max: number; shake: boolean; boss?: boolean }) {
    return (
        <div className={`${styles.fighter} ${boss ? styles.boss : ''} ${shake ? styles.shake : ''}`}>
            <div className={styles.fighterEmoji} aria-hidden>{emoji}</div>
            <div className={styles.fighterName}>{name}</div>
            <div className={styles.bar} role="img" aria-label={`${name} health ${hp} of ${max}`}>
                <i style={{ width: `${Math.round((hp / max) * 100)}%` }} />
            </div>
            <div className={styles.hp}>❤️ {hp} / {max}</div>
        </div>
    );
}

function CoinChart({ history }: { history: number[] }) {
    const max = Math.max(...history);
    return (
        <div className={styles.chartBox}>
            <div className={styles.chart} role="img" aria-label={`Your coins each week: ${history.join(', ')}`}>
                {history.map((coins, i) => (
                    <div key={i} style={{ height: `${Math.max(8, Math.round((coins / max) * 100))}%` }}><span>{coins}</span></div>
                ))}
            </div>
            <div className={styles.chartLabels} aria-hidden>
                {history.map((_, i) => <span key={i}>{i === 0 ? 'Go' : i}</span>)}
            </div>
            <div className={styles.chartCaption}>Your coins, week by week</div>
        </div>
    );
}

export default function PiggyBankBossPage() {
    const [g, setG] = useState<Game>(idleGame);

    const choose = (choice: Choice) => setG(play(g, choice));
    const fight: Fight | null = g.fight;

    let screen: ReactNode = null;

    if (g.phase === 'start') {
        screen = (
            <>
                <div className={styles.piggy}>🐷</div>
                <h1>Piggy Bank <em>Boss</em></h1>
                <p>You have <b>10 coins</b> and <b>{ROUNDS} weeks</b>. Each week, save or spend. Then a surprise happens!</p>
                <p>At the end you fight <b>{BOSS.name} {BOSS.title}</b> {BOSS.emoji}. <b>🪙 Coins</b> give you ❤️ health. <b>⭐ Stars</b> give you ⚔️ power.</p>
                <VestaTip>Hi, I’m Vesta! Saving makes your coins grow. Spending gets you stars. You need both to win!</VestaTip>
                <button className={styles.primary} autoFocus onClick={() => setG(startGame())}>Let’s play →</button>
            </>
        );
    } else if (g.phase === 'choose') {
        const canTreat = canSpend(g);
        screen = (
            <>
                <Hud g={g} />
                <div className={styles.piggy}>🐷</div>
                <h2>What will you do this week?</h2>
                <div className={styles.choices}>
                    <button className={`${styles.choice} ${styles.save}`} autoFocus onClick={() => choose('save')}>
                        <span className={styles.big}>🏦</span>Save it<small>Your coins grow</small>
                    </button>
                    <button className={`${styles.choice} ${styles.spend}`} disabled={!canTreat} onClick={() => choose('spend')}>
                        <span className={styles.big}>🍦</span>Spend it
                        <small>{canTreat ? `Costs ${SPEND_COST} coins · get a star` : 'Not enough coins'}</small>
                    </button>
                </div>
                <p className={styles.hint}>🪙 Coins = ❤️ health &nbsp;·&nbsp; ⭐ Stars = ⚔️ power</p>
                {!canTreat && <VestaTip>{LOW_COINS_TIP}</VestaTip>}
            </>
        );
    } else if (g.phase === 'result' && g.last) {
        const lastWeek = g.round >= ROUNDS;
        screen = (
            <>
                <Hud g={g} />
                <div className={`${styles.piggy} ${g.last.choice === 'save' ? styles.wiggle : styles.hop}`}>🐷</div>
                <h2>Week {g.round} done!</h2>
                <Events lines={g.last.lines} />
                <VestaTip>{g.last.tip}</VestaTip>
                <button className={styles.primary} autoFocus onClick={() => setG(next(g))}>
                    {lastWeek ? `Meet the boss! ${BOSS.emoji}` : 'Next week →'}
                </button>
            </>
        );
    } else if (g.phase === 'boss-intro' && fight) {
        screen = (
            <>
                <div className={`${styles.piggy} ${styles.wiggle}`}>{BOSS.emoji}</div>
                <h2>Boss time!</h2>
                <p><b>{BOSS.name}</b> {BOSS.title} wants your coins!</p>
                <div className={`${styles.hud} ${styles.hudTwo}`}>
                    <Stat value={`❤️ ${fight.heroMax}`} label="Your health" />
                    <Stat value={`⚔️ ${fight.power}`} label="Your power" />
                </div>
                <p className={styles.hint}>
                    🪙 {g.coins} coins became ❤️ {fight.heroMax} health<br />
                    ⭐ {g.stars} stars became ⚔️ {fight.power} power
                </p>
                <VestaTip>{introTip(g)}</VestaTip>
                <button className={styles.primary} autoFocus onClick={() => setG(startFight(g))}>Fight! ⚔️</button>
            </>
        );
    } else if (g.phase === 'battle' && fight) {
        screen = (
            <>
                <h2>{fight.over ? (fight.won ? 'Victory! 🎉' : `${BOSS.name} wins this round!`) : 'Battle!'}</h2>
                <div className={styles.arena}>
                    {/* keyed by turn so the shake animation replays on every hit */}
                    <Fighter key={`you-${fight.turns}`} emoji="🐷" name="You" hp={fight.hero} max={fight.heroMax} shake={fight.hit === 'both'} />
                    <div className={styles.vs}>VS</div>
                    <Fighter key={`boss-${fight.turns}`} emoji={BOSS.emoji} name={BOSS.name} hp={fight.boss} max={fight.bossMax} shake={fight.hit !== 'none'} boss />
                </div>
                {fight.turns === 0 ? <p>Tap attack to hit {BOSS.name}!</p> : <Events lines={fight.lines} />}
                {fight.over ? (
                    <button className={styles.primary} autoFocus onClick={() => setG(finish(g))}>
                        {fight.won ? 'See my results 🏆' : 'See what happened'}
                    </button>
                ) : (
                    <button className={`${styles.primary} ${styles.attack}`} autoFocus onClick={() => setG(attack(g))}>⚔️ Attack!</button>
                )}
            </>
        );
    } else if (g.phase === 'end') {
        const won = fight?.won === true;
        const r = rank(g);
        screen = (
            <>
                <div className={`${styles.piggy} ${styles.wiggle}`}>{won ? '🐷' : '💪'}</div>
                <h2>{won ? `You beat ${BOSS.name}!` : 'Try again, champ!'}</h2>
                <div className={styles.titleBadge}>{won ? r.name : 'Almost had him! 💪'}</div>
                <div className={`${styles.hud} ${styles.hudTwo}`}>
                    <Stat value={`🪙 ${g.coins}`} label="Coins" />
                    <Stat value={`⭐ ${g.stars}`} label="Stars" />
                </div>
                <CoinChart history={g.history} />
                <VestaTip>{won ? r.message : defeatTip(g)}</VestaTip>
                <button className={styles.primary} autoFocus onClick={() => setG(startGame())}>Play again 🔁</button>
            </>
        );
    }

    return (
        <main className={styles.page}>
            <div className={styles.wrap}>
                <Link href="/games" className={styles.back}>← All games</Link>
                <section className={styles.card} aria-live="polite">{screen}</section>
                <p className={styles.footnote}>Free to play · No real money, ever</p>
            </div>
        </main>
    );
}