'use client';

import { useMemo, useState } from 'react';
import styles from './LessonRenderer.module.css';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConceptItem { type: 'concept'; term: string; desc: string }
interface PlainItem { type: 'plain'; text: string }
type SectionItem = ConceptItem | PlainItem;

type Block =
    | { kind: 'intro'; text: string }
    | { kind: 'section'; heading: string; items: SectionItem[] }
    | { kind: 'concepts'; items: ConceptItem[] }
    | { kind: 'steps'; heading?: string; items: string[] }
    | { kind: 'bullets'; items: string[] }
    | { kind: 'formula'; heading: string; body: string }
    | { kind: 'paragraph'; text: string };

// ─── Content Parser ──────────────────────────────────────────────────────────

const FORMULA_HEADINGS = new Set(['Formula', 'The Formula', 'Calculation', 'Example']);

function parseContent(raw: string): Block[] {
    const paras = raw.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    const blocks: Block[] = [];
    let isFirst = true;

    for (const para of paras) {
        const lines = para.split('\n').map(l => l.trim()).filter(Boolean);
        if (!lines.length) continue;
        const first = lines[0];

        // **Heading** (alone on line) followed by content
        const headingMatch = first.match(/^\*\*([^*]+?):?\*\*\s*$/) ?? first.match(/^\*\*([^*]+?):\*\*\s*$/);

        if (headingMatch && lines.length > 1) {
            const heading = headingMatch[1].replace(/:$/, '').trim();
            const rest = lines.slice(1);

            if (FORMULA_HEADINGS.has(heading)) {
                blocks.push({ kind: 'formula', heading, body: rest.join('\n') });
                continue;
            }
            if (rest.every(l => l.startsWith('-'))) {
                const items: SectionItem[] = rest.map(l => {
                    const raw2 = l.replace(/^-\s*/, '');
                    const m = raw2.match(/^\*\*([^*]+?)\*\*:?\s*(.*)/);
                    if (m) return { type: 'concept', term: m[1], desc: m[2] };
                    return { type: 'plain', text: raw2 };
                });
                blocks.push({ kind: 'section', heading, items });
                continue;
            }
            if (rest.every(l => /^\d+\./.test(l))) {
                blocks.push({ kind: 'steps', heading, items: rest.map(l => l.replace(/^\d+\.\s*/, '')) });
                continue;
            }
            // Text body
            blocks.push({ kind: 'section', heading, items: [{ type: 'plain', text: rest.join(' ') }] });
            continue;
        }

        // All lines are **Term:** desc → concept group
        if (lines.length >= 1 && lines.every(l => /^\*\*[^*]+\*\*:\s*.+/.test(l))) {
            const items: ConceptItem[] = lines.map(l => {
                const m = l.match(/^\*\*([^*]+)\*\*:\s*(.*)/);
                return { type: 'concept', term: m![1].replace(/:$/, ''), desc: m![2] };
            });
            // Merge into previous concepts block if adjacent
            const last = blocks[blocks.length - 1];
            if (last?.kind === 'concepts') {
                last.items.push(...items);
            } else {
                blocks.push({ kind: 'concepts', items });
            }
            continue;
        }

        // Pure numbered list
        if (lines.every(l => /^\d+\./.test(l))) {
            blocks.push({ kind: 'steps', items: lines.map(l => l.replace(/^\d+\.\s*/, '')) });
            continue;
        }

        // Pure bullet list
        if (lines.every(l => l.startsWith('-'))) {
            blocks.push({ kind: 'bullets', items: lines.map(l => l.replace(/^-\s*/, '')) });
            continue;
        }

        // First text block → intro
        if (isFirst) {
            isFirst = false;
            blocks.push({ kind: 'intro', text: para });
            continue;
        }

        isFirst = false;
        blocks.push({ kind: 'paragraph', text: para });
    }

    return blocks;
}

// ─── Inline Bold / Rich Text ─────────────────────────────────────────────────

function toBold(text: string): string {
    return text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function RichText({ text, className }: { text: string; className?: string }) {
    return (
        <span
            className={className}
            dangerouslySetInnerHTML={{ __html: toBold(text) }}
        />
    );
}

// ─── Concept Card Icon ────────────────────────────────────────────────────────

function conceptIcon(term: string): string {
    const t = term.toLowerCase();
    if (/price|bid|ask|spread|premium/.test(t)) return '';
    if (/risk|loss|stop|drawdown|danger|penalty|withdraw/.test(t)) return '';
    if (/profit|gain|return|yield|dividend/.test(t)) return '';
    if (/chart|candle|pattern|signal|trend/.test(t)) return '';
    if (/strategy|plan|system|rule/.test(t)) return '';
    if (/market|exchange|stock|share|index|etf/.test(t)) return '';
    if (/portfolio|diversif|allocat|asset/.test(t)) return '';
    if (/option|call|put|greek|delta|theta/.test(t)) return '';
    if (/time|period|day|week|month|date/.test(t)) return '';
    if (/formula|ratio|calc|p\/e|eps|interest|rate|principal|linear|compound|snowball/.test(t)) return '';
    if (/psychology|emotion|bias|fomo/.test(t)) return '';
    if (/ira|roth|traditional|retirement|pension|contribution/.test(t)) return '';
    if (/budget|expense|income|spend|need|want|saving|net worth|lifestyle/.test(t)) return '';
    if (/frequen|growth|compound/.test(t)) return '';
    return '';
}

// ─── Block Renderers ──────────────────────────────────────────────────────────

function IntroBlock({ text }: { text: string }) {
    return (
        <div className={styles.introBlock}>
            <p className={styles.introText}>
                <RichText text={text} />
            </p>
        </div>
    );
}

function ConceptCard({ item }: { item: ConceptItem }) {
    return (
        <div className={styles.conceptCard}>
            <span className={styles.conceptIcon}>{conceptIcon(item.term)}</span>
            <div className={styles.conceptBody}>
                <span className={styles.conceptTerm}>{item.term}</span>
                <span className={styles.conceptDesc}>
                    <RichText text={item.desc} />
                </span>
            </div>
        </div>
    );
}

function SectionBlock({ heading, items }: { heading: string; items: SectionItem[] }) {
    const isConceptList = items.every(i => i.type === 'concept');
    return (
        <div className={styles.sectionBlock}>
            {heading && <div className={styles.sectionHeading}>{heading}</div>}
            {isConceptList ? (
                <div className={styles.conceptGrid}>
                    {items.map((item, i) =>
                        item.type === 'concept' ? (
                            <ConceptCard key={i} item={item} />
                        ) : null
                    )}
                </div>
            ) : (
                <div className={styles.sectionBody}>
                    {items.map((item, i) => (
                        <p key={i} className={styles.sectionText}>
                            <RichText text={item.type === 'plain' ? item.text : `**${item.term}:** ${item.desc}`} />
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}

function ConceptsGroup({ items }: { items: ConceptItem[] }) {
    return (
        <div className={styles.conceptGrid}>
            {items.map((item, i) => (
                <ConceptCard key={i} item={item} />
            ))}
        </div>
    );
}

function StepsBlock({ heading, items }: { heading?: string; items: string[] }) {
    return (
        <div className={styles.stepsBlock}>
            {heading && <div className={styles.sectionHeading}>{heading}</div>}
            <div className={styles.stepsList}>
                {items.map((item, i) => (
                    <div key={i} className={styles.step}>
                        <div className={styles.stepLeft}>
                            <div className={styles.stepNum}>{i + 1}</div>
                            {i < items.length - 1 && <div className={styles.stepLine} />}
                        </div>
                        <div className={styles.stepText}>
                            <RichText text={item} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function BulletsBlock({ items }: { items: string[] }) {
    return (
        <ul className={styles.bulletList}>
            {items.map((item, i) => (
                <li key={i} className={styles.bulletItem}>
                    <span className={styles.bulletDot} />
                    <span className={styles.bulletText}>
                        <RichText text={item} />
                    </span>
                </li>
            ))}
        </ul>
    );
}

function FormulaBlock({ heading, body }: { heading: string; body: string }) {
    const isExample = heading === 'Example';
    const lines = body.split('\n').filter(Boolean);
    return (
        <div className={isExample ? styles.exampleBlock : styles.formulaBlock}>
            <div className={styles.formulaLabel}>{isExample ? 'Example' : 'Formula'}</div>
            {lines.map((line, i) => {
                const bulletLine = line.replace(/^-\s*/, '');
                return (
                    <div key={i} className={styles.formulaLine}>
                        {line.startsWith('-') && <span className={styles.formulaBulletDot} />}
                        <RichText text={bulletLine} />
                    </div>
                );
            })}
        </div>
    );
}

function ParagraphBlock({ text }: { text: string }) {
    return (
        <p className={styles.paragraph}>
            <RichText text={text} />
        </p>
    );
}

// ─── SVG Charts ───────────────────────────────────────────────────────────────

function CandlestickDiagram() {
    return (
        <div className={styles.chartBox}>
            <div className={styles.chartTitle}>Candlestick Anatomy</div>
            <div className={styles.chartSubtitle}>How to read a single candle</div>
            <svg viewBox="0 0 420 220" className={styles.chart} aria-label="Candlestick anatomy diagram">
                {/* Grid lines */}
                <line x1="20" y1="210" x2="400" y2="210" stroke="currentColor" strokeOpacity="0.12" />
                {/* ── Green (Bullish) Candle ── */}
                {/* Wick top */}
                <line x1="115" y1="30" x2="115" y2="60" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" />
                {/* Body */}
                <rect x="90" y="60" width="50" height="80" rx="4" fill="#4ade80" fillOpacity="0.85" stroke="#22c55e" strokeWidth="1.5" />
                {/* Wick bottom */}
                <line x1="115" y1="140" x2="115" y2="175" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" />
                {/* Label: High */}
                <line x1="115" y1="30" x2="160" y2="30" stroke="#4ade80" strokeWidth="1" strokeDasharray="3,2" strokeOpacity="0.6" />
                <text x="164" y="34" fill="#4ade80" fontSize="11" fontFamily="Inter,sans-serif">High</text>
                {/* Label: Close */}
                <line x1="90" y1="60" x2="55" y2="60" stroke="#4ade80" strokeWidth="1" strokeDasharray="3,2" strokeOpacity="0.6" />
                <text x="5" y="64" fill="#4ade80" fontSize="11" fontFamily="Inter,sans-serif">Close</text>
                {/* Label: Open */}
                <line x1="90" y1="140" x2="55" y2="140" stroke="#4ade80" strokeWidth="1" strokeDasharray="3,2" strokeOpacity="0.6" />
                <text x="7" y="144" fill="#4ade80" fontSize="11" fontFamily="Inter,sans-serif">Open</text>
                {/* Label: Low */}
                <line x1="115" y1="175" x2="160" y2="175" stroke="#4ade80" strokeWidth="1" strokeDasharray="3,2" strokeOpacity="0.6" />
                <text x="164" y="179" fill="#4ade80" fontSize="11" fontFamily="Inter,sans-serif">Low</text>
                {/* Label: Body */}
                <text x="97" y="106" fill="white" fontSize="10" fontFamily="Inter,sans-serif" fontWeight="700">Body</text>
                {/* Green label */}
                <rect x="82" y="190" width="66" height="18" rx="9" fill="#4ade8022" stroke="#4ade8044" />
                <text x="115" y="203" fill="#4ade80" fontSize="10" fontFamily="Inter,sans-serif" textAnchor="middle" fontWeight="600">BULLISH ↑</text>

                {/* ── Red (Bearish) Candle ── */}
                {/* Wick top */}
                <line x1="305" y1="30" x2="305" y2="65" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" />
                {/* Body */}
                <rect x="280" y="65" width="50" height="80" rx="4" fill="#f87171" fillOpacity="0.85" stroke="#ef4444" strokeWidth="1.5" />
                {/* Wick bottom */}
                <line x1="305" y1="145" x2="305" y2="180" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" />
                {/* Label: High */}
                <line x1="305" y1="30" x2="350" y2="30" stroke="#f87171" strokeWidth="1" strokeDasharray="3,2" strokeOpacity="0.6" />
                <text x="354" y="34" fill="#f87171" fontSize="11" fontFamily="Inter,sans-serif">High</text>
                {/* Label: Open (top of red body) */}
                <line x1="280" y1="65" x2="245" y2="65" stroke="#f87171" strokeWidth="1" strokeDasharray="3,2" strokeOpacity="0.6" />
                <text x="197" y="69" fill="#f87171" fontSize="11" fontFamily="Inter,sans-serif">Open</text>
                {/* Label: Close (bottom of red body) */}
                <line x1="280" y1="145" x2="245" y2="145" stroke="#f87171" strokeWidth="1" strokeDasharray="3,2" strokeOpacity="0.6" />
                <text x="195" y="149" fill="#f87171" fontSize="11" fontFamily="Inter,sans-serif">Close</text>
                {/* Label: Low */}
                <line x1="305" y1="180" x2="350" y2="180" stroke="#f87171" strokeWidth="1" strokeDasharray="3,2" strokeOpacity="0.6" />
                <text x="354" y="184" fill="#f87171" fontSize="11" fontFamily="Inter,sans-serif">Low</text>
                {/* Label: Body */}
                <text x="287" y="110" fill="white" fontSize="10" fontFamily="Inter,sans-serif" fontWeight="700">Body</text>
                {/* Red label */}
                <rect x="272" y="190" width="66" height="18" rx="9" fill="#f8717122" stroke="#f8717144" />
                <text x="305" y="203" fill="#f87171" fontSize="10" fontFamily="Inter,sans-serif" textAnchor="middle" fontWeight="600">BEARISH ↓</text>
            </svg>
            <div className={styles.chartLegend}>
                <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#4ade80' }} />Bullish: close &gt; open (price rose)</div>
                <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#f87171' }} />Bearish: close &lt; open (price fell)</div>
            </div>
        </div>
    );
}

function PortfolioPieChart() {
    // Simple donut chart for portfolio allocation
    const segments = [
        { label: 'US Stocks', pct: 45, color: '#4576E7' },
        { label: 'Bonds', pct: 25, color: '#4ade80' },
        { label: 'Intl Stocks', pct: 20, color: '#4576E7' },
        { label: 'Cash/Other', pct: 10, color: '#f97316' },
    ];
    // Build SVG arcs
    const cx = 100, cy = 100, r = 70, innerR = 42;
    let cumDeg = -90;
    const arcs = segments.map(seg => {
        const startDeg = cumDeg;
        cumDeg += (seg.pct / 100) * 360;
        const endDeg = cumDeg;
        const toRad = (d: number) => (d * Math.PI) / 180;
        const x1 = cx + r * Math.cos(toRad(startDeg));
        const y1 = cy + r * Math.sin(toRad(startDeg));
        const x2 = cx + r * Math.cos(toRad(endDeg));
        const y2 = cy + r * Math.sin(toRad(endDeg));
        const ix1 = cx + innerR * Math.cos(toRad(startDeg));
        const iy1 = cy + innerR * Math.sin(toRad(startDeg));
        const ix2 = cx + innerR * Math.cos(toRad(endDeg));
        const iy2 = cy + innerR * Math.sin(toRad(endDeg));
        const large = seg.pct > 50 ? 1 : 0;
        const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1} Z`;
        return { ...seg, d };
    });

    return (
        <div className={styles.chartBox}>
            <div className={styles.chartTitle}>Balanced Portfolio Allocation</div>
            <div className={styles.chartSubtitle}>A classic diversified "moderate" portfolio example</div>
            <div className={styles.pieLayout}>
                <svg viewBox="0 0 200 200" className={styles.pieChart} aria-label="Portfolio allocation pie chart">
                    {arcs.map((seg, i) => (
                        <path key={i} d={seg.d} fill={seg.color} fillOpacity="0.9" stroke="var(--vt-surface)" strokeWidth="2" />
                    ))}
                    <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--vt-text)" fontSize="13" fontWeight="700" fontFamily="Inter,sans-serif">Your</text>
                    <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--vt-text)" fontSize="13" fontWeight="700" fontFamily="Inter,sans-serif">Portfolio</text>
                </svg>
                <div className={styles.pieLegend}>
                    {segments.map((seg, i) => (
                        <div key={i} className={styles.pieLegendItem}>
                            <div className={styles.pieLegendColor} style={{ background: seg.color }} />
                            <div className={styles.pieLegendText}>
                                <span className={styles.pieLegendLabel}>{seg.label}</span>
                                <span className={styles.pieLegendPct} style={{ color: seg.color }}>{seg.pct}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.chartNote}>Asset allocation determines ~90% of long-term portfolio returns</div>
        </div>
    );
}

function BullBearChart() {
    return (
        <div className={styles.chartBox}>
            <div className={styles.chartTitle}>Bull vs Bear Market</div>
            <div className={styles.chartSubtitle}>Both are normal parts of the market cycle</div>
            <svg viewBox="0 0 400 180" className={styles.chart} aria-label="Bull and bear market chart">
                {/* Grid */}
                {[40, 80, 120, 160].map(y => (
                    <line key={y} x1="40" y1={y} x2="380" y2={y} stroke="currentColor" strokeOpacity="0.07" />
                ))}
                {/* Zero line */}
                <line x1="40" y1="90" x2="380" y2="90" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="4,3" />

                {/* Bull market (rising) - green area fill */}
                <polygon
                    points="40,90 80,80 120,65 160,50 200,55 240,35 280,30 320,40 360,25 380,20 380,90"
                    fill="#4ade80" fillOpacity="0.12"
                />
                {/* Bull market line */}
                <polyline
                    points="40,90 80,80 120,65 160,50 200,55 240,35 280,30 320,40 360,25 380,20"
                    fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                />

                {/* Bear market (falling) - red area fill */}
                <polygon
                    points="40,90 80,100 120,110 160,118 200,125 240,138 280,145 320,150 360,158 380,162 380,90"
                    fill="#f87171" fillOpacity="0.12"
                />
                {/* Bear market line */}
                <polyline
                    points="40,90 80,100 120,110 160,118 200,125 240,138 280,145 320,150 360,158 380,162"
                    fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                />

                {/* Labels */}
                <rect x="290" y="8" width="82" height="20" rx="10" fill="#4ade8022" stroke="#4ade8044" />
                <text x="331" y="22" fill="#4ade80" fontSize="11" fontFamily="Inter,sans-serif" textAnchor="middle" fontWeight="700">BULL</text>

                <rect x="288" y="154" width="84" height="20" rx="10" fill="#f8717122" stroke="#f8717144" />
                <text x="330" y="168" fill="#f87171" fontSize="11" fontFamily="Inter,sans-serif" textAnchor="middle" fontWeight="700">BEAR</text>

                {/* Y axis label */}
                <text x="36" y="93" fill="currentColor" fillOpacity="0.4" fontSize="9" fontFamily="Inter,sans-serif" textAnchor="end">0%</text>

                {/* 20% bear market line */}
                <line x1="40" y1="144" x2="260" y2="144" stroke="#f87171" strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.5" />
                <text x="42" y="141" fill="#f87171" fontSize="9" fontFamily="Inter,sans-serif" fillOpacity="0.7">−20% (bear market threshold)</text>
            </svg>
            <div className={styles.chartLegend}>
                <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#4ade80' }} />Bull market: 20%+ rise, optimism prevails</div>
                <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#f87171' }} />Bear market: 20%+ decline, pessimism prevails</div>
            </div>
        </div>
    );
}

function CompoundGrowthChart() {
    // 8% annual return, $10k starting, 30 years
    // Year: [0,5,10,15,20,25,30] → [$10K,$14.7K,$21.6K,$31.7K,$46.6K,$68.5K,$100.6K]
    const growthPts = "50,170 107,163 163,153 220,137 277,115 333,82 390,34";
    const flatPts = "50,170 390,170";
    const growthArea = "50,185 50,170 107,163 163,153 220,137 277,115 333,82 390,34 390,185";

    return (
        <div className={styles.chartBox}>
            <div className={styles.chartTitle}>The Power of Compounding</div>
            <div className={styles.chartSubtitle}>$10,000 at 8% annual return vs. no investment</div>
            <svg viewBox="0 0 420 210" className={styles.chart} aria-label="Compound growth chart">
                {/* Grid lines */}
                {[50, 95, 140, 185].map(y => (
                    <line key={y} x1="45" y1={y} x2="395" y2={y} stroke="currentColor" strokeOpacity="0.08" />
                ))}
                {[50, 107, 163, 220, 277, 333, 390].map((x, i) => (
                    <line key={x} x1={x} y1="20" x2={x} y2="185" stroke="currentColor" strokeOpacity="0.06" />
                ))}

                {/* Flat line (no growth) */}
                <polyline points={flatPts} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5,3" />

                {/* Compound area fill */}
                <polygon points={growthArea} fill="#4576E7" fillOpacity="0.12" />
                {/* Compound line */}
                <polyline points={growthPts} fill="none" stroke="#4576E7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Data dots */}
                {[[50,170],[107,163],[163,153],[220,137],[277,115],[333,82],[390,34]].map(([x,y],i) => (
                    <circle key={i} cx={x} cy={y} r="3.5" fill="#4576E7" stroke="var(--vt-surface)" strokeWidth="2" />
                ))}

                {/* End label: $100K */}
                <rect x="294" y="20" width="98" height="22" rx="11" fill="#4576E722" stroke="#4576E744" />
                <text x="343" y="35" textAnchor="middle" fill="#7d9bff" fontSize="11.5" fontWeight="700" fontFamily="Inter,sans-serif">$100,627</text>

                {/* End label: flat */}
                <rect x="294" y="158" width="80" height="22" rx="11" fill="#94a3b822" stroke="#94a3b844" />
                <text x="334" y="173" textAnchor="middle" fill="#94a3b8" fontSize="11.5" fontWeight="700" fontFamily="Inter,sans-serif">$10,000</text>

                {/* X axis labels */}
                {[0,5,10,15,20,25,30].map((yr, i) => (
                    <text key={i} x={[50,107,163,220,277,333,390][i]} y="198" textAnchor="middle" fill="currentColor" fillOpacity="0.45" fontSize="9" fontFamily="Inter,sans-serif">Yr {yr}</text>
                ))}

                {/* Y axis labels */}
                <text x="40" y="188" textAnchor="end" fill="currentColor" fillOpacity="0.4" fontSize="9" fontFamily="Inter,sans-serif">$10K</text>
                <text x="40" y="38" textAnchor="end" fill="currentColor" fillOpacity="0.4" fontSize="9" fontFamily="Inter,sans-serif">$100K</text>
            </svg>
            <div className={styles.chartLegend}>
                <div className={styles.legendItem}><span className={styles.legendLine} style={{ background: '#4576E7' }} />Compounding at 8%/year (x10 growth in 30 years)</div>
                <div className={styles.legendItem}><span className={styles.legendLine} style={{ background: '#94a3b8', opacity: 0.6 }} />No investment (stays at $10,000)</div>
            </div>
            <div className={styles.chartNote}>Time in the market beats timing the market</div>
        </div>
    );
}

function OrderTypesVisual() {
    const orders = [
        { icon: '', name: 'Market Order', speed: 'Instant', price: 'Current price', risk: 'Price may vary', color: '#4576E7' },
        { icon: '', name: 'Limit Order', speed: 'When triggered', price: 'Your set price', risk: 'May not fill', color: '#4ade80' },
        { icon: '', name: 'Stop-Loss', speed: 'Auto-triggers', price: 'Below entry', risk: 'Limits losses', color: '#f97316' },
        { icon: '', name: 'Stop-Limit', speed: 'Two-stage', price: 'Two levels', risk: 'Most precise', color: '#4576E7' },
    ];
    return (
        <div className={styles.chartBox}>
            <div className={styles.chartTitle}>Order Types Compared</div>
            <div className={styles.chartSubtitle}>When to use each type of order</div>
            <div className={styles.orderGrid}>
                {orders.map((o, i) => (
                    <div key={i} className={styles.orderCard} style={{ borderTopColor: o.color }}>
                        <div className={styles.orderIcon}>{o.icon}</div>
                        <div className={styles.orderName} style={{ color: o.color }}>{o.name}</div>
                        <div className={styles.orderRow}><span className={styles.orderLabel}>Speed</span><span className={styles.orderVal}>{o.speed}</span></div>
                        <div className={styles.orderRow}><span className={styles.orderLabel}>Price</span><span className={styles.orderVal}>{o.price}</span></div>
                        <div className={styles.orderRow}><span className={styles.orderLabel}>Note</span><span className={styles.orderVal}>{o.risk}</span></div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MovingAveragesChart() {
    // Simulate a stock price with 20-day and 50-day MAs
    // Golden cross at approximately x=280
    const price = "30,110 60,100 90,95 120,88 150,80 180,75 210,80 240,72 270,65 300,60 330,55 360,50 390,42";
    const ma20 = "120,102 150,95 180,88 210,83 240,78 270,72 300,65 330,58 360,52 390,44";
    const ma50 = "200,100 230,95 260,90 290,85 320,78 350,70 380,62 390,58";
    return (
        <div className={styles.chartBox}>
            <div className={styles.chartTitle}>〰Moving Averages in Action</div>
            <div className={styles.chartSubtitle}>Price vs 20-day MA vs 50-day MA — showing a Golden Cross</div>
            <svg viewBox="0 0 420 170" className={styles.chart} aria-label="Moving averages chart">
                {[40, 80, 120].map(y => (
                    <line key={y} x1="25" y1={y} x2="400" y2={y} stroke="currentColor" strokeOpacity="0.07" />
                ))}
                {/* Price line */}
                <polyline points={price} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeOpacity="0.7" />
                {/* 20-day MA */}
                <polyline points={ma20} fill="none" stroke="#4576E7" strokeWidth="2" strokeLinecap="round" />
                {/* 50-day MA */}
                <polyline points={ma50} fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />

                {/* Golden cross marker */}
                <circle cx="310" cy="64" r="8" fill="#4ade80" fillOpacity="0.25" stroke="#4ade80" strokeWidth="1.5" />
                <text x="315" y="55" fill="#4ade80" fontSize="9" fontFamily="Inter,sans-serif" fontWeight="700">Golden Cross</text>
                <line x1="310" y1="56" x2="310" y2="64" stroke="#4ade80" strokeWidth="1" strokeOpacity="0.6" />

                {/* Legend in chart */}
                <rect x="28" y="148" width="70" height="14" rx="7" fill="#94a3b822" />
                <text x="63" y="158" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="Inter,sans-serif">Price</text>
                <rect x="104" y="148" width="56" height="14" rx="7" fill="#4576E722" />
                <text x="132" y="158" textAnchor="middle" fill="#4576E7" fontSize="9" fontFamily="Inter,sans-serif">20-day MA</text>
                <rect x="166" y="148" width="56" height="14" rx="7" fill="#f9731622" />
                <text x="194" y="158" textAnchor="middle" fill="#f97316" fontSize="9" fontFamily="Inter,sans-serif">50-day MA</text>
            </svg>
            <div className={styles.chartNote}>Golden Cross: 50-day MA crosses above 200-day MA = bullish signal</div>
        </div>
    );
}

function RiskRewardVisual() {
    return (
        <div className={styles.chartBox}>
            <div className={styles.chartTitle}>Risk / Reward Ratio</div>
            <div className={styles.chartSubtitle}>Why 2:1 R:R is a baseline requirement</div>
            <svg viewBox="0 0 400 160" className={styles.chart} aria-label="Risk reward visualization">
                {/* Entry line */}
                <line x1="40" y1="80" x2="360" y2="80" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="4,3" />
                <text x="36" y="83" textAnchor="end" fill="currentColor" fillOpacity="0.5" fontSize="9" fontFamily="Inter,sans-serif">Entry</text>

                {/* Stop loss bar (risk) */}
                <rect x="55" y="82" width="100" height="50" rx="4" fill="#f87171" fillOpacity="0.2" stroke="#f87171" strokeOpacity="0.4" />
                <line x1="55" y1="132" x2="155" y2="132" stroke="#f87171" strokeWidth="2" />
                <text x="105" y="145" textAnchor="middle" fill="#f87171" fontSize="10" fontFamily="Inter,sans-serif" fontWeight="600">Risk: $50</text>
                <text x="105" y="108" textAnchor="middle" fill="#f87171" fontSize="10" fontFamily="Inter,sans-serif">Stop Loss</text>

                {/* Target bar (reward) */}
                <rect x="165" y="30" width="170" height="50" rx="4" fill="#4ade80" fillOpacity="0.2" stroke="#4ade80" strokeOpacity="0.4" />
                <line x1="165" y1="30" x2="335" y2="30" stroke="#4ade80" strokeWidth="2" />
                <text x="250" y="22" textAnchor="middle" fill="#4ade80" fontSize="10" fontFamily="Inter,sans-serif" fontWeight="600">Reward: $100</text>
                <text x="250" y="60" textAnchor="middle" fill="#4ade80" fontSize="10" fontFamily="Inter,sans-serif">Target</text>

                {/* 2:1 badge */}
                <rect x="155" y="65" width="40" height="22" rx="11" fill="#4576E7" fillOpacity="0.9" />
                <text x="175" y="80" textAnchor="middle" fill="white" fontSize="11" fontFamily="Inter,sans-serif" fontWeight="800">2 : 1</text>
            </svg>
            <div className={styles.chartNote}>Even with a 40% win rate, a 2:1 R:R is profitable over time</div>
        </div>
    );
}

// ─── Personal Finance Charts ──────────────────────────────────────────────────

function IRAEarlyChart() {
    // $200/month at 7%, retiring at age 65. Start at 18 → $525K, start at 30 → $222K.
    // Contributions: 47yr×12×$200 = $113K and 35yr×12×$200 = $84K.
    // Scale: 560K → 150 px height; bottomY = 185.
    const BY = 185;
    const scale = (v: number) => Math.round((v / 560000) * 150);
    const e = scale(525000); // 141
    const l = scale(222000); // 59
    const eC = scale(113000); // 30
    const lC = scale(84000); // 23
    const g100 = BY - scale(100000);
    const g300 = BY - scale(300000);
    const g500 = BY - scale(500000);
    return (
        <div className={styles.chartBox}>
            <div className={styles.chartTitle}>Early vs Late IRA Investor</div>
            <div className={styles.chartSubtitle}>$200/month at 7% annual return — both retire at age 65</div>
            <svg viewBox="0 0 380 215" className={styles.chart} aria-label="Early vs late IRA investor comparison">
                {[BY, g100, g300, g500].map(y => (
                    <line key={y} x1="44" y1={y} x2="356" y2={y} stroke="currentColor" strokeOpacity="0.08" />
                ))}
                <text x="40" y={BY + 4} textAnchor="end" fill="currentColor" fillOpacity="0.4" fontSize="9" fontFamily="Inter,sans-serif">$0</text>
                <text x="40" y={g100 + 4} textAnchor="end" fill="currentColor" fillOpacity="0.4" fontSize="9" fontFamily="Inter,sans-serif">$100K</text>
                <text x="40" y={g300 + 4} textAnchor="end" fill="currentColor" fillOpacity="0.4" fontSize="9" fontFamily="Inter,sans-serif">$300K</text>
                <text x="40" y={g500 + 4} textAnchor="end" fill="currentColor" fillOpacity="0.4" fontSize="9" fontFamily="Inter,sans-serif">$500K</text>

                {/* Bar 1 — start at 18 */}
                <rect x="55" y={BY - e} width="95" height={e - eC} rx="4" fill="#06b6d4" fillOpacity="0.85" />
                <rect x="55" y={BY - eC} width="95" height={eC} rx="0" fill="#06b6d4" fillOpacity="0.35" />
                <text x="102" y={BY - e - 8} textAnchor="middle" fill="#22d3ee" fontSize="12" fontFamily="Inter,sans-serif" fontWeight="700">$525,000</text>
                <text x="102" y={BY + 15} textAnchor="middle" fill="currentColor" fillOpacity="0.55" fontSize="10" fontFamily="Inter,sans-serif" fontWeight="600">Start at 18</text>

                {/* Bar 2 — start at 30 */}
                <rect x="225" y={BY - l} width="95" height={l - lC} rx="4" fill="#f97316" fillOpacity="0.85" />
                <rect x="225" y={BY - lC} width="95" height={lC} rx="0" fill="#f97316" fillOpacity="0.35" />
                <text x="272" y={BY - l - 8} textAnchor="middle" fill="#fb923c" fontSize="12" fontFamily="Inter,sans-serif" fontWeight="700">$222,000</text>
                <text x="272" y={BY + 15} textAnchor="middle" fill="currentColor" fillOpacity="0.55" fontSize="10" fontFamily="Inter,sans-serif" fontWeight="600">Start at 30</text>

                {/* Difference badge */}
                <rect x="155" y={BY - e + Math.round(e / 2) - 11} width="56" height="22" rx="11" fill="#4ade8022" stroke="#4ade8044" />
                <text x="183" y={BY - e + Math.round(e / 2) + 4} textAnchor="middle" fill="#4ade80" fontSize="10" fontFamily="Inter,sans-serif" fontWeight="700">+$303K</text>
            </svg>
            <div className={styles.chartLegend}>
                <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#06b6d4' }} />Compound growth (returns on returns)</div>
                <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#06b6d455' }} />Your actual contributions</div>
            </div>
            <div className={styles.chartNote}>12 extra years of compounding more than doubles your retirement savings</div>
        </div>
    );
}

function CompoundMonthlyChart() {
    // $100/month at 7%, compounded monthly over 40 years.
    // x: 50→400 (350px / 40yr = 8.75px/yr). y: 185→25 (160px / $265K).
    const pts = (arr: [number, number][]) => arr.map(([x, y]) => `${x},${y}`).join(' ');
    const totalPts: [number, number][] = [
        [50, 185], [94, 181], [138, 175], [181, 165],
        [225, 153], [269, 136], [313, 111], [356, 76], [400, 26],
    ];
    const contribPts: [number, number][] = [
        [50, 185], [94, 181], [138, 178], [181, 174],
        [225, 171], [269, 167], [313, 163], [356, 160], [400, 156],
    ];
    const growthArea = [
        ...totalPts,
        ...[...contribPts].reverse(),
    ].map(([x, y]) => `${x},${y}`).join(' ');
    const contribArea = [...contribPts, [400, 185] as [number, number]]
        .map(([x, y]) => `${x},${y}`).join(' ');

    const yrs = [0, 5, 10, 15, 20, 25, 30, 35, 40];
    const xPos = [50, 94, 138, 181, 225, 269, 313, 356, 400];

    return (
        <div className={styles.chartBox}>
            <div className={styles.chartTitle}>Compound Growth in Action</div>
            <div className={styles.chartSubtitle}>$100/month at 7% annual return — total value vs money contributed</div>
            <svg viewBox="0 0 430 210" className={styles.chart} aria-label="Compound monthly contribution growth chart">
                {[185, 145, 105, 65, 25].map(y => (
                    <line key={y} x1="45" y1={y} x2="405" y2={y} stroke="currentColor" strokeOpacity="0.07" />
                ))}
                {/* Contribution area */}
                <polygon points={contribArea} fill="#94a3b8" fillOpacity="0.15" />
                {/* Growth area (between contribution and total) */}
                <polygon points={growthArea} fill="#06b6d4" fillOpacity="0.15" />
                {/* Contribution line */}
                <polyline points={pts(contribPts)} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5,3" strokeLinecap="round" />
                {/* Total value line */}
                <polyline points={pts(totalPts)} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Data dots */}
                {totalPts.map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="3.5" fill="#06b6d4" stroke="var(--vt-surface)" strokeWidth="2" />
                ))}
                {/* End labels */}
                <rect x="304" y="12" width="98" height="22" rx="11" fill="#06b6d422" stroke="#06b6d444" />
                <text x="353" y="27" textAnchor="middle" fill="#22d3ee" fontSize="11.5" fontWeight="700" fontFamily="Inter,sans-serif">$121,900</text>
                <rect x="304" y="144" width="80" height="22" rx="11" fill="#94a3b822" stroke="#94a3b844" />
                <text x="344" y="159" textAnchor="middle" fill="#94a3b8" fontSize="11.5" fontWeight="700" fontFamily="Inter,sans-serif">$36,000</text>
                {/* X-axis labels */}
                {yrs.map((yr, i) => (
                    <text key={i} x={xPos[i]} y="200" textAnchor="middle" fill="currentColor" fillOpacity="0.45" fontSize="9" fontFamily="Inter,sans-serif">Yr {yr}</text>
                ))}
                {/* Y-axis labels */}
                <text x="40" y="188" textAnchor="end" fill="currentColor" fillOpacity="0.4" fontSize="9" fontFamily="Inter,sans-serif">$0</text>
                <text x="40" y="28" textAnchor="end" fill="currentColor" fillOpacity="0.4" fontSize="9" fontFamily="Inter,sans-serif">$265K</text>
            </svg>
            <div className={styles.chartLegend}>
                <div className={styles.legendItem}><span className={styles.legendLine} style={{ background: '#06b6d4' }} />Total account value (with compound growth)</div>
                <div className={styles.legendItem}><span className={styles.legendLine} style={{ background: '#94a3b8', opacity: 0.6 }} />Amount you actually contributed</div>
            </div>
            <div className={styles.chartNote}>After 30 years your account is 3× your contributions — growth does the heavy lifting</div>
        </div>
    );
}

function SimpleVsCompoundChart() {
    // $1,000 at 10% for 20 years.
    // Simple: $1K + $100×t. Compound: $1K × 1.10^t
    // x: 50→390 (340px/20yr). y: 175→25 (150px/$7K).
    const simplePts = "50,154 135,143 220,132 305,121 390,111";
    const compoundPts = "50,154 135,141 220,119 305,86 390,31";
    const simpleArea = "50,175 50,154 135,143 220,132 305,121 390,111 390,175";
    const compoundArea = "50,175 50,154 135,141 220,119 305,86 390,31 390,175";
    const yrs = [0, 5, 10, 15, 20];
    const xPos = [50, 135, 220, 305, 390];
    return (
        <div className={styles.chartBox}>
            <div className={styles.chartTitle}>Simple vs Compound Interest</div>
            <div className={styles.chartSubtitle}>$1,000 at 10% — straight-line vs exponential growth over 20 years</div>
            <svg viewBox="0 0 420 200" className={styles.chart} aria-label="Simple vs compound interest comparison chart">
                {[175, 140, 105, 70, 35].map(y => (
                    <line key={y} x1="45" y1={y} x2="395" y2={y} stroke="currentColor" strokeOpacity="0.07" />
                ))}
                {/* Simple area */}
                <polygon points={simpleArea} fill="#94a3b8" fillOpacity="0.12" />
                {/* Compound area */}
                <polygon points={compoundArea} fill="#4576E7" fillOpacity="0.12" />
                {/* Simple line */}
                <polyline points={simplePts} fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {/* Compound line */}
                <polyline points={compoundPts} fill="none" stroke="#4576E7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* End labels */}
                <rect x="293" y="18" width="88" height="22" rx="11" fill="#4576E722" stroke="#4576E744" />
                <text x="337" y="33" textAnchor="middle" fill="#7d9bff" fontSize="11.5" fontWeight="700" fontFamily="Inter,sans-serif">$6,727</text>
                <rect x="293" y="98" width="82" height="22" rx="11" fill="#94a3b822" stroke="#94a3b844" />
                <text x="334" y="113" textAnchor="middle" fill="#94a3b8" fontSize="11.5" fontWeight="700" fontFamily="Inter,sans-serif">$3,000</text>
                {/* X-axis labels */}
                {yrs.map((yr, i) => (
                    <text key={i} x={xPos[i]} y="190" textAnchor="middle" fill="currentColor" fillOpacity="0.45" fontSize="9" fontFamily="Inter,sans-serif">Yr {yr}</text>
                ))}
                <text x="40" y="178" textAnchor="end" fill="currentColor" fillOpacity="0.4" fontSize="9" fontFamily="Inter,sans-serif">$1K</text>
                <text x="40" y="35" textAnchor="end" fill="currentColor" fillOpacity="0.4" fontSize="9" fontFamily="Inter,sans-serif">$7K</text>
            </svg>
            <div className={styles.chartLegend}>
                <div className={styles.legendItem}><span className={styles.legendLine} style={{ background: '#4576E7' }} />Compound interest ($6,727 after 20 years)</div>
                <div className={styles.legendItem}><span className={styles.legendLine} style={{ background: '#94a3b8', opacity: 0.6 }} />Simple interest ($3,000 after 20 years)</div>
            </div>
            <div className={styles.chartNote}>Compound interest produces 2.2× more than simple interest over 20 years at the same rate</div>
        </div>
    );
}

function BudgetPieChart() {
    const segments = [
        { label: 'Needs', sub: 'Housing, food, transport', pct: 50, color: '#4576E7' },
        { label: 'Wants', sub: 'Dining, fun, hobbies', pct: 30, color: '#f97316' },
        { label: 'Savings', sub: 'IRA, emergency fund', pct: 20, color: '#4ade80' },
    ];
    const cx = 100, cy = 100, r = 70, innerR = 42;
    let cumDeg = -90;
    const arcs = segments.map(seg => {
        const startDeg = cumDeg;
        cumDeg += (seg.pct / 100) * 360;
        const endDeg = cumDeg;
        const toRad = (d: number) => (d * Math.PI) / 180;
        const x1 = cx + r * Math.cos(toRad(startDeg));
        const y1 = cy + r * Math.sin(toRad(startDeg));
        const x2 = cx + r * Math.cos(toRad(endDeg));
        const y2 = cy + r * Math.sin(toRad(endDeg));
        const ix1 = cx + innerR * Math.cos(toRad(startDeg));
        const iy1 = cy + innerR * Math.sin(toRad(startDeg));
        const ix2 = cx + innerR * Math.cos(toRad(endDeg));
        const iy2 = cy + innerR * Math.sin(toRad(endDeg));
        const large = seg.pct > 50 ? 1 : 0;
        const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1} Z`;
        return { ...seg, d };
    });
    return (
        <div className={styles.chartBox}>
            <div className={styles.chartTitle}>The 50/30/20 Budget Rule</div>
            <div className={styles.chartSubtitle}>A simple framework for every dollar you earn</div>
            <div className={styles.pieLayout}>
                <svg viewBox="0 0 200 200" className={styles.pieChart} aria-label="50/30/20 budget breakdown pie chart">
                    {arcs.map((seg, i) => (
                        <path key={i} d={seg.d} fill={seg.color} fillOpacity="0.9" stroke="var(--vt-surface)" strokeWidth="2" />
                    ))}
                    <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--vt-text)" fontSize="13" fontWeight="700" fontFamily="Inter,sans-serif">Your</text>
                    <text x={cx} y={cx + 10} textAnchor="middle" fill="var(--vt-text)" fontSize="13" fontWeight="700" fontFamily="Inter,sans-serif">Budget</text>
                </svg>
                <div className={styles.pieLegend}>
                    {segments.map((seg, i) => (
                        <div key={i} className={styles.pieLegendItem}>
                            <div className={styles.pieLegendColor} style={{ background: seg.color }} />
                            <div className={styles.pieLegendText}>
                                <span className={styles.pieLegendLabel}>{seg.label} — {seg.sub}</span>
                                <span className={styles.pieLegendPct} style={{ color: seg.color }}>{seg.pct}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.chartNote}>On $3,000/month: $1,500 needs · $900 wants · $600 saved and invested</div>
        </div>
    );
}

// ─── Chart Injection Map ──────────────────────────────────────────────────────

function getChartForLesson(levelId: string, unitId: number): React.ReactNode | null {
    const key = `${levelId}-${unitId}`;
    switch (key) {
        case 'beginner-3': return <OrderTypesVisual />;
        case 'beginner-4': return <PortfolioPieChart />;
        case 'beginner-5': return <CandlestickDiagram />;
        case 'beginner-6': return <BullBearChart />;
        case 'beginner-7': return <CompoundGrowthChart />;
        case 'intermediate-2': return <MovingAveragesChart />;
        case 'intermediate-8': return <RiskRewardVisual />;
        case 'strategies-2': return <RiskRewardVisual />;
        case 'strategies-5': return <RiskRewardVisual />;
        case 'advanced-5': return <CompoundGrowthChart />;
        case 'personal-finance-1': return <IRAEarlyChart />;
        case 'personal-finance-2': return <CompoundMonthlyChart />;
        case 'personal-finance-3': return <SimpleVsCompoundChart />;
        case 'personal-finance-4': return <BudgetPieChart />;
        default: return null;
    }
}

// ─── Mini Quiz Prompt ─────────────────────────────────────────────────────────

function QuickCheckPrompt({ onTakeQuiz }: { onTakeQuiz?: () => void }) {
    const [answered, setAnswered] = useState(false);
    return (
        <div className={styles.quickCheck}>
            <div className={styles.quickCheckLabel}>Quick Check</div>
            <p className={styles.quickCheckText}>
                Feeling confident? Test what you just learned with a quick quiz.
            </p>
            {onTakeQuiz && (
                <button className={styles.quickCheckBtn} onClick={onTakeQuiz}>
                    Take the Quiz →
                </button>
            )}
        </div>
    );
}

// ─── Main Renderer ────────────────────────────────────────────────────────────

interface LessonRendererProps {
    content: string;
    unitId: number;
    levelId: string;
    accentColor?: string;
    onTakeQuiz?: () => void;
}

export function LessonRenderer({ content, unitId, levelId, accentColor, onTakeQuiz }: LessonRendererProps) {
    const blocks = useMemo(() => parseContent(content), [content]);
    const chart = useMemo(() => getChartForLesson(levelId, unitId), [levelId, unitId]);

    // Inject chart after the intro block
    let chartInjected = false;
    const rendered: React.ReactNode[] = [];

    blocks.forEach((block, i) => {
        switch (block.kind) {
            case 'intro':
                rendered.push(<IntroBlock key={i} text={block.text} />);
                if (chart && !chartInjected) {
                    rendered.push(<div key="chart" className={styles.chartSection}>{chart}</div>);
                    chartInjected = true;
                }
                break;
            case 'section':
                rendered.push(<SectionBlock key={i} heading={block.heading} items={block.items} />);
                break;
            case 'concepts':
                rendered.push(<ConceptsGroup key={i} items={block.items} />);
                break;
            case 'steps':
                rendered.push(<StepsBlock key={i} heading={block.heading} items={block.items} />);
                break;
            case 'bullets':
                rendered.push(<BulletsBlock key={i} items={block.items} />);
                break;
            case 'formula':
                rendered.push(<FormulaBlock key={i} heading={block.heading} body={block.body} />);
                break;
            case 'paragraph':
                rendered.push(<ParagraphBlock key={i} text={block.text} />);
                break;
        }
    });

    // If no intro was found, inject chart at the start
    if (chart && !chartInjected) {
        rendered.unshift(<div key="chart" className={styles.chartSection}>{chart}</div>);
    }

    return (
        <div className={styles.renderer} style={{ '--accent': accentColor ?? '#4576E7' } as React.CSSProperties}>
            {rendered}
            <QuickCheckPrompt onTakeQuiz={onTakeQuiz} />
        </div>
    );
}
