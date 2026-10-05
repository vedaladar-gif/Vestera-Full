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
        leaderCount: 3,
        founded: '2026',
        initials: 'GL',
        isFounding: true,
    },
    {
        name: 'John Fraser Secondary School',
        location: 'Mississauga, ON',
        presidentLabel: 'President',
        president: 'Anton Park',
        leaderCount: 1,
        founded: '2026',
        initials: 'JF',
    },
    {
        name: 'Independence High School',
        location: 'Frisco, TX',
        presidentLabel: 'President',
        president: 'Priyansh M',
        leaderCount: 1,
        founded: '2026',
        initials: 'IH',
    },
];

const SCHOOL_COUNT = CHAPTERS.length;
const LEADER_COUNT = CHAPTERS.reduce((sum, c) => sum + c.leaderCount, 0);
const CITY_COUNT = new Set(CHAPTERS.map(c => c.location)).size;

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

            <section className={styles.listSection}>
                <div className={styles.listInner}>
                    <div className={styles.listHeader}>
                        <h2 className={styles.listTitle}>Current Chapters</h2>
                        <p className={styles.listMeta}>
                            {SCHOOL_COUNT} schools · {LEADER_COUNT} student leaders · {CITY_COUNT} cities
                        </p>
                    </div>
                    <p className={styles.listSub}>
                        Join a growing network of student leaders bringing financial literacy to their schools.
                    </p>

                    <ul className={styles.chapterList}>
                        {CHAPTERS.map(c => (
                            <li key={c.name} className={styles.chapterRow}>
                                <div className={styles.rowAvatar} aria-hidden="true">
                                    {c.initials}
                                </div>

                                <div className={styles.rowBody}>
                                    <div className={styles.rowNameLine}>
                                        <span className={styles.rowName}>{c.name}</span>
                                        {c.isFounding && (
                                            <span className={styles.foundingBadge}>Founding chapter</span>
                                        )}
                                    </div>
                                    <div className={styles.rowLeaders}>
                                        {c.presidentLabel}: {c.president}
                                    </div>
                                </div>

                                <div className={styles.rowSide}>
                                    <div className={styles.rowLocation}>{c.location}</div>
                                    <div className={styles.rowFounded}>Founded {c.founded}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </main>
    );
}
