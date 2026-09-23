import type { Metadata } from 'next';
import styles from './chapters.module.css';
import ChapterApplyForm from './ChapterApplyForm';

export const metadata: Metadata = {
    title: 'Start a Chapter · Vestera',
    description: 'Bring Vestera to your school by starting a student-led chapter.',
};

const CHAPTERS = [
    {
        name: 'Green Level High School',
        location: 'Cary, NC',
        presidentLabel: 'Co-Founders',
        president: 'Sourish, Kiaan, and Vedant',
        founded: '2026',
        initials: 'GL',
        gradient: 'linear-gradient(135deg, #3CA787 0%, #1F6E56 100%)',
        isMain: true,
    },
    {
        name: 'John Fraser Secondary School',
        location: 'Mississauga, ON',
        presidentLabel: 'President',
        president: 'Anton Park',
        founded: '2026',
        initials: 'JF',
        gradient: 'linear-gradient(135deg, #12A669 0%, #2955C9 100%)',
    },
    {
        name: 'Independence High School',
        location: 'Frisco, TX',
        presidentLabel: 'President',
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
                            <div
                                key={c.name}
                                className={`${styles.chapterCard} ${c.isMain ? styles.chapterCardMain : ''}`}
                            >
                                {c.isMain && <div className={styles.mainBadge}>⭐ Main Chapter</div>}
                                <div className={styles.chapterAvatar} style={{ background: c.gradient }}>
                                    {c.initials}
                                </div>
                                <div>
                                    <div className={styles.chapterName}>{c.name}</div>
                                    <div className={styles.chapterLocation}>{c.location}</div>
                                    <div className={styles.chapterPresident}>{c.presidentLabel}: {c.president}</div>
                                    <div className={styles.chapterFounded}>Founded {c.founded}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.statsBar}>
                        <div className={styles.statItem}>
                            <span className={styles.statIcon} aria-hidden>📍</span>
                            <span className={styles.statValue}>{CHAPTERS.length}</span> Schools
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statIcon} aria-hidden>👥</span>
                            <span className={styles.statValue}>5</span> Student Leaders
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statIcon} aria-hidden>🏙️</span>
                            <span className={styles.statValue}>{CHAPTERS.length}</span> Cities
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
