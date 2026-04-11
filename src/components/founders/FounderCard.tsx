import styles from './FounderCard.module.css';
import FounderAvatarContent from '@/components/founders/FounderAvatarContent';

export interface FounderCardProps {
    name: string;
    role: string;
    bio: string;
    /** Shown inside the avatar placeholder (e.g. initials). */
    initials?: string;
    image?: string;
    imageObjectPosition?: string;
}

export default function FounderCard({
    name,
    role,
    bio,
    initials = '?',
    image,
    imageObjectPosition,
}: FounderCardProps) {
    const wrapClass = image
        ? `${styles.avatarWrap} ${styles.avatarWrapPhoto}`
        : `${styles.avatarWrap} ${styles.avatarWrapPlaceholder}`;

    return (
        <article className={styles.card}>
            <div className={wrapClass} aria-hidden>
                {image ? (
                    <div className={styles.avatarHeroFrame}>
                        <FounderAvatarContent
                            image={image}
                            initials={initials}
                            name={name}
                            photoClassName={styles.avatarHeroPhoto}
                            objectPosition={imageObjectPosition}
                            sizes="(max-width: 768px) 100vw, 33vw"
                        />
                    </div>
                ) : (
                    <div className={styles.avatarInnerInitials}>
                        <FounderAvatarContent
                            image={image}
                            initials={initials}
                            name={name}
                            photoClassName={styles.avatarHeroPhoto}
                            sizes="(max-width: 768px) 100vw, 33vw"
                        />
                    </div>
                )}
            </div>
            <div className={styles.body}>
                <h2 className={styles.name}>{name}</h2>
                <p className={styles.role}>{role}</p>
                <p className={styles.bio}>{bio}</p>
            </div>
        </article>
    );
}
