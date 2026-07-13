'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './page.module.css';
import VestaBlob from '@/components/VestaBlob';
import { useMarketStatus } from '@/hooks/useMarketStatus';
import { enterGuestMode } from '@/lib/guestMode';
import { startTour } from '@/lib/onboarding';

/* ── types & formatters ── */
interface NvdaData { price: number; change: number; changePct: number; }
const fmt$ = (n: number) => `$${n.toFixed(2)}`;
const fmtPortfolio = (n: number) =>
    '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ── content ── */
const VESTA_PROMPTS = [
    'Quiz me on how P/E ratios work',
    'Explain why this stock went up today',
    'Help me build my first practice portfolio',
    'Strategies for spotting a good company',
    'Show me a beginner trade to try',
];

const TICKER_TAPE = [
    { sym: 'AAPL',  name: 'Apple',     pct: 1.24 },
    { sym: 'TSLA',  name: 'Tesla',     pct: -2.08 },
    { sym: 'NVDA',  name: 'NVIDIA',    pct: 4.03 },
    { sym: 'DIS',   name: 'Disney',    pct: 0.62 },
    { sym: 'GOOGL', name: 'Alphabet',  pct: 0.95 },
    { sym: 'AMZN',  name: 'Amazon',    pct: -0.41 },
    { sym: 'NFLX',  name: 'Netflix',   pct: 1.87 },
    { sym: 'RBLX',  name: 'Roblox',    pct: 3.12 },
    { sym: 'MSFT',  name: 'Microsoft', pct: 0.58 },
    { sym: 'COIN',  name: 'Coinbase',  pct: -1.35 },
];

const FAQ_ITEMS = [
    { q: 'Is any of this real money?',          a: 'Never. Every trade uses your $100,000 of practice cash. Prices are real, risk is zero.' },
    { q: 'What ages is Vestera for?',            a: 'Vestera is designed for students aged 10–18, but anyone curious about investing can learn here.' },
    { q: 'Do I need a bank account or card?',   a: 'No. There\'s no real money involved. You start with virtual $100,000 from day one.' },
    { q: 'Who is Vesta?',                        a: 'Vesta is your AI investing coach — she explains the market in plain English, no jargon.' },
    { q: 'Can parents keep an eye on progress?', a: 'Yes! Parents can view their child\'s portfolio, trades, and lesson progress from the same account.' },
];

export default function Home() {
    const router = useRouter();
    const [authenticated, setAuthenticated] = useState(false);
    const [portfolioData, setPortfolioData] = useState<{ pl: number; pct: number; cash: number; portfolio_value: number } | null>(null);
    const [loading, setLoading]     = useState(true);
    const [nvdaData, setNvdaData]   = useState<NvdaData | null>(null);
    const [priceColor, setPriceColor] = useState('#fff');
    const prevPrice = useRef(0);
    const marketStatus = useMarketStatus();

    const [vestaOpen, setVestaOpen] = useState<number | null>(null);
    const [faqOpen,   setFaqOpen]   = useState<number | null>(0);
    const [vestaInput, setVestaInput] = useState('');
    const [emailInput, setEmailInput] = useState('');

    /* auth */
    useEffect(() => {
        fetch('/api/auth/me', { credentials: 'same-origin' })
            .then(r => r.json())
            .then(async d => {
                setAuthenticated(d.authenticated);
                if (d.authenticated) {
                    const h = await fetch('/api/holdings').then(r => r.json());
                    setPortfolioData(h);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    /* NVDA */
    useEffect(() => {
        let alive = true;
        const go = async () => {
            try {
                const d: NvdaData = await fetch('/api/quote/NVDA').then(r => r.json());
                if (!alive) return;
                if (prevPrice.current && d.price !== prevPrice.current)
                    setPriceColor(d.price > prevPrice.current ? 'var(--vt-green)' : 'var(--vt-red)');
                setTimeout(() => { if (alive) setPriceColor('#fff'); }, 700);
                prevPrice.current = d.price;
                setNvdaData(d);
            } catch { /* ignore */ }
        };
        go();
        const id = setInterval(go, 30_000);
        return () => { alive = false; clearInterval(id); };
    }, []);

    const pl    = portfolioData?.pl  ?? 0;
    const pct   = portfolioData?.pct ?? 0;
    const isUp  = pl >= 0;
    const total = authenticated && portfolioData
        ? (portfolioData.portfolio_value ?? 0) + (portfolioData.cash ?? 0)
        : 103_240;

    /* count-up animation for the portfolio number */
    const [displayTotal, setDisplayTotal] = useState(0);
    useEffect(() => {
        let raf: number;
        const startTime = performance.now();
        const duration = 1100;
        const tick = (now: number) => {
            const p = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplayTotal(total * eased);
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [total]);

    const openVesta = (msg: string) =>
        window.dispatchEvent(new CustomEvent('openVestaChat', { detail: { message: msg } }));

    const handleVestaSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (vestaInput.trim()) { openVesta(vestaInput.trim()); setVestaInput(''); }
    };

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/register${emailInput ? `?email=${encodeURIComponent(emailInput)}` : ''}`);
    };

    /* Launch the no-signup demo + guided tutorial (starts on the trade page) */
    const [demoLoading, setDemoLoading] = useState(false);
    const startDemoTour = async () => {
        if (demoLoading) return;
        setDemoLoading(true);
        try {
            await fetch('/api/auth/demo-login', { method: 'POST', credentials: 'same-origin' });
        } catch { /* ignore — tutorial still runs */ }
        startTour();
        window.location.assign('/trade'); // load the Market as the demo user, then the tutorial begins
    };

    /* ── render ── */
    return (
        <div className={styles.page}>

            {/* ════════════════════════════
                HERO
            ════════════════════════════ */}
            <section className={styles.heroSection}>
                <div className={`${styles.auroraBlob} ${styles.auroraBlob1}`} />
                <div className={`${styles.auroraBlob} ${styles.auroraBlob2}`} />
                <div className={`${styles.auroraBlob} ${styles.auroraBlob3}`} />
                <div className={styles.heroInner}>

                    {/* LEFT */}
                    <motion.div
                        className={styles.heroLeft}
                        initial="hidden"
                        animate="show"
                        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
                    >
                        <motion.h1 className={styles.heroTitle}
                            variants={{ hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16,1,0.3,1] } } }}
                        >
                            Stocks made simple.<br />
                            <span className={styles.heroBlue}>Vesta explains it all.</span>
                        </motion.h1>

                        <motion.p className={styles.heroSub}
                            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, delay: 0.1 } } }}
                        >
                            Trade real companies with $100,000 in play money.
                            Whenever you&apos;re stuck, Vesta breaks it down in plain
                            English — no real risk, real understanding.
                        </motion.p>

                        <motion.div className={styles.heroBtns}
                            variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.2 } } }}
                        >
                            <Link href={authenticated ? '/trade' : '/register'} className={styles.btnPrimary} data-tour="start-trading">
                                {authenticated ? 'Open Market' : 'Start Playing'} →
                            </Link>
                            {!authenticated && (
                                <button type="button" className={styles.btnDemo}
                                    onClick={startDemoTour} disabled={demoLoading}>
                                    {demoLoading ? 'Starting…' : '▶ Try the tutorial — no signup'}
                                </button>
                            )}
                            <button type="button" className={styles.btnText}
                                onClick={() => { enterGuestMode(); router.push('/learn'); }}>
                                Browse Lessons
                            </button>
                        </motion.div>

                        <motion.p className={styles.heroMeta}
                            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.35 } } }}
                        >
                            Free to start · No real money, ever
                        </motion.p>
                    </motion.div>

                    {/* RIGHT — floating cards */}
                    <div className={styles.heroRight}>

                        {/* Dark stock card — click opens NVDA in Market */}
                        <Link
                            href={authenticated ? '/trade?ticker=NVDA' : '/register'}
                            style={{ textDecoration: 'none', position: 'absolute', top: 0, right: 0, zIndex: 2, transform: 'rotate(4deg)' }}
                        >
                        <motion.div className={styles.stockCard}
                            style={{ position: 'static', transform: 'none', cursor: 'pointer' }}
                            initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.85, delay: 0.2, ease: [0.16,1,0.3,1] }}
                            whileHover={{ y: -6, transition: { duration: 0.22 } }}
                        >
                            <div className={styles.scTop}>
                                <div className={styles.scTicker}>
                                    <div className={styles.scIcon}>N</div>
                                    <div>
                                        <div className={styles.scSym}>NVDA</div>
                                        <div className={styles.scName}>NVIDIA Corp.</div>
                                    </div>
                                </div>
                                <span className={styles.scBadge} style={{
                                    background: marketStatus.open ? 'rgba(124,224,198,0.2)' : 'rgba(224,99,122,0.2)',
                                    color: marketStatus.open ? '#7CE0C6' : '#E0637A',
                                }}>
                                    + {marketStatus.label}
                                </span>
                            </div>

                            <motion.div className={styles.scPrice} style={{ color: priceColor }}
                                key={nvdaData?.price} animate={{ scale: [1,1.03,1] }} transition={{ duration: 0.3 }}>
                                {nvdaData ? fmt$(nvdaData.price) : '$—'}
                            </motion.div>

                            <div className={styles.scChange}
                                style={{ color: nvdaData && nvdaData.change >= 0 ? '#7CE0C6' : '#E0637A' }}>
                                {nvdaData
                                    ? `${nvdaData.change >= 0 ? '▲' : '▼'} ${Math.abs(nvdaData.changePct).toFixed(2)}% today`
                                    : '▲ +3.4% today'}
                            </div>

                            <div className={styles.scChart}>
                                <svg viewBox="0 0 220 52" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#FFB84C" stopOpacity="0.3"/>
                                            <stop offset="100%" stopColor="#FFB84C" stopOpacity="0"/>
                                        </linearGradient>
                                    </defs>
                                    <path d="M0,44 L22,40 L44,36 L66,39 L88,28 L110,22 L132,18 L154,14 L176,8 L198,5 L220,2"
                                        stroke="#FFB84C" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                                    <path d="M0,44 L22,40 L44,36 L66,39 L88,28 L110,22 L132,18 L154,14 L176,8 L198,5 L220,2 L220,52 L0,52Z"
                                        fill="url(#cg)"/>
                                </svg>
                            </div>
                            <div className={styles.scHint}>Tap to open NVDA in Market →</div>
                        </motion.div>
                        </Link>

                        {/* White portfolio card */}
                        <motion.div className={styles.pfCard}
                            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.85, delay: 0.35, ease: [0.16,1,0.3,1] }}
                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        >
                            <div className={styles.pfLabel}>YOUR PORTFOLIO</div>
                            <div className={styles.pfValue}>{fmtPortfolio(displayTotal)}</div>
                            <div className={styles.pfChange} style={{ color: isUp ? '#3CA787' : '#E0637A' }}>
                                {authenticated && portfolioData
                                    ? `${isUp ? '▲' : '▼'} ${isUp ? '+' : ''}${pct.toFixed(2)}% this week`
                                    : '▲ +2.2% this week'}
                            </div>
                        </motion.div>

                        {/* Gold dollar badge */}
                        <motion.div className={styles.dollarBadge}
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1, y: [0, -9, 0] }}
                            transition={{ opacity: { duration: 0.5, delay: 0.5 }, scale: { duration: 0.5, delay: 0.5 }, y: { duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 1 } }}
                        >$</motion.div>

                        {/* Lesson chip */}
                        <motion.div className={styles.lessonChip}
                            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                        >
                            <span className={styles.lcEmoji}>🎓</span>
                            <div>
                                <div className={styles.lcLabel}>Today&apos;s Lesson</div>
                                <div className={styles.lcTitle}>What&apos;s a P/E ratio?</div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </section>

            {/* ════════════════════════════
                TICKER TAPE
            ════════════════════════════ */}
            <section className={styles.tickerSection}>
                <div className={styles.tickerTrack}>
                    {[...TICKER_TAPE, ...TICKER_TAPE].map((t, i) => (
                        <div key={i} className={styles.tickerItem}>
                            <span className={styles.tickerSym}>{t.sym}</span>
                            <span className={styles.tickerName}>{t.name}</span>
                            <span className={styles.tickerChange} style={{ color: t.pct >= 0 ? '#7CE0C6' : '#FF7BA6' }}>
                                {t.pct >= 0 ? '▲' : '▼'} {Math.abs(t.pct).toFixed(2)}%
                            </span>
                            <span className={styles.tickerDot} />
                        </div>
                    ))}
                </div>
            </section>

            {/* ════════════════════════════
                ASK VESTA
            ════════════════════════════ */}
            <section className={styles.askSection}>
                <motion.div className={styles.askInner}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}
                >

                    <VestaBlob size={72} showDot animate />
                    <h2 className={styles.askHeading}>Ask Vesta anything about the market</h2>

                    <div className={styles.accordion}>
                        {VESTA_PROMPTS.map((p, i) => (
                            <div key={i} className={styles.accItem}
                                onClick={() => setVestaOpen(vestaOpen === i ? null : i)}>
                                <span className={styles.accText}>{p}</span>
                                <button type="button" className={styles.accBtn}
                                    onClick={e => { e.stopPropagation(); openVesta(p); }}>
                                    {vestaOpen === i ? '−' : '+'}
                                </button>
                            </div>
                        ))}
                    </div>

                    <form className={styles.askForm} onSubmit={handleVestaSubmit}>
                        <input type="text" className={styles.askInput}
                            placeholder="Ask Vesta anything…"
                            value={vestaInput} onChange={e => setVestaInput(e.target.value)} />
                        <button type="submit" className={styles.askSend} aria-label="Send">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <circle cx="16" cy="16" r="16" fill="#20264D"/>
                                <path d="M16 22V10M10 16l6-6 6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </form>

                    <p className={styles.askNote}>Vesta can make mistakes. This is practice money, not real advice.</p>
                </motion.div>
            </section>

            {/* ════════════════════════════
                FAQ
            ════════════════════════════ */}
            <section className={styles.faqSection}>
                <motion.div className={styles.faqInner}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}
                >
                    <h2 className={styles.faqHeading}>Frequently Asked Questions</h2>

                    <div className={styles.accordion}>
                        {FAQ_ITEMS.map((item, i) => (
                            <div key={i}
                                className={`${styles.accItem} ${faqOpen === i ? styles.accItemOpen : ''}`}
                                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                            >
                                <span className={styles.accText}>{item.q}</span>
                                <span className={styles.accBtn}>{faqOpen === i ? '−' : '+'}</span>
                                <AnimatePresence>
                                    {faqOpen === i && (
                                        <motion.div className={styles.accAnswer}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.22 }}
                                        >
                                            {item.a}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ════════════════════════════
                FOOTER CTA
            ════════════════════════════ */}
            <section className={styles.footerSection}>
                <motion.div className={styles.footerInner}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}
                >
                    <h2 className={styles.footerHeading}>Ready to start playing?</h2>
                    <p className={styles.footerSub}>Free forever to start. No card, no real money, ever.</p>

                    {!loading && !authenticated ? (
                        <form className={styles.footerForm} onSubmit={handleEmailSubmit}>
                            <input type="email" className={styles.footerEmail}
                                placeholder="you@email.com"
                                value={emailInput} onChange={e => setEmailInput(e.target.value)} />
                            <button type="submit" className={styles.footerBtn}>Create Free Account</button>
                        </form>
                    ) : authenticated ? (
                        <Link href="/trade" className={styles.footerBtn} style={{ textDecoration: 'none', display: 'inline-block' }}>
                            Go to Market →
                        </Link>
                    ) : null}

                    <nav className={styles.footerLinks}>
                        <Link href={authenticated ? '/trade' : '/register'}>Play</Link>
                        <Link href="/learn">Learn</Link>
                        <Link href="/stats">Rankings</Link>
                        <Link href="/privacy">Privacy</Link>
                        <Link href="/terms">Terms</Link>
                    </nav>
                    <p className={styles.footerCopy}>© 2026 Vestera. Practice trading, real learning.</p>
                </motion.div>
            </section>

        </div>
    );
}
