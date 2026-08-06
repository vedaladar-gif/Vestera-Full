import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.inner}>
                <p className={styles.text}>
                    © 2026 Vestera · For educational purposes only. Not financial advice. ·{' '}
                    <Link href="/privacy" className={styles.link}>
                        Privacy Policy
                    </Link>
                    {' · '}
                    <Link href="/terms" className={styles.link}>
                        Terms of Service
                    </Link>
                    {' · '}
                    <Link href="/partners" className={styles.link}>
                        Partners
                    </Link>
                </p>
            </div>
        </footer>
    );
}
