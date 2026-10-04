export type IconName =
    | 'bank' | 'capitol' | 'office' | 'fund' | 'bars' | 'flame' | 'stocks'
    | 'calendar' | 'paycheck' | 'news' | 'unlock' | 'trophy'
    | 'earnings' | 'confidence' | 'rates' | 'boom' | 'correction' | 'growth' | 'finish'
    | 'star' | 'cup' | 'pie' | 'info' | 'toggle';

const PATHS: Record<IconName, string[]> = {
    bank: ['M8 20 L32 8 L56 20 Z', 'M10 22 H54', 'M14 24 V42', 'M24 24 V42', 'M40 24 V42', 'M50 24 V42', 'M8 44 H56', 'M6 48 H58'],
    capitol: ['M32 6 V11', 'M22 22 Q32 8 42 22', 'M18 22 H46', 'M20 22 V26 H44 V22', 'M22 28 V42', 'M29 28 V42', 'M35 28 V42', 'M42 28 V42', 'M14 44 H50', 'M10 48 H54'],
    office: ['M18 46 V10 H40 V46', 'M40 20 H50 V46', 'M24 16 H28', 'M31 16 H35', 'M24 24 H28', 'M31 24 H35', 'M24 32 H28', 'M31 32 H35', 'M44 28 H46', 'M44 36 H46', 'M27 46 V39 H31 V46', 'M12 46 H56'],
    fund: ['M8 44 L18 34 L26 38 L36 24 L44 28 L56 12', 'M8 48 H56', 'M50 12 H56 V18'],
    bars: ['M26 12 H38 L40 20 H24 Z', 'M17 22 H31 L33 31 H15 Z', 'M33 22 H47 L49 31 H31 Z', 'M10 33 H24 L26 42 H8 Z', 'M25 33 H39 L41 42 H23 Z', 'M40 33 H54 L56 42 H38 Z'],
    flame: ['M32 6 C36 16 46 20 46 32 A14 14 0 0 1 18 32 C18 24 24 20 26 14 C28 20 30 22 32 22 C32 16 32 12 32 6 Z', 'M32 44 A6 6 0 0 1 26 38 C26 34 30 32 32 28 C34 32 38 34 38 38 A6 6 0 0 1 32 44 Z'],
    stocks: ['M14 14 V40', 'M10 20 H18 V34 H10 Z', 'M30 10 V32', 'M26 14 H34 V26 H26 Z', 'M46 20 V46', 'M42 26 H50 V40 H42 Z', 'M8 48 H56'],
    calendar: ['M10 14 H54 V48 H10 Z', 'M10 22 H54', 'M20 8 V16', 'M44 8 V16', 'M18 30 H24', 'M29 30 H35', 'M40 30 H46', 'M18 38 H24', 'M29 38 H35'],
    paycheck: ['M8 16 H56 V44 H8 Z', 'M14 24 H30', 'M14 30 H26', 'M38 36 H50', 'M44 20 V32', 'M47 22 Q44 20 41 22 Q41 26 44 26 Q47 26 47 30 Q44 32 41 30'],
    news: ['M12 10 H48 V48 H16 A4 4 0 0 1 12 44 Z', 'M48 18 H54 V44 A4 4 0 0 1 50 48', 'M18 18 H42', 'M18 26 H28 V36 H18 Z', 'M32 26 H42', 'M32 32 H42', 'M18 42 H42'],
    unlock: ['M16 26 H48 V48 H16 Z', 'M22 26 V18 A10 10 0 0 1 41 14', 'M32 34 V40'],
    trophy: ['M20 8 H44 V22 A12 12 0 0 1 20 22 Z', 'M20 12 H12 A8 8 0 0 0 20 24', 'M44 12 H52 A8 8 0 0 1 44 24', 'M32 34 V42', 'M22 48 H42 L40 42 H24 Z'],
    earnings: ['M12 10 H44 L52 18 V50 H12 Z', 'M44 10 V18 H52', 'M20 42 V34', 'M28 42 V28', 'M36 42 V32', 'M44 42 V24'],
    confidence: ['M8 44 L22 30 L32 36 L54 14', 'M44 14 H54 V24', 'M8 50 H56'],
    rates: ['M16 46 L48 12', 'M20 18 A5 5 0 1 0 20.01 18', 'M44 40 A5 5 0 1 0 44.01 40'],
    boom: ['M36 6 L16 32 H30 L26 52 L48 24 H34 Z'],
    correction: ['M8 14 L22 28 L32 22 L54 44', 'M44 44 H54 V34', 'M8 50 H56'],
    growth: ['M32 48 V26', 'M32 30 C32 20 24 16 16 16 C16 26 24 30 32 30', 'M32 26 C32 16 40 10 48 10 C48 20 40 26 32 26', 'M20 48 H44'],
    finish: ['M16 50 V8', 'M16 10 H48 L42 19 L48 28 H16', 'M26 10 V28', 'M36 10 V28'],
    star: ['M32 8 L38 24 L55 24 L41 34 L46 50 L32 40 L18 50 L23 34 L9 24 L26 24 Z'],
    cup: ['M20 10 H44 V22 A12 12 0 0 1 20 22 Z', 'M32 34 V44', 'M22 50 H42', 'M20 14 H12 A8 8 0 0 0 20 26', 'M44 14 H52 A8 8 0 0 1 44 26'],
    pie: ['M32 8 A24 24 0 1 0 56 32 H32 Z', 'M38 4 A22 22 0 0 1 60 26 H38 Z'],
    info: ['M32 28 V46', 'M32 18 V19'],
    toggle: ['M32 8 L44 24 H20 Z', 'M32 56 L20 40 H44 Z'],
};

export function Icon({ name, size = 56, className }: { name: IconName; size?: number; className?: string }) {
    return (
        <svg className={className} width={size} height={size * 0.875} viewBox="0 0 64 56" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {PATHS[name].map(d => <path key={d} d={d} />)}
        </svg>
    );
}

export function ToggleArrows() {
    return (
        <svg width="8" height="11" viewBox="0 0 8 11" aria-hidden>
            <path d="M4 0 L8 4 H0 Z M4 11 L0 7 H8 Z" fill="currentColor" />
        </svg>
    );
}
