export interface FounderData {
    name: string;
    role: string;
    bio: string;
    initials: string;
    /** Public path under `/public`, e.g. `/founders/vedant.jpg` */
    image?: string;
    /** Optional CSS object-position for photo crop (founder-specific framing). */
    imageObjectPosition?: string;
}

export const FOUNDERS_DATA: readonly FounderData[] = [
    {
        name: 'Vedant Aladar',
        role: 'Co-Founder & CEO',
        bio: 'Passionate about building accessible financial education tools for the next generation.',
        initials: 'VA',
        image: '/founders/vedant.jpg',
        /** Portrait sits low in frame (sky above); bias crop toward face/shoulders */
        imageObjectPosition: 'center 35%',
    },
    {
        name: 'Sourish Nampalli',
        role: 'Co-Founder & CTO',
        bio: 'Focused on scalable product and technology that makes paper trading and learning seamless for everyone.',
        initials: 'SN',
        image: '/founders/sourish.jpg',
        /** Face in upper-middle; bias slightly up for head + shoulders in hero crop */
        imageObjectPosition: 'center 32%',
    },
    {
        name: 'Kiaan Rana',
        role: 'Co-Founder & COO',
        bio: 'Dedicated to operations, partnerships, and growing a community that learns markets with confidence.',
        initials: 'KR',
        image: '/founders/kiaan.jpg',
    },
] as const;
