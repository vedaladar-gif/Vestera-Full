import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './check-email.module.css';

export const metadata: Metadata = {
    title: 'Check your email · Vestera',
    description: 'Confirm your Vestera account from your inbox.',
};

type SearchParams = { registered?: string; pending?: string };

export default async function CheckEmailPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const sp = await searchParams;
    const registered = sp.registered === '1';
    const pendingConfirmation = sp.pending === '1';

    if (!registered) {
        return (
            <div className={styles.wrap}>
                <div className={styles.card}>
                    <div className={styles.brand}>V</div>
                    <h1 className={styles.title}>Check your email</h1>
                    <p className={styles.body}>
                        This screen appears after you create a Vestera account. If you haven&apos;t signed up yet,
                        start there first.
                    </p>
                    <p className={styles.hint} style={{ marginBottom: 24 }}>
                        Already have an account? Head to log in.
                    </p>
                    <Link href="/login" className={styles.loginBox}>
                        Log In
                    </Link>
                    <p className={styles.secondary}>
                        <Link href="/register">Create an account</Link>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.card}>
                <div className={styles.brand}>V</div>
                <h1 className={styles.title}>Check your email</h1>
                {pendingConfirmation ? (
                    <>
                        <p className={styles.body}>
                            Your account has been created. Please check your email and confirm your account before
                            logging in.
                        </p>
                        <p className={styles.hint}>
                            If you don&apos;t see the email, check your spam or junk folder.
                        </p>
                    </>
                ) : (
                    <>
                        <p className={styles.body}>
                            Your account has been created. You can sign in now with the email and password you chose.
                        </p>
                        <p className={styles.hint}>
                            If your project requires email confirmation, watch your inbox for a link from your provider.
                        </p>
                    </>
                )}
                <Link href="/login" className={styles.loginBox}>
                    Log In
                </Link>
                <p className={styles.secondary}>
                    Wrong address? <Link href="/register">Back to sign up</Link>
                </p>
            </div>
        </div>
    );
}
