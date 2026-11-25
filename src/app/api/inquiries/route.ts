import { NextRequest, NextResponse } from 'next/server';
import { createInquiry, listInquiries, type NewInquiry } from '@/lib/inquiries';
import { getAdminSession } from '@/lib/adminSession';

const subjects = {
    partnership: 'Vestera partnership inquiry',
    chapter: 'Vestera chapter application',
    school: 'Vestera school workshop request',
    sponsor: 'Vestera sponsorship inquiry',
};

async function emailInquiry(subject: string, inquiry: NewInquiry) {
    const formId = process.env.NEXT_PUBLIC_VESTERA_FORMSPREE_ID;
    const formUrl = 'https://vestera.app/programs';
    const url = formId ? 'https://formspree.io/f/' + encodeURIComponent(formId)
        : 'https://formsubmit.co/ajax/vesteratrading@gmail.com';
    const response = await fetch(url, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', Referer: formUrl },
        body: JSON.stringify({
            _subject: subject, _url: formUrl, name: inquiry.fullName, email: inquiry.email,
            organization: inquiry.organization, message: inquiry.message || subject,
        }),
        signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error('Email service rejected inquiry');
    if (!formId) {
        const result = await response.json();
        if (result.success !== true && result.success !== 'true') throw new Error('Email service did not accept inquiry');
    }
}

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
        return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { type, fullName, organization, email, message } = body as Record<string, unknown>;

    if (typeof type !== 'string' || !Object.hasOwn(subjects, type)) {
        return NextResponse.json({ error: 'Invalid inquiry type.' }, { status: 400 });
    }
    if (typeof fullName !== 'string' || !fullName.trim()) {
        return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }
    if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
        return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    if (fullName.length > 200 || email.length > 200 || (typeof organization === 'string' && organization.length > 200)
        || (typeof message === 'string' && message.length > 4000)) {
        return NextResponse.json({ error: 'One of the fields exceeds the allowed length.' }, { status: 400 });
    }
    const subject = subjects[type as keyof typeof subjects];
    const inquiry: NewInquiry = {
        type: type === 'chapter' ? 'chapter' : 'partnership',
        fullName: fullName.trim(),
        organization: typeof organization === 'string' ? organization.trim() : null,
        email: email.trim(),
        message: typeof message === 'string' ? message.trim() : null,
    };
    const record = type === 'school' || type === 'sponsor'
        ? { ...inquiry, message: [subject, inquiry.message].filter(Boolean).join('\n') }
        : inquiry;
    const [storage, mail] = await Promise.allSettled([createInquiry(record), emailInquiry(subject, inquiry)]);
    if (storage.status === 'rejected') console.error('Inquiry storage failed');
    if (mail.status === 'fulfilled') return NextResponse.json({ ok: true });

    console.error('Inquiry email forwarding failed');
    if (storage.status === 'fulfilled') {
        return NextResponse.json({ ok: true, notice: 'Your inquiry was saved for the Vestera team. Email delivery was not confirmed. You can follow up at vesteratrading@gmail.com.' });
    }
    return NextResponse.json({ error: 'We could not accept your inquiry. Please try again or email vesteratrading@gmail.com.' }, { status: 503 });
}

export async function GET() {
    const session = await getAdminSession();
    if (!session.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const inquiries = await listInquiries();
        return NextResponse.json({ inquiries });
    } catch (err) {
        console.error('listInquiries error:', err);
        return NextResponse.json({ error: 'Could not load inquiries.' }, { status: 503 });
    }
}
