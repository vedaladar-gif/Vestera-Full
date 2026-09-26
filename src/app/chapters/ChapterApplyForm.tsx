'use client';

import { useState } from 'react';
import styles from './chapters.module.css';

interface FormState {
    fullName: string;
    organization: string;
    email: string;
    message: string;
}

const EMPTY_FORM: FormState = { fullName: '', organization: '', email: '', message: '' };

export default function ChapterApplyForm() {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [submitted, setSubmitted] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const update = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setError('');

        try {
            const res = await fetch('/api/inquiries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'chapter',
                    fullName: form.fullName,
                    organization: form.organization,
                    email: form.email,
                    message: form.message,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || 'Something went wrong. Please try again.');
            setSubmitted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        } finally {
            setSending(false);
        }
    };

    if (!open) {
        return (
            <button type="button" className={styles.ctaBtn} onClick={() => setOpen(true)}>
                Apply to Start a Chapter →
            </button>
        );
    }

    return (
        <div className={styles.formCard}>
            {submitted ? (
                <div className={styles.successBox}>
                    <p className={styles.successTitle}>Application received!</p>
                    <p className={styles.successText}>
                        Thanks for your interest in starting a Vestera chapter — we&apos;ll be in touch soon.
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    {error && <p className={styles.errorText}>{error}</p>}
                    <div className={styles.formRow}>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="chFullName">Full Name</label>
                            <input
                                id="chFullName"
                                className={styles.input}
                                placeholder="Jane Doe"
                                value={form.fullName}
                                onChange={update('fullName')}
                                required
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="chSchool">School</label>
                            <input
                                id="chSchool"
                                className={styles.input}
                                placeholder="Acme High School"
                                value={form.organization}
                                onChange={update('organization')}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="chEmail">Email Address</label>
                        <input
                            id="chEmail"
                            type="email"
                            className={styles.input}
                            placeholder="jane@example.com"
                            value={form.email}
                            onChange={update('email')}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="chMessage">Why do you want to start a chapter?</label>
                        <textarea
                            id="chMessage"
                            className={styles.textarea}
                            placeholder="Tell us about your school and what you're hoping to build…"
                            value={form.message}
                            onChange={update('message')}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={sending}>
                        {sending ? 'Submitting…' : 'Submit Application'}
                    </button>
                </form>
            )}
            {!submitted && (
                <button type="button" className={styles.closeBtn} onClick={() => setOpen(false)}>
                    Cancel
                </button>
            )}
        </div>
    );
}
