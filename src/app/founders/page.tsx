import type { Metadata } from 'next';
import FoundersPageClient from '@/components/founders/FoundersPageClient';

export const metadata: Metadata = {
    title: 'Founders · Vestera',
    description: 'Meet the team behind Vestera.',
};

export default function FoundersPage() {
    return <FoundersPageClient />;
}
