'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import styles from './UpgradeModal.module.css';

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function UpgradeModal({ open, onClose }: Props) {
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className={styles.backdrop}
            role="presentation"
            onClick={e => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby="upgrade-modal-title"
            >
                <h2 id="upgrade-modal-title" className={styles.title}>
                    Create an account to continue
                </h2>
                <p className={styles.message}>
                    Sign up or log in to take the diagnostic and unlock the Academy.
                </p>
                <div className={styles.actions}>
                    <Link href="/login" className={styles.btnPrimary} onClick={onClose}>
                        Log In / Sign Up
                    </Link>
                    <button type="button" className={styles.btnClose} onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
