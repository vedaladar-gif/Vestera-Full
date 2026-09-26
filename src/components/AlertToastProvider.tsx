'use client';

import {
    createContext, useContext, useState, useCallback,
    useEffect, useRef, ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import styles from './AlertToastProvider.module.css';

// ── Types ──────────────────────────────────────────────────────────────────

export interface AlertToastItem {
    id: string; // unique toast instance ID
    alertId: string; // database price_alert row ID
    ticker: string;
    condition: 'above' | 'below';
    targetPrice: number;
    currentPrice: number;
}

interface PriceAlert {
    id: string;
    ticker: string;
    condition: 'above' | 'below';
    target_price: number;
}

// ── Context ────────────────────────────────────────────────────────────────

interface ContextValue {
    toasts: AlertToastItem[];
    addToast: (t: AlertToastItem) => void;
    dismissToast: (id: string) => void;
}

const AlertToastContext = createContext<ContextValue>({
    toasts: [],
    addToast: () => {},
    dismissToast: () => {},
});

export const useAlertToast = () => useContext(AlertToastContext);

// ── Single Toast Component ─────────────────────────────────────────────────

const TOAST_MS = 7000;

function Toast({ toast, onDismiss }: { toast: AlertToastItem; onDismiss: () => void }) {
    const router = useRouter();
    const [exiting, setExiting] = useState(false);
    const [progress, setProgress] = useState(100);
    const rafRef = useRef<number | null>(null);
    const startRef = useRef(Date.now());
    const remainingRef = useRef(TOAST_MS);
    const pausedRef = useRef(false);

    const startTick = useCallback(() => {
        startRef.current = Date.now();
        const tick = () => {
            if (pausedRef.current) return;
            const elapsed = Date.now() - startRef.current;
            const pct = Math.max(0, ((remainingRef.current - elapsed) / TOAST_MS) * 100);
            setProgress(pct);
            if (pct > 0) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                exit();
            }
        };
        rafRef.current = requestAnimationFrame(tick);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const exit = useCallback(() => {
        setExiting(true);
        setTimeout(onDismiss, 350);
    }, [onDismiss]);

    useEffect(() => {
        startTick();
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [startTick]);

    const pause = () => {
        pausedRef.current = true;
        remainingRef.current -= Date.now() - startRef.current;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };

    const resume = () => {
        pausedRef.current = false;
        startTick();
    };

    const handleNavigate = () => {
        exit();
        router.push(`/trade?ticker=${toast.ticker}`);
    };

    const isAbove = toast.condition === 'above';
    const accent = isAbove ? 'var(--vt-green)' : 'var(--vt-red)';
    const icon = isAbove ? '' : '';
    const verb = isAbove ? 'crossed above' : 'dropped below';

    return (
        <div
            className={`${styles.toast} ${exiting ? styles.toastOut : ''}`}
            style={{ '--accent': accent } as React.CSSProperties}
            onMouseEnter={pause}
            onMouseLeave={resume}
        >
            <div className={styles.toastHead}>
                <div className={styles.toastTitle}>
                    <span className={styles.toastIcon}>{icon}</span>
                    <span className={styles.toastTicker}>{toast.ticker}</span>
                    <span className={styles.toastLabel}>Alert Triggered</span>
                </div>
                <button className={styles.toastClose} onClick={exit} aria-label="Dismiss">×</button>
            </div>

            <p className={styles.toastMsg}>
                <strong>{toast.ticker}</strong> {verb} your target of{' '}
                <span style={{ color: accent }}>${toast.targetPrice.toFixed(2)}</span>
            </p>
            <p className={styles.toastPrice}>
                Current price:{' '}
                <strong style={{ color: accent }}>${toast.currentPrice.toFixed(2)}</strong>
            </p>

            <button className={styles.toastCta} onClick={handleNavigate}>
                Trade {toast.ticker} now →
            </button>

            <div className={styles.toastProgressTrack}>
                <div
                    className={styles.toastProgressBar}
                    style={{ width: `${progress}%`, background: accent }}
                />
            </div>
        </div>
    );
}

// ── Toast Container ────────────────────────────────────────────────────────

function ToastContainer() {
    const { toasts, dismissToast } = useAlertToast();
    if (toasts.length === 0) return null;
    return (
        <div className={styles.container} aria-live="polite" aria-label="Price alert notifications">
            {toasts.map(t => (
                <Toast key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
            ))}
        </div>
    );
}

// ── Polling Component ──────────────────────────────────────────────────────

const POLL_MS = 25_000;

function AlertPoller() {
    const { addToast } = useAlertToast();
    // Tracks alert IDs we've already fired a toast for in this session
    const firedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;

        const poll = async () => {
            try {
                // Only poll if the user is authenticated
                const meRes = await fetch('/api/auth/me', { credentials: 'same-origin' });
                const me = await meRes.json();
                if (!me.authenticated) {
                    timeout = setTimeout(poll, POLL_MS);
                    return;
                }

                // Fetch active alerts
                const alertsRes = await fetch('/api/alerts');
                if (!alertsRes.ok) { timeout = setTimeout(poll, POLL_MS); return; }
                const { alerts = [] }: { alerts: PriceAlert[] } = await alertsRes.json();
                if (alerts.length === 0) { timeout = setTimeout(poll, POLL_MS); return; }

                // Fetch prices for unique tickers
                const tickers = [...new Set(alerts.map(a => a.ticker))];
                const priceMap: Record<string, number> = {};
                await Promise.all(
                    tickers.map(async ticker => {
                        try {
                            const r = await fetch(`/api/price/${ticker}`);
                            const d = await r.json();
                            if (d.price) priceMap[ticker] = d.price;
                        } catch { /* ignore */ }
                    })
                );

                // Check each alert condition
                for (const alert of alerts) {
                    if (firedRef.current.has(alert.id)) continue;
                    const price = priceMap[alert.ticker];
                    if (!price) continue;

                    const hit =
                        (alert.condition === 'above' && price >= alert.target_price) ||
                        (alert.condition === 'below' && price <= alert.target_price);

                    if (hit) {
                        firedRef.current.add(alert.id);

                        // Mark as triggered in DB (fire-and-forget)
                        fetch(`/api/alerts/${alert.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                is_active: false,
                                triggered_at: new Date().toISOString(),
                            }),
                        }).catch(() => {});

                        // Fire toast
                        addToast({
                            id: `${alert.id}-${Date.now()}`,
                            alertId: alert.id,
                            ticker: alert.ticker,
                            condition: alert.condition,
                            targetPrice: alert.target_price,
                            currentPrice: price,
                        });
                    }
                }
            } catch { /* ignore network errors */ }

            timeout = setTimeout(poll, POLL_MS);
        };

        poll();
        return () => clearTimeout(timeout);
    }, [addToast]);

    return null;
}

// ── Root Provider (exported) ───────────────────────────────────────────────

export function AlertToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<AlertToastItem[]>([]);

    const addToast = useCallback((toast: AlertToastItem) => {
        setToasts(prev => {
            // Max 4 visible at once — drop the oldest if over limit
            const next = [...prev, toast];
            return next.length > 4 ? next.slice(next.length - 4) : next;
        });
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <AlertToastContext.Provider value={{ toasts, addToast, dismissToast }}>
            {children}
            <AlertPoller />
            <ToastContainer />
        </AlertToastContext.Provider>
    );
}
