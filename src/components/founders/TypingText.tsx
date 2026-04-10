'use client';

import { useEffect, useRef, useState } from 'react';

interface TypingTextProps {
    text: string;
    /** Milliseconds per character (lower = faster). */
    msPerChar?: number;
    onComplete?: () => void;
    className?: string;
    as?: 'p' | 'h2' | 'span';
    showCursor?: boolean;
    /** Start typing after mount; set false to wait for external trigger */
    active?: boolean;
}

export default function TypingText({
    text,
    msPerChar = 22,
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
        let i = 0;
        const id = window.setInterval(() => {
            i += 1;
            setShown(text.slice(0, i));
            if (i >= text.length) {
                window.clearInterval(id);
                setDone(true);
                completedRef.current = true;
                onCompleteRef.current?.();
            }
        }, msPerChar);
        return () => window.clearInterval(id);
    }, [text, msPerChar, active]);

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
