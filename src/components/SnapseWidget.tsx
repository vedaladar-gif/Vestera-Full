'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import VestaBlob from './VestaBlob';
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

const TYPEWRITER_SPEED_MS = 11;

// Per-page contextual greetings
function getGreeting(pathname: string): string {
    if (pathname === '/' || pathname.startsWith('/register') || pathname.startsWith('/login')) {
        return "Hi, I'm Vesta! Want help picking your first stock? 👋";
    }
    if (pathname.startsWith('/trade')) {
        const ticker = tickerFromWindow();
        return ticker
            ? `Want me to explain what's moving ${ticker} today?`
            : "Want me to explain what's moving in the market today?";
    }
    if (pathname.startsWith('/learn')) return "Stuck on a lesson? Ask me to explain it a different way!";
    if (pathname.startsWith('/stats')) return "Losses happen to everyone — want tips to bounce back?";
    if (pathname.startsWith('/settings')) return "Pick any color — you can always change it later!";
    return "Hi, I'm Vesta! Want help picking your first stock? 👋";
}

// Per-page quick-reply chips
function getChips(pathname: string): { label: string; text: string }[] {
    if (pathname.startsWith('/trade')) {
        return [
            { label: 'Explain the chart', text: 'Explain the chart to me' },
            { label: 'Should I buy?', text: 'Should I buy this stock?' },
        ];
    }
    if (pathname.startsWith('/learn')) {
        return [
            { label: 'Quiz me', text: 'Quiz me on what I just learned' },
            { label: 'Give me an example', text: 'Give me a real-world example' },
        ];
    }
    if (pathname.startsWith('/stats')) {
        return [
            { label: 'Give me tips', text: 'Give me tips to improve my portfolio' },
            { label: 'What went wrong?', text: 'What went wrong with my trades?' },
        ];
    }
    if (pathname.startsWith('/settings')) {
        return [
            { label: 'Change avatar', text: 'How do I change my avatar?' },
            { label: 'Help', text: 'What can I do in settings?' },
        ];
    }
    return [
        { label: "What's a stock?", text: "What's a stock?" },
        { label: 'Show me a trade', text: 'Show me how to make a trade' },
    ];
}

export default function SnapseWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [streamingText, setStreamingText] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [showChips, setShowChips] = useState(true);
    const streamingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesRef = useRef<Message[]>(messages);
    const pathname = usePathname();

    const isTrading = pathname.startsWith('/trade');
    const mode = isTrading ? 'TRADING' : 'TUTOR';
    const greeting = getGreeting(pathname);
    const chips = getChips(pathname);

    useLayoutEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading, streamingText]);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 300);
    }, [open]);

    /* Listen for programmatic open from other page sections */
    useEffect(() => {
        const handler = (e: Event) => {
            const msg = (e as CustomEvent<{ message?: string }>).detail?.message;
            setOpen(true);
            setShowChips(false);
            if (msg) setTimeout(() => void sendMessageWithText(msg), 350);
        };
        window.addEventListener('openVestaChat', handler);
        return () => window.removeEventListener('openVestaChat', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

        setShowChips(false);
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
            try { data = await res.json(); } catch { data = {}; }

            if (res.status === 401) {
                setMessages(prev => {
                    const updated = [...prev, { role: 'assistant' as const, content: 'Please **sign in** to chat with Vesta. Your session may have expired — try refreshing.' }];
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
                const detail = typeof data.error === 'string' && data.error.trim() ? data.error.trim() : 'Something went wrong. Please try again.';
                setMessages(prev => {
                    const updated: Message[] = [...prev, { role: 'assistant', content: detail }];
                    messagesRef.current = updated;
                    return updated;
                });
            }
        } catch {
            setMessages(prev => {
                const updated = [...prev, { role: 'assistant' as const, content: 'Something went wrong. Please try again.' }];
                messagesRef.current = updated;
                return updated;
            });
        } finally {
            setLoading(false);
        }
    };

    const formatContent = (text: string) => {
        const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return escaped
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br/>');
    };

    const hasMessages = messages.length > 0;

    return (
        <div className={styles.widget}>

            {/* ── Toggle button — full Vesta mascot or close X ── */}
            <button
                className={`${styles.toggleBtn} ${open ? styles.toggleBtnOpen : ''}`}
                onClick={() => setOpen(!open)}
                title={open ? 'Close Vesta' : 'Chat with Vesta'}
                type="button"
                aria-label={open ? 'Close Vesta chat' : 'Open Vesta chat'}
            >
                {open ? (
                    <div className={styles.closeCircle}>
                        <span className={styles.closeX}>✕</span>
                    </div>
                ) : (
                    <VestaBlob size={66} showDot={true} animate={true} showLabel={true} />
                )}
            </button>

            {/* ── Chat panel ── */}
            <div className={`${styles.panel} ${open ? styles.panelActive : ''}`} role="dialog" aria-label="Vesta AI Chat">

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <VestaBlob size={28} showDot={false} mini={true} />
                        <div className={styles.headerInfo}>
                            <span className={styles.headerName}>Vesta</span>
                            <span className={styles.headerStatus}>
                                <span className={styles.onlineDot} />
                                Online
                            </span>
                        </div>
                    </div>
                </div>

                {/* Message history (only shown when there are messages) */}
                {hasMessages && (
                    <div className={styles.messages}>
                        {messages.map((msg, i) => (
                            <div key={i} className={`${styles.messageRow} ${msg.role === 'user' ? styles.userRow : styles.assistantRow}`}>
                                {msg.role === 'assistant' && (
                                    <div className={styles.avatarMini}>
                                        <VestaBlob size={20} showDot={false} mini={true} />
                                    </div>
                                )}
                                <div
                                    className={`${styles.bubble} ${msg.role === 'user' ? styles.userBubble : styles.assistantBubble}`}
                                    dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                                />
                            </div>
                        ))}

                        {isStreaming && (
                            <div className={`${styles.messageRow} ${styles.assistantRow}`}>
                                <div className={styles.avatarMini}><VestaBlob size={20} showDot={false} mini={true} /></div>
                                <div className={`${styles.bubble} ${styles.assistantBubble}`}>
                                    <span dangerouslySetInnerHTML={{ __html: formatContent(streamingText) }} />
                                    <span className={styles.cursor} />
                                </div>
                            </div>
                        )}

                        {loading && (
                            <div className={`${styles.messageRow} ${styles.assistantRow}`}>
                                <div className={styles.avatarMini}><VestaBlob size={20} showDot={false} mini={true} /></div>
                                <div className={`${styles.bubble} ${styles.assistantBubble} ${styles.thinkingBubble}`}>
                                    <span className={styles.dot} />
                                    <span className={styles.dot} />
                                    <span className={styles.dot} />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Greeting card + chips (shown before any user messages) */}
                {!hasMessages && (
                    <div className={styles.greetingArea}>
                        <div className={styles.greetingBubble}>{greeting}</div>

                        {showChips && (
                            <div className={styles.chips}>
                                {chips.map(chip => (
                                    <button
                                        key={chip.text}
                                        type="button"
                                        className={styles.chip}
                                        onClick={() => void sendMessageWithText(chip.text)}
                                        disabled={loading}
                                    >
                                        {chip.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Input row */}
                <div className={styles.inputArea}>
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                void sendMessageWithText(input);
                            }
                        }}
                        placeholder="Ask Vesta..."
                        className={styles.input}
                        disabled={loading || isStreaming}
                        aria-label="Message Vesta"
                    />
                    <button
                        className={`${styles.sendBtn} ${(!input.trim() || loading || isStreaming) ? styles.sendBtnDisabled : ''}`}
                        type="button"
                        onClick={() => void sendMessageWithText(input)}
                        disabled={loading || isStreaming || !input.trim()}
                        aria-label="Send message"
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M8 13V3M3 8l5-5 5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
