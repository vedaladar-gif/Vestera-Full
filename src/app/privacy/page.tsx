import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy · Vestera',
    description: 'Vestera privacy policy (placeholder).',
};

export default function PrivacyPage() {
    return (
        <div style={{ maxWidth: 720, paddingBottom: 48 }}>
            <h1 style={{ marginBottom: 16 }}>Privacy Policy</h1>
            <p style={{ color: 'var(--vt-text2)', fontSize: 15, lineHeight: 1.7 }}>
                This is a placeholder page. A full privacy policy will be published here.
            </p>
        </div>
    );
}
