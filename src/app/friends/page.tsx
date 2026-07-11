'use client';

import { motion } from 'framer-motion';
import styles from '@/app/stats/stats.module.css';
import { FriendsTab } from '@/components/stats/FriendsTab';
import GuestGuard from '@/components/GuestGuard';

function FriendsPage() {
    return (
        <div className={styles.statsWrap}>
            <div className={styles.statsInner}>
                <motion.div
                    className={styles.pageHeader}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                    <h1 className={styles.pageTitle}>Friends</h1>
                    <p className={styles.pageSubtitle}>Connect with other traders and compare portfolios</p>
                </motion.div>

                <FriendsTab />
            </div>
        </div>
    );
}

export default function FriendsRoute() {
    return (
        <GuestGuard>
            <FriendsPage />
        </GuestGuard>
    );
}
