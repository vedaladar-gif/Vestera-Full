'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/useAuthState';

function GuardSpinner() {
    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--vt-bg)',
            }}
        >
            <span
                style={{
                    width: 36,
                    height: 36,
                    border: '3px solid var(--vt-border)',
                    borderTopColor: '#4576E7',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                }}
                aria-label="Loading"
            />
        </div>
    );
}

/**
 * Renders children only for authenticated users. Others are sent to `/restricted`
 * (client fallback; middleware enforces the same server-side).
 */
export default function GuestGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { authenticated, loading } = useAuthState();

    useEffect(() => {
        if (loading) return;
        if (!authenticated) {
            router.replace('/restricted');
        }
    }, [authenticated, loading, router]);

    if (loading) {
        return <GuardSpinner />;
    }
    if (!authenticated) {
        return <GuardSpinner />;
    }
    return <>{children}</>;
}
