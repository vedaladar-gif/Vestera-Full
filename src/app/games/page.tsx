import Link from 'next/link';
import styles from './games.module.css';

export default function GamesPage() {
    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <p className={styles.eyebrow}>Vestera Games</p>
                <h1>Learn by playing.</h1>
                <p>Put investing concepts into practice through short, strategic games.</p>
            </header>

            <section className={styles.library} aria-label="Game library">
                <article className={`${styles.card} ${styles.featured}`}>
                    <div className={styles.cardVisual}>
                        <div className={styles.marketLine}>
                            <span />
                            <span />
                            <span />
                            <span />
                            <span />
                        </div>
                        <div className={styles.visualLabel}>20 years · About 20 minutes</div>
                    </div>
                    <div className={styles.cardBody}>
                        <span className={styles.available}>Available now</span>
                        <h2>Wall Street Challenge</h2>
                        <p>Eight rounds, twenty simulated years. Get paid every six months, react to market news, and compare your portfolio with friends and a steady investor.</p>
                        <Link href="/games/wall-street-challenge" className={styles.playButton}>Play Now</Link>
                    </div>
                </article>

                {[2, 3].map(number => (
                    <article className={`${styles.card} ${styles.comingSoon}`} key={number}>
                        <div className={styles.placeholder}>
                            <span>Game {number}</span>
                        </div>
                        <div className={styles.cardBody}>
                            <span className={styles.unavailable}>In development</span>
                            <h2>Coming Soon</h2>
                            <p>More investing games are on the way.</p>
                            <span className={styles.soonButton}>Coming Soon</span>
                        </div>
                    </article>
                ))}
            </section>
        </main>
    );
}
