'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import VesteraLogo from '@/components/VesteraLogo';
import VestaBlob from '@/components/VestaBlob';
import type { AssetId, AssetView, GameSnapshot } from '@/lib/wallStreetTypes';
import { Icon, ToggleArrows, type IconName } from './icons';
import { ASSET_ICON, ASSET_LESSONS, CARD_TITLE, FIRST_STOCKS, HOW_TO_PLAY, assetSlides, type Slide } from './lessons';
import styles from './challenge.module.css';

type Sheet = 'market' | 'leaderboard' | 'achievements' | 'portfolio';
type Order = { id: AssetId; side: 'buy' | 'sell' };
type Qty = 1 | 10 | 25 | 'max';

const ROOM_KEY = 'vestera-wsc-room';
const forgetRoom = () => window.sessionStorage.removeItem(ROOM_KEY);

const TOP_ROW: AssetId[] = ['SAVE', 'GOVB', 'VMKT'];
const STOCKS: AssetId[] = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];
const BOTTOM_ROW: AssetId[] = ['CORP', 'GOLD', 'ENRG'];
const QTYS: Qty[] = [1, 10, 25, 'max'];
const ROUND_ICON: IconName[] = ['earnings', 'confidence', 'rates', 'boom', 'news', 'correction', 'growth', 'finish'];
const money = (value: number, digits = 0) => value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
});

const signedMoney = (value: number, digits = 0) => `${value >= 0 ? '+' : '-'}${money(Math.abs(value), digits)}`;
const pct = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
const sharesText = (units: number) => (units < 0.005 ? '0' : units >= 100 ? units.toFixed(0) : units.toFixed(2).replace(/\.?0+$/, ''));
const cardTitle = (asset: AssetView) => CARD_TITLE[asset.id] ?? asset.name;

function useNow() {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now()), 250);
        return () => window.clearInterval(id);
    }, []);
    return now;
}

function Countdown({ to }: { to: string | null }) {
    const now = useNow();
    if (!to) return <>--:--</>;
    const seconds = Math.max(0, Math.ceil((new Date(to).getTime() - now) / 1000));
    return <>{Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}</>;
}

function RichText({ text }: { text: string }) {
    return <>{text.split(/\[(.+?)\]/).map((part, index) => (index % 2 ? <u key={index}>{part}</u> : part))}</>;
}

function AreaChart({ values }: { values: number[] }) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(max - min, max * 0.002, 0.0001);
    const points = values.map((value, index) => {
        const x = (index / Math.max(1, values.length - 1)) * 100;
        const y = 38 - ((value - min) / span) * 32;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    const up = values[values.length - 1] >= values[0];
    return (
        <svg className={`${styles.area} ${up ? styles.areaUp : styles.areaDown}`} viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden>
            <polygon points={`0,40 ${points.join(' ')} 100,40`} />
        </svg>
    );
}

function eventSlides(game: GameSnapshot): Slide[] {
    const info = game.roundInfo;
    if (!info) return [];
    const slides: Slide[] = [
        { kicker: `Round ${info.number} of ${game.totalRounds} · ${info.years}`, title: info.title, icon: ROUND_ICON[info.number - 1] ?? 'news', text: info.headline },
        { kicker: info.title, title: 'What does this mean?', icon: 'news', text: info.meaning, list: info.impacts.map(impact => ({ label: impact.name, value: impact.pct })) },
        { kicker: info.title, title: 'What can you do?', icon: ROUND_ICON[info.number - 1] ?? 'news', text: `${info.action} ${info.tip}` },
    ];
    const seen = new Set<string>();
    for (const unlock of info.unlocks) {
        const lessons = ASSET_LESSONS[unlock.id];
        if (!lessons.length) continue;
        const title = FIRST_STOCKS.includes(unlock.id) ? 'Individual Stocks' : CARD_TITLE[unlock.id] ?? unlock.name;
        const key = `${title}:${lessons[0]}`;
        if (seen.has(key)) continue;
        seen.add(key);
        for (const slide of assetSlides(unlock.id, title)) slides.push({ ...slide, kicker: 'New this round' });
    }
    for (const unlock of info.unlocks) {
        if (unlock.category === 'Stocks') slides.push({ kicker: 'New company', title: unlock.name, icon: 'stocks', text: unlock.description });
    }
    return slides;
}

function Carousel({ slides, dark, onDone, doneLabel = 'got it', footer, onClose }: {
    slides: Slide[];
    dark: boolean;
    onDone?: () => void;
    doneLabel?: string;
    footer?: ReactNode;
    onClose?: () => void;
}) {
    const [index, setIndex] = useState(0);
    const last = slides.length - 1;
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'ArrowRight') setIndex(value => Math.min(last, value + 1));
            if (event.key === 'ArrowLeft') setIndex(value => Math.max(0, value - 1));
            if (event.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [last, onClose]);
    const slide = slides[Math.min(index, last)];
    if (!slide) return null;
    return (
        <div className={dark ? styles.slideFrame : styles.helpFrame}>
            {onClose && <button type="button" className={styles.closeX} onClick={onClose}>Close</button>}
            <div>
                <div className={styles.slide}>
                    <button type="button" className={styles.arrow} disabled={index === 0} onClick={() => setIndex(index - 1)} aria-label="Previous">‹</button>
                    <div className={styles.slideBody}>
                        {slide.kicker && <p className={styles.slideKicker}>{slide.kicker}</p>}
                        <h2 className={styles.slideTitle}>{slide.title}</h2>
                        <Icon name={slide.icon} size={64} />
                        <p className={styles.slideText}><RichText text={slide.text} /></p>
                        {slide.list && slide.list.length > 0 && (
                            <ul className={styles.slideList}>
                                {slide.list.map(item => (
                                    <li key={item.label}>
                                        <span>{item.label}</span>
                                        <strong className={item.value >= 0 ? (dark ? styles.upOnDark : styles.up) : (dark ? styles.downOnDark : styles.down)}>{pct(item.value)}</strong>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {index === last && onDone && <button type="button" className={styles.gotIt} onClick={onDone}>{doneLabel}</button>}
                    </div>
                    <button type="button" className={styles.arrow} disabled={index === last} onClick={() => setIndex(index + 1)} aria-label="Next">›</button>
                </div>
                <div className={styles.dots}>
                    {slides.map((item, dot) => (
                        <button key={dot} type="button" className={dot === index ? styles.dotOn : styles.dot} onClick={() => setIndex(dot)} aria-label={`Slide ${dot + 1}`} />
                    ))}
                </div>
                {footer && <div className={styles.slideFoot}>{footer}</div>}
            </div>
        </div>
    );
}

export default function WallStreetChallengePage() {
    const [creating, setCreating] = useState(false);
    const [slowMode, setSlowMode] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [code, setCode] = useState('');
    const [game, setGame] = useState<GameSnapshot | null>(null);
    const [sheet, setSheet] = useState<Sheet>('market');
    const [order, setOrder] = useState<Order | null>(null);
    const [amount, setAmount] = useState(500);
    const [help, setHelp] = useState<AssetId | null>(null);
    const [info, setInfo] = useState(false);
    const [showProfit, setShowProfit] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');

    const loadGame = useCallback(async (roomCode: string) => {
        const response = await fetch(`/api/games/${roomCode}`, { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load game.');
        setGame(data);
    }, []);

    useEffect(() => {
        const saved = window.sessionStorage.getItem(ROOM_KEY);
        if (saved) setCode(saved);
    }, []);

    useEffect(() => {
        if (!code) return;
        window.sessionStorage.setItem(ROOM_KEY, code);
        void loadGame(code).catch(reason => {
            window.sessionStorage.removeItem(ROOM_KEY);
            setCode('');
            setError(reason instanceof Error ? reason.message : 'Could not load game.');
        });
        const id = window.setInterval(() => { void loadGame(code).catch(() => {}); }, 2000);
        return () => window.clearInterval(id);
    }, [code, loadGame]);

    useEffect(() => {
        if (game?.phase !== 'playing') setOrder(null);
    }, [game?.phase]);

    useEffect(() => {
        if (!toast) return;
        const id = window.setTimeout(() => setToast(''), 3500);
        return () => window.clearTimeout(id);
    }, [toast]);

    const inGame = !!game && game.phase !== 'lobby';
    useEffect(() => {
        if (!error || !inGame) return;
        const id = window.setTimeout(() => setError(''), 3500);
        return () => window.clearTimeout(id);
    }, [error, inGame]);

    const openRoom = async (action: 'create' | 'join') => {
        setBusy(true);
        setError('');
        try {
            const response = await fetch('/api/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(action === 'create' ? { action, slowMode } : { action, code: joinCode }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Could not open game.');
            setCode(data.code);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Could not open game.');
        } finally {
            setBusy(false);
        }
    };

    const send = async (body: object) => {
        if (!code) return false;
        setBusy(true);
        setError('');
        try {
            const response = await fetch(`/api/games/${code}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Could not update game.');
            setGame(data);
            return true;
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Could not update game.');
            return false;
        } finally {
            setBusy(false);
        }
    };

    if (!game) {
        return (
            <main className={styles.plain}>
                <div className={styles.entryCard}>
                    <div className={styles.entryTop}>
                        <Link href="/games" aria-label="Back to Games" className={styles.logoLink}><VesteraLogo height={26} /></Link>
                        <Link href="/games" className={styles.quietLink}>Back to Games</Link>
                    </div>
                    <div className={styles.entryIntro}>
                        <VestaBlob size={72} showDot={false} />
                        <div>
                            <p className={styles.eyebrow}>Wall Street Challenge</p>
                            <h1>20 years of investing in about 20 minutes</h1>
                            <p>Get paid every six months, choose where your money goes, and see how 8 rounds of market news change your portfolio.</p>
                        </div>
                    </div>
                    {error && <div className={styles.error}>{error}</div>}
                    {!creating ? (
                        <div className={styles.entryGrid}>
                            <button type="button" className={styles.entryOption} onClick={() => setCreating(true)}>
                                <strong>Create game</strong>
                                <span>Host a room and share the code with friends. The Steady Investor always plays too.</span>
                            </button>
                            <div className={styles.entryOption}>
                                <strong>Join game</strong>
                                <span>Enter the code from your host.</span>
                                <div className={styles.joinRow}>
                                    <input aria-label="Game code" value={joinCode} maxLength={6} placeholder="ABC123" onChange={event => setJoinCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
                                    <button className={styles.primary} disabled={joinCode.length !== 6 || busy} onClick={() => void openRoom('join')}>Join</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className={styles.modeGrid}>
                                <button type="button" className={!slowMode ? styles.modeOn : styles.mode} onClick={() => setSlowMode(false)}>
                                    <strong>Normal mode</strong>
                                    <span>About 20 minutes. Each round lasts 2 minutes 30 seconds.</span>
                                </button>
                                <button type="button" className={slowMode ? styles.modeOn : styles.mode} onClick={() => setSlowMode(true)}>
                                    <strong>Slow mode</strong>
                                    <span>Players get more time to make decisions. Each round lasts 3 minutes 45 seconds.</span>
                                </button>
                            </div>
                            <div className={styles.rowEnd}>
                                <button type="button" className={styles.secondary} onClick={() => setCreating(false)}>Back</button>
                                <button className={styles.primary} disabled={busy} onClick={() => void openRoom('create')}>{busy ? 'Creating…' : 'Create game'}</button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        );
    }

    if (game.phase === 'lobby') {
        return (
            <main className={styles.plain}>
                <div className={styles.entryCard}>
                    <div className={styles.entryTop}>
                        <VesteraLogo height={26} />
                        <Link href="/games" className={styles.quietLink} onClick={forgetRoom}>Leave</Link>
                    </div>
                    <p className={styles.eyebrow}>Wall Street Challenge</p>
                    <h1>20 minute investing simulation</h1>
                    <div className={styles.lobbyGrid}>
                        <section>
                            <span className={styles.label}>Game code</span>
                            <div className={styles.code}>{game.code}</div>
                            <p className={styles.muted}>Share this code with your friends.</p>
                            <button className={styles.secondary} onClick={() => void navigator.clipboard.writeText(game.code)}>Copy code</button>
                            <div className={styles.lobbyMode}>
                                <strong>{game.slowMode ? 'Slow mode' : 'Normal mode'}</strong>
                                <span>{game.slowMode ? 'Players get more time to make decisions.' : 'About 20 minutes from start to finish.'}</span>
                            </div>
                        </section>
                        <section>
                            <div className={styles.sectionHead}><span className={styles.label}>Players</span><span className={styles.muted}>{game.players.length} / 8</span></div>
                            {game.players.map(player => (
                                <div key={player.userId} className={styles.lobbyPlayer}>
                                    <span className={styles.avatar}>{player.name.charAt(0).toUpperCase()}</span>
                                    <strong>{player.name}</strong>
                                    <em>{player.isHost ? 'Host' : ''}</em>
                                </div>
                            ))}
                            <div className={styles.lobbyPlayer}>
                                <span className={styles.avatarRival}>S</span>
                                <strong>Steady Investor</strong>
                                <em>Computer</em>
                            </div>
                            {game.canStart ? (
                                <button className={styles.primaryWide} disabled={busy} onClick={() => void send({ action: 'start' })}>Start game</button>
                            ) : <p className={styles.muted}>Waiting for the host to start the game.</p>}
                            {error && <div className={styles.error}>{error}</div>}
                        </section>
                    </div>
                </div>
            </main>
        );
    }

    const paused = game.phase === 'briefing' || game.phase === 'event';
    const playing = game.phase === 'playing';
    const byId = (id: AssetId) => game.assets.find(asset => asset.id === id) ?? null;
    const visible = (ids: AssetId[]) => ids.map(byId).filter((asset): asset is AssetView => !!asset && asset.unlocked);
    const top = visible(TOP_ROW);
    const stocks = visible(STOCKS);
    const bottom = visible(BOTTOM_ROW);
    const orderAsset = order ? byId(order.id) : null;
    const helpAsset = help ? byId(help) : null;
    const orderCap = order?.side === 'buy' ? game.me.cash : orderAsset?.owned ?? 0;
    const doneCount = game.achievements.filter(item => item.done).length;
    const lotOfCash = game.me.cash >= 1500 && game.me.cash > game.me.portfolioValue * 0.5;
    const bubble = game.phase === 'finished'
        ? 'The market is closed. Nice work.'
        : game.paycheckNotice ?? (lotOfCash ? 'That is a lot of pocket cash. Try investing it.' : null);

    const openOrder = (id: AssetId, side: 'buy' | 'sell') => {
        const asset = byId(id);
        const cap = side === 'buy' ? game.me.cash : asset?.owned ?? 0;
        setOrder({ id, side });
        setAmount(Math.max(1, Math.min(500, Math.floor(cap))));
        setError('');
    };

    const quickTrade = async (asset: AssetView, side: 'buy' | 'sell', qty: Qty) => {
        const ok = await send({ action: 'trade', id: asset.id, side, shares: qty });
        if (ok) setToast(`${side === 'buy' ? 'Bought' : 'Sold'} ${qty === 'max' ? 'max' : qty} ${qty === 1 ? 'share' : 'shares'} of ${cardTitle(asset)}.`);
    };

    const confirmOrder = async () => {
        if (!order || !orderAsset) return;
        const ok = await send({ action: 'trade', id: order.id, side: order.side, amount });
        if (!ok) return;
        const verb = order.id === 'SAVE' ? (order.side === 'buy' ? 'Deposited' : 'Withdrew') : order.side === 'buy' ? 'Bought' : 'Sold';
        setToast(`${verb} ${money(amount, 2)} ${order.id === 'SAVE' ? (order.side === 'buy' ? 'into' : 'from') : 'of'} ${cardTitle(orderAsset)}.`);
        setOrder(null);
    };

    const openSheet = (next: Sheet) => {
        setHelp(null);
        setInfo(false);
        setSheet(current => (current === next ? 'market' : next));
    };

    const cardProps = { cash: game.me.cash, canTrade: playing && !busy, round: game.round, onOrder: openOrder, onQuick: quickTrade, onHelp: (id: AssetId) => { setInfo(false); setHelp(id); } };

    let board: ReactNode;
    if (game.phase === 'briefing') {
        board = (
            <Carousel
                key="briefing"
                dark
                slides={HOW_TO_PLAY.map(slide => ({ ...slide, kicker: 'How to play' }))}
                onDone={game.isHost ? () => void send({ action: 'continue' }) : undefined}
                footer={<>{game.isHost ? 'The game starts' : 'Waiting for the host. The game starts'} automatically in <Countdown to={game.pauseEndsAt} /></>}
            />
        );
    } else if (game.phase === 'event') {
        board = (
            <Carousel
                key={`event-${game.round}`}
                dark
                slides={eventSlides(game)}
                onDone={game.isHost ? () => void send({ action: 'continue' }) : undefined}
                footer={<>{game.isHost ? 'The round starts' : 'Waiting for the host. The round starts'} automatically in <Countdown to={game.pauseEndsAt} /></>}
            />
        );
    } else if (game.phase === 'finished' && game.results) {
        board = <ResultsSheet game={game} />;
    } else if (helpAsset) {
        const title = FIRST_STOCKS.includes(helpAsset.id) ? 'Individual Stocks' : helpAsset.category === 'Stocks' ? helpAsset.name : cardTitle(helpAsset);
        const lessonSlides = assetSlides(helpAsset.id, title);
        board = (
            <Carousel
                key={`help-${helpAsset.id}`}
                dark={false}
                slides={lessonSlides.length ? lessonSlides : [{ title, icon: ASSET_ICON[helpAsset.id], text: helpAsset.description }]}
                onDone={() => setHelp(null)}
                onClose={() => setHelp(null)}
            />
        );
    } else if (info) {
        board = <Carousel key="info" dark={false} slides={HOW_TO_PLAY} onDone={() => setInfo(false)} onClose={() => setInfo(false)} />;
    } else if (sheet === 'leaderboard') {
        board = (
            <SheetFrame title="Leaderboard" onBack={() => setSheet('market')}>
                <div className={styles.box}><Standings game={game} /></div>
                <p className={styles.muted}>The Steady Investor puts every paycheck into the Vestera Market Fund and never sells.</p>
            </SheetFrame>
        );
    } else if (sheet === 'achievements') {
        board = (
            <SheetFrame title="Achievements" onBack={() => setSheet('market')}>
                <div className={styles.box}>
                    <ul className={styles.achievementList}>
                        {game.achievements.map(item => (
                            <li key={item.id} className={item.done ? styles.achieved : ''}>
                                <span className={item.done ? styles.checkOn : styles.check}>{item.done && <CheckIcon />}</span>
                                {item.label}
                            </li>
                        ))}
                    </ul>
                </div>
            </SheetFrame>
        );
    } else if (sheet === 'portfolio') {
        board = <SheetFrame title="Portfolio" onBack={() => setSheet('market')}><PortfolioView game={game} /></SheetFrame>;
    } else {
        board = (
            <>
                {top.length > 0 && <div className={styles.row}>{top.map(asset => <InvestmentCard key={asset.id} asset={asset} {...cardProps} />)}</div>}
                {stocks.length > 0 && (
                    <section className={styles.stocksPanel}>
                        <h2 className={styles.cardTitle}>Individual Stocks</h2>
                        <span className={styles.cornerHelp}><button type="button" className={styles.helpButton} onClick={() => cardProps.onHelp('S1')} aria-label="About individual stocks">?</button></span>
                        <div className={styles.stockGrid}>
                            {stocks.map(asset => <StockCard key={asset.id} asset={asset} {...cardProps} />)}
                        </div>
                    </section>
                )}
                {bottom.length > 0 && <div className={styles.row}>{bottom.map(asset => <InvestmentCard key={asset.id} asset={asset} {...cardProps} />)}</div>}
            </>
        );
    }

    return (
        <main className={styles.game}>
            <aside className={`${styles.panel} ${paused ? styles.panelPaused : ''}`}>
                <h1 className={styles.yearTitle}>
                    {paused ? 'Paused' : <>Year <strong>{game.phase === 'finished' ? game.totalYears : game.year}</strong> of {game.totalYears}</>}
                </h1>
                <div className={styles.yearBar} aria-hidden>
                    {Array.from({ length: game.totalYears }, (_, index) => (
                        <span key={index} className={game.phase === 'finished' || index < game.year - 1 ? styles.yearDone : ''} />
                    ))}
                </div>
                <p className={styles.roundLine}>
                    {game.phase === 'playing' && <>Round {game.round} of {game.totalRounds} · <Countdown to={game.roundEndsAt} /> left</>}
                    {game.phase === 'event' && <>Round {game.round} of {game.totalRounds} · starts in <Countdown to={game.pauseEndsAt} /></>}
                    {game.phase === 'briefing' && <>Starts in <Countdown to={game.pauseEndsAt} /></>}
                    {game.phase === 'finished' && <>Game over</>}
                </p>

                <div className={styles.dimmable}>
                    <div className={styles.mascot}>
                        {bubble && <div className={styles.bubble}>{bubble}</div>}
                        <VestaBlob size={118} showDot={false} />
                    </div>

                    <div className={styles.money}>
                        <div>
                            <span className={styles.moneyLabel}>Pocket cash</span>
                            <strong>{money(game.me.cash, 2)}</strong>
                        </div>
                        <div>
                            <button type="button" className={styles.moneyLabel} onClick={() => setShowProfit(value => !value)}>
                                <ToggleArrows /> {showProfit ? 'Overall profit' : 'Overall net worth'}
                            </button>
                            <strong className={showProfit ? (game.me.gain >= 0 ? styles.upOnDark : styles.downOnDark) : ''}>
                                {showProfit ? signedMoney(game.me.gain, 2) : money(game.me.portfolioValue, 2)}
                            </strong>
                        </div>
                    </div>

                    <nav className={styles.panelNav} aria-label="Game views">
                        <button type="button" className={sheet === 'leaderboard' ? styles.navOn : ''} onClick={() => openSheet('leaderboard')}>
                            <span><span className={styles.caret}>▸</span>Leaderboard</span>
                            <span className={styles.navIcon}><Icon name="star" size={24} /><em>{game.me.rank}</em></span>
                        </button>
                        <button type="button" className={sheet === 'achievements' ? styles.navOn : ''} onClick={() => openSheet('achievements')}>
                            <span><span className={styles.caret}>▸</span>Achievements</span>
                            <span className={styles.navIcon}><Icon name="cup" size={24} /><em>{doneCount}</em></span>
                        </button>
                        <button type="button" className={sheet === 'portfolio' ? styles.navOn : ''} onClick={() => openSheet('portfolio')}>
                            <span><span className={styles.caret}>▸</span>Portfolio</span>
                            <span className={styles.navIcon}><Icon name="pie" size={24} /></span>
                        </button>
                    </nav>

                    <div className={styles.panelFoot}>
                        <button type="button" className={styles.infoButton} onClick={() => { setHelp(null); setInfo(value => !value); }} aria-label="How to play">i</button>
                        <span>Room {game.code}</span>
                        <Link href="/games" onClick={forgetRoom}>Exit</Link>
                    </div>
                </div>
            </aside>

            <section className={`${styles.board} ${paused ? styles.pausedBoard : ''}`}>{board}</section>

            {order && orderAsset && playing && (
                <div className={styles.modalBack} onClick={() => setOrder(null)}>
                    <section className={styles.modal} onClick={event => event.stopPropagation()}>
                        <div className={styles.modalHead}>
                            <Icon name={ASSET_ICON[orderAsset.id]} size={40} />
                            <div>
                                <h2>{order.id === 'SAVE' ? (order.side === 'buy' ? 'Deposit' : 'Withdraw') : order.side === 'buy' ? 'Buy' : 'Sell'} · {cardTitle(orderAsset)}</h2>
                                <p>{orderAsset.risk} risk</p>
                            </div>
                        </div>
                        <div className={styles.modalRows}>
                            <div><span>{order.side === 'buy' ? 'Pocket cash' : order.id === 'SAVE' ? 'Balance' : 'You own'}</span><strong>{money(orderCap, 2)}</strong></div>
                        </div>
                        <span className={styles.label}>Amount</span>
                        <div className={styles.presets}>
                            {[250, 500, 1000].map(preset => (
                                <button key={preset} type="button" disabled={orderCap < 1} className={amount === Math.min(preset, Math.floor(orderCap)) ? styles.presetOn : ''} onClick={() => setAmount(Math.max(1, Math.min(preset, Math.floor(orderCap))))}>{money(preset)}</button>
                            ))}
                            <button type="button" disabled={orderCap < 1} onClick={() => setAmount(Math.floor(orderCap * 100) / 100)}>All</button>
                        </div>
                        <input className={styles.amountInput} aria-label="Amount in dollars" type="number" min={1} step={50} value={amount} onChange={event => setAmount(Number(event.target.value))} />
                        <div className={styles.modalRows}>
                            <div><span>Pocket cash after</span><strong>{money(order.side === 'buy' ? game.me.cash - amount : game.me.cash + amount, 2)}</strong></div>
                        </div>
                        {error && <div className={styles.error}>{error}</div>}
                        <div className={styles.buttons}>
                            <button type="button" className={styles.gameBtn} onClick={() => setOrder(null)}>cancel</button>
                            <button type="button" className={styles.gameBtnPrimary} disabled={busy || amount < 1 || amount > orderCap + 0.01} onClick={() => void confirmOrder()}>
                                {order.id === 'SAVE' ? (order.side === 'buy' ? 'deposit' : 'withdraw') : order.side}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {toast && <div className={styles.toast} role="status">{toast}</div>}
            {error && !order && <div className={styles.toastError} role="alert">{error}</div>}
        </main>
    );
}

type CardProps = {
    asset: AssetView;
    cash: number;
    canTrade: boolean;
    round: number;
    onOrder: (id: AssetId, side: 'buy' | 'sell') => void;
    onQuick: (asset: AssetView, side: 'buy' | 'sell', qty: Qty) => void;
    onHelp: (id: AssetId) => void;
};

function canQuick(asset: AssetView, side: 'buy' | 'sell', qty: Qty, cash: number) {
    if (side === 'buy') return qty === 'max' ? cash >= 1 : qty * asset.price <= cash + 0.001;
    return qty === 'max' ? asset.units > 0.0001 : asset.units >= qty - 1e-6;
}

function ValueRow({ asset, balanceFirst = false }: { asset: AssetView; balanceFirst?: boolean }) {
    const [flipped, setFlipped] = useState(false);
    const showBalance = balanceFirst !== flipped;
    const held = asset.owned >= 0.005;
    return (
        <div className={styles.valueRow}>
            <button type="button" className={styles.toggle} onClick={() => setFlipped(value => !value)}>
                <ToggleArrows /> {showBalance ? 'Balance' : 'Profit'}
            </button>
            <strong className={!showBalance && held ? (asset.profit >= 0 ? styles.up : styles.down) : ''}>
                {showBalance ? money(asset.owned, 2) : money(held ? asset.profit : 0, 2)}
            </strong>
        </div>
    );
}

function QtyPicker({ qty, onChange }: { qty: Qty; onChange: (qty: Qty) => void }) {
    return (
        <span className={styles.qtyGroup}>
            {QTYS.map(option => (
                <button key={option} type="button" className={qty === option ? styles.qtyOn : styles.qty} onClick={() => onChange(option)}>
                    {option === 'max' ? 'MAX' : option}
                </button>
            ))}
        </span>
    );
}

function PriceLine({ asset }: { asset: AssetView }) {
    const up = asset.changePct >= 0;
    return (
        <div className={styles.priceLine}>
            <span className={up ? styles.up : styles.down}>{money(asset.price, 2)}</span>
            <span className={up ? styles.up : styles.down}>{up ? '▲' : '▼'} {Math.abs(asset.changePct).toFixed(2)}%</span>
        </div>
    );
}

function InvestmentCard({ asset, cash, canTrade, round, onOrder, onQuick, onHelp }: CardProps) {
    const [qty, setQty] = useState<Qty>(1);
    const isSavings = asset.id === 'SAVE';
    const quick = asset.id === 'ENRG';
    const held = asset.owned >= 0.01;
    return (
        <article className={styles.card}>
            {asset.unlockRound === round && asset.unlockRound > 1 && <span className={styles.newTag}>NEW</span>}
            <h2 className={styles.cardTitle}>{cardTitle(asset)}</h2>
            <span className={styles.cornerHelp}><button type="button" className={styles.helpButton} onClick={() => onHelp(asset.id)} aria-label={`About ${cardTitle(asset)}`}>?</button></span>
            <div className={styles.cardVisual}>
                {quick ? (
                    <div style={{ width: '100%' }}>
                        <PriceLine asset={asset} />
                        <div className={styles.chartRow}>
                            <AreaChart values={asset.history} />
                            <span className={styles.shares}>shares:<b>{sharesText(asset.units)}</b></span>
                        </div>
                    </div>
                ) : asset.id === 'VMKT' || asset.id === 'GOLD' ? (
                    <AreaChart values={asset.history} />
                ) : (
                    <Icon name={ASSET_ICON[asset.id]} size={60} />
                )}
            </div>
            <ValueRow asset={asset} balanceFirst={isSavings} />
            {isSavings ? (
                <div className={styles.buttons}>
                    <button type="button" className={styles.gameBtn} disabled={!canTrade || !held} onClick={() => onOrder(asset.id, 'sell')}>withdraw</button>
                    <button type="button" className={styles.gameBtnPrimary} disabled={!canTrade || cash < 1} onClick={() => onOrder(asset.id, 'buy')}>deposit</button>
                </div>
            ) : quick ? (
                <div className={styles.buttons}>
                    <QtyPicker qty={qty} onChange={setQty} />
                    <span className={styles.buttons}>
                        <button type="button" className={`${styles.gameBtn} ${styles.small}`} disabled={!canTrade || !canQuick(asset, 'sell', qty, cash)} onClick={() => onQuick(asset, 'sell', qty)}>sell</button>
                        <button type="button" className={`${styles.gameBtnPrimary} ${styles.small}`} disabled={!canTrade || !canQuick(asset, 'buy', qty, cash)} onClick={() => onQuick(asset, 'buy', qty)}>buy</button>
                    </span>
                </div>
            ) : (
                <div className={`${styles.buttons} ${held ? '' : styles.buttonsCenter}`}>
                    {held && <button type="button" className={styles.gameBtn} disabled={!canTrade} onClick={() => onOrder(asset.id, 'sell')}>sell</button>}
                    <button type="button" className={styles.gameBtnPrimary} disabled={!canTrade || cash < 1} onClick={() => onOrder(asset.id, 'buy')}>buy</button>
                </div>
            )}
        </article>
    );
}

function StockCard({ asset, cash, canTrade, round, onQuick }: CardProps) {
    const [qty, setQty] = useState<Qty>(1);
    return (
        <article className={styles.stockCard}>
            {asset.unlockRound === round && <span className={styles.stockNew}>NEW</span>}
            <h3 className={styles.stockName}>{asset.name}</h3>
            <PriceLine asset={asset} />
            <ValueRow asset={asset} />
            <div className={styles.chartRow}>
                <AreaChart values={asset.history} />
                <span className={styles.shares}>shares:<b>{sharesText(asset.units)}</b></span>
            </div>
            <div className={styles.buttons}>
                <button type="button" className={`${styles.gameBtn} ${styles.small}`} disabled={!canTrade || !canQuick(asset, 'sell', qty, cash)} onClick={() => onQuick(asset, 'sell', qty)}>sell</button>
                <button type="button" className={`${styles.gameBtnPrimary} ${styles.small}`} disabled={!canTrade || !canQuick(asset, 'buy', qty, cash)} onClick={() => onQuick(asset, 'buy', qty)}>buy</button>
            </div>
            <div className={styles.qtyRow}><QtyPicker qty={qty} onChange={setQty} /></div>
        </article>
    );
}

function SheetFrame({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
    return (
        <div className={styles.sheet}>
            <div className={styles.sheetHead}>
                <h2>{title}</h2>
                <button type="button" className={styles.gameBtn} onClick={onBack}>back to market</button>
            </div>
            {children}
        </div>
    );
}

function ResultsSheet({ game }: { game: GameSnapshot }) {
    const results = game.results!;
    return (
        <div className={styles.results}>
            <div className={styles.resultsHead}>
                <VestaBlob size={72} showDot={false} />
                <div>
                    <p className={styles.eyebrow}>Game complete</p>
                    <h2>You finished #{results.rank}</h2>
                </div>
            </div>
            <div className={styles.eraReveal}>
                <span>The years you just played</span>
                <strong>{results.era.startYear} – {results.era.endYear}</strong>
                <p>The ups and downs you saw were based on the real stock market of those years.</p>
            </div>
            <div className={styles.box}>
                <h3>The real companies</h3>
                <ul className={styles.revealList}>
                    {results.reveal.map(item => (
                        <li key={item.id}>
                            <div>
                                <span>{item.codeName} was</span>
                                <strong>{item.realName}</strong>
                                {item.note && <small>{item.note}</small>}
                            </div>
                            <em className={item.changePct >= 0 ? styles.up : styles.down}>{pct(item.changePct)}</em>
                        </li>
                    ))}
                </ul>
                <p className={styles.muted}>Change over your 20 years in the game. Prices follow the shape of each real history, with growth scaled down and extra swings added, and company histories are close approximations.</p>
            </div>
            <div className={styles.resultStats}>
                <div><span>Final net worth</span><strong>{money(results.finalValue)}</strong></div>
                <div><span>Money you received</span><strong>{money(results.contributed)}</strong></div>
                <div><span>Return</span><strong className={results.gain >= 0 ? styles.up : styles.down}>{signedMoney(results.gain)} · {pct(results.returnPct)}</strong></div>
                <div><span>Steady Investor</span><strong>{money(results.computerValue)}</strong></div>
            </div>
            <div className={styles.resultGrid}>
                <div className={styles.box}><h3>Final leaderboard</h3><Standings game={game} /></div>
                <div className={styles.box}><h3>Where your money ended up</h3><MixBars mix={results.mix.map(part => ({ id: part.name, name: part.name, pct: part.pct }))} /></div>
            </div>
            <div className={`${styles.box} ${styles.lessons}`}>
                <h3>What you learned</h3>
                {results.lessons.map(lesson => <p key={lesson}>{lesson}</p>)}
            </div>
            <div className={styles.buttons}>
                <span />
                <Link href="/games" className={styles.primary} onClick={forgetRoom}>Back to Games</Link>
            </div>
        </div>
    );
}

function PortfolioView({ game }: { game: GameSnapshot }) {
    const owned = game.assets.filter(asset => asset.owned >= 0.5);
    return (
        <>
            <div className={styles.summaryGrid}>
                <div><span>Pocket cash</span><strong>{money(game.me.cash)}</strong></div>
                <div><span>Invested</span><strong>{money(game.me.invested)}</strong></div>
                <div><span>Net worth</span><strong>{money(game.me.portfolioValue)}</strong></div>
                <div><span>Profit / loss</span><strong className={game.me.gain >= 0 ? styles.up : styles.down}>{signedMoney(game.me.gain)}</strong><small>{pct(game.me.gainPct)} on {money(game.me.contributed)} received</small></div>
            </div>
            <div className={styles.portfolioGrid}>
                <div className={styles.box}>
                    <h3>Holdings</h3>
                    {owned.length === 0 && <p className={styles.muted}>You have not bought anything yet. Your paychecks are waiting as pocket cash.</p>}
                    {owned.map(asset => (
                        <div key={asset.id} className={styles.holdingRow}>
                            <Icon name={ASSET_ICON[asset.id]} size={28} />
                            <div><strong>{cardTitle(asset)}</strong><span>{sharesText(asset.units)} shares · you put in {money(asset.contributed)}</span></div>
                            <div className={styles.alignEnd}><strong>{money(asset.owned)}</strong><span className={asset.profit >= 0 ? styles.up : styles.down}>{signedMoney(asset.profit)}</span></div>
                        </div>
                    ))}
                </div>
                <div className={styles.box}>
                    <h3>Mix</h3>
                    <MixBars mix={game.mix} />
                </div>
            </div>
        </>
    );
}

function Standings({ game }: { game: GameSnapshot }) {
    return (
        <ol className={styles.standings}>
            {game.players.map(player => (
                <li key={player.userId} className={player.isYou ? styles.standYou : ''}>
                    <span className={styles.rank}>{player.rank}</span>
                    <span>{player.isYou ? 'You' : player.name}{player.isComputer ? <em> Computer</em> : null}</span>
                    <strong>{money(player.portfolioValue)}</strong>
                </li>
            ))}
        </ol>
    );
}

function MixBars({ mix }: { mix: Array<{ id: string; name: string; pct: number }> }) {
    if (!mix.length) return <p className={styles.muted}>Nothing here yet.</p>;
    return (
        <div className={styles.mix}>
            {mix.map(part => (
                <div key={part.id}>
                    <div className={styles.mixLabel}><span>{part.name}</span><span>{part.pct.toFixed(0)}%</span></div>
                    <div className={styles.mixTrack}><span style={{ width: `${Math.max(2, Math.min(100, part.pct))}%` }} /></div>
                </div>
            ))}
        </div>
    );
}

function CheckIcon() {
    return (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2 6.5L4.8 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
