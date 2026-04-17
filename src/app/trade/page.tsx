'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './trade.module.css';
import { buildChartOptions, getChartColors, isThemeDark } from '@/lib/chartTheme';
import { useMarketStatus } from '@/hooks/useMarketStatus';
import { isMarketOpen, MARKET_CLOSED_TRADE_MESSAGE } from '@/lib/marketStatus';
import DashNav from '@/components/DashNav';
import GuestGuard from '@/components/GuestGuard';
import { useTradeAsset } from '@/hooks/useTradeAsset';
import { useAssetSearch } from '@/hooks/useAssetSearch';
import { AssetSearchInput } from '@/components/trade/AssetSearchInput';
import { getAssetBySymbol, normalizeTradableTicker } from '@/lib/assetCatalog';
import { displaySymbol } from '@/lib/symbolDisplay';
import {
    type TradeChartTimeframe,
    TRADE_CHART_TIMEFRAMES,
    barChartTime,
    historyQueryForTimeframe,
    isIntradayTimeframe,
} from '@/lib/chartRanges';
import {
    formatPositionPnL,
    hasUsablePrice,
    isPnLNonNegative,
    positionGainLossDollars,
    positionMarketValue,
} from '@/lib/holdingDisplay';

// ── Types ──────────────────────────────────────────────────────────────────

interface TradeEntry {
    stock: string;
    action: string;
    shares: number;
    price: number;
    created_at: string;
}

interface HoldingEntry {
    stock: string;
    shares: number;
    /** Weighted average cost per share from trade history */
    buy_price: number;
    current_price: number;
    value: number;
    gain_loss: number;
    gain_loss_pct?: number;
}

interface PriceAlert {
    id: string;
    ticker: string;
    condition: 'above' | 'below';
    target_price: number;
}

interface OhlcBar {
    time: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    value?: number;
}

interface WatchItem {
    sym: string;
    name: string;
    price: number;
    change: number;
    changePct: number;
}

// ── Static watchlist (prices fetched dynamically) ─────────────────────────

const WATCHLIST_BASE: WatchItem[] = [
    { sym: 'AAPL',  name: 'Apple Inc.',       price: 0, change: 0, changePct: 0 },
    { sym: 'NVDA',  name: 'NVIDIA Corp.',      price: 0, change: 0, changePct: 0 },
    { sym: 'MSFT',  name: 'Microsoft Corp.',   price: 0, change: 0, changePct: 0 },
    { sym: 'TSLA',  name: 'Tesla Inc.',        price: 0, change: 0, changePct: 0 },
    { sym: 'GOOGL', name: 'Alphabet Inc.',     price: 0, change: 0, changePct: 0 },
    { sym: 'AMZN',  name: 'Amazon.com',        price: 0, change: 0, changePct: 0 },
    { sym: 'META',  name: 'Meta Platforms',    price: 0, change: 0, changePct: 0 },
    { sym: 'JPM',   name: 'JPMorgan Chase',    price: 0, change: 0, changePct: 0 },
    { sym: 'V',     name: 'Visa Inc.',         price: 0, change: 0, changePct: 0 },
    { sym: 'NFLX',  name: 'Netflix Inc.',      price: 0, change: 0, changePct: 0 },
    { sym: 'AMD',   name: 'AMD Inc.',          price: 0, change: 0, changePct: 0 },
    { sym: 'INTC',  name: 'Intel Corp.',       price: 0, change: 0, changePct: 0 },
];

// ── Helpers ────────────────────────────────────────────────────────────────


// ── Component ──────────────────────────────────────────────────────────────

function TradingDashboard() {
    const [authChecked, setAuthChecked] = useState(false);
    const {
        ticker,
        setTicker,
        quote: stockQuote,
        loading: quoteLoading,
        error: quoteError,
    } = useTradeAsset('AAPL', { enabled: authChecked, pollIntervalMs: 15_000 });
    const assetSearch = useAssetSearch({ debounceMs: 220, limit: 28 });
    const [quantity, setQuantity] = useState(1);
    const [cash, setCash] = useState(0);
    const [holdings, setHoldings] = useState<HoldingEntry[]>([]);
    const [recentTrades, setRecentTrades] = useState<TradeEntry[]>([]);
    const [chartType, setChartType] = useState<'candlestick' | 'area' | 'line'>('area');
    const [timeframe, setTimeframe] = useState<TradeChartTimeframe>('1M');
    const timeframeRef = useRef<TradeChartTimeframe>(timeframe);
    timeframeRef.current = timeframe;
    const [statusMsg, setStatusMsg] = useState('');
    const [statusType, setStatusType] = useState<'success' | 'error'>('success');
    const [chartReady, setChartReady] = useState(false);
    const [chartEmptyReason, setChartEmptyReason] = useState<string | null>(null);

    // OHLC tooltip state
    const [ohlcBar, setOhlcBar] = useState<OhlcBar | null>(null);
    const [ohlcLocked, setOhlcLocked] = useState(false);
    const ohlcLockedRef = useRef(false);

    // Watchlist state
    const [watchlist, setWatchlist] = useState<WatchItem[]>(WATCHLIST_BASE);
    const [watchlistLoading, setWatchlistLoading] = useState(true);

    // Price alert state
    const [alerts, setAlerts] = useState<PriceAlert[]>([]);
    const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');
    const [alertPrice, setAlertPrice] = useState('');
    const [alertMsg, setAlertMsg] = useState('');
    const [alertMsgType, setAlertMsgType] = useState<'success' | 'error'>('success');
    const [alertSaving, setAlertSaving] = useState(false);
    const [marketClosedToast, setMarketClosedToast] = useState<string | null>(null);
    const marketClosedToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [showChatHint, setShowChatHint] = useState(true);

    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstanceRef = useRef<ReturnType<typeof import('lightweight-charts').createChart> | null>(null);
    const seriesRef = useRef<unknown>(null);
    /** Bars from `/api/history` (daily or intraday); last bar merged with live quote when polling. */
    const chartHistoryRef = useRef<
        { date: string; timeUtc?: number; open: number; high: number; low: number; close: number }[]
    >([]);
    const lcRef = useRef<typeof import('lightweight-charts') | null>(null);
    const themeObserverRef = useRef<MutationObserver | null>(null);
    const chartResizeObserverRef = useRef<ResizeObserver | null>(null);

    const router = useRouter();
    const watchlistIntervalRef = useRef<NodeJS.Timeout | null>(null);
    // Live market status — re-evaluates every 60 s via the hook
    const marketStatus = useMarketStatus();

    const displayPrice = stockQuote?.price ?? 0;

    // ── 1. Auth gate (wait for /me; only redirect when definitively unauthenticated) ─
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
                if (cancelled) return;
                if (!res.ok) {
                    router.replace('/restricted');
                    return;
                }
                const data = await res.json();
                if (cancelled) return;
                if (data.authenticated === true) setAuthChecked(true);
                else router.replace('/restricted');
            } catch {
                if (!cancelled) router.replace('/restricted');
            }
        })();
        return () => { cancelled = true; };
    }, [router]);

    // ── 2. Prefill ticker from ?ticker= URL param ─────────────────────────────
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('ticker');
        if (t) setTicker(normalizeTradableTicker(t));
    }, []);

    // ── 3. Fetch holdings ─────────────────────────────────────────────────────
    const fetchHoldings = useCallback(async () => {
        try {
            const res = await fetch('/api/holdings');
            if (!res.ok) return;
            const data = await res.json();
            setCash(data.cash || 0);
            setHoldings(data.holdings || []);
        } catch { /* ignore */ }
    }, []);

    // ── 4. Fetch alerts ───────────────────────────────────────────────────────
    const fetchAlerts = useCallback(async () => {
        try {
            const res = await fetch('/api/alerts');
            if (!res.ok) return;
            const data = await res.json();
            setAlerts(data.alerts || []);
        } catch { /* ignore */ }
    }, []);

    // ── 5. Fetch watchlist prices (parallel /api/quote for each ticker) ───────
    const fetchWatchlistPrices = useCallback(async () => {
        const results = await Promise.allSettled(
            WATCHLIST_BASE.map(async item => {
                try {
                    const res = await fetch(`/api/quote/${item.sym}`);
                    if (!res.ok) return null;
                    const d = await res.json();
                    return { sym: item.sym, price: d.price ?? 0, change: d.change ?? 0, changePct: d.changePct ?? 0 };
                } catch {
                    return null;
                }
            })
        );
        setWatchlist(prev => prev.map(item => {
            const found = results.find(
                r => r.status === 'fulfilled' && r.value?.sym === item.sym
            );
            if (found?.status === 'fulfilled' && found.value) {
                return { ...item, ...found.value };
            }
            return item;
        }));
        setWatchlistLoading(false);
    }, []);

    // ── 6. Chart initialisation (single instance; full teardown on cleanup) ─
    // Without teardown, React Strict Mode / remounts can leave a second chart
    // inside the same container (stacked canvases — looks like a duplicate graph).
    useEffect(() => {
        if (!authChecked) return;

        let mounted = true;

        const disposeChart = () => {
            chartResizeObserverRef.current?.disconnect();
            chartResizeObserverRef.current = null;
            themeObserverRef.current?.disconnect();
            themeObserverRef.current = null;
            try {
                chartInstanceRef.current?.remove();
            } catch {
                /* chart may already be disposed */
            }
            chartInstanceRef.current = null;
            seriesRef.current = null;
            lcRef.current = null;
            if (chartRef.current) {
                chartRef.current.replaceChildren();
            }
            setChartReady(false);
        };

        const initChart = async () => {
            await new Promise(resolve => setTimeout(resolve, 80));
            if (!mounted || !chartRef.current) return;

            const lc = await import('lightweight-charts');
            if (!mounted || !chartRef.current) return;

            disposeChart();
            if (!mounted || !chartRef.current) return;

            lcRef.current = lc;

            const dark = isThemeDark();
            const colors = getChartColors(dark);

            const chart = lc.createChart(chartRef.current, {
                width:  chartRef.current.clientWidth,
                height: chartRef.current.clientHeight || 440,
                layout: {
                    background: { type: lc.ColorType.Solid, color: 'transparent' },
                    textColor: colors.textColor,
                },
                grid: {
                    vertLines: { color: colors.gridColor },
                    horzLines: { color: colors.gridColor },
                },
                timeScale: {
                    timeVisible: true,
                    borderColor: colors.borderColor,
                },
                rightPriceScale: {
                    borderColor: colors.borderColor,
                },
                crosshair: { mode: 1 },
            });

            chartInstanceRef.current = chart;

            const ro = new ResizeObserver(() => {
                if (chartRef.current && chartInstanceRef.current) {
                    chartInstanceRef.current.applyOptions({
                        width: chartRef.current.clientWidth,
                    });
                }
            });
            ro.observe(chartRef.current);
            chartResizeObserverRef.current = ro;

            const themeObserver = new MutationObserver(() => {
                if (!chartInstanceRef.current) return;
                chartInstanceRef.current.applyOptions(buildChartOptions(isThemeDark()));
            });
            themeObserver.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['data-theme'],
            });
            themeObserverRef.current = themeObserver;

            // ── OHLC hover subscription ──────────────────────────────────────
            // seriesRef.current always holds the active series — safe to use
            // inside the handler even though the handler is created once here.
            type LcParam = {
                time?: unknown;
                seriesData: Map<object, Record<string, number>>;
            };

            const formatCrosshairTimeLabel = (t: unknown): string => {
                if (typeof t === 'number') {
                    return new Date(t * 1000).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    });
                }
                return String(t);
            };

            chart.subscribeCrosshairMove((param) => {
                const p = param as unknown as LcParam;
                if (!p.time) {
                    if (!ohlcLockedRef.current) setOhlcBar(null);
                    return;
                }
                if (ohlcLockedRef.current) return;
                if (!seriesRef.current) return;
                const data = p.seriesData?.get(seriesRef.current as object);
                if (!data) return;
                const rawTime = p.time;
                const timeLabel =
                    typeof rawTime === 'number' || timeframeRef.current === '1D'
                        ? formatCrosshairTimeLabel(rawTime)
                        : String(rawTime);
                setOhlcBar({
                    time: timeLabel,
                    open:  typeof data.open  === 'number' ? data.open  : undefined,
                    high:  typeof data.high  === 'number' ? data.high  : undefined,
                    low:   typeof data.low   === 'number' ? data.low   : undefined,
                    close: typeof data.close === 'number' ? data.close : undefined,
                    value: typeof data.value === 'number' ? data.value : undefined,
                });
            });

            // Click to lock / unlock the OHLC bar
            chart.subscribeClick((param) => {
                const p = param as unknown as LcParam;
                if (!p.time) return;
                const newLocked = !ohlcLockedRef.current;
                ohlcLockedRef.current = newLocked;
                setOhlcLocked(newLocked);
                if (newLocked && seriesRef.current) {
                    const data = p.seriesData?.get(seriesRef.current as object);
                    if (data) {
                        const rawTime = p.time;
                        const timeLabel =
                            typeof rawTime === 'number' || timeframeRef.current === '1D'
                                ? formatCrosshairTimeLabel(rawTime)
                                : String(rawTime);
                        setOhlcBar({
                            time: timeLabel,
                            open:  typeof data.open  === 'number' ? data.open  : undefined,
                            high:  typeof data.high  === 'number' ? data.high  : undefined,
                            low:   typeof data.low   === 'number' ? data.low   : undefined,
                            close: typeof data.close === 'number' ? data.close : undefined,
                            value: typeof data.value === 'number' ? data.value : undefined,
                        });
                    }
                }
            });

            if (mounted) setChartReady(true);
        };

        void initChart();

        return () => {
            mounted = false;
            disposeChart();
        };
    }, [authChecked]);

    // ── 7. Load chart data ────────────────────────────────────────────────────
    useEffect(() => {
        if (!chartReady || !chartInstanceRef.current || !lcRef.current) return;
        const chart = chartInstanceRef.current;
        const lc = lcRef.current;

        if (seriesRef.current) {
            try { chart.removeSeries(seriesRef.current as Parameters<typeof chart.removeSeries>[0]); } catch { /* ignore */ }
            seriesRef.current = null;
        }
        // Clear OHLC bar when chart data changes
        ohlcLockedRef.current = false;
        setOhlcLocked(false);
        setOhlcBar(null);
        setChartEmptyReason(null);

        const colors = getChartColors(isThemeDark());
        const intraday = isIntradayTimeframe(timeframe);
        const q = historyQueryForTimeframe(timeframe);

        fetch(`/api/history/${encodeURIComponent(ticker)}?${q}`)
            .then(async r => {
                const data = await r.json().catch(() => ({}));
                if (!chartInstanceRef.current) return;
                if (!r.ok) {
                    chartHistoryRef.current = [];
                    setChartEmptyReason(
                        timeframe === '1D'
                            ? 'Intraday data could not be loaded. Try again or pick another range.'
                            : null
                    );
                    return;
                }
                const bars = data.history as {
                    date: string;
                    timeUtc?: number;
                    open: number;
                    high: number;
                    low: number;
                    close: number;
                }[];
                if (!bars?.length) {
                    chartHistoryRef.current = [];
                    setChartEmptyReason(
                        timeframe === '1D'
                            ? 'No intraday data for this symbol right now (market closed or data unavailable).'
                            : null
                    );
                    return;
                }
                setChartEmptyReason(null);
                chartHistoryRef.current = bars;

                const t = (b: (typeof bars)[number]) => barChartTime(b, intraday);

                if (chartType === 'candlestick') {
                    const s = chart.addSeries(lc.CandlestickSeries, {
                        upColor: '#4ade80', downColor: '#f87171',
                        borderUpColor: '#4ade80', borderDownColor: '#f87171',
                        wickUpColor: '#4ade80', wickDownColor: '#f87171',
                    });
                    s.setData(
                        bars.map(b => ({
                            time: t(b),
                            open: b.open,
                            high: b.high,
                            low: b.low,
                            close: b.close,
                        })) as Parameters<typeof s.setData>[0]
                    );
                    seriesRef.current = s;
                } else if (chartType === 'area') {
                    const s = chart.addSeries(lc.AreaSeries, {
                        topColor:    colors.areaTopColor,
                        bottomColor: colors.areaBottomColor,
                        lineColor:   colors.lineColor,
                        lineWidth:   2,
                    });
                    s.setData(
                        bars.map(b => ({ time: t(b), value: b.close })) as Parameters<typeof s.setData>[0]
                    );
                    seriesRef.current = s;
                } else {
                    const s = chart.addSeries(lc.LineSeries, { color: '#9b5de5', lineWidth: 2 });
                    s.setData(
                        bars.map(b => ({ time: t(b), value: b.close })) as Parameters<typeof s.setData>[0]
                    );
                    seriesRef.current = s;
                }

                chart.timeScale().fitContent();
            })
            .catch(e => {
                console.error('Chart data error:', e);
                chartHistoryRef.current = [];
                if (timeframe === '1D') {
                    setChartEmptyReason('Could not load intraday chart. Check your connection and try again.');
                }
            });
    }, [ticker, chartType, timeframe, chartReady]);

    // ── 8. Keep last chart bar aligned with the same live quote as the header ─
    useEffect(() => {
        const live = stockQuote?.price;
        const sym = stockQuote?.sym?.toUpperCase();
        if (!chartReady || !live || sym !== ticker.toUpperCase()) return;
        const base = chartHistoryRef.current;
        if (!base.length) return;
        const chart = chartInstanceRef.current;
        const series = seriesRef.current;
        if (!chart || !series) return;

        const last = base[base.length - 1];
        const mergedLast = {
            ...last,
            close: live,
            high: Math.max(last.high, live),
            low: Math.min(last.low, live),
        };
        const displayBars = [...base.slice(0, -1), mergedLast];
        const intraday = isIntradayTimeframe(timeframe);
        const bt = (b: (typeof base)[number]) => barChartTime(b, intraday);

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const s = series as { setData: (d: any) => void };
            if (chartType === 'candlestick') {
                s.setData(
                    displayBars.map(b => ({
                        time: bt(b),
                        open: b.open,
                        high: b.high,
                        low: b.low,
                        close: b.close,
                    }))
                );
            } else {
                s.setData(displayBars.map(b => ({ time: bt(b), value: b.close })));
            }
        } catch {
            /* series replaced mid-update */
        }
    }, [chartReady, chartType, timeframe, ticker, stockQuote?.price, stockQuote?.sym, stockQuote?.updatedAt]);

    // ── 9. Holdings / alerts / watchlist (watchlist on its own cadence) ──────
    useEffect(() => {
        if (!authChecked) return;
        fetchHoldings();
        fetchAlerts();
        fetchWatchlistPrices();

        if (watchlistIntervalRef.current) clearInterval(watchlistIntervalRef.current);
        watchlistIntervalRef.current = setInterval(fetchWatchlistPrices, 60_000);

        const holdingsPoll = window.setInterval(fetchHoldings, 20_000);

        return () => {
            if (watchlistIntervalRef.current) clearInterval(watchlistIntervalRef.current);
            window.clearInterval(holdingsPoll);
        };
    }, [authChecked, ticker, fetchHoldings, fetchAlerts, fetchWatchlistPrices]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const selectStock = (sym: string) => {
        setTicker(normalizeTradableTicker(sym));
        assetSearch.setQuery('');
        assetSearch.setOpen(false);
        assetSearch.setSelectedIndex(-1);
    };

    const showMarketClosedToast = useCallback(() => {
        if (marketClosedToastTimer.current) clearTimeout(marketClosedToastTimer.current);
        setMarketClosedToast(MARKET_CLOSED_TRADE_MESSAGE);
        marketClosedToastTimer.current = setTimeout(() => {
            setMarketClosedToast(null);
            marketClosedToastTimer.current = null;
        }, 8000);
    }, []);

    useEffect(() => () => {
        if (marketClosedToastTimer.current) clearTimeout(marketClosedToastTimer.current);
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setShowChatHint(false), 8000);
        return () => clearTimeout(t);
    }, []);

    const dismissMarketClosedToast = useCallback(() => {
        if (marketClosedToastTimer.current) {
            clearTimeout(marketClosedToastTimer.current);
            marketClosedToastTimer.current = null;
        }
        setMarketClosedToast(null);
    }, []);

    const executeTrade = async (action: 'BUY' | 'SELL') => {
        if (!displayPrice || quantity <= 0) return;
        // Client check (instant feedback); server re-checks on every POST.
        if (!isMarketOpen()) {
            showMarketClosedToast();
            return;
        }
        setStatusMsg('');
        try {
            const res = await fetch('/api/trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticker, quantity, price: displayPrice, action }),
                credentials: 'same-origin',
            });
            const data = await res.json().catch(() => ({}));
            if (res.status === 403 && data.error === 'MARKET_CLOSED') {
                showMarketClosedToast();
                return;
            }
            if (data.success) {
                setStatusMsg(`${action} ${quantity} ${ticker} @ $${displayPrice.toFixed(2)}`);
                setStatusType('success');
                setCash(data.cash_after);
                await fetchHoldings();
                setRecentTrades(prev => [{
                    stock: ticker, action, shares: quantity, price: displayPrice,
                    created_at: new Date().toISOString(),
                }, ...prev].slice(0, 10));
            } else {
                setStatusMsg(typeof data.error === 'string' ? data.error : 'Trade failed');
                setStatusType('error');
            }
        } catch {
            setStatusMsg('Trade failed');
            setStatusType('error');
        }
    };

    const createAlert = async () => {
        const target = parseFloat(alertPrice);
        if (!alertPrice || isNaN(target) || target <= 0) {
            setAlertMsg('Enter a valid target price.');
            setAlertMsgType('error');
            return;
        }
        setAlertSaving(true);
        setAlertMsg('');
        try {
            const res = await fetch('/api/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticker, condition: alertCondition, targetPrice: target }),
            });
            const data = await res.json();
            if (data.alert) {
                setAlerts(prev => [data.alert, ...prev]);
                setAlertPrice('');
                setAlertMsg(`Alert set: ${ticker} ${alertCondition} $${target.toFixed(2)}`);
                setAlertMsgType('success');
            } else {
                setAlertMsg(data.error || 'Failed to create alert.');
                setAlertMsgType('error');
            }
        } catch {
            setAlertMsg('Network error.');
            setAlertMsgType('error');
        } finally {
            setAlertSaving(false);
            setTimeout(() => setAlertMsg(''), 4000);
        }
    };

    const deleteAlert = async (id: string) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
        try {
            await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
        } catch { /* optimistic delete */ }
    };

    const unlockOhlc = () => {
        ohlcLockedRef.current = false;
        setOhlcLocked(false);
    };

    const displayHoldings = useMemo(() => {
        const t = ticker.toUpperCase();
        return holdings.map(h => {
            const sym = h.stock.toUpperCase();
            const useLive =
                !!stockQuote &&
                hasUsablePrice(stockQuote.price) &&
                sym === t &&
                stockQuote.sym.toUpperCase() === sym;
            const price = useLive ? stockQuote.price : h.current_price;
            const hasQuote = hasUsablePrice(price);
            const avg = h.buy_price;
            const value = hasQuote ? positionMarketValue(h.shares, price) : h.value;
            const gainLoss = hasQuote ? positionGainLossDollars(h.shares, avg, price) : null;
            return {
                stock: h.stock,
                shares: h.shares,
                buy_price: avg,
                value,
                gainLoss,
                hasQuote,
                displayName: getAssetBySymbol(h.stock)?.name,
            };
        });
    }, [holdings, ticker, stockQuote]);

    const portfolioValue = displayHoldings.reduce((s, h) => s + h.value, 0);
    const tickerAlerts = alerts.filter(a => a.ticker === ticker);

    if (!authChecked) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'var(--vt-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <div style={{
                    width: 32, height: 32,
                    border: '2px solid rgba(79,110,247,0.15)',
                    borderTopColor: '#4f6ef7',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }} />
            </div>
        );
    }

    return (
        <div className={styles.dashWrap}>
            <DashNav onLogout={() => router.push('/')} />

            <div className={styles.dashGrid}>

                {/* ── Stock Watchlist Sidebar (left) ────────────────────── */}
                <div className={styles.stockList}>
                    <div className={styles.stockListHeader}>
                        <div className={styles.stockListTitle}>
                            Watchlist
                            {watchlistLoading && (
                                <span className={styles.stockListUpdating}>updating…</span>
                            )}
                        </div>
                    </div>
                    <div className={styles.stockListItems}>
                        {watchlist.map((item, idx) => (
                            <div key={item.sym}>
                                <button
                                    className={`${styles.stockItem} ${ticker === item.sym ? styles.stockItemActive : ''}`}
                                    onClick={() => selectStock(item.sym)}
                                >
                                    <div className={styles.stockItemLeft}>
                                        <span className={styles.stockSym}>{item.sym}</span>
                                        <span className={styles.stockName}>{item.name}</span>
                                    </div>
                                    <div className={styles.stockItemRight}>
                                        <span className={styles.stockPrice}>
                                            {item.price > 0 ? `$${item.price.toFixed(2)}` : '—'}
                                        </span>
                                        <span
                                            className={styles.stockChange}
                                            style={{ color: item.changePct >= 0 ? '#4ade80' : '#f87171' }}
                                        >
                                            {item.price > 0
                                                ? `${item.changePct >= 0 ? '+' : ''}${item.changePct.toFixed(2)}%`
                                                : '—'
                                            }
                                        </span>
                                    </div>
                                </button>
                                {idx < watchlist.length - 1 && (
                                    <div className={styles.stockDivider} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Chart panel ───────────────────────────────────────── */}
                <div className={styles.chartPanel}>
                    <div className={styles.chartHeader}>
                        <div className={styles.tickerInfo}>
                            <AssetSearchInput
                                query={assetSearch.query}
                                onQueryChange={assetSearch.setQuery}
                                open={assetSearch.open}
                                onOpenChange={assetSearch.setOpen}
                                onFocusOpen={assetSearch.onFocusOpen}
                                results={assetSearch.results}
                                loading={assetSearch.loading}
                                selectedIndex={assetSearch.selectedIndex}
                                onSelectedIndexChange={assetSearch.setSelectedIndex}
                                onSelectSymbol={selectStock}
                            />
                            <h2>{displaySymbol(ticker)}</h2>
                            <span className={styles.priceDisplay}>
                                {stockQuote ? (
                                    <>
                                        ${stockQuote.price.toFixed(2)}
                                        <span className={stockQuote.change >= 0 ? styles.up : styles.down}>
                                            {stockQuote.change >= 0 ? '▲' : '▼'} {Math.abs(stockQuote.change).toFixed(2)} (
                                            {stockQuote.changePct >= 0 ? '+' : ''}
                                            {stockQuote.changePct.toFixed(2)}%)
                                        </span>
                                    </>
                                ) : quoteLoading ? (
                                    <span style={{ color: 'var(--vt-text2)', fontSize: 15 }}>Loading…</span>
                                ) : (
                                    <span style={{ color: 'var(--vt-text3)' }}>—</span>
                                )}
                            </span>
                            {quoteError && !stockQuote && (
                                <span style={{ fontSize: 11, color: '#f87171', maxWidth: 200 }} title={quoteError}>
                                    {quoteError}
                                </span>
                            )}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: marketStatus.open ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
                                border: `1px solid ${marketStatus.open ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
                                borderRadius: '100px', padding: '4px 12px',
                            }}>
                                <div style={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    background: marketStatus.open ? '#4ade80' : '#f87171',
                                }} />
                                <span style={{ fontSize: 12, fontWeight: 600, color: marketStatus.open ? '#4ade80' : '#f87171' }}>
                                    {marketStatus.label}
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--vt-text2)' }}>· {marketStatus.sub}</span>
                            </div>
                        </div>

                        <div className={styles.chartControls}>
                            <div className={styles.chartTypeGroup}>
                                {(['area', 'candlestick', 'line'] as const).map(ct => (
                                    <button
                                        key={ct}
                                        className={`${styles.ctrlBtn} ${chartType === ct ? styles.active : ''}`}
                                        onClick={() => setChartType(ct)}
                                    >
                                        {ct.charAt(0).toUpperCase() + ct.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <div className={styles.chartTypeGroup}>
                                {TRADE_CHART_TIMEFRAMES.map(tf => (
                                    <button
                                        key={tf}
                                        type="button"
                                        className={`${styles.ctrlBtn} ${timeframe === tf ? styles.active : ''}`}
                                        onClick={() => setTimeframe(tf)}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── OHLC info bar — always visible, updates on hover ── */}
                    <div className={`${styles.ohlcBar} ${ohlcLocked ? styles.ohlcBarLocked : ''}`}>
                        {ohlcBar ? (
                            <>
                                <span className={styles.ohlcDate}>{ohlcBar.time}</span>

                                {ohlcBar.open !== undefined ? (
                                    /* Candlestick / area with OHLC data */
                                    <>
                                        <div className={styles.ohlcItem}>
                                            <span className={styles.ohlcItemLabel}>O</span>
                                            <span className={styles.ohlcItemVal}>${ohlcBar.open.toFixed(2)}</span>
                                        </div>
                                        <div className={styles.ohlcItem}>
                                            <span className={styles.ohlcItemLabel}>H</span>
                                            <span className={styles.ohlcItemVal} style={{ color: '#4ade80' }}>
                                                ${ohlcBar.high?.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className={styles.ohlcItem}>
                                            <span className={styles.ohlcItemLabel}>L</span>
                                            <span className={styles.ohlcItemVal} style={{ color: '#f87171' }}>
                                                ${ohlcBar.low?.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className={styles.ohlcItem}>
                                            <span className={styles.ohlcItemLabel}>C</span>
                                            <span
                                                className={styles.ohlcItemVal}
                                                style={{
                                                    color: (ohlcBar.close ?? 0) >= (ohlcBar.open ?? 0)
                                                        ? '#4ade80' : '#f87171',
                                                }}
                                            >
                                                ${ohlcBar.close?.toFixed(2)}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    /* Area/Line chart — single value */
                                    <div className={styles.ohlcItem}>
                                        <span className={styles.ohlcItemLabel}>Price</span>
                                        <span className={styles.ohlcItemVal}>${ohlcBar.value?.toFixed(2)}</span>
                                    </div>
                                )}

                                {ohlcLocked ? (
                                    <button className={styles.ohlcLockBtn} onClick={unlockOhlc}>
                                        🔒 Click to unlock
                                    </button>
                                ) : (
                                    <span className={styles.ohlcHint}>Click chart to lock</span>
                                )}
                            </>
                        ) : (
                            <span className={styles.ohlcEmpty}>
                                {stockQuote ? (
                                    <>
                                        <span className={styles.ohlcDate}>Live</span>
                                        <span className={styles.ohlcItemVal} style={{ fontWeight: 700 }}>
                                            ${stockQuote.price.toFixed(2)}
                                        </span>
                                        <span
                                            className={styles.ohlcItemVal}
                                            style={{ color: stockQuote.change >= 0 ? '#4ade80' : '#f87171' }}
                                        >
                                            {stockQuote.change >= 0 ? '+' : ''}
                                            {stockQuote.change.toFixed(2)} ({stockQuote.changePct >= 0 ? '+' : ''}
                                            {stockQuote.changePct.toFixed(2)}%)
                                        </span>
                                        <span style={{ marginLeft: 8, color: 'var(--vt-text3)', fontSize: 10 }}>
                                            · hover chart for bar details
                                        </span>
                                    </>
                                ) : quoteLoading ? (
                                    'Loading quote…'
                                ) : (
                                    'Hover over the chart to see price details'
                                )}
                            </span>
                        )}
                    </div>

                    {/* Chart canvas — lightweight-charts fills inner div */}
                    <div className={styles.chartCanvasWrap}>
                        <div ref={chartRef} className={styles.chartArea} />
                        {chartEmptyReason && (
                            <div className={styles.chartEmptyOverlay} role="status">
                                {chartEmptyReason}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right Sidebar ────────────────────────────────────── */}
                <div className={styles.sidebar}>

                    {/* Portfolio summary */}
                    <div className={styles.sideCard}>
                        <h3>Portfolio</h3>
                        <div className={styles.portfolioGrid}>
                            <div className={styles.portfolioItem}>
                                <span className={styles.itemLabel}>Cash</span>
                                <span className={styles.itemValue}>${cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className={styles.portfolioItem}>
                                <span className={styles.itemLabel}>Holdings</span>
                                <span className={styles.itemValue}>${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Trade form */}
                    <div className={styles.sideCard}>
                        <h3>Trade {ticker}</h3>
                        <div className={styles.tradeForm}>
                            <label className={styles.tradeLabel}>
                                Shares
                                <input
                                    type="number" min="1"
                                    value={quantity}
                                    onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                                    className={styles.tradeInput}
                                />
                            </label>
                            <div className={styles.tradeTotal}>
                                Total: <strong>${(quantity * displayPrice).toFixed(2)}</strong>
                            </div>
                            <div className={styles.tradeBtns}>
                                <button className={styles.buyBtn} onClick={() => executeTrade('BUY')}>BUY</button>
                                <button className={styles.sellBtn} onClick={() => executeTrade('SELL')}>SELL</button>
                            </div>
                            {statusMsg && (
                                <div className={`${styles.tradeStatus} ${statusType === 'success' ? styles.tradeSuccess : styles.tradeError}`}>
                                    {statusMsg}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Price alerts */}
                    <div className={styles.sideCard}>
                        <h3>Price Alerts</h3>
                        <div className={styles.alertForm}>
                            <div className={styles.alertRow}>
                                <select
                                    className={styles.alertSelect}
                                    value={alertCondition}
                                    onChange={e => setAlertCondition(e.target.value as 'above' | 'below')}
                                >
                                    <option value="above">Goes above</option>
                                    <option value="below">Drops below</option>
                                </select>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={alertPrice}
                                    onChange={e => setAlertPrice(e.target.value)}
                                    placeholder={displayPrice > 0 ? `$${displayPrice.toFixed(2)}` : 'Target price'}
                                    className={`${styles.tradeInput} ${styles.alertPriceInput}`}
                                />
                            </div>
                            <button
                                className={styles.alertBtn}
                                onClick={createAlert}
                                disabled={alertSaving}
                            >
                                {alertSaving ? 'Setting…' : `Set alert for ${ticker}`}
                            </button>
                            {alertMsg && (
                                <div className={`${styles.tradeStatus} ${alertMsgType === 'success' ? styles.tradeSuccess : styles.tradeError}`}>
                                    {alertMsg}
                                </div>
                            )}
                        </div>

                        {tickerAlerts.length > 0 && (
                            <div className={styles.alertsList}>
                                <div className={styles.alertsLabel}>Active for {ticker}</div>
                                {tickerAlerts.map(a => (
                                    <div key={a.id} className={styles.alertItem}>
                                        <div className={styles.alertItemLeft}>
                                            <span className={a.condition === 'above' ? styles.alertUp : styles.alertDown}>
                                                {a.condition === 'above' ? '↑' : '↓'}
                                            </span>
                                            <span className={styles.alertItemPrice}>${a.target_price.toFixed(2)}</span>
                                            <span className={styles.alertItemCond}>{a.condition}</span>
                                        </div>
                                        <button
                                            className={styles.alertDismiss}
                                            onClick={() => deleteAlert(a.id)}
                                            aria-label="Remove alert"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Holdings */}
                    <div className={styles.sideCard}>
                        <h3>Holdings</h3>
                        {displayHoldings.length === 0 ? (
                            <p className={styles.holdingsEmpty}>No holdings yet</p>
                        ) : (
                            <div className={styles.holdingsList}>
                                {displayHoldings.map(h => (
                                    <button
                                        key={h.stock}
                                        type="button"
                                        className={styles.holdingRow}
                                        onClick={() => selectStock(h.stock)}
                                    >
                                        <div className={styles.holdingRowInner}>
                                            <div className={styles.holdingRowTop}>
                                                <div className={styles.holdingTitleCol}>
                                                    <span className={styles.holdingTicker}>{h.stock}</span>
                                                    {h.displayName ? (
                                                        <span className={styles.holdingName}>{h.displayName}</span>
                                                    ) : null}
                                                </div>
                                                {h.hasQuote && h.gainLoss !== null ? (
                                                    <span
                                                        className={
                                                            isPnLNonNegative(h.gainLoss)
                                                                ? styles.holdingPnLPos
                                                                : styles.holdingPnLNeg
                                                        }
                                                    >
                                                        {formatPositionPnL(h.gainLoss)}
                                                    </span>
                                                ) : (
                                                    <span className={styles.holdingPnLMuted} title="Quote unavailable">
                                                        —
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.holdingRowBottom}>
                                                <span>
                                                    {h.shares} {h.shares === 1 ? 'share' : 'shares'}
                                                </span>
                                                <span className={styles.holdingMetaSep} aria-hidden>
                                                    •
                                                </span>
                                                <span>Avg cost ${h.buy_price.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent trades */}
                    {recentTrades.length > 0 && (
                        <div className={styles.sideCard}>
                            <h3>Recent Trades</h3>
                            <div className={styles.holdingsList}>
                                {recentTrades.slice(0, 5).map((t, i) => (
                                    <div key={i} className={styles.recentTradeRow}>
                                        <span className={t.action === 'BUY' ? styles.tradeBuy : styles.tradeSell}>{t.action}</span>
                                        <span>{t.shares} {t.stock}</span>
                                        <span className={styles.holdingValue}>${t.price.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showChatHint && (
                <div className={styles.chatHint} role="complementary" onClick={() => setShowChatHint(false)}>
                    <div className={styles.chatHintCard}>
                        <p className={styles.chatHintLabel}>Try it out</p>
                        <p className={styles.chatHintTitle}>Interactive AI Coach</p>
                        <p className={styles.chatHintSub}>Ask about any stock, get coaching on trades, or learn investing concepts.</p>
                        <svg className={styles.chatHintArrow} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 4 C4 32 36 36 54 54" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none"/>
                            <path d="M54 54 L40 48 M54 54 L48 40" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                        </svg>
                    </div>
                </div>
            )}

            {marketClosedToast && (
                <div className={styles.marketClosedToast} role="alert">
                    <div className={styles.marketClosedToastCard}>
                        <div className={styles.marketClosedToastHead}>
                            <span className={styles.marketClosedToastLabel}>Trading unavailable</span>
                            <button
                                type="button"
                                className={styles.marketClosedToastClose}
                                onClick={dismissMarketClosedToast}
                                aria-label="Dismiss"
                            >
                                ×
                            </button>
                        </div>
                        <p className={styles.marketClosedToastBody}>{marketClosedToast}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TradePage() {
    return (
        <GuestGuard>
            <TradingDashboard />
        </GuestGuard>
    );
}
