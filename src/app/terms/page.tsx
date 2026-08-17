import type { Metadata } from 'next';
import styles from '../privacy/privacy.module.css';

export const metadata: Metadata = {
    title: 'Terms of Service · Vestera',
    description: 'Terms governing your use of the Vestera educational trading platform.',
};

export default function TermsPage() {
    return (
        <main className={styles.page}>
            <article className={styles.card}>
                <h1 className={styles.title}>Terms of Service — Vestera</h1>
                <p className={styles.lastUpdated}>Last Updated: April 9, 2026</p>

                <section className={styles.section} aria-labelledby="t1">
                    <h2 id="t1" className={styles.h2}>
                        1. Acceptance of Terms
                    </h2>
                    <p className={styles.p}>
                        Welcome to Vestera (“Vestera,” “we,” “our,” or “us”). These Terms of Service (“Terms”) govern
                        your access to and use of the Vestera website, applications, and services (collectively, the
                        “Platform”).
                    </p>
                    <p className={styles.p}>
                        By creating an account or using Vestera, you agree to be bound by these Terms. If you do not
                        agree, you may not use the Platform.
                    </p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="t2">
                    <h2 id="t2" className={styles.h2}>
                        2. Description of Service
                    </h2>
                    <p className={styles.p}>
                        Vestera is an educational platform designed to improve financial literacy by allowing users to
                        practice investing through paper trading simulations.
                    </p>
                    <p className={styles.p}>Vestera:</p>
                    <ul className={styles.list}>
                        <li>Provides simulated trading experiences</li>
                        <li>Offers educational tools and market-learning resources</li>
                        <li>Does not support real-money trading</li>
                        <li>Is not a brokerage, financial institution, or investment advisor</li>
                    </ul>
                    <p className={styles.p}>All trades executed on Vestera are virtual and have no real financial value.</p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="t3">
                    <h2 id="t3" className={styles.h2}>
                        3. Eligibility
                    </h2>
                    <p className={styles.p}>You must be at least 13 years old to use Vestera.</p>
                    <p className={styles.p}>If you are under 18 years old:</p>
                    <ul className={styles.list}>
                        <li>You represent that you have permission from a parent or legal guardian.</li>
                        <li>A parent or guardian may review or request deletion of your account information.</li>
                    </ul>
                    <p className={styles.p}>
                        Vestera reserves the right to suspend accounts that violate age requirements or applicable laws.
                    </p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="t4">
                    <h2 id="t4" className={styles.h2}>
                        4. Account Registration
                    </h2>
                    <p className={styles.p}>To access certain features, users must create an account.</p>
                    <p className={styles.p}>You agree to:</p>
                    <ul className={styles.list}>
                        <li>Provide accurate information</li>
                        <li>Keep login credentials secure</li>
                        <li>Be responsible for activity under your account</li>
                        <li>Notify us immediately of unauthorized access</li>
                    </ul>
                    <p className={styles.p}>
                        We may suspend or terminate accounts suspected of misuse or fraudulent behavior.
                    </p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="t5">
                    <h2 id="t5" className={styles.h2}>
                        5. Educational Use Only — No Financial Advice
                    </h2>
                    <p className={styles.p}>Vestera is strictly an educational platform.</p>
                    <p className={styles.p}>The information provided on Vestera:</p>
                    <ul className={styles.list}>
                        <li>Is for learning purposes only</li>
                        <li>Does not constitute financial, investment, legal, or tax advice</li>
                        <li>Should not be relied upon for real investment decisions</li>
                    </ul>
                    <p className={styles.p}>
                        You acknowledge that simulated performance does not guarantee real-world investment results.
                    </p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="t6">
                    <h2 id="t6" className={styles.h2}>
                        6. Simulated Trading Disclaimer
                    </h2>
                    <p className={styles.p}>
                        All portfolios, gains, losses, and trading outcomes shown on Vestera are simulated.
                    </p>
                    <p className={styles.p}>Vestera:</p>
                    <ul className={styles.list}>
                        <li>Does not execute real trades</li>
                        <li>Does not hold or transfer money</li>
                        <li>Does not connect to brokerage accounts</li>
                        <li>Does not guarantee market accuracy or real-time pricing</li>
                    </ul>
                    <p className={styles.p}>Market data may be delayed or approximated for educational purposes.</p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="t7">
                    <h2 id="t7" className={styles.h2}>
                        7. Acceptable Use
                    </h2>
                    <p className={styles.p}>You agree not to:</p>
                    <ul className={styles.list}>
                        <li>Use Vestera for unlawful purposes</li>
                        <li>Attempt to hack, disrupt, or reverse engineer the Platform</li>
                        <li>Manipulate simulations unfairly</li>
                        <li>Create multiple accounts to exploit rankings or competitions</li>
                        <li>Upload harmful, abusive, or inappropriate content</li>
                    </ul>
                    <p className={styles.p}>We may remove content or suspend accounts that violate these rules.</p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="t8">
                    <h2 id="t8" className={styles.h2}>
                        8. Intellectual Property
                    </h2>
                    <p className={styles.p}>All content on Vestera, including:</p>
                    <ul className={styles.list}>
                        <li>Software</li>
                        <li>Design</li>
                        <li>Branding</li>
                        <li>Educational materials</li>
                        <li>Logos and graphics</li>
                    </ul>
                    <p className={styles.p}>
                        is owned by Vestera or its licensors and protected by intellectual property laws.
                    </p>
                    <p className={styles.p}>You may not copy, distribute, or reproduce content without permission.</p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="t9">
                    <h2 id="t9" className={styles.h2}>
                        9. User Content
                    </h2>
                    <p className={styles.p}>
                        If you submit feedback, comments, or content on Vestera, you grant us a non-exclusive, worldwide,
                        royalty-free license to use that content to improve and operate the Platform.
                    </p>
                    <p className={styles.p}>You remain responsible for any content you post.</p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="t10">
                    <h2 id="t10" className={styles.h2}>
                        10. Privacy
                    </h2>
                    <p className={styles.p}>
                        Your use of Vestera is also governed by our Privacy Policy, which explains how we collect and
                        use data.
                    </p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="t11">
                    <h2 id="t11" className={styles.h2}>
                        11. Account Suspension and Termination
                    </h2>
                    <p className={styles.p}>We may suspend or terminate accounts if:</p>
                    <ul className={styles.list}>
                        <li>These Terms are violated</li>
                        <li>Fraudulent or abusive behavior is detected</li>
                        <li>Required by law or safety concerns</li>
                    </ul>
                    <p className={styles.p}>Users may delete their account at any time by contacting support.</p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="t12">
                    <h2 id="t12" className={styles.h2}>
                        12. Third-Party Services and Links
                    </h2>
                    <p className={styles.p}>
                        Vestera may include links to third-party tools or educational resources. We are not responsible
                        for third-party content, policies, or services.
                    </p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="t13">
                    <h2 id="t13" className={styles.h2}>
                        13. Disclaimer of Warranties
                    </h2>
                    <p className={styles.p}>Vestera is provided on an “as-is” and “as-available” basis.</p>
                    <p className={styles.p}>We do not guarantee that:</p>
                    <ul className={styles.list}>
                        <li>The Platform will be uninterrupted or error-free</li>
                        <li>Simulated data will perfectly reflect real markets</li>
                        <li>Educational outcomes or financial success will result</li>
                    </ul>
                    <p className={styles.p}>Use of the Platform is at your own risk.</p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="t14">
                    <h2 id="t14" className={styles.h2}>
                        14. Limitation of Liability
                    </h2>
                    <p className={styles.p}>
                        To the fullest extent permitted by law, Vestera and its team shall not be liable for:
                    </p>
                    <ul className={styles.list}>
                        <li>Any indirect or consequential damages</li>
                        <li>Losses resulting from reliance on simulated data</li>
                        <li>Decisions made based on educational content</li>
                    </ul>
                    <p className={styles.p}>
                        Because Vestera does not involve real money trading, users acknowledge no financial transactions
                        occur through the Platform.
                    </p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="t15">
                    <h2 id="t15" className={styles.h2}>
                        15. Changes to the Terms
                    </h2>
                    <p className={styles.p}>
                        We may update these Terms periodically. Updated versions will be posted with a revised “Last
                        Updated” date.
                    </p>
                    <p className={styles.p}>Continued use of Vestera after changes means you accept the updated Terms.</p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="t16">
                    <h2 id="t16" className={styles.h2}>
                        16. Governing Law
                    </h2>
                    <p className={styles.p}>
                        These Terms shall be governed by and interpreted under the laws of the United States and the
                        applicable state jurisdiction where Vestera operates.
                    </p>
                </section>

                <hr className={styles.rule} />

                <section className={styles.section} aria-labelledby="t17">
                    <h2 id="t17" className={styles.h2}>
                        17. Contact Information
                    </h2>
                    <p className={styles.p}>For questions regarding these Terms:</p>
                    <div className={styles.contactBlock}>
                        <div>Vestera Support</div>
                        <div>
                            Email:{' '}
                            <a href="mailto:vesteratrading@gmail.com">vesteratrading@gmail.com</a>
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
