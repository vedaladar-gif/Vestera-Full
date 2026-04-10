export interface FounderData {
    name: string;
    role: string;
    bio: string;
    initials: string;
}

export const FOUNDERS_DATA: readonly FounderData[] = [
    {
        name: 'Founder Name',
        role: 'Co-Founder & CEO',
        bio: 'Passionate about building accessible financial education tools for the next generation.',
        initials: 'F1',
    },
    {
        name: 'Founder Name',
        role: 'Co-Founder & CTO',
        bio: 'Focused on scalable product and technology that makes paper trading and learning seamless for everyone.',
        initials: 'F2',
    },
    {
        name: 'Founder Name',
        role: 'Co-Founder & COO',
        bio: 'Dedicated to operations, partnerships, and growing a community that learns markets with confidence.',
        initials: 'F3',
    },
] as const;
