'use client';

import GuestGuard from '@/components/GuestGuard';
import { FOUNDERS_DATA } from '@/lib/foundersData';
import styles from './founders.module.css';

function FoundersContent() {
    return (
        <div className={styles.foundersWrap}>
            <div className={styles.foundersInner}>
                <header className={styles.foundersHeader}>
                    <div className={styles.foundersEyebrow}>THE TEAM</div>
                    <h1 className={styles.foundersTitle}>Meet the Founders</h1>
                    <p className={styles.foundersSub}>
                        Vestera was built to make financial education accessible, engaging, and risk-free for the next generation of investors.
                    </p>
                </header>

                <div className={styles.foundersGrid}>
                    {FOUNDERS_DATA.map(founder => (
                        <article key={founder.name} className={styles.founderCard}>
                            {founder.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={founder.image}
                                    alt={founder.name}
                                    className={styles.founderPhoto}
                                    style={founder.imageObjectPosition ? { objectPosition: founder.imageObjectPosition } : undefined}
                                />
                            ) : (
                                <div className={styles.founderPhoto} />
                            )}
                            <div className={styles.founderBody}>
                                <h2 className={styles.founderName}>{founder.name}</h2>
                                <div className={styles.founderRole}>{founder.role}</div>
                                <p className={styles.founderBio}>{founder.bio}</p>
                            </div>
                        </article>
                    ))}
                </div>

                <div className={styles.missionCard}>
                    <h3 className={styles.missionTitle}>Our Mission</h3>
                    <p className={styles.missionText}>
                        We believe every student deserves access to high-quality investing education. Vestera combines
                        structured courses, paper trading with real market data, and a supportive community — so you
                        can build confidence before risking a single dollar.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function FoundersPage() {
    return (
        <GuestGuard>
            <FoundersContent />
        </GuestGuard>
    );
}
