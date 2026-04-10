import type { Metadata } from 'next';
import styles from './privacy.module.css';

export const metadata: Metadata = {
    title: 'Privacy Policy · Vestera',
    description: 'How Vestera collects, uses, and protects your information.',
};

export default function PrivacyPage() {
    return (
        <main className={styles.page}>
            <article className={styles.card}>
                <h1 className={styles.title}>Privacy Policy — Vestera</h1>
                <p className={styles.lastUpdated}>Last Updated: April 9, 2026</p>

                <section className={styles.section} aria-labelledby="s1">
                    <h2 id="s1" className={styles.h2}>
                        1. Introduction
                    </h2>
                    <p className={styles.p}>
                        Welcome to Vestera (“Vestera,” “we,” “our,” or “us”). Vestera is a financial education platform
                        designed to help teenagers learn about investing through paper trading and simulated market
                        experiences before participating in real-world trading.
                    </p>
                    <p className={styles.p}>
                        Your privacy is important to us. This Privacy Policy explains how we collect, use, store, and
                        protect your information when you use our website, services, and applications (collectively,
                        the “Platform”).
                    </p>
                    <p className={styles.p}>By using Vestera, you agree to the practices described in this Privacy Policy.</p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="s2">
                    <h2 id="s2" className={styles.h2}>
                        2. Eligibility and Users Under 18
                    </h2>
                    <p className={styles.p}>
                        Vestera is designed primarily for educational use by teenagers. Because some users may be under
                        the age of 18:
                    </p>
                    <ul className={styles.list}>
                        <li>We collect only limited personal information necessary to operate the Platform.</li>
                        <li>We do not allow real-money trading.</li>
                        <li>We do not knowingly sell or share personal information of minors for advertising purposes.</li>
                        <li>Parental or guardian consent may be required where applicable by law.</li>
                    </ul>
                    <p className={styles.p}>
                        If you believe a minor has provided personal data without appropriate consent, please contact us
                        so we can remove the information.
                    </p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="s3">
                    <h2 id="s3" className={styles.h2}>
                        3. Information We Collect
                    </h2>
                    <h3 className={styles.h3}>A. Information You Provide</h3>
                    <p className={styles.p}>We may collect information you voluntarily provide, including:</p>
                    <ul className={styles.list}>
                        <li>Name or username</li>
                        <li>Email address</li>
                        <li>Account login credentials</li>
                        <li>Educational preferences or goals</li>
                        <li>Feedback or support messages</li>
                    </ul>

                    <h3 className={styles.h3}>B. Automatically Collected Information</h3>
                    <p className={styles.p}>When you use Vestera, we may automatically collect:</p>
                    <ul className={styles.list}>
                        <li>Device type and browser information</li>
                        <li>IP address</li>
                        <li>Usage activity within the platform</li>
                        <li>Pages visited and session duration</li>
                        <li>Simulated trading activity and portfolio performance</li>
                    </ul>

                    <h3 className={styles.h3}>C. Educational &amp; Simulation Data</h3>
                    <p className={styles.p}>Vestera collects simulated trading data such as:</p>
                    <ul className={styles.list}>
                        <li>Paper trades</li>
                        <li>Portfolio allocations</li>
                        <li>Learning progress</li>
                    </ul>
                    <p className={styles.p}>
                        This data is used strictly for educational and platform functionality purposes.
                    </p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="s4">
                    <h2 id="s4" className={styles.h2}>
                        4. How We Use Your Information
                    </h2>
                    <p className={styles.p}>We use collected information to:</p>
                    <ul className={styles.list}>
                        <li>Provide and operate the Vestera platform</li>
                        <li>Create and manage user accounts</li>
                        <li>Improve financial literacy tools and simulations</li>
                        <li>Personalize learning experiences</li>
                        <li>Monitor platform performance and security</li>
                        <li>Communicate updates, educational content, or support responses</li>
                        <li>Prevent fraud or misuse</li>
                    </ul>
                    <p className={styles.p}>We do not provide financial advice or brokerage services.</p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="s5">
                    <h2 id="s5" className={styles.h2}>
                        5. Data Sharing and Disclosure
                    </h2>
                    <p className={styles.p}>We do not sell personal information.</p>
                    <p className={styles.p}>We may share information only in the following situations:</p>
                    <ul className={styles.list}>
                        <li>With service providers who help operate the platform (hosting, analytics, security)</li>
                        <li>To comply with legal obligations or law enforcement requests</li>
                        <li>To protect the safety, rights, or integrity of Vestera and its users</li>
                        <li>During a business transfer such as a merger or acquisition</li>
                    </ul>
                    <p className={styles.p}>All partners are required to protect user data.</p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="s6">
                    <h2 id="s6" className={styles.h2}>
                        6. Cookies and Tracking Technologies
                    </h2>
                    <p className={styles.p}>Vestera may use cookies and similar technologies to:</p>
                    <ul className={styles.list}>
                        <li>Keep users logged in</li>
                        <li>Remember preferences</li>
                        <li>Analyze platform usage</li>
                        <li>Improve performance</li>
                    </ul>
                    <p className={styles.p}>
                        Users may disable cookies through browser settings, though some features may not function
                        properly.
                    </p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="s7">
                    <h2 id="s7" className={styles.h2}>
                        7. Data Security
                    </h2>
                    <p className={styles.p}>
                        We implement reasonable administrative, technical, and physical safeguards to protect user
                        information, including:
                    </p>
                    <ul className={styles.list}>
                        <li>Encrypted connections (HTTPS)</li>
                        <li>Secure authentication systems</li>
                        <li>Limited internal data access</li>
                    </ul>
                    <p className={styles.p}>
                        However, no internet system is completely secure, and we cannot guarantee absolute security.
                    </p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="s8">
                    <h2 id="s8" className={styles.h2}>
                        8. Data Retention
                    </h2>
                    <p className={styles.p}>We retain information only as long as necessary to:</p>
                    <ul className={styles.list}>
                        <li>Provide services</li>
                        <li>Maintain educational progress</li>
                        <li>Comply with legal obligations</li>
                    </ul>
                    <p className={styles.p}>Users may request account deletion at any time.</p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="s9">
                    <h2 id="s9" className={styles.h2}>
                        9. User Rights and Choices
                    </h2>
                    <p className={styles.p}>Depending on your location, you may have the right to:</p>
                    <ul className={styles.list}>
                        <li>Access your personal data</li>
                        <li>Correct inaccurate information</li>
                        <li>Request deletion of your account</li>
                        <li>Withdraw consent for communications</li>
                    </ul>
                    <p className={styles.p}>Requests can be submitted through our contact email listed below.</p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="s10">
                    <h2 id="s10" className={styles.h2}>
                        10. Third-Party Services
                    </h2>
                    <p className={styles.p}>
                        Vestera may link to third-party educational resources or market data providers. We are not
                        responsible for the privacy practices of external websites or services.
                    </p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="s11">
                    <h2 id="s11" className={styles.h2}>
                        11. Educational Disclaimer
                    </h2>
                    <p className={styles.p}>Vestera provides simulated trading and financial education only. The platform:</p>
                    <ul className={styles.list}>
                        <li>Does not execute real trades</li>
                        <li>Does not hold funds</li>
                        <li>Does not act as a broker or financial advisor</li>
                    </ul>
                    <p className={styles.p}>All trading activity on Vestera is virtual and for learning purposes.</p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="s12">
                    <h2 id="s12" className={styles.h2}>
                        12. Changes to This Privacy Policy
                    </h2>
                    <p className={styles.p}>
                        We may update this Privacy Policy periodically. Changes will be posted with an updated “Last
                        Updated” date. Continued use of the platform after updates constitutes acceptance of the revised
                        policy.
                    </p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="s13">
                    <h2 id="s13" className={styles.h2}>
                        13. Contact Us
                    </h2>
                    <p className={styles.p}>If you have questions about this Privacy Policy or your data, please contact:</p>
                    <div className={styles.contactBlock}>
                        <div>Vestera Support</div>
                        <div>
                            Email:{' '}
                            <a href="mailto:synapseai.education@gmail.com">synapseai.education@gmail.com</a>
                        </div>
                        <div>
                            Website:{' '}
                            <a href="https://www.vestera.com" rel="noopener noreferrer">
                                www.vestera.com
                            </a>
                        </div>
                    </div>
                </section>

                <hr className={styles.rule} />

                <p className={styles.footerNote}>© 2026 Vestera. All rights reserved.</p>
            </article>
        </main>
    );
}
