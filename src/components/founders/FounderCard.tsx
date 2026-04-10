import styles from './FounderCard.module.css';

export interface FounderCardProps {
    name: string;
    role: string;
    bio: string;
    /** Shown inside the avatar placeholder (e.g. initials). */
    initials?: string;
}

export default function FounderCard({ name, role, bio, initials = '?' }: FounderCardProps) {
    return (
        <article className={styles.card}>
            <div className={styles.avatarWrap} aria-hidden>
                <div className={styles.avatarInner}>{initials}</div>
            </div>
            <div className={styles.body}>
                <h2 className={styles.name}>{name}</h2>
                <p className={styles.role}>{role}</p>
                <p className={styles.bio}>{bio}</p>
            </div>
        </article>
    );
}
