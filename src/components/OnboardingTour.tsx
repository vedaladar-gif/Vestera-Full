'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import VestaBlob from './VestaBlob';
import styles from './OnboardingTour.module.css';
import {
    TOUR_STEPS,
    isTourActive,
    getTourStep,
    setTourStep,
    markTourSeen,
} from '@/lib/onboarding';

interface Rect { top: number; left: number; width: number; height: number; }

const CLUSTER_W = 340;
const CLUSTER_H = 280;

export default function OnboardingTour() {
    const pathname = usePathname();
    const router = useRouter();
    const [active, setActive] = useState(false);
    const [step, setStep] = useState(0);
    const [rect, setRect] = useState<Rect | null>(null);
    const [mounted, setMounted] = useState(false);
    const targetElRef = useRef<HTMLElement | null>(null);

    /* ── init from storage + listen for programmatic start ── */
    useEffect(() => {
        setMounted(true);
        if (isTourActive()) {
            setActive(true);
            setStep(getTourStep());
            window.dispatchEvent(new CustomEvent('vestera:tour-start'));
        }
        const startHandler = () => {
            setActive(true);
            setStep(getTourStep());
            window.dispatchEvent(new CustomEvent('vestera:tour-start'));
        };
        window.addEventListener('vestera:start-tour', startHandler);
        return () => window.removeEventListener('vestera:start-tour', startHandler);
    }, []);

    const current = TOUR_STEPS[step];
    const onRoute = !!current && pathname === current.route;
    const needsTarget = !!current?.target;

    /* ── clear the tracked target ── */
    const clearTarget = useCallback(() => {
        targetElRef.current = null;
    }, []);

    /* ── locate + track the target element for the current step ── */
    useEffect(() => {
        if (!active || !onRoute || !needsTarget) {
            setRect(null);
            clearTarget();
            return;
        }

        let cancelled = false;
        let pollId: ReturnType<typeof setInterval> | null = null;
        let cleanupScroll: (() => void) | null = null;

        const measure = (el: HTMLElement) => {
            const r = el.getBoundingClientRect();
            setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        };

        const attach = (el: HTMLElement) => {
            // The overlay is click-through, so the real element stays clickable —
            // the spotlight hole simply reveals it. Just track it for measuring + click-advance.
            targetElRef.current = el;
            measure(el);
            const onScrollResize = () => measure(el);
            window.addEventListener('scroll', onScrollResize, { passive: true });
            window.addEventListener('resize', onScrollResize);
            cleanupScroll = () => {
                window.removeEventListener('scroll', onScrollResize);
                window.removeEventListener('resize', onScrollResize);
            };
        };

        const tryFind = () => {
            if (cancelled) return true;
            const el = document.querySelector<HTMLElement>(`[data-tour="${current!.target}"]`);
            if (el) {
                if (pollId) { clearInterval(pollId); pollId = null; }
                el.scrollIntoView({ block: 'center', behavior: 'smooth' });
                setTimeout(() => !cancelled && attach(el), 350);
                return true;
            }
            return false;
        };

        if (!tryFind()) {
            pollId = setInterval(tryFind, 150);
            // stop polling after ~4s
            setTimeout(() => { if (pollId) { clearInterval(pollId); pollId = null; } }, 4000);
        }

        return () => {
            cancelled = true;
            if (pollId) clearInterval(pollId);
            if (cleanupScroll) cleanupScroll();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, onRoute, needsTarget, step, pathname]);

    /* ── advance / finish ── */
    const advance = useCallback(() => {
        clearTarget();
        const next = step + 1;
        if (next >= TOUR_STEPS.length) {
            markTourSeen();
            setActive(false);
            window.dispatchEvent(new CustomEvent('vestera:tour-end'));
            return;
        }
        setStep(next);
        setTourStep(next);

        // Auto-drive Vesta to the next page if the next step lives elsewhere.
        const nextStep = TOUR_STEPS[next];
        if (nextStep && nextStep.route !== pathname) {
            router.push(nextStep.navPath ?? nextStep.route);
        }
    }, [step, clearTarget, pathname, router]);

    const finishEarly = useCallback(() => {
        clearTarget();
        markTourSeen();
        setActive(false);
        window.dispatchEvent(new CustomEvent('vestera:tour-end'));
    }, [clearTarget]);

    /* ── click-target steps: advance when the highlighted element is clicked ── */
    useEffect(() => {
        if (!active || !onRoute || current?.advanceOn !== 'click-target') return;
        const el = targetElRef.current;
        if (!el) return;
        const handler = () => {
            // advance in both React state and storage before the click's navigation
            const next = step + 1;
            clearTarget();
            setTourStep(next);
            setStep(next);
        };
        el.addEventListener('click', handler);
        return () => el.removeEventListener('click', handler);
    // clearTarget is stable (useCallback []) — omitted to keep deps length constant
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, onRoute, current, step, rect]);

    /* ── event-gated steps: advance when a specific app event fires (e.g. a buy) ── */
    useEffect(() => {
        if (!active || !onRoute || current?.advanceOn !== 'event' || !current.event) return;
        const handler = () => advance();
        window.addEventListener(current.event, handler);
        return () => window.removeEventListener(current.event!, handler);
    }, [active, onRoute, current, advance]);

    /* clear tracked target on unmount */
    useEffect(() => () => clearTarget(), [clearTarget]);

    if (!mounted || !active || !current) return null;
    // Wait quietly until the user is on the step's route.
    if (!onRoute) return null;
    // Target step but element not found yet → keep waiting (dim only).
    if (needsTarget && !rect) {
        return <div className={styles.overlay}><div className={styles.dim} /></div>;
    }

    const centered = !needsTarget;

    /* compute cluster position */
    let clusterLeft = 0, clusterTop = 0;
    if (!centered && rect) {
        const vw = window.innerWidth, vh = window.innerHeight;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const placement = current.placement ?? 'bottom';
        const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));
        if (placement === 'bottom') {
            clusterLeft = clamp(cx - CLUSTER_W / 2, 16, vw - CLUSTER_W - 16);
            clusterTop = clamp(rect.top + rect.height + 14, 16, vh - CLUSTER_H - 16);
        } else if (placement === 'top') {
            clusterLeft = clamp(cx - CLUSTER_W / 2, 16, vw - CLUSTER_W - 16);
            clusterTop = clamp(rect.top - CLUSTER_H - 14, 16, vh - CLUSTER_H - 16);
        } else if (placement === 'left') {
            clusterLeft = clamp(rect.left - CLUSTER_W - 20, 16, vw - CLUSTER_W - 16);
            clusterTop = clamp(cy - CLUSTER_H / 2, 16, vh - CLUSTER_H - 16);
        } else {
            clusterLeft = clamp(rect.left + rect.width + 20, 16, vw - CLUSTER_W - 16);
            clusterTop = clamp(cy - CLUSTER_H / 2, 16, vh - CLUSTER_H - 16);
        }
    }

    const isClickTarget = current.advanceOn === 'click-target';
    const isEventGated = current.advanceOn === 'event';

    const cardInner = (
        <>
            <div className={styles.vestaWrap}>
                <VestaBlob size={current.finish ? 76 : 64} showDot animate={current.finish} />
            </div>
            <div className={`${styles.card} ${current.finish ? styles.cardFinish : ''}`}>
                <div className={styles.stepDots}>
                    {TOUR_STEPS.map((_, i) => (
                        <span
                            key={i}
                            className={`${styles.dot} ${i === step ? styles.dotActive : ''} ${i < step ? styles.dotDone : ''}`}
                        />
                    ))}
                </div>
                <h3 className={styles.title}>{current.title}</h3>
                <p className={styles.body}>{current.body}</p>
                <div className={styles.actions}>
                    {!current.finish && (
                        <button className={styles.skipBtn} onClick={finishEarly}>Skip tour</button>
                    )}
                    {isEventGated ? (
                        <span className={styles.waitHint}>
                            <span className={styles.waitDot} /> Waiting for you…
                        </span>
                    ) : (
                        <button
                            className={styles.primaryBtn}
                            onClick={advance}
                            disabled={isClickTarget}
                        >
                            {current.cta}
                        </button>
                    )}
                </div>
            </div>
        </>
    );

    return (
        <div className={styles.overlay}>
            {centered ? (
                <div className={styles.dim} />
            ) : rect ? (
                <>
                    {/* Spotlight only — no click-blocker, so the highlighted element stays clickable */}
                    <div
                        className={styles.spotlight}
                        style={{
                            top: rect.top - 6,
                            left: rect.left - 6,
                            width: rect.width + 12,
                            height: rect.height + 12,
                        }}
                    />
                    <div
                        className={styles.ring}
                        style={{
                            top: rect.top - 6,
                            left: rect.left - 6,
                            width: rect.width + 12,
                            height: rect.height + 12,
                        }}
                    />
                </>
            ) : null}

            <AnimatePresence mode="wait">
                <motion.div
                    key={current.id}
                    className={`${styles.cluster} ${centered ? styles.clusterCentered : ''}`}
                    style={centered ? undefined : { left: clusterLeft, top: clusterTop }}
                    initial={
                        centered
                            ? { opacity: 0, scale: 0.7, x: '40vw', y: '40vh' }
                            : { opacity: 0, scale: 0.9 }
                    }
                    animate={
                        centered
                            ? { opacity: 1, scale: 1, x: '-50%', y: '-50%' }
                            : { opacity: 1, scale: 1 }
                    }
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                >
                    {cardInner}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
