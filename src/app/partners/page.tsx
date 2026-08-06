import type { Metadata } from 'next';
import styles from './partners.module.css';

export const metadata: Metadata = {
    title: 'Partners & Chapters · Vestera',
    description: 'Organizations and school chapters working with Vestera to expand financial literacy.',
};

const PARTNERS = [
    {
        name: 'Futures Financials',
        description:
            'Futures Financials is a youth-led 501(c)(3) nonprofit dedicated to making financial literacy accessible, engaging, and practical for students everywhere. They partner with schools, universities, and community organizations to bring in-classroom workshops, guest lessons, and chapter programs — from budgeting basics to investing and entrepreneurship — free of charge.',
        href: 'https://futuresfinancials.org/our-partners',
        linkLabel: 'Visit Futures Financials partners →',
    },
    {
        name: 'EdTech Index',
        description:
            'The EdTech Index is an ISTE initiative that helps K-12 educators quickly find and vet educational technology tools backed by trusted third-party certifications. Vestera is proud to be part of this ecosystem — connecting teachers and schools with proven resources that actually work in the classroom.',
        href: 'https://edtechindex.org/',
        linkLabel: 'Explore the EdTech Index →',
    },
];

export default function PartnersPage() {
    return (
        <main className={styles.page}>
            <header className={styles.hero}>
                <h1 className={styles.title}>Partners &amp; Chapters</h1>
                <p className={styles.lead}>
                    Vestera works with organizations and school communities that share our mission —
                    helping students learn investing through practice, not pressure.
                </p>
            </header>

            <section className={styles.section} aria-labelledby="partners-heading">
                <h2 id="partners-heading" className={styles.sectionTitle}>Partners</h2>
                <p className={styles.sectionSub}>
                    Trusted organizations we collaborate with to expand access to financial education.
                </p>

                <div className={styles.partnerGrid}>
                    {PARTNERS.map(partner => (
                        <article key={partner.name} className={styles.partnerCard}>
                            <h3 className={styles.partnerName}>{partner.name}</h3>
                            <p className={styles.partnerDesc}>{partner.description}</p>
                            <a
                                href={partner.href}
                                className={styles.partnerLink}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {partner.linkLabel}
                            </a>
                        </article>
                    ))}
                </div>
            </section>

            <hr className={styles.rule} />

            <section className={styles.section} aria-labelledby="chapters-heading">
                <h2 id="chapters-heading" className={styles.sectionTitle}>Chapters</h2>
                <p className={styles.sectionSub}>
                    Student-led Vestera chapters at schools and in communities — coming soon.
                </p>

                <div className={styles.chaptersPlaceholder}>
                    <div className={styles.chaptersIcon} aria-hidden>🏫</div>
                    <p className={styles.chaptersTitle}>Chapters coming soon</p>
                    <p className={styles.chaptersText}>
                        We&apos;re building out a directory of Vestera chapters. Check back here for
                        school and community groups near you.
                    </p>
                </div>
            </section>
        </main>
    );
}
