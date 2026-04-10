'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import VLogo from '@/components/VLogo';
import NonProfitSection from '@/components/NonProfitSection';
import { useMarketStatus } from '@/hooks/useMarketStatus';
import { enterGuestMode } from '@/lib/guestMode';

/* ── display helpers ─────────────────────────────────────── */
interface NvdaData {
  price: number; change: number; changePct: number;
  open: number; volume: number; high52w: number; marketCap: number;
}
interface TickerItem { sym: string; price: number; change: number; changePct: number; }

const fmt$ = (n: number) => `$${n.toFixed(2)}`;
const fmtVol = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
};
const fmtCap = (n: number) => {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  return `$${(n / 1e6).toFixed(0)}M`;
};

export default function Home() {
  const router = useRouter();

  // ── auth / portfolio state ───────────────────────────────────
  const [authenticated, setAuthenticated] = useState(false);
  const [portfolioData, setPortfolioData] = useState<{
    pl: number; pct: number; cash: number; portfolio_value: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // ── real market data state ────────────────────────────────────
  const [nvdaData, setNvdaData]   = useState<NvdaData | null>(null);
  const [tickerData, setTickerData] = useState<TickerItem[]>([]);
  // Use a CSS variable so it's correct in both light and dark mode
  const [priceColor, setPriceColor] = useState<string>('var(--vt-text)');
  const prevNvdaPrice = useRef<number>(0);
  const marketStatus = useMarketStatus();

  // Vestera Prototype Animation Add-on — ticker visibility state
  const [tickerVisible, setTickerVisible] = useState(true);

  // ── refs ─────────────────────────────────────────────────────
  const heroRef = useRef<HTMLElement>(null);

  // ── auth effect ──────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then(res => res.json())
      .then(async data => {
        setAuthenticated(data.authenticated);
        if (data.authenticated) {
          const holdings = await fetch('/api/holdings').then(r => r.json());
          setPortfolioData(holdings);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── refresh portfolio while logged in (live quotes → holdings value) ──
  useEffect(() => {
    if (!authenticated) return;
    const refresh = () => {
      fetch('/api/holdings', { credentials: 'same-origin' })
        .then(r => (r.ok ? r.json() : null))
        .then(d => {
          if (d) setPortfolioData(d);
        })
        .catch(() => {});
    };
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, [authenticated]);

  // ── real market data fetch ────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const fetchNvda = async () => {
      try {
        const res = await fetch('/api/quote/NVDA');
        if (!res.ok || !mounted) return;
        const data: NvdaData = await res.json();
        if (prevNvdaPrice.current && data.price !== prevNvdaPrice.current) {
          setPriceColor(data.price >= prevNvdaPrice.current ? '#4ade80' : '#f87171');
          setTimeout(() => { if (mounted) setPriceColor('var(--vt-text)'); }, 600);
        }
        prevNvdaPrice.current = data.price;
        if (mounted) setNvdaData(data);
      } catch { /* ignore */ }
    };

    const fetchTicker = async () => {
      try {
        const res = await fetch('/api/market-data');
        if (!res.ok || !mounted) return;
        const json = await res.json();
        if (mounted) setTickerData(json.data ?? []);
      } catch { /* ignore */ }
    };

    fetchNvda();
    fetchTicker();
    const nvdaInt   = setInterval(fetchNvda,   30_000);
    const tickerInt = setInterval(fetchTicker, 60_000);

    return () => {
      mounted = false;
      clearInterval(nvdaInt);
      clearInterval(tickerInt);
    };
  }, []);

  // ── animation effects ────────────────────────────────────────
  useEffect(() => {
    // Feature card scroll reveal (ctaCard handled separately below)
    const revealEls = document.querySelectorAll(`.${styles.featureItem}`);
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el  = entry.target as HTMLElement;
          const idx = Array.from(revealEls).indexOf(el);
          el.style.animationDelay = (idx % 3) * 0.13 + 's';
          el.classList.add(styles.visible);
          revealObs.unobserve(el);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => revealObs.observe(el));

    // Vestera Prototype Animation Add-on — hide ticker when hero exits viewport
    const heroEl = heroRef.current;
    const heroExitObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const scrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        setTickerVisible(!scrolledPast);
      });
    }, { threshold: 0 });
    if (heroEl) heroExitObs.observe(heroEl);

    return () => {
      revealObs.disconnect();
      heroExitObs.disconnect();
    };
  }, []);

  // Runs after auth resolves so the CTA card is actually in the DOM
  useEffect(() => {
    if (loading || authenticated) return;
    const ctaEl = document.querySelector(`.${styles.ctaCard}`) as HTMLElement | null;
    if (!ctaEl) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.visible);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    obs.observe(ctaEl);
    return () => obs.disconnect();
  }, [loading, authenticated]);

  const pl   = portfolioData?.pl  ?? 0;
  const pct  = portfolioData?.pct ?? 0;
  const isUp = pl >= 0;

  return (
    <div className={styles.wrap}>

      {/* Vestera Prototype Animation Add-on — scrolling stock ticker tape (real data) */}
      <div className={`${styles.ticker}${tickerVisible ? '' : ' ' + styles.tickerHidden}`}>
        {tickerData.length > 0 && (
          <div className={styles.tickerInner}>
            {/* items duplicated for a seamless infinite scroll loop */}
            {[...tickerData, ...tickerData].map((s, i) => (
              <span key={i} className={styles.tickerItem}>
                <strong>{s.sym}</strong>
                {fmt$(s.price)}{' '}
                <span className={s.change >= 0 ? styles.tickerUp : styles.tickerDn}>
                  {s.change >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Ambient background orbs ── */}
      <div className={styles.bgOrbs} aria-hidden="true">
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={`${styles.orb} ${styles.orb3}`} />
      </div>
      <div className={styles.grain} aria-hidden="true" />

      {/* ── HERO ── */}
      <section className={styles.hero} ref={heroRef}>
        <div className={styles.heroLeft}>
          <div className={styles.heroEyebrow}>
            <span className={styles.eyebrowDot} />
            Paper Trading Platform
          </div>
          <h1 className={styles.heroTitle}>
            Trade smarter.<br />
            <span className={styles.heroTitleAccent}>Risk nothing.</span>
          </h1>
          <p className={styles.heroSub}>
            Practice with real market data, AI-powered insights, and a $100K virtual portfolio. Learn the markets before you risk real money.
          </p>
          <div className={styles.heroBtns}>
            <Link href={authenticated ? '/trade' : '/restricted'} className={styles.btnPrimary}>Launch Dashboard</Link>
            <Link href="/learn" className={styles.btnGhost}>Browse Lessons →</Link>
          </div>
          <button
            type="button"
            className={styles.heroGuestLink}
            onClick={() => {
              enterGuestMode();
              router.push('/learn');
            }}
          >
            Continue without account →
          </button>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <strong>77+</strong>
              <span>Real Stocks</span>
            </div>
            <div className={styles.heroStat}>
              <strong>$100K</strong>
              <span>Starting Balance</span>
            </div>
            <div className={styles.heroStat}>
              <strong>0%</strong>
              <span>Risk</span>
            </div>
          </div>
        </div>

        {/* ── MOCK TRADING CARD ── */}
        <div className={styles.heroRight}>
          <div className={styles.mockCard}>
            <div className={styles.mockHeader}>
              <div className={styles.mockTicker}>
                <VLogo size={36} />
                <div>
                  <div className={styles.mockTickerName}>NVDA</div>
                  <div className={styles.mockTickerSub}>NVIDIA Corp</div>
                </div>
              </div>
              <div
                className={styles.mockBadge}
                style={{
                  background: marketStatus.open ? 'rgba(74,222,128,0.10)' : 'rgba(248,113,113,0.10)',
                  border: `1px solid ${marketStatus.open ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
                  color: marketStatus.open ? '#4ade80' : '#f87171',
                }}
              >
                <span style={{
                  display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                  background: marketStatus.open ? '#4ade80' : '#f87171',
                  marginRight: 5,
                  boxShadow: marketStatus.open ? '0 0 6px #4ade80' : 'none',
                  animation: marketStatus.open ? 'pulse 2s ease-in-out infinite' : 'none',
                }} />
                {marketStatus.label}
              </div>
            </div>
            <div className={styles.mockPrice} style={{ color: priceColor }}>
              {nvdaData ? fmt$(nvdaData.price) : '—'}
            </div>
            <div
              className={styles.mockChange}
              style={{ color: nvdaData && nvdaData.change >= 0 ? '#4ade80' : '#f87171' }}
            >
              {nvdaData
                ? `${nvdaData.change >= 0 ? '+' : ''}${fmt$(nvdaData.change)} (${nvdaData.change >= 0 ? '+' : ''}${nvdaData.changePct.toFixed(2)}%) today`
                : 'Loading…'}
            </div>
            <div className={styles.mockChart}>
              <svg viewBox="0 0 300 80" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradHero" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f6ef7" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="#4f6ef7" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d="M0,65 L20,60 L40,55 L60,58 L80,45 L100,40 L120,35 L140,38 L160,25 L180,20 L200,22 L220,15 L240,18 L260,10 L280,8 L300,5" stroke="#4f6ef7" strokeWidth="2.5" fill="none"/>
                <path d="M0,65 L20,60 L40,55 L60,58 L80,45 L100,40 L120,35 L140,38 L160,25 L180,20 L200,22 L220,15 L240,18 L260,10 L280,8 L300,5 L300,80 L0,80 Z" fill="url(#chartGradHero)"/>
              </svg>
            </div>
            <div className={styles.mockGrid}>
              <div className={styles.mockGridItem}>
                <span>Open</span>
                <strong>{nvdaData ? fmt$(nvdaData.open) : '—'}</strong>
              </div>
              <div className={styles.mockGridItem}>
                <span>Volume</span>
                <strong>{nvdaData ? fmtVol(nvdaData.volume) : '—'}</strong>
              </div>
              <div className={styles.mockGridItem}>
                <span>52W High</span>
                <strong>{nvdaData ? fmt$(nvdaData.high52w) : '—'}</strong>
              </div>
              <div className={styles.mockGridItem}>
                <span>Mkt Cap</span>
                <strong>{nvdaData ? fmtCap(nvdaData.marketCap) : '—'}</strong>
              </div>
            </div>
            <button
              className={styles.mockBuyBtn}
              onClick={() => router.push(authenticated ? '/trade?ticker=NVDA' : '/restricted')}
            >
              Buy NVDA — Paper Trade
            </button>
          </div>

          {/* Personalized badge when logged in */}
          {!loading && authenticated && portfolioData && (
            <div className={styles.floatingBadge}>
              <div className={styles.floatingBadgeIcon}>{isUp ? '📈' : '📉'}</div>
              <div className={styles.floatingBadgeText}>
                <strong>Your portfolio today</strong>
                <span style={{ color: isUp ? '#4ade80' : '#f87171' }}>
                  {isUp ? '+' : ''}${pl.toFixed(2)} ({isUp ? '+' : ''}{pct.toFixed(1)}%)
                </span>
              </div>
            </div>
          )}

          {/* Static badge for logged-out users */}
          {!loading && !authenticated && (
            <div className={styles.floatingBadge}>
              <div className={styles.floatingBadgeIcon}>🚀</div>
              <div className={styles.floatingBadgeText}>
                <strong>Start with $100,000</strong>
                <span style={{ color: '#4ade80' }}>Zero risk. Real data.</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className={styles.features}>
        <div className={styles.sectionLabel}>Everything you need</div>
        <h2 className={styles.sectionTitle}>Built for serious learners</h2>

        <NonProfitSection />

        <div className={styles.featureGrid}>
          <div className={styles.featureItem}>
            <div className={`${styles.featureIcon} ${styles.iconBlue}`}>📊</div>
            <h3>Live Charts</h3>
            <p>Candlestick, area, and line charts powered by real Yahoo Finance data. Multi-timeframe analysis just like the pros use.</p>
          </div>
          <div className={styles.featureItem}>
            <div className={`${styles.featureIcon} ${styles.iconPurple}`}>🤖</div>
            <h3>AI Stock Analyst</h3>
            <p>Get entry and exit signals, risk assessments, and trade recommendations from an intelligent AI trading assistant.</p>
          </div>
          <div className={styles.featureItem}>
            <div className={`${styles.featureIcon} ${styles.iconGreen}`}>🎓</div>
            <h3>Learning Academy</h3>
            <p>30+ lessons across beginner, intermediate, and advanced levels. Master technical analysis, risk management, and strategy.</p>
          </div>
        </div>
      </section>

      {/* ── CTA — logged-out only ── */}
      {!loading && !authenticated && (
        <section className={styles.ctaSection}>
          <div className={styles.ctaCard}>
            <h2 className={styles.ctaTitle}>Start trading today</h2>
            <p className={styles.ctaSub}>Free forever. No credit card. No risk.</p>
            <div className={styles.ctaBtns}>
              <Link href="/register" className={styles.btnPrimary}>Create Free Account</Link>
              <Link href="/login"    className={styles.btnGhost}>Sign In →</Link>
            </div>
            <button
              type="button"
              className={styles.heroGuestLink}
              style={{ marginTop: 16, marginBottom: 0 }}
              onClick={() => {
                enterGuestMode();
                router.push('/learn');
              }}
            >
              Continue without account →
            </button>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>Vestera</div>
        <div className={styles.footerText}>© 2026 Vestera · For educational purposes only. Not financial advice.</div>
      </footer>

    </div>
  );
}
