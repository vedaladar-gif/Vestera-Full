'use client';

import { useEffect, useState, useCallback } from 'react';
import styles from './admin.module.css';

interface Inquiry {
    id: string;
    type: 'partnership' | 'chapter';
    fullName: string;
    organization: string | null;
    email: string;
    message: string | null;
    createdAt: string;
}

interface Account {
    id: string;
    username: string;
    displayName: string | null;
    avatarColor: string;
    cash: number;
    holdingsValue: number;
    totalValue: number;
}

type InboxFilter = 'all' | 'partnership' | 'chapter';
type Mode = 'accounts' | 'inbox' | 'academy';

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function AdminPage() {
    const [checking, setChecking] = useState(true);
    const [authed, setAuthed] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);

    const [mode, setMode] = useState<Mode>('accounts');

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [accountsLoading, setAccountsLoading] = useState(false);
    const [accountsError, setAccountsError] = useState('');
    const [accountSearch, setAccountSearch] = useState('');

    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [inboxLoading, setInboxLoading] = useState(false);
    const [inboxError, setInboxError] = useState('');
    const [filter, setFilter] = useState<InboxFilter>('all');

    const [academyOverview, setAcademyOverview] = useState<Record<string, unknown> | null>(null);
    const [academyLoading, setAcademyLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [userAcademy, setUserAcademy] = useState<{ user: { username: string; displayName: string | null }; academy: Record<string, unknown> } | null>(null);

    const loadAccounts = useCallback(async () => {
        setAccountsLoading(true);
        setAccountsError('');
        try {
            const res = await fetch('/api/admin/accounts');
            if (res.status === 401) { setAuthed(false); return; }
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to load');
            setAccounts(data.accounts || []);
        } catch (err) {
            setAccountsError(err instanceof Error ? err.message : 'Failed to load accounts.');
        } finally {
            setAccountsLoading(false);
        }
    }, []);

    const loadInquiries = useCallback(async () => {
        setInboxLoading(true);
        setInboxError('');
        try {
            const res = await fetch('/api/inquiries');
            if (res.status === 401) { setAuthed(false); return; }
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to load');
            setInquiries(data.inquiries || []);
        } catch (err) {
            setInboxError(err instanceof Error ? err.message : 'Failed to load inquiries.');
        } finally {
            setInboxLoading(false);
        }
    }, []);

    const loadAcademy = useCallback(async () => {
        setAcademyLoading(true);
        try {
            const res = await fetch('/api/admin/academy');
            if (res.status === 401) { setAuthed(false); return; }
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to load');
            setAcademyOverview(data);
        } catch {
            setAcademyOverview(null);
        } finally {
            setAcademyLoading(false);
        }
    }, []);

    const openUserAcademy = async (id: string) => {
        setSelectedUserId(id);
        const res = await fetch(`/api/admin/academy/users/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (res.ok) setUserAcademy(data);
    };

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/admin/login');
                const data = await res.json();
                setAuthed(Boolean(data?.isAdmin));
            } finally {
                setChecking(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (!authed) return;
        loadAccounts();
        loadInquiries();
        loadAcademy();
    }, [authed, loadAccounts, loadInquiries, loadAcademy]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoggingIn(true);
        setLoginError('');
        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setLoginError(data?.error || 'Incorrect code.');
                return;
            }
            setAuthed(true);
            setPassword('');
        } catch {
            setLoginError('Something went wrong. Try again.');
        } finally {
            setLoggingIn(false);
        }
    };

    const handleExit = async () => {
        await fetch('/api/admin/login', { method: 'DELETE' });
        window.location.assign('/trade');
    };

    if (checking) {
        return <main className={styles.page} />;
    }

    if (!authed) {
        return (
            <main className={styles.page}>
                <div className={styles.loginWrap}>
                    <div className={styles.loginCard}>
                        <p className={styles.loginTitle}>Admin Access</p>
                        <form onSubmit={handleLogin}>
                            {loginError && <p className={styles.errorText}>{loginError}</p>}
                            <input
                                type="password"
                                className={styles.input}
                                placeholder="Enter code"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoFocus
                                required
                            />
                            <button type="submit" className={styles.submitBtn} disabled={loggingIn}>
                                {loggingIn ? 'Checking…' : 'Enter'}
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        );
    }

    const filteredInquiries = inquiries.filter(i => filter === 'all' || i.type === filter);
    const filteredAccounts = accounts.filter(a => {
        const q = accountSearch.trim().toLowerCase();
        if (!q) return true;
        return a.username.toLowerCase().includes(q) || (a.displayName || '').toLowerCase().includes(q);
    });

    const totalUsers = accounts.length;
    const totalAum = accounts.reduce((sum, a) => sum + a.totalValue, 0);
    const avgValue = totalUsers ? totalAum / totalUsers : 0;

    return (
        <main className={styles.page}>
            <div className={styles.inner}>
                <div className={styles.topBar}>
                    <div>
                        <h1 className={styles.title}>Admin Mode</h1>
                        <p className={styles.subtitle} style={{ marginBottom: 8 }}>Accounts and inbound submissions across Vestera.</p>
                        <span className={styles.userCountBadge}>
                            {totalUsers.toLocaleString()} total {totalUsers === 1 ? 'user' : 'users'}
                        </span>
                    </div>
                    <button className={styles.exitBtn} onClick={handleExit}>
                        Switch back to normal mode →
                    </button>
                </div>

                <div className={styles.modeTabs}>
                    <button
                        className={`${styles.modeTab} ${mode === 'accounts' ? styles.modeTabActive : ''}`}
                        onClick={() => setMode('accounts')}
                    >
                        Accounts
                    </button>
                    <button
                        className={`${styles.modeTab} ${mode === 'inbox' ? styles.modeTabActive : ''}`}
                        onClick={() => setMode('inbox')}
                    >
                        Inbox
                        {inquiries.length > 0 && <span className={styles.pill}>{inquiries.length}</span>}
                    </button>
                    <button
                        className={`${styles.modeTab} ${mode === 'academy' ? styles.modeTabActive : ''}`}
                        onClick={() => setMode('academy')}
                    >
                        Academy
                    </button>
                </div>

                {mode === 'accounts' && (
                    <>
                        <div className={styles.statsRow}>
                            <div className={styles.statCard}>
                                <div className={styles.statLabel}>Total Accounts</div>
                                <div className={styles.statValue}>{totalUsers}</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statLabel}>Total AUM</div>
                                <div className={styles.statValue}>{money(totalAum)}</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statLabel}>Avg. Account Value</div>
                                <div className={styles.statValue}>{money(avgValue)}</div>
                            </div>
                        </div>

                        <div className={styles.toolbar}>
                            <input
                                className={styles.searchInput}
                                placeholder="Search username or name…"
                                value={accountSearch}
                                onChange={e => setAccountSearch(e.target.value)}
                            />
                        </div>

                        {accountsLoading && <p className={styles.empty}>Loading…</p>}
                        {accountsError && <p className={styles.empty}>{accountsError}</p>}

                        {!accountsLoading && !accountsError && (
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th className={styles.numCell}>Cash</th>
                                            <th className={styles.numCell}>Holdings</th>
                                            <th className={styles.numCell}>Total Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAccounts.map(a => (
                                            <tr key={a.id} className={styles.clickRow} onClick={() => { setMode('academy'); void openUserAcademy(a.id); }}>
                                                <td>
                                                    <div className={styles.tableUser}>@{a.username}</div>
                                                    {a.displayName && <div className={styles.tableSub}>{a.displayName}</div>}
                                                </td>
                                                <td className={styles.numCell}>{money(a.cash)}</td>
                                                <td className={styles.numCell}>{money(a.holdingsValue)}</td>
                                                <td className={styles.numCell}>{money(a.totalValue)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredAccounts.length === 0 && <p className={styles.empty}>No accounts found.</p>}
                            </div>
                        )}
                    </>
                )}

                {mode === 'inbox' && (
                    <>
                        <div className={styles.toolbar}>
                            <div className={styles.filters}>
                                {(['all', 'partnership', 'chapter'] as InboxFilter[]).map(f => (
                                    <button
                                        key={f}
                                        className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
                                        onClick={() => setFilter(f)}
                                    >
                                        {f === 'all' ? 'All' : f === 'partnership' ? 'Partnerships' : 'Chapters'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {inboxLoading && <p className={styles.empty}>Loading…</p>}
                        {inboxError && <p className={styles.empty}>{inboxError}</p>}
                        {!inboxLoading && !inboxError && filteredInquiries.length === 0 && (
                            <p className={styles.empty}>No submissions yet.</p>
                        )}

                        <div className={styles.list}>
                            {filteredInquiries.map(inq => (
                                <article key={inq.id} className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <div>
                                            <div className={styles.cardName}>{inq.fullName}</div>
                                            {inq.organization && <div className={styles.cardOrg}>{inq.organization}</div>}
                                        </div>
                                        <span className={`${styles.badge} ${inq.type === 'partnership' ? styles.badgePartnership : styles.badgeChapter}`}>
                                            {inq.type === 'partnership' ? 'Partnership' : 'Chapter'}
                                        </span>
                                    </div>
                                    <div className={styles.cardMeta}>
                                        <a href={`mailto:${inq.email}`}>{inq.email}</a>
                                    </div>
                                    {inq.message && <p className={styles.cardMessage}>{inq.message}</p>}
                                    <div className={styles.cardDate}>
                                        {new Date(inq.createdAt).toLocaleString()}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </>
                )}

                {mode === 'academy' && (
                    <>
                        <p className={styles.subtitle}>All numbers come from real Academy activity. Unranked means the diagnostic has not been completed.</p>
                        {academyLoading && <p className={styles.empty}>Loading…</p>}
                        {academyOverview && (
                            <div className={styles.statsRow}>
                                <div className={styles.statCard}><div className={styles.statLabel}>Academy users</div><div className={styles.statValue}>{String(academyOverview.totalUsers ?? 0)}</div></div>
                                <div className={styles.statCard}><div className={styles.statLabel}>Ranked</div><div className={styles.statValue}>{String(academyOverview.rankedUsers ?? 0)}</div></div>
                                <div className={styles.statCard}><div className={styles.statLabel}>Unranked</div><div className={styles.statValue}>{String(academyOverview.unrankedUsers ?? 0)}</div></div>
                                <div className={styles.statCard}><div className={styles.statLabel}>Avg diagnostic</div><div className={styles.statValue}>{academyOverview.averageDiagnosticScore == null ? '—' : Number(academyOverview.averageDiagnosticScore).toFixed(1)}</div></div>
                                <div className={styles.statCard}><div className={styles.statLabel}>Avg quiz</div><div className={styles.statValue}>{academyOverview.averageQuizScore == null ? '—' : Number(academyOverview.averageQuizScore).toFixed(1)}</div></div>
                                <div className={styles.statCard}><div className={styles.statLabel}>Lessons completed</div><div className={styles.statValue}>{String(academyOverview.lessonsCompleted ?? 0)}</div></div>
                                <div className={styles.statCard}><div className={styles.statLabel}>Academy hours</div><div className={styles.statValue}>{Number(academyOverview.totalAcademyHours || 0).toFixed(1)}</div></div>
                                <div className={styles.statCard}><div className={styles.statLabel}>Rank-up pass rate</div><div className={styles.statValue}>{academyOverview.rankUpSuccessRate == null ? '—' : `${Math.round(Number(academyOverview.rankUpSuccessRate) * 100)}%`}</div></div>
                            </div>
                        )}
                        <p className={styles.subtitle}>Click a username in Accounts to open their Academy profile. Rank is UNRANKED until they finish the diagnostic.</p>
                        {userAcademy && (
                            <article className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <div className={styles.cardName}>@{userAcademy.user.username}</div>
                                        {userAcademy.user.displayName && <div className={styles.cardOrg}>{userAcademy.user.displayName}</div>}
                                    </div>
                                    <button type="button" className={styles.filterBtn} onClick={() => { setUserAcademy(null); setSelectedUserId(null); }}>Close</button>
                                </div>
                                <p className={styles.cardMessage}>
                                    Academy progress{'\n'}
                                    Rank: {String(userAcademy.academy.rank)}{'\n'}
                                    XP: {String(userAcademy.academy.xp)}{'\n'}
                                    Lessons: {String(userAcademy.academy.lessonsCompleted)} / 100{'\n'}
                                    Completion: {String(userAcademy.academy.completionPct)}%{'\n'}
                                    Quiz average: {userAcademy.academy.quizAverage == null ? '—' : `${Number(userAcademy.academy.quizAverage).toFixed(1)} / 10`}{'\n'}
                                    Diagnostic: {userAcademy.academy.diagnosticCompleted ? `${userAcademy.academy.diagnosticScore} / ${userAcademy.academy.diagnosticTotal}` : 'Not completed'}{'\n'}
                                    Diagnostic date: {userAcademy.academy.diagnosticDate ? new Date(String(userAcademy.academy.diagnosticDate)).toLocaleDateString() : '—'}{'\n'}
                                    Time spent: {formatHours(Number(userAcademy.academy.timeSpentMs || 0))}{'\n'}
                                    Last active: {userAcademy.academy.lastActiveAt ? new Date(String(userAcademy.academy.lastActiveAt)).toLocaleString() : '—'}{'\n'}
                                    Current lesson: {userAcademy.academy.currentLesson ? `Lesson ${userAcademy.academy.currentLesson}` : '—'}{'\n'}
                                    Rank-up tests passed: {String(userAcademy.academy.rankUpTestsPassed)}{'\n'}
                                    Rank-up available: {userAcademy.academy.rankUpAvailable ? 'Yes' : 'Not yet taken / not eligible'}
                                </p>
                            </article>
                        )}
                        {!userAcademy && selectedUserId && <p className={styles.empty}>Loading profile…</p>}
                    </>
                )}
            </div>
        </main>
    );
}

function formatHours(ms: number) {
    const totalMin = Math.round(ms / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h}h ${m}m`;
}
