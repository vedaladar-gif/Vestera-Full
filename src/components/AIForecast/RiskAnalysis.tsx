'use client';

import styles from './aiForecastComponents.module.css';
import type { RiskBreakdownData } from './types';

const LEVEL_COLOR: Record<string, string> = {
    'Very Low': '#4576E7',
    'Low': '#B7CBF6',
    'Moderate': '#FFB84C',
    'High': '#FF8A5B',
    'Very High': '#E0637A',
    'N/A': '#8b90b0',
    'Unknown': '#8b90b0',
};

function LevelPill({ level }: { level: string }) {
    const color = LEVEL_COLOR[level] ?? '#8b90b0';
    return <span className={styles.riskPill} style={{ background: `${color}22`, color }}>{level}</span>;
}

export default function RiskAnalysis({ risk }: { risk: RiskBreakdownData }) {
    const rows: Array<{ label: string; level: string; detail: string }> = [
        {
            label: 'Volatility',
            level: risk.volatility.level,
            detail: risk.volatility.annualizedVolatilityPct !== null
                ? `${risk.volatility.annualizedVolatilityPct.toFixed(1)}% annualized`
                : 'Not enough history',
        },
        { label: 'Drawdown Risk', level: risk.drawdown.level, detail: `Max 1Y drawdown: ${risk.drawdown.maxDrawdownPct.toFixed(1)}%` },
        { label: 'Valuation Risk', level: risk.valuation.level, detail: risk.valuation.note },
        { label: 'Momentum Risk', level: risk.momentum.level, detail: risk.momentum.rsi !== null ? `RSI ${risk.momentum.rsi.toFixed(0)}` : 'No RSI data' },
        { label: 'Market Risk', level: risk.market.level, detail: risk.market.beta !== null ? `Beta ${risk.market.beta.toFixed(2)}` : 'Beta unavailable' },
        {
            label: 'Earnings/Event Risk',
            level: risk.earningsEvent.level,
            detail: risk.earningsEvent.daysUntil !== null ? `Next earnings in ~${risk.earningsEvent.daysUntil} days` : 'No confirmed earnings date',
        },
    ];

    return (
        <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
                <div className={styles.riskOverallRow}>
                    <div>
                        <h2 className={styles.sectionTitle}>Risk Analysis</h2>
                        <p className={styles.sectionSubtitle}>How much could go wrong, and where it's coming from</p>
                    </div>
                    <div className={styles.riskOverallBadge}>
                        <LevelPill level={risk.overall} />
                        <span className={styles.riskOverallScore}>{risk.overallScore}/100</span>
                    </div>
                </div>
            </div>
            <div className={styles.riskGrid}>
                {rows.map(r => (
                    <div key={r.label} className={styles.riskRow}>
                        <div className={styles.riskRowLabel}>{r.label}</div>
                        <LevelPill level={r.level} />
                        <div className={styles.riskRowDetail}>{r.detail}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
