'use client';

import { useEffect } from 'react';

export function applyTheme(_theme?: string) {
    document.documentElement.setAttribute('data-theme', 'light');
}

export default function ThemeProvider({ initialTheme: _initialTheme }: { initialTheme?: string }) {
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('vt-theme', 'light');
    }, []);

    return null;
}
