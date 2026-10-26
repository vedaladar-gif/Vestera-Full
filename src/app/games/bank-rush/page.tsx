'use client';

import Link from 'next/link';
import { useEffect, useReducer, useRef, useState } from 'react';
import {
    LEVELS, challengeOf, initialState, levelOf, reducer, reputation,
    type AccountChallenge, type Challenge, type Look, type MathChallenge, type TellerChallenge,
} from './logic';
import styles from './bankRush.module.css';

function playTone(kind: 'ok' | 'no' | 'fanfare') {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = kind === 'ok' ? [523, 659] : kind === 'no' ? [196, 164] : [523, 659, 784, 1046];
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const at = ctx.currentTime + i * 0.11;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.07, at + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.28);
        osc.connect(gain).connect(ctx.destination);
        osc.start(at);
        osc.stop(at + 0.3);
    });
}

function useRoll(from: number, to: number, active: boolean, skip: boolean) {
    const [value, setValue] = useState(from);
    useEffect(() => {
        if (!active) {
            setValue(from);
            return;
        }
        if (skip || from === to) {
            setValue(to);
            return;
        }
        const start = performance.now();
        let frame = 0;
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / 800);
            setValue(Math.round(from + (to - from) * t));
            if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [from, to, active, skip]);
    return value;
}

const LOOK: Record<Look, { skin: string; hair: string; shirt: string; style: 'long' | 'short' | 'pigtail' | 'bob' | 'curly' }> = {
    maya: { skin: '#F6C7A4', hair: '#4A2C17', shirt: '#4576E7', style: 'long' },
    jordan: { skin: '#8D5524', hair: '#1B1B1B', shirt: '#1C8C5A', style: 'short' },
    ava: { skin: '#F3D0B5', hair: '#C45C26', shirt: '#E2B043', style: 'pigtail' },
    emma: { skin: '#E7B48A', hair: '#2A1A12', shirt: '#6E63C6', style: 'bob' },
    leo: { skin: '#C68642', hair: '#5A3A28', shirt: '#2F6F8F', style: 'curly' },
    sophia: { skin: '#F6C7A4', hair: '#1E244E', shirt: '#C24545', style: 'long' },
};

function Person({ look, mood }: { look: Look; mood: 'wait' | 'happy' | 'oops' }) {
    const p = LOOK[look];
    const hair = p.style === 'short'
        ? <path d="M36 58c2-22 16-34 28-34s24 10 22 32c-8-8-16-10-24-8-8-2-16 0-26 10z" fill={p.hair} />
        : p.style === 'pigtail'
            ? <><path d="M40 64c0-24 10-38 22-38s20 12 20 34c-6-10-14-12-20-10-8-4-16-2-22 14z" fill={p.hair} /><circle cx="28" cy="78" r="10" fill={p.hair} /><circle cx="94" cy="78" r="10" fill={p.hair} /></>
            : p.style === 'bob'
                ? <path d="M32 70c0-28 12-44 28-44s28 16 28 44c0 8-4 10-8 8 0-16-8-24-20-24s-20 8-20 24c-4 2-8 0-8-8z" fill={p.hair} />
                : p.style === 'curly'
                    ? <><circle cx="42" cy="48" r="12" fill={p.hair} /><circle cx="60" cy="40" r="13" fill={p.hair} /><circle cx="78" cy="48" r="12" fill={p.hair} /><circle cx="48" cy="60" r="10" fill={p.hair} /><circle cx="72" cy="60" r="10" fill={p.hair} /></>
                    : <path d="M34 78c2-36 14-52 28-52s26 16 28 52c-2 18-8 36-14 48-4-20-8-28-14-28s-10 8-14 28c-6-12-12-30-14-48z" fill={p.hair} />;
    return (
        <svg className={`${styles.person} ${styles[mood]}`} viewBox="0 0 120 190" aria-hidden>
            <ellipse cx="60" cy="180" rx="30" ry="6" fill="rgba(30,36,78,.18)" />
            <path d="M36 100h48v48a12 12 0 0 1-12 12H48a12 12 0 0 1-12-12z" fill={p.shirt} />
            <circle cx="60" cy="70" r="28" fill={p.skin} />
            {hair}
            <circle cx="50" cy="70" r="3" fill="#1E244E" />
            <circle cx="70" cy="70" r="3" fill="#1E244E" />
            {mood === 'oops'
                ? <path d="M50 86q10-8 20 0" fill="none" stroke="#1E244E" strokeWidth="2.5" strokeLinecap="round" />
                : <path d="M50 84q10 10 20 0" fill="none" stroke="#1E244E" strokeWidth="2.5" strokeLinecap="round" />}
        </svg>
    );
}

function Muncher({ pose }: { pose: 'peek' | 'taunt' | 'gone' }) {
    return (
        <svg className={`${styles.muncher} ${styles[pose]}`} viewBox="0 0 140 120" aria-hidden>
            <ellipse cx="70" cy="78" rx="52" ry="36" fill="#5C4D92" />
            <circle cx="48" cy="62" r="8" fill="#fff" />
            <circle cx="92" cy="62" r="8" fill="#fff" />
            <circle cx="50" cy="64" r="3.5" fill="#1E244E" />
            <circle cx="94" cy="64" r="3.5" fill="#1E244E" />
            <path d="M40 86h60l-8 16H48z" fill="#2A2348" />
            <circle cx="52" cy="96" r="6" fill="#E2B043" />
            <circle cx="70" cy="100" r="6" fill="#F6D56B" />
            <circle cx="88" cy="96" r="6" fill="#E2B043" />
            <path d="M18 40l14 8-14 6z" fill="#5C4D92" />
            <path d="M122 40l-14 8 14 6z" fill="#5C4D92" />
        </svg>
    );
}

function Bills({ count }: { count: number }) {
    return (
        <span className={styles.bills} aria-hidden>
            {Array.from({ length: Math.min(4, Math.max(1, Math.round(count / 15))) }, (_, i) => <i key={i} />)}
        </span>
    );
}

function money(n: number) {
    return `$${n}`;
}

function TellerBoard({ challenge, revealed, skip }: { challenge: TellerChallenge; revealed: boolean; skip: boolean }) {
    const account = useRoll(challenge.account, challenge.afterAccount, revealed, skip);
    const cash = useRoll(challenge.cash, challenge.afterCash, revealed, skip);
    const direction = revealed
        ? (challenge.correctId === 'deposit' ? styles.toAccount : styles.toCash)
        : '';
    return (
        <div className={`${styles.piles} ${direction}`}>
            <div className={styles.pile}>
                <span>Account</span>
                <strong>{money(account)}</strong>
                <Bills count={account} />
            </div>
            <div className={styles.pile}>
                <span>Cash in hand</span>
                <strong>{money(cash)}</strong>
                <Bills count={Math.max(cash, 1)} />
            </div>
        </div>
    );
}

function AccountBoard({ challenge, revealed, skip }: { challenge: AccountChallenge; revealed: boolean; skip: boolean }) {
    const checking = useRoll(challenge.checking, challenge.afterChecking, revealed, skip);
    const savings = useRoll(challenge.savings, challenge.afterSavings, revealed, skip);
    return (
        <div className={styles.piles}>
            <div className={styles.pile}>
                <span>Checking now</span>
                <strong>{money(checking)}</strong>
            </div>
            <div className={styles.pile}>
                <span>Savings now</span>
                <strong>{money(savings)}</strong>
            </div>
        </div>
    );
}

export default function BankRushPage() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const rootRef = useRef<HTMLDivElement>(null);
    const heard = useRef('');
    const level = levelOf(state.level);
    const challenge = state.phase === 'play' || state.phase === 'result' ? challengeOf(state) : null;
    const mood = state.phase === 'result' ? (state.correct ? 'happy' : 'oops') : 'wait';

    useEffect(() => {
        const key = `${state.phase}:${state.choice}:${state.shielded}`;
        if (heard.current === key) return;
        heard.current = key;
        if (!state.sound) return;
        if (state.phase === 'result') playTone(state.correct ? 'ok' : 'no');
        if (state.phase === 'boss' && state.shielded) playTone('ok');
        if (state.phase === 'victory') playTone('fanfare');
    }, [state.phase, state.choice, state.correct, state.shielded, state.sound]);

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            const tag = (event.target as HTMLElement | null)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            if (event.key === 'f') {
                event.preventDefault();
                toggleFullscreen();
            }
            if (event.key === 'p') dispatch({ type: 'toggle', key: 'present' });
            if (event.key === 'm') dispatch({ type: 'toggle', key: 'sound' });
            if (state.phase === 'play' && challenge) {
                const ids = choiceIds(challenge);
                const n = Number(event.key);
                if (n >= 1 && n <= ids.length) dispatch({ type: 'choose', id: ids[n - 1] });
            }
            if (event.key === 'Enter') {
                if (state.phase === 'intro') dispatch({ type: 'begin' });
                if (state.phase === 'result') dispatch({ type: 'next' });
                if (state.phase === 'levelDone') dispatch({ type: 'continue' });
                if (state.phase === 'boss' && !state.shielded) dispatch({ type: 'shield' });
                if (state.phase === 'boss' && state.shielded) dispatch({ type: 'celebrate' });
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    function toggleFullscreen() {
        const node = rootRef.current;
        if (!node) return;
        if (document.fullscreenElement) void document.exitFullscreen();
        else void node.requestFullscreen?.();
    }

    return (
        <div ref={rootRef} className={`${styles.shell} ${state.present ? styles.present : ''} ${state.skip ? styles.skip : ''}`}>
            <div className={styles.topbar}>
                <Link href="/games" className={styles.back}>Back to Games</Link>
                <div className={styles.tools}>
                    <button type="button" onClick={() => dispatch({ type: 'toggle', key: 'sound' })}>{state.sound ? 'Sound on' : 'Sound off'}</button>
                    <button type="button" onClick={() => dispatch({ type: 'toggle', key: 'skip' })}>{state.skip ? 'Animations off' : 'Skip animation'}</button>
                    <button type="button" onClick={() => dispatch({ type: 'toggle', key: 'present' })}>{state.present ? 'Exit present' : 'Present'}</button>
                    <button type="button" onClick={toggleFullscreen}>Full screen</button>
                </div>
            </div>

            {state.phase === 'title' && <Title onStart={() => dispatch({ type: 'start' })} onHow={() => dispatch({ type: 'howto' })} />}
            {state.phase === 'howto' && <HowTo onClose={() => dispatch({ type: 'closeHow' })} />}
            {state.phase === 'intro' && (
                <Intro
                    level={state.level}
                    stars={state.stars}
                    solved={state.solved}
                    onBegin={() => dispatch({ type: 'begin' })}
                />
            )}
            {(state.phase === 'play' || state.phase === 'result') && challenge && (
                <Play
                    levelName={level.name}
                    level={state.level}
                    index={state.index}
                    stars={state.stars}
                    solved={state.solved}
                    challenge={challenge}
                    phase={state.phase}
                    choice={state.choice}
                    correct={state.correct}
                    skip={state.skip}
                    mood={mood}
                    onChoose={id => dispatch({ type: 'choose', id })}
                    onNext={() => dispatch({ type: 'next' })}
                />
            )}
            {state.phase === 'levelDone' && (
                <LevelDone
                    level={state.level}
                    earned={state.levelStars[state.level - 1]}
                    stars={state.stars}
                    onContinue={() => dispatch({ type: 'continue' })}
                />
            )}
            {state.phase === 'boss' && (
                <Boss
                    shielded={state.shielded}
                    stars={state.stars}
                    onShield={() => dispatch({ type: 'shield' })}
                    onCelebrate={() => dispatch({ type: 'celebrate' })}
                />
            )}
            {state.phase === 'victory' && (
                <Victory
                    stars={state.stars}
                    solved={state.solved}
                    levelStars={state.levelStars}
                    onAgain={() => dispatch({ type: 'restart' })}
                />
            )}
        </div>
    );
}

function choiceIds(challenge: Challenge) {
    if (challenge.kind === 'teller') return ['deposit', 'withdraw'];
    if (challenge.kind === 'accounts') return ['checking', 'savings'];
    if (challenge.kind === 'math') return challenge.options.map(String);
    return ['block', 'safe'];
}

function Hud({ level, levelName, index, stars, solved, customer }: {
    level: number; levelName: string; index: number; stars: number; solved: number; customer?: string;
}) {
    return (
        <header className={styles.hud}>
            <div>
                <p className={styles.kicker}>Level {level} of 3</p>
                <h2>{levelName}</h2>
            </div>
            <div className={styles.progress} aria-hidden>
                {[0, 1, 2].map(i => <i key={i} className={i < index || (i === index && customer) ? styles.pipOn : ''} />)}
                <span>{customer ? `${customer}` : `Customer ${index + 1} of 3`}</span>
            </div>
            <div className={styles.meters}>
                <div className={styles.starCount}><b>{stars}</b><span>/ 9 stars</span></div>
                <div className={styles.rep}>
                    <span>{reputation(solved)}</span>
                    <div className={styles.repTrack}><i style={{ width: `${(solved / 9) * 100}%` }} /></div>
                </div>
            </div>
        </header>
    );
}

function Title({ onStart, onHow }: { onStart: () => void; onHow: () => void }) {
    return (
        <section className={styles.titleScreen}>
            <div className={styles.skyline} aria-hidden>
                <span className={styles.tower} />
                <span className={styles.tower} />
                <span className={styles.tower} />
            </div>
            <Muncher pose="peek" />
            <p className={styles.kicker}>Vestera classroom game</p>
            <h1>Bank Rush!</h1>
            <p className={styles.tag}>Run your bank. Help your customers. Save the day!</p>
            <p className={styles.blurb}>
                One screen for the whole class. Students call out the answer. The presenter clicks.
                Three levels, about 6 to 8 minutes.
            </p>
            <div className={styles.titleActions}>
                <button type="button" className={styles.primary} onClick={onStart}>Start game</button>
                <button type="button" className={styles.secondary} onClick={onHow}>How to play</button>
            </div>
        </section>
    );
}

function HowTo({ onClose }: { onClose: () => void }) {
    return (
        <section className={styles.panel}>
            <p className={styles.kicker}>For the presenter</p>
            <h1>How to play</h1>
            <ul className={styles.howList}>
                <li>Put this on the classroom TV. Students do not need phones.</li>
                <li>Read the customer’s request. Let the class talk, then click their choice.</li>
                <li>A correct first choice earns 1 star. A miss still teaches the right move.</li>
                <li>Nothing moves on until you press Next customer. There is no timer.</li>
                <li>Keys: 1, 2, and 3 pick an answer. Enter continues. M mutes. F is full screen. P hides the website menu.</li>
            </ul>
            <button type="button" className={styles.primary} onClick={onClose}>Back</button>
        </section>
    );
}

function Intro({ level, stars, solved, onBegin }: { level: number; stars: number; solved: number; onBegin: () => void }) {
    const info = levelOf(level);
    return (
        <section className={styles.panel}>
            <Hud level={level} levelName={info.name} index={0} stars={stars} solved={solved} />
            <p className={styles.kicker}>{info.kicker}</p>
            <h1>{info.name}</h1>
            <p className={styles.blurb}>{info.intro}</p>
            {level === 2 && <Muncher pose="taunt" />}
            <button type="button" className={styles.primary} onClick={onBegin}>Meet the first customer</button>
        </section>
    );
}

function Play({
    levelName, level, index, stars, solved, challenge, phase, choice, correct, skip, mood, onChoose, onNext,
}: {
    levelName: string;
    level: number;
    index: number;
    stars: number;
    solved: number;
    challenge: Challenge;
    phase: 'play' | 'result';
    choice: string | null;
    correct: boolean;
    skip: boolean;
    mood: 'wait' | 'happy' | 'oops';
    onChoose: (id: string) => void;
    onNext: () => void;
}) {
    const revealed = phase === 'result';
    const last = index === 2;
    const nextLabel = last && level === 3 ? 'Face the Money Muncher' : last ? 'Finish this level' : 'Next customer';
    return (
        <section className={styles.play}>
            <Hud level={level} levelName={levelName} index={index} stars={stars} solved={solved} customer={challenge.name} />
            <div className={`${styles.stage} ${styles[`level${level}`]} ${revealed && correct ? styles.win : ''} ${revealed && !correct ? styles.miss : ''}`}>
                <div className={styles.bank} aria-hidden>
                    <span className={styles.column} />
                    <span className={styles.column} />
                    <span className={styles.vault} />
                </div>
                {level === 3 && <div className={styles.alarm} aria-hidden />}
                <div key={challenge.id} className={styles.walker}>
                    <Person look={challenge.look} mood={mood} />
                </div>
                {(level === 3 || (revealed && !correct)) && <Muncher pose={revealed && correct && level === 3 ? 'gone' : 'peek'} />}
                <div className={styles.bubble}>
                    <strong>{challenge.name}</strong>
                    <p>{challenge.speech}</p>
                </div>
                {challenge.kind === 'security' && (
                    <div className={`${styles.phone} ${revealed && correct ? styles.phoneBlocked : ''}`}>
                        <span>{challenge.from}</span>
                        <strong>{challenge.headline}</strong>
                        <p>{challenge.body}</p>
                        {revealed && challenge.correctId === 'block' && <em>Blocked</em>}
                    </div>
                )}
            </div>

            {challenge.kind === 'teller' && <TellerBoard challenge={challenge} revealed={revealed} skip={skip} />}
            {challenge.kind === 'accounts' && <AccountBoard challenge={challenge} revealed={revealed} skip={skip} />}
            {challenge.kind === 'math' && <MathBoard challenge={challenge} revealed={revealed} skip={skip} />}

            {phase === 'play' ? (
                <div className={styles.choices}>
                    <Choices challenge={challenge} onChoose={onChoose} />
                    <p className={styles.hint}>Talk it over, then the presenter clicks. Keys 1, 2{challenge.kind === 'math' ? ', 3' : ''}.</p>
                </div>
            ) : (
                <div className={styles.result} role="status">
                    <h2>{correct ? 'The bank got it right' : 'Not quite — here is the right move'}</h2>
                    <p>{correct ? challenge.success : challenge.mistake}</p>
                    <button type="button" className={styles.primary} onClick={onNext}>{nextLabel}</button>
                </div>
            )}
        </section>
    );
}

function Choices({ challenge, onChoose }: { challenge: Challenge; onChoose: (id: string) => void }) {
    if (challenge.kind === 'teller') {
        return (
            <>
                <button type="button" className={styles.choice} onClick={() => onChoose('deposit')}><small>1</small>Deposit<span>Put money in</span></button>
                <button type="button" className={styles.choice} onClick={() => onChoose('withdraw')}><small>2</small>Withdraw<span>Take money out</span></button>
            </>
        );
    }
    if (challenge.kind === 'accounts') {
        return (
            <>
                <button type="button" className={`${styles.choice} ${styles.checking}`} onClick={() => onChoose('checking')}>
                    <small>1</small>Checking<span>Everyday spending and debit cards</span>
                </button>
                <button type="button" className={`${styles.choice} ${styles.savings}`} onClick={() => onChoose('savings')}>
                    <small>2</small>Savings<span>Set aside for a later goal</span>
                </button>
            </>
        );
    }
    if (challenge.kind === 'math') {
        return (
            <>
                {challenge.options.map((option, i) => (
                    <button type="button" className={`${styles.choice} ${styles.tile}`} key={option} onClick={() => onChoose(String(option))}>
                        <small>{i + 1}</small>{money(option)}
                    </button>
                ))}
            </>
        );
    }
    return (
        <>
            <button type="button" className={`${styles.choice} ${styles.block}`} onClick={() => onChoose('block')}><small>1</small>Block it<span>Stop this message</span></button>
            <button type="button" className={`${styles.choice} ${styles.safe}`} onClick={() => onChoose('safe')}><small>2</small>It is safe<span>Let this one through</span></button>
        </>
    );
}

function MathBoard({ challenge, revealed, skip }: { challenge: MathChallenge; revealed: boolean; skip: boolean }) {
    const left = useRoll(challenge.checking, challenge.after, revealed, skip);
    return (
        <div className={styles.mathLine}>
            <div><span>Checking</span><strong>{money(left)}</strong></div>
            <div><span>Spent</span><strong>− {money(challenge.spend)}</strong></div>
            <div><span>Left</span><strong>{revealed ? money(challenge.after) : '?'}</strong></div>
        </div>
    );
}

function LevelDone({ level, earned, stars, onContinue }: { level: number; earned: number; stars: number; onContinue: () => void }) {
    const info = levelOf(level);
    const next = levelOf(level + 1);
    return (
        <section className={styles.panel}>
            <p className={styles.kicker}>Level {level} complete</p>
            <h1>{info.name} is done</h1>
            <p className={styles.tag}>{earned} of 3 stars this level · {stars} of 9 total</p>
            {level === 2 && (
                <>
                    <Muncher pose="taunt" />
                    <p className={styles.blurb}>The Money Muncher rattles the vault. “Your accounts are tidy. Let’s see if you can stop a trick!”</p>
                </>
            )}
            <button type="button" className={styles.primary} onClick={onContinue}>Continue to {next.name}</button>
        </section>
    );
}

function Boss({ shielded, stars, onShield, onCelebrate }: { shielded: boolean; stars: number; onShield: () => void; onCelebrate: () => void }) {
    return (
        <section className={`${styles.panel} ${styles.boss} ${shielded ? styles.shielded : ''}`}>
            <p className={styles.kicker}>Final moment · {stars} of 9 stars</p>
            <h1>The Money Muncher wants the bank’s secret password!</h1>
            <p className={styles.blurb}>Have the class call out “Protect the bank!” then press the shield.</p>
            <div className={styles.bossStage}>
                <div className={styles.shield} aria-hidden />
                <Muncher pose={shielded ? 'gone' : 'taunt'} />
            </div>
            {shielded ? (
                <>
                    <p className={styles.blurb}>The shield holds. The Money Muncher bounces off, unharmed and very surprised. The bank is safe.</p>
                    <button type="button" className={styles.primary} onClick={onCelebrate}>Celebrate</button>
                </>
            ) : (
                <button type="button" className={styles.primary} onClick={onShield}>Activate security shield</button>
            )}
        </section>
    );
}

function Victory({ stars, solved, levelStars, onAgain }: {
    stars: number; solved: number; levelStars: [number, number, number]; onAgain: () => void;
}) {
    return (
        <section className={styles.panel}>
            <div className={styles.confetti} aria-hidden>
                {Array.from({ length: 18 }, (_, i) => <i key={i} />)}
            </div>
            <p className={styles.kicker}>Vestera Banking Champions</p>
            <h1>You saved the bank!</h1>
            <p className={styles.tag}>{stars} of 9 stars · Reputation: {reputation(solved)}</p>
            <ul className={styles.scoreList}>
                {LEVELS.map((level, i) => (
                    <li key={level.id}><span>{level.name}</span><b>{levelStars[i]} / 3</b></li>
                ))}
            </ul>
            <div className={styles.titleActions}>
                <button type="button" className={styles.primary} onClick={onAgain}>Play again</button>
                <Link href="/games" className={styles.secondary}>Return to Games</Link>
            </div>
        </section>
    );
}
