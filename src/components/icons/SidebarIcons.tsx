/**
 * Small, clean line icons for the app sidebar / nav. Deliberately minimal
 * (18px, 1.6px stroke) to match a professional fintech product rather than
 * a playful/illustrated style.
 */

export interface IconProps {
    size?: number;
    className?: string;
}

const base = {
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
};

export function TradeIcon({ size = 18, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
            <path d="M3 17l5-5 4 4 8-8" />
            <path d="M15 8h5v5" />
        </svg>
    );
}

export function PortfolioIcon({ size = 18, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
            <rect x="3" y="7.5" width="18" height="12" rx="2" />
            <path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5" />
            <path d="M3 12h18" />
        </svg>
    );
}

export function LearnIcon({ size = 18, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
            <path d="M12 5 2 9l10 4 10-4-10-4Z" />
            <path d="M6 11v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5" />
        </svg>
    );
}

export function LeaderboardIcon({ size = 18, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
            <path d="M8 21h8" />
            <path d="M12 17v4" />
            <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
            <path d="M7 6H4.5A1.5 1.5 0 0 0 3 7.5c0 1.8 1.4 3 3.2 3.4" />
            <path d="M17 6h2.5A1.5 1.5 0 0 1 21 7.5c0 1.8-1.4 3-3.2 3.4" />
        </svg>
    );
}

export function FriendsIcon({ size = 18, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
            <circle cx="9" cy="8" r="3" />
            <path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" />
            <circle cx="17.5" cy="9" r="2.3" />
            <path d="M15.5 14.2c2.3.3 4.5 1.9 4.5 4.8" />
        </svg>
    );
}

export function ForecastIcon({ size = 18, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
            <path d="M3 15l4-5 4 3 6-7 4 4" />
            <circle cx="19" cy="6" r="1.4" fill="currentColor" stroke="none" />
        </svg>
    );
}

export function ChaptersIcon({ size = 18, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
            <path d="M3 21V10l9-6 9 6v11" />
            <path d="M9 21v-6h6v6" />
        </svg>
    );
}

export function PartnersIcon({ size = 18, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
            <path d="M8.5 13.5 11 16l6-6" />
            <path d="M3 12.5 7 9l3 1.6L14 6l4 2.5-3 3" />
        </svg>
    );
}

export function AiAssistantIcon({ size = 18, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
            <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1M3 12h3M18 12h3" />
            <circle cx="12" cy="12" r="4" />
        </svg>
    );
}

export function SettingsIcon({ size = 18, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
            <circle cx="12" cy="12" r="3.2" />
            <path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87A1.7 1.7 0 0 0 2.6 12.5H2.5a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.15 7.35a1.7 1.7 0 0 0-.34-1.87l-.06-.06A2 2 0 1 1 6.58 2.6l.06.06a1.7 1.7 0 0 0 1.87.34H8.6A1.7 1.7 0 0 0 9.65 1.1V1a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1.06 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09c.24.7.82 1.22 1.55 1.35h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.56 1.05Z" />
        </svg>
    );
}

export function LogoutIcon({ size = 18, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
            <path d="M15 17l5-5-5-5" />
            <path d="M20 12H9" />
            <path d="M13 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" />
        </svg>
    );
}

export function ChevronDownIcon({ size = 14, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
            <path d="M6 9l6 6 6-6" />
        </svg>
    );
}

export function BellIcon({ size = 18, className }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
            <path d="M18 9.6a6 6 0 1 0-12 0c0 4.2-1.5 5.4-1.5 6.4 0 .6.5 1 1.1 1h12.8c.6 0 1.1-.4 1.1-1 0-1-1.5-2.2-1.5-6.4Z" />
            <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
    );
}
