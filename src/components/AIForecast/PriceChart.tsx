'use client';

import { useEffect, useRef, useState } from 'react';
import { getChartColors, isThemeDark, buildChartOptions } from '@/lib/chartTheme';
import styles from './aiForecastComponents.module.css';

export type ChartRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y';
const RANGES: ChartRange[] = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'];

interface HistoryBar {
    date: string;
    timeUtc?: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

interface ForecastPoint {
    time: string | number;
    low: number;
    mid: number;
    high: number;
}

interface PredictAITrajectoryPoint {
    time: string | number;
    price: number;
}

/** Maps the chart's range toggle to a Vestera Predict AI horizon. 5Y has no equivalent (model's longest horizon is 1Y) — honestly omitted rather than extrapolated. */
const RANGE_TO_PREDICT_AI_HORIZON: Partial<Record<ChartRange, string>> = {
    '1D': 'TODAY',
    '1W': '1W',
    '1M': '1M',
    '3M': '3M',
    '6M': '6M',
    '1Y': '1Y',
};

export default function PriceChart({ symbol }: { symbol: string }) {
    const [range, setRange] = useState<ChartRange>('3M');
    const [loading, setLoading] = useState(true);
    const [emptyReason, setEmptyReason] = useState<string | null>(null);
    const [horizonLabel, setHorizonLabel] = useState<string | null>(null);
    const [predictAIActive, setPredictAIActive] = useState(false);
    const chartRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chartInstanceRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lcRef = useRef<any>(null);
    const [chartReady, setChartReady] = useState(false);

    useEffect(() => {
        let mounted = true;
        // `init` is async, so its own `return` value isn't the effect's cleanup function —
        // these must be captured in refs the outer cleanup below can reach, or the observers
        // never get disconnected and keep firing `applyOptions` on a removed chart.
        let ro: ResizeObserver | null = null;
        let themeObserver: MutationObserver | null = null;
        const init = async () => {
            await new Promise(r => setTimeout(r, 60));
            if (!mounted || !chartRef.current) return;
            const lc = await import('lightweight-charts');
            if (!mounted || !chartRef.current) return;
            lcRef.current = lc;

            const colors = getChartColors(isThemeDark());
            const chart = lc.createChart(chartRef.current, {
                width: chartRef.current.clientWidth,
                height: 420,
                layout: { background: { type: lc.ColorType.Solid, color: 'transparent' }, textColor: colors.textColor },
                grid: { vertLines: { color: colors.gridColor }, horzLines: { color: colors.gridColor } },
                timeScale: { timeVisible: true, borderColor: colors.borderColor },
                rightPriceScale: { borderColor: colors.borderColor },
                crosshair: { mode: 1 },
            });
            chartInstanceRef.current = chart;

            ro = new ResizeObserver(() => {
                if (chartRef.current) chart.applyOptions({ width: chartRef.current.clientWidth });
            });
            ro.observe(chartRef.current);

            themeObserver = new MutationObserver(() => chart.applyOptions(buildChartOptions(isThemeDark())));
            themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

            setChartReady(true);
        };
        void init();
        return () => {
            mounted = false;
            ro?.disconnect();
            themeObserver?.disconnect();
            try { chartInstanceRef.current?.remove(); } catch { /* ignore */ }
            chartInstanceRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!chartReady || !chartInstanceRef.current || !lcRef.current) return;
        const chart = chartInstanceRef.current;
        const lc = lcRef.current;
        // Guards against a slow response for a stock/range the user has since navigated away
        // from landing after a newer request already rendered — without this, series for the
        // wrong symbol/range could get drawn onto the chart.
        let cancelled = false;
        setLoading(true);
        setEmptyReason(null);

        const predictAIHorizonKey = RANGE_TO_PREDICT_AI_HORIZON[range];

        Promise.all([
            fetch(`/api/ai-forecast/${encodeURIComponent(symbol)}/history?range=${range}`).then(r => r.json()),
            predictAIHorizonKey
                ? fetch(`/api/predict-ai/${encodeURIComponent(symbol)}`).then(r => (r.ok ? r.json() : null)).catch(() => null)
                : Promise.resolve(null),
        ])
            .then(([data, predictAIData]) => {
                if (cancelled) return;
                // Clear previous series (chart instance is typed `any`, so we track our own series list on it).
                try {
                    (chart.__vtSeries || []).forEach((s: unknown) => { try { chart.removeSeries(s); } catch { /* ignore */ } });
                } catch { /* ignore */ }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const created: any[] = [];

                const bars: HistoryBar[] = data.history || [];
                if (!bars.length) {
                    setEmptyReason(data.error || 'No chart data available.');
                    setLoading(false);
                    return;
                }

                const intraday = range === '1D';
                const colors = getChartColors(isThemeDark());
                const t = (b: HistoryBar) => (intraday ? (b.timeUtc ?? Math.floor(Date.parse(b.date) / 1000)) : b.date.slice(0, 10));

                const areaSeries = chart.addSeries(lc.AreaSeries, {
                    topColor: colors.areaTopColor,
                    bottomColor: colors.areaBottomColor,
                    lineColor: colors.lineColor,
                    lineWidth: 2,
                });
                areaSeries.setData(bars.map(b => ({ time: t(b), value: b.close })));
                created.push(areaSeries);

                if (data.overlays?.sma20 && !intraday) {
                    const sma20 = chart.addSeries(lc.LineSeries, { color: '#f0a94a', lineWidth: 1 });
                    sma20.setData(
                        bars
                            .map((b, i) => ({ time: t(b), value: data.overlays.sma20[i] }))
                            .filter((p: { value: number | null }) => p.value !== null)
                    );
                    created.push(sma20);
                }
                if (data.overlays?.sma50 && !intraday) {
                    const sma50 = chart.addSeries(lc.LineSeries, { color: '#0F9D6B', lineWidth: 1 });
                    sma50.setData(
                        bars
                            .map((b, i) => ({ time: t(b), value: data.overlays.sma50[i] }))
                            .filter((p: { value: number | null }) => p.value !== null)
                    );
                    created.push(sma50);
                }

                if (data.forecastCone?.points?.length) {
                    const lastReal = { time: t(bars[bars.length - 1]), value: bars[bars.length - 1].close };
                    const points: ForecastPoint[] = data.forecastCone.points;

                    const mid = chart.addSeries(lc.LineSeries, { color: '#12A669', lineWidth: 2, lineStyle: 2 });
                    mid.setData([lastReal, ...points.map(p => ({ time: p.time, value: p.mid }))]);
                    created.push(mid);

                    const high = chart.addSeries(lc.LineSeries, { color: 'rgba(18,166,105,0.45)', lineWidth: 1, lineStyle: 2 });
                    high.setData([lastReal, ...points.map(p => ({ time: p.time, value: p.high }))]);
                    created.push(high);

                    const low = chart.addSeries(lc.LineSeries, { color: 'rgba(18,166,105,0.45)', lineWidth: 1, lineStyle: 2 });
                    low.setData([lastReal, ...points.map(p => ({ time: p.time, value: p.low }))]);
                    created.push(low);

                    setHorizonLabel(data.forecastCone.horizonLabel ?? null);
                } else {
                    setHorizonLabel(null);
                }

                // ── Vestera Predict AI: single dotted projected-price line (separate model, additive to the cone above) ──
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const predictAIHorizon = predictAIData?.horizons?.find((h: any) => h.key === predictAIHorizonKey);
                if (predictAIHorizon?.trajectory?.length) {
                    const lastReal = { time: t(bars[bars.length - 1]), value: bars[bars.length - 1].close };
                    const points: PredictAITrajectoryPoint[] = predictAIHorizon.trajectory;

                    const predictAILine = chart.addSeries(lc.LineSeries, {
                        color: '#0F9D6B',
                        lineWidth: 2,
                        lineStyle: 1, // Dotted — visually distinct from the existing model's dashed cone
                    });
                    predictAILine.setData([lastReal, ...points.map(p => ({ time: p.time, value: p.price }))]);
                    created.push(predictAILine);
                    setPredictAIActive(true);
                } else {
                    setPredictAIActive(false);
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (chart as any).__vtSeries = created;
                chart.timeScale().fitContent();
                setLoading(false);
            })
            .catch(() => {
                if (cancelled) return;
                setEmptyReason('Unable to retrieve current market data. Please try again.');
                setLoading(false);
            });

        return () => { cancelled = true; };
    }, [chartReady, symbol, range]);

    return (
        <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
                <div className={styles.chartTitle}>Price Chart</div>
                <div className={styles.chartRangeToggle}>
                    {RANGES.map(r => (
                        <button
                            key={r}
                            className={r === range ? styles.rangeBtnActive : styles.rangeBtn}
                            onClick={() => setRange(r)}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>
            <div className={styles.chartLegend}>
                <span><i className={styles.legendDotBlue} /> Price</span>
                <span><i className={styles.legendDotOrange} /> SMA 20</span>
                <span><i className={styles.legendDotPurple} /> SMA 50</span>
                <span><i className={styles.legendDotDashed} /> AI-projected trend{horizonLabel ? ` for the ${horizonLabel}` : ''} (estimate, not guaranteed)</span>
                {predictAIActive && (
                    <span><i className={styles.legendDotDotted} /> Vestera Predict AI — single projected trajectory (news + real-time market data)</span>
                )}
            </div>
            <div className={styles.chartCanvasWrap}>
                <div ref={chartRef} className={styles.chartCanvas} />
                {loading && <div className={styles.chartOverlay}><div className={styles.spinner} /></div>}
                {!loading && emptyReason && <div className={styles.chartOverlay}><p>{emptyReason}</p></div>}
            </div>
        </div>
    );
}
