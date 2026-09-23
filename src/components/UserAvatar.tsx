/**
 * UserAvatar — renders a profile picture or a gradient+initials fallback.
 * Imports shared helpers from lib/avatarColors.ts.
 */
import { getAvatarGradient, getInitials } from '@/lib/avatarColors';

export interface UserAvatarProps {
    avatarUrl?: string | null;
    avatarColor?: string;
    username: string;
    displayName?: string | null;
    size: number;
    borderRadius?: number;
    style?: React.CSSProperties;
}

export function UserAvatar({
    avatarUrl,
    avatarColor = 'blue',
    username,
    displayName,
    size,
    borderRadius,
    style,
}: UserAvatarProps) {
    const radius = borderRadius ?? Math.round(size * 0.28);
    const base: React.CSSProperties = {
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        ...style,
    };

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={`@${username}`}
                width={size}
                height={size}
                style={{ ...base, objectFit: 'cover', display: 'block' }}
            />
        );
    }

    const initials = getInitials(username, displayName);
    const fontSize = Math.round(size * 0.38);

    return (
        <div
            style={{
                ...base,
                background: getAvatarGradient(avatarColor),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize,
                fontWeight: 700,
                fontFamily: "'Inter', 'Inter', sans-serif",
                letterSpacing: '-0.5px',
                userSelect: 'none',
            }}
        >
            {initials}
        </div>
    );
}
