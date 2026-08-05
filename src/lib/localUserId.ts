export const LOCAL_USER_PREFIX = 'local:';

export function isLocalUser(userId: string | undefined | null): boolean {
    return typeof userId === 'string' && userId.startsWith(LOCAL_USER_PREFIX);
}

export function toLocalUserId(numericId: number): string {
    return `${LOCAL_USER_PREFIX}${numericId}`;
}

export function parseLocalUserId(userId: string): number {
    return parseInt(userId.slice(LOCAL_USER_PREFIX.length), 10);
}
