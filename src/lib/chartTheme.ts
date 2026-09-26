/**
 * Shared chart theme tokens for lightweight-charts.
 * Call getChartColors(isDark) to get the right palette for the active theme.
 * Use with chart.applyOptions() on theme change via MutationObserver.
 */

export interface ChartColorConfig {
    textColor: string;
    gridColor: string;
    borderColor: string;
    crosshairColor: string;
    /** For area series top fill */
    areaTopColor: string;
    /** For area series bottom fill */
    areaBottomColor: string;
    /** For area/line series line */
    lineColor: string;
}

export function getChartColors(isDark: boolean): ChartColorConfig {
    if (isDark) {
        return {
            textColor: '#94a3b8',
            gridColor: 'rgba(255,255,255,0.07)',
            borderColor: 'rgba(255,255,255,0.1)',
            crosshairColor: 'rgba(255,255,255,0.2)',
            areaTopColor: 'rgba(79,110,247,0.35)',
            areaBottomColor: 'rgba(79,110,247,0.02)',
            lineColor: '#4f6ef7',
        };
    }
    return {
        textColor: '#64748b',
        gridColor: 'rgba(0,0,0,0.08)',
        borderColor: 'rgba(0,0,0,0.12)',
        crosshairColor: 'rgba(0,0,0,0.25)',
        areaTopColor: 'rgba(79,110,247,0.2)',
        areaBottomColor: 'rgba(79,110,247,0)',
        lineColor: '#4f6ef7',
    };
}

/** Returns the partial options object to pass to chart.applyOptions() */
export function buildChartOptions(isDark: boolean) {
    const c = getChartColors(isDark);
    return {
        layout: {
            textColor: c.textColor,
        },
        grid: {
            vertLines: { color: c.gridColor },
            horzLines: { color: c.gridColor },
        },
        timeScale: {
            timeVisible: true,
            borderColor: c.borderColor,
        },
        rightPriceScale: {
            borderColor: c.borderColor,
        },
        crosshair: {
            vertLine: { color: c.crosshairColor, labelBackgroundColor: isDark ? '#1e293b' : '#e2e8f0' },
            horzLine: { color: c.crosshairColor, labelBackgroundColor: isDark ? '#1e293b' : '#e2e8f0' },
        },
    };
}

/** Read the active resolved theme from the HTML element */
export function isThemeDark(): boolean {
    if (typeof document === 'undefined') return true;
    return document.documentElement.getAttribute('data-theme') !== 'light';
}
