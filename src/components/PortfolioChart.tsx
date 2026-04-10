'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import styles from './PortfolioChart.module.css';

export interface HistoryPoint {
    date: string; // YYYY-MM-DD
    value: number; // USD portfolio value
}

interface Props {
    data: HistoryPoint[];
    loading?: boolean;
    /** Height of the SVG canvas in px. Defaults to 240. */
    chartHeight?: number;
}

// ── Formatting helpers ───────────────────────────────────────────────────────

function fmt$(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return `$${Math.round(n).toLocaleString()}`;
}

function fmtDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

const PAD = { top: 20, right: 20, bottom: 40, left: 64 };
const Y_TICKS = 5;
const MAX_X_LABELS = 5;

export default function PortfolioChart({ data, loading, chartHeight = 240 }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svgWidth, setSvgWidth] = useState(600);
    const [hover, setHover] = useState<{ idx: number } | null>(null);

    const safeData = useMemo(() => {
        if (!data || data.length < 2) return [] as HistoryPoint[];
        return data;
    }, [data]);

    const hasChart = Boolean(!loading && safeData.length >= 2);

    const innerW = svgWidth - PAD.left - PAD.right;
    const innerH = chartHeight - PAD.top - PAD.bottom;

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const ro = new ResizeObserver(entries => {
            const w = entries[0]?.contentRect.width;
            if (w > 0) setSvgWidth(Math.floor(w));
        });
        ro.observe(el);

        const initial = el.getBoundingClientRect().width;
        if (initial > 0) setSvgWidth(Math.floor(initial));

        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        if (!hasChart) setHover(null);
    }, [hasChart]);

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<SVGSVGElement>) => {
            if (!hasChart || safeData.length < 2 || innerW <= 0) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left - PAD.left) / innerW;
            const n = safeData.length;
            const idx = Math.max(0, Math.min(n - 1, Math.round(relX * (n - 1))));
            setHover({ idx });
        },
        [hasChart, innerW, safeData.length]
    );

    const handleMouseLeave = useCallback(() => setHover(null), []);

    const chartGeom = useMemo(() => {
        if (safeData.length < 2) return null;

        const values = safeData.map(d => d.value);
        const rawMin = Math.min(...values);
        const rawMax = Math.max(...values);
        const rawRange = rawMax - rawMin;
        const vPad = (rawRange || rawMax * 0.05 || 1000) * 0.08;
        const yMin = rawMin - vPad;
        const yMax = rawMax + vPad;
        const yRange = yMax - yMin;

        const toX = (i: number) => PAD.left + (i / Math.max(safeData.length - 1, 1)) * innerW;
        const toY = (v: number) => PAD.top + (1 - (v - yMin) / yRange) * innerH;

        const pathD = safeData
            .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(pt.value).toFixed(1)}`)
            .join(' ');

        const areaD =
            pathD +
            ` L ${toX(safeData.length - 1).toFixed(1)} ${(PAD.top + innerH).toFixed(1)}` +
            ` L ${PAD.left.toFixed(1)} ${(PAD.top + innerH).toFixed(1)} Z`;

        const isUp = safeData[safeData.length - 1].value >= safeData[0].value;
        const lineColor = isUp ? '#4ade80' : '#f87171';
        const gradStopDark = isUp ? 'rgba(74,222,128,' : 'rgba(248,113,113,';

        const yTicks = Array.from({ length: Y_TICKS }, (_, i) => {
            const frac = i / (Y_TICKS - 1);
            return {
                y: toY(yMin + frac * yRange),
                label: fmt$(yMin + frac * yRange),
            };
        }).reverse();

        const xCount = Math.min(MAX_X_LABELS, safeData.length);
        const xIndices =
            xCount === 1
                ? [0]
                : Array.from({ length: xCount }, (_, i) =>
                      Math.round((i / (xCount - 1)) * (safeData.length - 1))
                  );

        return {
            pathD,
            areaD,
            yTicks,
            xIndices,
            lineColor,
            gradStopDark,
            toX,
            toY,
            yMin,
            yMax,
            yRange,
            innerH,
        };
    }, [safeData, innerW, innerH]);

    const hoverPt =
        hasChart && hover !== null && chartGeom && safeData[hover.idx] ? safeData[hover.idx] : null;
    const hoverX =
        hasChart && hover !== null && chartGeom ? chartGeom.toX(hover.idx) : 0;
    const hoverY =
        hasChart && hover !== null && chartGeom && safeData[hover.idx]
            ? chartGeom.toY(safeData[hover.idx].value)
            : 0;

    const tooltipLeft = hoverX + 12;
    const tooltipMaxLeft = svgWidth - 148;

    return (
        <div ref={containerRef} className={styles.wrap} style={{ height: chartHeight }}>
            {loading && (
                <div className={styles.skeleton} style={{ minHeight: chartHeight, height: '100%' }}>
                    <div className={styles.shimmer} />
                </div>
            )}

            {!loading && safeData.length < 2 && (
                <div className={styles.empty} style={{ minHeight: chartHeight, height: '100%' }}>
                    <span className={styles.emptyIcon}>📈</span>
                    <p className={styles.emptyTitle}>No performance history yet</p>
                    <p className={styles.emptySub}>
                        Make your first trade to start tracking your portfolio over time.
                    </p>
                    <a href="/trade" className={styles.emptyLink}>
                        Start trading →
                    </a>
                </div>
            )}

            {!loading && hasChart && chartGeom && (
                <>
                    <svg
                        width={svgWidth}
                        height={chartHeight}
                        className={styles.svg}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    >
                        <defs>
                            <linearGradient id="pgAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={`${chartGeom.gradStopDark}0.28)`} />
                                <stop offset="100%" stopColor={`${chartGeom.gradStopDark}0.01)`} />
                            </linearGradient>
                        </defs>

                        {chartGeom.yTicks.map((tick, i) => (
                            <g key={i}>
                                <line
                                    x1={PAD.left}
                                    y1={tick.y.toFixed(1)}
                                    x2={svgWidth - PAD.right}
                                    y2={tick.y.toFixed(1)}
                                    stroke="var(--vt-border2)"
                                    strokeWidth="1"
                                    strokeDasharray="4 6"
                                />
                                <text
                                    x={PAD.left - 8}
                                    y={tick.y}
                                    textAnchor="end"
                                    dominantBaseline="middle"
                                    fill="var(--vt-text3)"
                                    fontSize="11"
                                    fontFamily="Inter, -apple-system, sans-serif"
                                >
                                    {tick.label}
                                </text>
                            </g>
                        ))}

                        <path d={chartGeom.areaD} fill="url(#pgAreaGrad)" />

                        <path
                            d={chartGeom.pathD}
                            stroke={chartGeom.lineColor}
                            strokeWidth="2.5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {chartGeom.xIndices.map(idx => (
                            <text
                                key={idx}
                                x={chartGeom.toX(idx).toFixed(1)}
                                y={chartHeight - 10}
                                textAnchor="middle"
                                fill="var(--vt-text3)"
                                fontSize="11"
                                fontFamily="Inter, -apple-system, sans-serif"
                            >
                                {fmtDate(safeData[idx].date)}
                            </text>
                        ))}

                        <text
                            x={PAD.left}
                            y={chartGeom.toY(safeData[0].value)}
                            textAnchor="start"
                            dominantBaseline="middle"
                            fill="var(--vt-text3)"
                            fontSize="10"
                            fontFamily="Inter, -apple-system, sans-serif"
                            dy="-8"
                        />

                        {hover !== null && (
                            <>
                                <line
                                    x1={hoverX.toFixed(1)}
                                    y1={PAD.top}
                                    x2={hoverX.toFixed(1)}
                                    y2={PAD.top + chartGeom.innerH}
                                    stroke="var(--vt-text3)"
                                    strokeWidth="1"
                                    strokeDasharray="3 4"
                                />
                                <circle
                                    cx={hoverX.toFixed(1)}
                                    cy={hoverY.toFixed(1)}
                                    r="5"
                                    fill={chartGeom.lineColor}
                                    stroke="var(--vt-surface)"
                                    strokeWidth="2.5"
                                />
                            </>
                        )}
                    </svg>

                    {hoverPt && (
                        <div
                            className={styles.tooltip}
                            style={{
                                left: Math.min(tooltipLeft, tooltipMaxLeft),
                                top: Math.max(hoverY - 48, 4),
                            }}
                        >
                            <div className={styles.ttDate}>{fmtDate(hoverPt.date)}</div>
                            <div className={styles.ttValue} style={{ color: chartGeom.lineColor }}>
                                $
                                {hoverPt.value.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </div>
                            <div
                                className={styles.ttDelta}
                                style={{
                                    color: hoverPt.value >= 100_000 ? 'var(--vt-green)' : 'var(--vt-red)',
                                }}
                            >
                                {hoverPt.value >= 100_000 ? '+' : ''}
                                {((hoverPt.value / 100_000 - 1) * 100).toFixed(2)}%
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
