'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './page.module.css';
import { startTour } from '@/lib/onboarding';

const fmtPortfolio = (n: number) =>
    '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const FEATURES = [
    {
        title: '500+ Real Stocks',
        desc: 'Trade top stocks, ETFs, index funds, and more.',
        icon: (
            <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 17l5-5 4 4 8-8" />
                <path d="M15 8h5v5" />
            </svg>
        ),
    },
    {
        title: '$10,000 Starting Balance',
        desc: 'Practice with virtual money, no risk.',
        icon: (
            <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v10M9.5 9.2c0-1.1 1.1-1.9 2.5-1.9s2.5.9 2.5 2c0 2.6-5 1.4-5 4 0 1.1 1.1 2 2.5 2s2.5-.8 2.5-1.9" />
            </svg>
        ),
    },
    {
        title: 'Interactive Lessons',
        desc: 'Videos, quizzes, and more, from beginner to advanced.',
        icon: (
            <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5 2 9l10 4 10-4-10-4Z" />
                <path d="M6 11v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5" />
            </svg>
        ),
    },
    {
        title: 'Track Your Progress',
        desc: 'Earn XP, level up, collect badges.',
        icon: (
            <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 21h8" />
                <path d="M12 17v4" />
                <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
                <path d="M7 6H4.5A1.5 1.5 0 0 0 3 7.5c0 1.8 1.4 3 3.2 3.4" />
                <path d="M17 6h2.5A1.5 1.5 0 0 1 21 7.5c0 1.8-1.4 3-3.2 3.4" />
            </svg>
        ),
    },
];

export default function Home() {
    const [authenticated, setAuthenticated] = useState(false);
    const [portfolioData, setPortfolioData] = useState<{ pl: number; pct: number; cash: number; portfolio_value: number } | null>(null);
    const [demoLoading, setDemoLoading] = useState(false);

    /* auth + portfolio (for the dashboard preview card) */
    useEffect(() => {
        fetch('/api/auth/me', { credentials: 'same-origin' })
            .then(r => r.json())
            .then(async d => {
                setAuthenticated(d.authenticated);
                if (d.authenticated) {
                    const h = await fetch('/api/holdings').then(r => r.json());
                    setPortfolioData(h);
                }
            })
            .catch(() => {});
    }, []);

    const pct = portfolioData?.pct ?? 2.4;
    const isUp = pct >= 0;
    const total = authenticated && portfolioData
        ? (portfolioData.portfolio_value ?? 0) + (portfolioData.cash ?? 0)
        : 10_482.32;

    /* count-up animation for the portfolio number */
    const [displayTotal, setDisplayTotal] = useState(0);
    useEffect(() => {
        let raf: number;
        const startTime = performance.now();
        const duration = 1000;
        const tick = (now: number) => {
            const p = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplayTotal(total * eased);
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [total]);

    /* "Watch Video" — there's no recorded video yet, so this launches the live
       interactive product tour instead of a dead button. */
    const startDemoTour = async () => {
        if (demoLoading) return;
        setDemoLoading(true);
        try {
            await fetch('/api/auth/demo-login', { method: 'POST', credentials: 'same-origin' });
        } catch { /* ignore — tutorial still runs */ }
        startTour();
        window.location.assign('/trade');
    };

    return (
        <div className={styles.page}>

            {/* ════════════════════════════
                HERO — dark navy
            ════════════════════════════ */}
            <section className={styles.heroSection}>
                <div className={styles.heroInner}>

                    {/* LEFT */}
                    <motion.div
                        className={styles.heroLeft}
                        initial="hidden"
                        animate="show"
                        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
                    >
                        <motion.h1 className={styles.heroTitle}
                            variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } }}
                        >
                            Learn. Practice.<br />
                            Build Your <span className={styles.heroGreen}>Financial Future.</span>
                        </motion.h1>

                        <motion.p className={styles.heroSub}
                            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, delay: 0.1 } } }}
                        >
                            Vestera is a free, nonprofit platform that helps students learn about
                            investing and trading through interactive lessons, real-time markets,
                            and a risk-free trading simulator.
                        </motion.p>

                        <motion.div className={styles.heroBtns}
                            variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.18 } } }}
                        >
                            <Link href={authenticated ? '/trade' : '/register'} className={styles.btnPrimary} data-tour="start-trading">
                                Get Started
                            </Link>
                            <button type="button" className={styles.btnOutline} onClick={startDemoTour} disabled={demoLoading}>
                                {demoLoading ? 'Starting…' : '▶ Watch Video'}
                            </button>
                        </motion.div>

                        <motion.p className={styles.heroMeta}
                            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.3 } } }}
                        >
                            Free to start · No real money, ever
                        </motion.p>
                    </motion.div>

                    {/* RIGHT — night-sky visual + floating dashboard preview */}
                    <div className={styles.heroVisual}>
                        <div className={styles.heroPhoto} aria-hidden="true">
                            <svg viewBox="0 0 600 460" preserveAspectRatio="xMidYMid slice">
                                <defs>
                                    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#0B1C33" />
                                        <stop offset="55%" stopColor="#17324F" />
                                        <stop offset="100%" stopColor="#1E3F63" />
                                    </linearGradient>
                                    <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
                                        <stop offset="0%" stopColor="#EDF2F8" stopOpacity="0.9" />
                                        <stop offset="45%" stopColor="#EDF2F8" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#EDF2F8" stopOpacity="0" />
                                    </radialGradient>
                                </defs>
                                <rect width="600" height="460" fill="url(#skyGrad)" />
                                <circle cx="470" cy="90" r="90" fill="url(#moonGlow)" />
                                <circle cx="470" cy="90" r="34" fill="#EDF2F8" opacity="0.92" />
                                <polygon points="0,460 0,300 90,220 160,290 230,240 300,310 380,250 460,320 540,270 600,320 600,460" fill="#122A4C" opacity="0.85" />
                                <polygon points="0,460 0,360 120,300 210,370 320,320 430,380 520,340 600,390 600,460" fill="#0D2038" />
                            </svg>
                        </div>

                        <motion.div className={styles.dashPreview}
                            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className={styles.dashHead}>
                                <div className={styles.dashHeadIcon}>
                                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 17l5-5 4 4 8-8" />
                                        <path d="M15 8h5v5" />
                                    </svg>
                                </div>
                                <div className={styles.dashHeadDots}><span /><span /><span /></div>
                            </div>
                            <div className={styles.dashLabel}>Portfolio Value</div>
                            <div className={styles.dashValue}>{fmtPortfolio(displayTotal)}</div>
                            <div className={styles.dashChange}>{isUp ? '▲ +' : '▼ '}{pct.toFixed(1)}% today</div>
                            <div className={styles.dashChart}>
                                <svg viewBox="0 0 200 46" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="dashChartGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#34D399" stopOpacity="0.35" />
                                            <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M0,38 L20,34 L40,30 L60,33 L80,22 L100,18 L120,20 L140,12 L160,8 L180,6 L200,2"
                                        stroke="#34D399" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                                    <path d="M0,38 L20,34 L40,30 L60,33 L80,22 L100,18 L120,20 L140,12 L160,8 L180,6 L200,2 L200,46 L0,46Z"
                                        fill="url(#dashChartGrad)" />
                                </svg>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════
                FEATURES — white bg
            ════════════════════════════ */}
            <section className={styles.featuresSection}>
                <motion.div className={styles.featuresGrid}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                    {FEATURES.map(f => (
                        <div className={styles.featureCard} key={f.title}>
                            <div className={styles.featureIcon}>{f.icon}</div>
                            <h3 className={styles.featureTitle}>{f.title}</h3>
                            <p className={styles.featureDesc}>{f.desc}</p>
                        </div>
                    ))}
                </motion.div>
            </section>

            {/* ════════════════════════════
                MINIMAL FOOTER
            ════════════════════════════ */}
            <footer className={styles.miniFooter}>
                <div className={styles.miniFooterInner}>
                    <span className={styles.miniFooterCopy}>© 2026 Vestera. Practice trading, real learning.</span>
                    <nav className={styles.miniFooterLinks}>
                        <Link href="/learn">Learn</Link>
                        <Link href="/stats">Leaderboard</Link>
                        <Link href="/partners">Partnerships</Link>
                        <Link href="/chapters">Start a Chapter</Link>
                        <Link href="/privacy">Privacy</Link>
                        <Link href="/terms">Terms</Link>
                    </nav>
                </div>
            </footer>

        </div>
    );
}
