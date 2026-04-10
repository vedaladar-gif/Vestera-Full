'use client';

import Link from 'next/link';
import styles from './RestrictedPage.module.css';

/** Full-screen “access restricted” content (used by `/restricted` and legacy `LockedScreen`). */
export default function RestrictedPage() {
    return (
        <div className={styles.root}>
            <div className={styles.card}>
                <div className={styles.iconWrap} aria-hidden>
                    🔒
                </div>
                <h1 className={styles.title}>Access Restricted</h1>
                <p className={styles.message}>
                    You need to create an account or log in to access this feature.
                </p>
                <div className={styles.actions}>
                    <Link href="/login" className={styles.btnPrimary}>
                        Log In / Sign Up
                    </Link>
                    <Link href="/learn" className={styles.btnGhost}>
                        Back to Learn
                    </Link>
                </div>
            </div>
        </div>
    );
}
