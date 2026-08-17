import { NextRequest, NextResponse } from 'next/server';
import { createInquiry, listInquiries, type InquiryType } from '@/lib/inquiries';
import { getAdminSession } from '@/lib/adminSession';

const VALID_TYPES: InquiryType[] = ['partnership', 'chapter'];

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
        return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { type, fullName, organization, email, message } = body as Record<string, unknown>;

    if (typeof type !== 'string' || !VALID_TYPES.includes(type as InquiryType)) {
        return NextResponse.json({ error: 'Invalid inquiry type.' }, { status: 400 });
    }
    if (typeof fullName !== 'string' || !fullName.trim()) {
        return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }
    if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
        return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    try {
        await createInquiry({
            type: type as InquiryType,
            fullName: fullName.trim().slice(0, 200),
            organization: typeof organization === 'string' ? organization.trim().slice(0, 200) : null,
            email: email.trim().slice(0, 200),
            message: typeof message === 'string' ? message.trim().slice(0, 4000) : null,
        });
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('createInquiry error:', err);
        return NextResponse.json({ error: 'Could not submit right now. Please try again shortly.' }, { status: 503 });
    }
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
