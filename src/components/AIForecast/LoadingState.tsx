'use client';

import { useEffect, useState } from 'react';
import styles from './aiForecastComponents.module.css';

const STEPS = [
    'Fetching market data…',
    'Analyzing price action…',
    'Analyzing fundamentals…',
    'Evaluating market conditions…',
    'Running prediction model…',
    'Generating forecast…',
];

export default function LoadingState() {
    const [step, setStep] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 550);
        return () => clearInterval(id);
    }, []);

    return (
        <div className={styles.loadingWrap}>
            <div className={styles.loadingSpinner} />
            <div className={styles.loadingStep}>{STEPS[step]}</div>
            <div className={styles.loadingSteps}>
                {STEPS.map((s, i) => (
                    <div key={s} className={i <= step ? styles.loadingStepDone : styles.loadingStepPending}>
                        {i < step ? '✓' : i === step ? '●' : '○'} {s}
                    </div>
                ))}
            </div>
        </div>
    );
}
