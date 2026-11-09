import Link from 'next/link';
import styles from './games.module.css';

export default function GamesPage() {
    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <div>
                    <span className={styles.eyebrow}>Vestera games</span>
                    <h1>Good decisions<br /><em>make great games.</em></h1>
                    <p>Step into real money situations, test a strategy, and see what your choices change.</p>
                </div>
                <div className={styles.headerNote}><span>LEARN BY DOING</span><strong>Play. Decide. Grow.</strong><small>Every game gives you a new way to practice.</small></div>
            </header>

            <section className={styles.feature} aria-labelledby="bank-rush-heading">
                <div className={styles.featureCopy}>
                    <span className={styles.featureKicker}>01 / FEATURED GAME · 6–8 MIN</span>
                    <h2 id="bank-rush-heading">Bank Rush</h2>
                    <p>Run the service desk through three levels. Help customers choose accounts, handle deposits, and catch suspicious requests as the line gets busy.</p>
                    <div className={styles.featureFacts}><span><b>03</b> levels</span><span><b>09</b> decisions</span><span><b>01</b> final boss</span></div>
                    <Link href="/games/bank-rush" className={styles.featureButton}>Play Bank Rush <span aria-hidden="true">→</span></Link>
                </div>
                <div className={styles.bankScene} aria-label="Preview of a Bank Rush decision">
                    <div className={styles.sceneTop}><span>V / BANK RUSH</span><span>ROUND 3 OF 9</span></div>
                    <div className={styles.workspace}>
                        <div className={styles.workspaceTop}><span>Customer 03 <b>Emma</b></span><span>● Service desk open</span></div>
                        <div className={styles.request}><small>CUSTOMER REQUEST</small><h3>“I need $14 for tomorrow. Which account should I use?”</h3><p>Think about when she needs the money.</p></div>
                        <div className={styles.accounts}><div><span>EVERYDAY ACCOUNT</span><strong>$39</strong><small>Available to spend</small></div><div><span>SAVINGS ACCOUNT</span><strong>$85</strong><small>Set aside for later</small></div></div>
                    </div>
                    <div className={styles.sceneChoices}><span>01 &nbsp; Everyday account</span><span>02 &nbsp; Savings account</span></div>
                </div>
            </section>

            <section className={styles.library} aria-labelledby="choose-game-heading">
                <div className={styles.sectionLine}><h2 id="choose-game-heading">Choose your game</h2><span>Bank Rush is open to everyone · Sign in for the other games</span></div>
                <div className={styles.tiles}>
                    <article className={styles.tile}>
                        <div className={styles.tileTop}><span>02 / INVESTING</span><span>8 market rounds</span></div>
                        <div className={`${styles.tileArt} ${styles.marketBoard}`} aria-hidden="true">
                            <div className={styles.artTop}><span>PORTFOLIO SIMULATOR</span><b>ROUND 5 / 8</b></div>
                            <strong>$42,860 <small>+8.4%</small></strong>
                            <div className={styles.bars}>{[28,42,35,56,49,68,61,77,92].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div>
                            <p>MARKET NEWS &nbsp; · &nbsp; Rates rise. What changes?</p>
                        </div>
                        <h3>Wall Street Challenge</h3><p>Navigate market news, paydays, and risk across eight rounds.</p>
                        <Link href="/games/wall-street-challenge">Play game <span aria-hidden="true">→</span></Link>
                    </article>
                    <article className={styles.tile}>
                        <div className={styles.tileTop}><span>03 / SAVING</span><span>10 weeks</span></div>
                        <div className={`${styles.tileArt} ${styles.savingsBoard}`} aria-hidden="true">
                            <div className={styles.artTop}><span>WEEK 07 / 10</span><b>GOBBLES AHEAD</b></div>
                            <strong>18 coins <small>saved so far</small></strong>
                            <div className={styles.savingsTrack}><i /></div>
                            <div className={styles.savingsChoice}><span>A surprise changes your plan</span><b>Save or spend?</b></div>
                        </div>
                        <h3>Piggy Bank Boss</h3><p>Build a saving plan and adapt when surprises hit.</p>
                        <Link href="/games/piggy-bank-boss">Play game <span aria-hidden="true">→</span></Link>
                    </article>
                    <article className={styles.tile}>
                        <div className={styles.tileTop}><span>04 / MONEY SAFETY</span><span>Concept</span></div>
                        <div className={`${styles.tileArt} ${styles.signalBoard}`} aria-hidden="true">
                            <div className={styles.artTop}><span>INCOMING MESSAGE</span><b>?</b></div>
                            <p>“Your account is locked. Verify now.”</p>
                            <small>Sender: security@vestera-help.net</small>
                            <strong>What’s the red flag?</strong>
                        </div>
                        <h3>Scam Spotter</h3><p>Read the clues and verify before you trust a message.</p>
                        <span className={styles.coming}>Coming next</span>
                    </article>
                </div>
            </section>
        </main>
    );
}
