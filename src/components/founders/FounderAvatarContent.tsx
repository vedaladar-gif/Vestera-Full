'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

type Props = {
    image?: string;
    initials: string;
    name: string;
    photoClassName: string;
    /** Per-founder crop tuning (CSS `object-position`), e.g. `center 35%` when the face sits low in the source photo */
    objectPosition?: string;
    /** Passed to `next/image` for responsive loading */
    sizes?: string;
};

/**
 * Full-bleed `object-fit: cover` photo in its parent (parent must be `position: relative` with size);
 * falls back to initials if missing path or load error.
 */
export default function FounderAvatarContent({
    image,
    initials,
    name,
    photoClassName,
    objectPosition,
    sizes = '(max-width: 768px) 100vw, 33vw',
}: Props) {
    const [failed, setFailed] = useState(false);
    const trimmed = image?.trim() ?? '';

    useEffect(() => {
        setFailed(false);
    }, [trimmed]);

    const showImage = Boolean(trimmed) && !failed;

    if (!showImage) {
        return <>{initials}</>;
    }

    return (
        <Image
            src={trimmed}
            alt={name}
            fill
            className={photoClassName}
            style={objectPosition ? { objectPosition } : undefined}
            sizes={sizes}
            onError={() => setFailed(true)}
        />
    );
}
