export const AVATAR_GRADIENTS: Record<string, string> = {
    blue:   'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    purple: 'linear-gradient(135deg, #A855F7, #9333EA)',
    green:  'linear-gradient(135deg, #10B981, #059669)',
    orange: 'linear-gradient(135deg, #F97316, #EA580C)',
    pink:   'linear-gradient(135deg, #EC4899, #DB2777)',
    teal:   'linear-gradient(135deg, #14B8A6, #0D9488)',
    red:    'linear-gradient(135deg, #EF4444, #DC2626)',
    yellow: 'linear-gradient(135deg, #F59E0B, #D97706)',
};

export const AVATAR_COLOR_KEYS = Object.keys(AVATAR_GRADIENTS);

export function getAvatarGradient(color: string): string {
    return AVATAR_GRADIENTS[color] ?? AVATAR_GRADIENTS.blue;
}

/** Returns 1–2 uppercase initials from a username or display name. */
export function getInitials(username: string, displayName?: string | null): string {
    const raw = displayName?.trim() || username?.trim() || '?';
    // Strip email domain for legacy email-as-username
    const name = raw.includes('@') ? raw.split('@')[0] : raw;
    const parts = name.split(/[_.\s-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

/** Returns true when the username is an email (legacy, needs real username). */
export function isEmailUsername(username: string | null | undefined): boolean {
    return !username || username.includes('@');
}

export const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,20}$/;
