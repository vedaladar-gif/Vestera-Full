'use client';

import { useCallback, useEffect, useState } from 'react';

type MeResponse = {
    authenticated?: boolean;
    userId?: string;
};

export function useAuthState() {
    const [authenticated, setAuthenticated] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(() => {
        setLoading(true);
        fetch('/api/auth/me', { credentials: 'same-origin' })
            .then(r => r.json())
            .then((data: MeResponse) => {
                const authed = Boolean(data.authenticated);
                setAuthenticated(authed);
                setUserId(authed && data.userId ? data.userId : null);
            })
            .catch(() => {
                setAuthenticated(false);
                setUserId(null);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { authenticated, userId, loading, refresh, setAuthenticated };
}
