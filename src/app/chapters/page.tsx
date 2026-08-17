import type { Metadata } from 'next';
import styles from './chapters.module.css';
import ChapterApplyForm from './ChapterApplyForm';

export const metadata: Metadata = {
    title: 'Start a Chapter · Vestera',
    description: 'Bring Vestera to your school by starting a student-led chapter.',
};

const CHAPTERS = [
    {
        name: 'John Fraser Secondary School',
        location: 'Mississauga, ON',
        president: 'Anton Park',
        founded: '2026',
        initials: 'JF',
        gradient: 'linear-gradient(135deg, #4C8DFF 0%, #2955C9 100%)',
    },
    {
        name: 'Independence High School',
        location: 'Frisco, TX',
        president: 'Priyansh M',
        founded: '2026',
        initials: 'IH',
        gradient: 'linear-gradient(135deg, #5B4B8A 0%, #241B3B 100%)',
    },
];

export default function ChaptersPage() {
    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <h1 className={styles.title}>Start a Chapter</h1>
                <p className={styles.lead}>
                    Bring Vestera to your school by starting a chapter. Lead workshops,
                    introduce students to investing, and build a community focused on
                    financial literacy.
                </p>
                <ChapterApplyForm />
            </section>

            <section className={styles.chaptersSection}>
                <div className={styles.chaptersInner}>
                    <h2 className={styles.sectionTitle}>Current Chapters</h2>
                    <p className={styles.sectionSub}>
                        Join a growing network of student leaders bringing financial literacy to their schools.
                    </p>

                    <div className={styles.chapterGrid}>
                        {CHAPTERS.map(c => (
                            <div key={c.name} className={styles.chapterCard}>
                                <div className={styles.chapterAvatar} style={{ background: c.gradient }}>
                                    {c.initials}
                                </div>
                                <div>
                                    <div className={styles.chapterName}>{c.name}</div>
                                    <div className={styles.chapterLocation}>{c.location}</div>
                                    <div className={styles.chapterPresident}>President: {c.president}</div>
                                    <div className={styles.chapterFounded}>Founded {c.founded}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.statsBar}>
                        <div className={styles.statItem}>
                            <span className={styles.statIcon} aria-hidden>📍</span>
                            <span className={styles.statValue}>2</span> Schools
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statIcon} aria-hidden>👥</span>
                            <span className={styles.statValue}>2</span> Student Leaders
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statIcon} aria-hidden>🏙️</span>
                            <span className={styles.statValue}>2</span> Cities
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
