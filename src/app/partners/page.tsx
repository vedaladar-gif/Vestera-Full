'use client';

import { useState } from 'react';
import styles from './partners.module.css';

const PARTNERS = [
    {
        name: 'EdTech Index',
        initials: 'ET',
        description: 'Validates Vestera as a trusted, vetted tool for K-12 classrooms.',
        href: 'https://edtechindex.org/',
    },
];

interface FormState {
    fullName: string;
    organization: string;
    email: string;
    message: string;
}

const EMPTY_FORM: FormState = { fullName: '', organization: '', email: '', message: '' };

export default function PartnersPage() {
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
                    type: 'partnership',
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

    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <h1 className={styles.title}>Partner With Vestera</h1>
                <p className={styles.lead}>
                    Interested in bringing financial literacy to your students or community? Whether
                    you&apos;re a school, nonprofit, student organization, or business, we&apos;d love to
                    explore ways to work together.
                </p>

                <div className={styles.formCard}>
                    {submitted ? (
                        <div className={styles.successBox}>
                            <div className={styles.successIcon}>📬</div>
                            <p className={styles.successTitle}>Thanks for reaching out!</p>
                            <p className={styles.successText}>
                                We&apos;ve received your inquiry and will get back to you soon.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {error && <p className={styles.formNote} style={{ color: '#E0455B', marginTop: 0, marginBottom: 12 }}>{error}</p>}
                            <div className={styles.formRow}>
                                <div className={styles.field}>
                                    <label className={styles.label} htmlFor="fullName">Full Name</label>
                                    <input
                                        id="fullName"
                                        className={styles.input}
                                        placeholder="Jane Doe"
                                        value={form.fullName}
                                        onChange={update('fullName')}
                                        required
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label} htmlFor="organization">Organization / School</label>
                                    <input
                                        id="organization"
                                        className={styles.input}
                                        placeholder="Acme High School"
                                        value={form.organization}
                                        onChange={update('organization')}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label} htmlFor="email">Email Address</label>
                                <input
                                    id="email"
                                    type="email"
                                    className={styles.input}
                                    placeholder="jane@example.com"
                                    value={form.email}
                                    onChange={update('email')}
                                    required
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label} htmlFor="message">Message</label>
                                <textarea
                                    id="message"
                                    className={styles.textarea}
                                    placeholder="Tell us about your organization and how you'd like to partner…"
                                    value={form.message}
                                    onChange={update('message')}
                                    required
                                />
                            </div>

                            <button type="submit" className={styles.submitBtn} disabled={sending}>
                                {sending ? 'Sending…' : 'Send Inquiry'}
                            </button>
                            <p className={styles.formNote}>
                                We typically respond within 2-3 business days.
                            </p>
                        </form>
                    )}
                </div>
            </section>

            <section className={styles.partnersSection}>
                <div className={styles.partnersInner}>
                    <h2 className={styles.sectionTitle}>Our Partners</h2>
                    <p className={styles.sectionSub}>
                        Organizations working with Vestera to expand access to financial education.
                    </p>

                    <div className={styles.partnerGrid}>
                        {PARTNERS.map(partner => (
                            <a
                                key={partner.name}
                                href={partner.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.partnerCard}
                            >
                                <div className={styles.partnerLogo}>{partner.initials}</div>
                                <div className={styles.partnerName}>{partner.name}</div>
                                <p className={styles.partnerDesc}>{partner.description}</p>
                            </a>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
