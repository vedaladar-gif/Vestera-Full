'use client';

import { useEffect, useRef, useState } from 'react';

interface TypingTextProps {
    text: string;
    /** Fixed ms between characters when `minIntervalMs` / `maxIntervalMs` are not both set. */
    msPerChar?: number;
    /** Inclusive range (ms) for a more natural per-character delay; overrides fixed `msPerChar` when both are set. */
    minIntervalMs?: number;
    maxIntervalMs?: number;
    /** Wait after the last character before calling `onComplete` (pause between sections). */
    pauseAfterMs?: number;
    onComplete?: () => void;
    className?: string;
    as?: 'p' | 'h2' | 'span';
    showCursor?: boolean;
    /** Start typing after mount; set false to wait for external trigger */
    active?: boolean;
}

function nextDelayMs(
    msPerChar: number,
    minIntervalMs: number | undefined,
    maxIntervalMs: number | undefined,
): number {
    if (
        minIntervalMs != null &&
        maxIntervalMs != null &&
        minIntervalMs <= maxIntervalMs
    ) {
        return minIntervalMs + Math.random() * (maxIntervalMs - minIntervalMs);
    }
    return msPerChar;
}

export default function TypingText({
    text,
    msPerChar = 22,
    minIntervalMs,
    maxIntervalMs,
    pauseAfterMs = 0,
    onComplete,
    className,
    as: Tag = 'p',
    showCursor = true,
    active = true,
}: TypingTextProps) {
    const [shown, setShown] = useState('');
    const [done, setDone] = useState(false);
    const onCompleteRef = useRef(onComplete);
    const completedRef = useRef(false);
    onCompleteRef.current = onComplete;

    useEffect(() => {
        if (!active) {
            if (completedRef.current) {
                setShown(text);
                setDone(true);
            } else {
                setShown('');
                setDone(false);
            }
            return;
        }
        completedRef.current = false;
        setShown('');
        setDone(false);
        if (!text) {
            setDone(true);
            completedRef.current = true;
            onCompleteRef.current?.();
            return;
        }

        let cancelled = false;
        const timeoutIds: number[] = [];

        const clearPending = () => {
            timeoutIds.forEach(id => window.clearTimeout(id));
            timeoutIds.length = 0;
        };

        const finish = () => {
            if (cancelled) return;
            setDone(true);
            completedRef.current = true;
            const pause = pauseAfterMs > 0 ? pauseAfterMs : 0;
            if (pause > 0) {
                const id = window.setTimeout(() => {
                    if (!cancelled) onCompleteRef.current?.();
                }, pause);
                timeoutIds.push(id);
            } else {
                onCompleteRef.current?.();
            }
        };

        const step = (index: number) => {
            if (cancelled) return;
            const next = index + 1;
            setShown(text.slice(0, next));
            if (next >= text.length) {
                finish();
                return;
            }
            const delay = nextDelayMs(msPerChar, minIntervalMs, maxIntervalMs);
            const id = window.setTimeout(() => step(next), delay);
            timeoutIds.push(id);
        };

        const firstDelay = nextDelayMs(msPerChar, minIntervalMs, maxIntervalMs);
        const startId = window.setTimeout(() => step(0), firstDelay);
        timeoutIds.push(startId);

        return () => {
            cancelled = true;
            clearPending();
        };
    }, [text, msPerChar, minIntervalMs, maxIntervalMs, pauseAfterMs, active]);

    return (
        <Tag className={className}>
            {shown}
            {showCursor && active && !done && (
                <span className="founders-type-cursor" aria-hidden>
                    |
                </span>
            )}
        </Tag>
    );
}
