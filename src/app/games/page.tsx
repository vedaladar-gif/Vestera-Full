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

                <article className={styles.card}>
                    <div className={styles.cardVisual}>
                        <div className={styles.versus} aria-hidden>
                            <div className={styles.versusRow}>
                                <span>You</span>
                                <i className={styles.barYou} />
                            </div>
                            <div className={styles.versusRow}>
                                <span>Gobbles</span>
                                <i className={styles.barBoss} />
                            </div>
                        </div>
                        <div className={styles.visualLabel}>10 weeks · About 5 minutes</div>
                    </div>
                    <div className={styles.cardBody}>
                        <span className={styles.available}>Available now</span>
                        <h2>Piggy Bank Boss</h2>
                        <p>Save or spend for 10 weeks. Coins become your health, stars become your power, then take on Gobbles the Coin Gobbler.</p>
                        <Link href="/games/piggy-bank-boss" className={styles.playButton}>Play Now</Link>
                    </div>
                </article>

                <article className={styles.card}>
                    <div className={styles.cardVisual}>
                        <div className={styles.bankMark} aria-hidden>
                            <span />
                            <span />
                            <i />
                        </div>
                        <div className={styles.visualLabel}>3 levels · About 6–8 minutes</div>
                    </div>
                    <div className={styles.cardBody}>
                        <span className={styles.available}>Available now</span>
                        <h2>Bank Rush!</h2>
                        <p>A classroom runs one bank on the big screen. Help customers deposit, sort checking and savings, and stop the Money Muncher.</p>
                        <Link href="/games/bank-rush" className={styles.playButton}>Play Now</Link>
                    </div>
                </article>
            </section>
        </main>
    );
}