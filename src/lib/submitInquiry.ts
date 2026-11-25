type InquirySubmission = {
    type: 'chapter' | 'school' | 'sponsor' | 'partnership';
    fullName: string;
    organization: string;
    email: string;
    message: string;
};

export async function submitInquiry(submission: InquirySubmission) {
    const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...submission, delivery: 'browser' }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Please try again or email vesteratrading@gmail.com.');
    if (!result.fields) {
        if (!result.ok) throw new Error('Could not prepare the inquiry. Please try again.');
        return { navigating: false, notice: result.notice as string | undefined };
    }

    const form = document.createElement('form');
    form.method = 'post';
    form.action = 'https://formsubmit.co/vesteratrading@gmail.com';
    form.hidden = true;
    for (const [name, value] of Object.entries<string>(result.fields)) {
        const field = document.createElement('input');
        field.type = 'hidden';
        field.name = name;
        field.value = value;
        form.append(field);
    }
    document.body.append(form);
    window.addEventListener('pagehide', () => form.remove(), { once: true });
    form.submit();
    return { navigating: true };
}
