'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import styles from './SnapseWidget.module.css';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

function tickerFromWindow(): string {
    if (typeof window === 'undefined') return '';
    try {
        return (new URLSearchParams(window.location.search).get('ticker') || '').toUpperCase();
    } catch {
        return '';
    }
}

const TYPEWRITER_SPEED_MS = 12;

export default function SnapseWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content:
                "Hi! I'm **Vesta**, your investing coach. Ask about markets, concepts, your **paper portfolio**, or a stock you're learning about — I'll keep it educational and clear. What would you like to explore?",
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [streamingText, setStreamingText] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const streamingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    /** Always matches latest `messages` so the next send never posts an empty array (React batching). */
    const messagesRef = useRef<Message[]>(messages);
    const pathname = usePathname();

    const isTrading = pathname.startsWith('/trade');
    const mode = isTrading ? 'TRADING' : 'TUTOR';

    useLayoutEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading, streamingText]);

    const typewriterReveal = (fullText: string, onDone: () => void) => {
        if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);
        setIsStreaming(true);
        setStreamingText('');
        let i = 0;
        streamingIntervalRef.current = setInterval(() => {
            i++;
            setStreamingText(fullText.slice(0, i));
            if (i >= fullText.length) {
                clearInterval(streamingIntervalRef.current!);
                streamingIntervalRef.current = null;
                setIsStreaming(false);
                setStreamingText('');
                onDone();
            }
        }, TYPEWRITER_SPEED_MS);
    };

    useEffect(() => {
        return () => {
            if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);
        };
    }, []);

    const sendMessageWithText = async (raw: string) => {
        const trimmed = raw.trim();
        if (!trimmed || loading) return;

        const prev = messagesRef.current;
        const next = [...prev, { role: 'user' as const, content: trimmed }];
        messagesRef.current = next;
        setMessages(next);
        setInput('');
        setLoading(true);

        const toSend = next.slice(-10);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({
                    messages: toSend,
                    context: {
                        route: pathname,
                        mode,
                        stockSymbol: tickerFromWindow(),
                    },
                }),
            });

            let data: { reply?: string; error?: string } = {};
            try {
                data = await res.json();
            } catch {
                data = {};
            }

            if (res.status === 401) {
                setMessages(prev => {
                    const updated = [
                        ...prev,
                        {
                            role: 'assistant' as const,
                            content:
                                'Please **sign in** to use Vesta. If you were logged in, your session may have expired — try refreshing the page.',
                        },
                    ];
                    messagesRef.current = updated;
                    return updated;
                });
            } else if (typeof data.reply === 'string' && data.reply.trim()) {
                const replyText = data.reply.trim();
                setLoading(false);
                typewriterReveal(replyText, () => {
                    setMessages(prev => {
                        const updated: Message[] = [...prev, { role: 'assistant', content: replyText }];
                        messagesRef.current = updated;
                        return updated;
                    });
                });
                return;
            } else {
                const detail =
                    typeof data.error === 'string' && data.error.trim()
                        ? data.error.trim()
                        : 'Something went wrong. Please try again.';
                setMessages(prev => {
                    const updated: Message[] = [...prev, { role: 'assistant', content: detail }];
                    messagesRef.current = updated;
                    return updated;
                });
            }
        } catch {
            setMessages(prev => {
                const updated = [
                    ...prev,
                    { role: 'assistant' as const, content: 'Something went wrong. Please try again.' },
                ];
                messagesRef.current = updated;
                return updated;
            });
        } finally {
            setLoading(false);
        }
    };

    const formatContent = (text: string) => {
        const escaped = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        return escaped
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br/>');
    };

    const quickPrompts = ['What is a stock?', 'Explain ETFs', 'Is NVDA a good investment?'];

    return (
        <div className={styles.widget}>
            <button
                className={`${styles.toggleBtn} ${open ? styles.active : ''}`}
                onClick={() => setOpen(!open)}
                title="Open Vesta"
                type="button"
            >
                {open ? '✕' : (
                    <Image
                        src="/vesta-logo.png"
                        alt="Vesta"
                        width={28}
                        height={28}
                        style={{ display: 'block', borderRadius: 4 }}
                    />
                )}
            </button>

            <div className={`${styles.panel} ${open ? styles.panelActive : ''}`}>
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Image
                            src="/vesta-logo.png"
                            alt="Vesta"
                            width={36}
                            height={36}
                            style={{ borderRadius: '8px', display: 'block' }}
                        />
                        <div>
                            <h3
                                style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    color: 'white',
                                }}
                            >
                                Vesta
                            </h3>
                            <p style={{ margin: 0, fontSize: '11px', color: '#4f6ef7' }}>
                                {isTrading ? 'Investing coach' : 'Learning tutor'}
                            </p>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={() => setOpen(false)} type="button">
                        ✕
                    </button>
                </div>

                <div className={styles.messages}>
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : styles.messageAssistant}`}
                        >
                            <div
                                className={styles.bubble}
                                dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                            />
                        </div>
                    ))}
                    {isStreaming && (
                        <div className={`${styles.message} ${styles.messageAssistant}`}>
                            <div className={styles.bubble}>
                                <span
                                    dangerouslySetInnerHTML={{ __html: formatContent(streamingText) }}
                                />
                                <span className={styles.typingCursor} />
                            </div>
                        </div>
                    )}
                    {loading && (
                        <div className={`${styles.message} ${styles.messageAssistant}`}>
                            <div className={styles.bubble}>
                                <div className={styles.thinkingRow}>
                                    <span className={styles.thinkingText}>Thinking…</span>
                                    <div className={styles.typingDots}>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {messages.length <= 1 && (
                    <div
                        style={{
                            padding: '8px 12px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '6px',
                            borderTop: '1px solid var(--vt-border2)',
                        }}
                    >
                        {quickPrompts.map(p => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => void sendMessageWithText(p)}
                                disabled={loading}
                                style={{
                                    padding: '5px 10px',
                                    background: 'rgba(79,110,247,0.1)',
                                    border: '1px solid rgba(79,110,247,0.2)',
                                    borderRadius: '100px',
                                    color: '#7d9bff',
                                    fontSize: '11px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontFamily: 'Inter, sans-serif',
                                    opacity: loading ? 0.6 : 1,
                                }}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                )}

                <div className={styles.inputArea}>
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                void sendMessageWithText(input);
                            }
                        }}
                        placeholder="Ask about investing… (Shift+Enter for new line)"
                        className={styles.input}
                        rows={2}
                        disabled={loading || isStreaming}
                        aria-label="Message Vesta"
                    />
                    <button
                        className={styles.sendBtn}
                        type="button"
                        onClick={() => void sendMessageWithText(input)}
                        disabled={loading || isStreaming || !input.trim()}
                    >
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
}
