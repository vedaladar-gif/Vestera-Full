import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service · Vestera',
    description: 'Vestera terms of service (placeholder).',
};

export default function TermsPage() {
    return (
        <div style={{ maxWidth: 720, paddingBottom: 48 }}>
            <h1 style={{ marginBottom: 16 }}>Terms of Service</h1>
            <p style={{ color: 'var(--vt-text2)', fontSize: 15, lineHeight: 1.7 }}>
                This is a placeholder page. Full terms of service will be published here.
            </p>
        </div>
    );
}
