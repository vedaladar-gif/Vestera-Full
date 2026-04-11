'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import FounderCard from '@/components/founders/FounderCard';
import FounderAvatarContent from '@/components/founders/FounderAvatarContent';
import TypingText from '@/components/founders/TypingText';
import { FOUNDERS_DATA } from '@/lib/foundersData';
import pageStyles from '@/app/founders/founders.module.css';
import introStyles from '@/components/founders/foundersIntro.module.css';
import cardStyles from '@/components/founders/FounderCard.module.css';

type Step = 'image' | 'name' | 'role' | 'bio' | 'frame';

/**
 * Intro sequence runs from initial state on every mount (each visit to /founders,
 * including return navigation and refresh). No sessionStorage / localStorage.
 * `useReducedMotion` still skips motion for accessibility.
 */
export default function FoundersPageClient() {
    const reduceMotion = useReducedMotion();
    const [done, setDone] = useState(false);
    const [fi, setFi] = useState(0);
    const [step, setStep] = useState<Step>('image');
    const [settled, setSettled] = useState<[boolean, boolean, boolean]>([false, false, false]);
    const [exitStage, setExitStage] = useState(false);
    const [stageOpen, setStageOpen] = useState(true);
    const [missionVisible, setMissionVisible] = useState(false);
    const imageDoneRef = useRef(false);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (!reduceMotion) return;
        setSettled([true, true, true]);
        setDone(true);
        setStageOpen(false);
    }, [reduceMotion]);

    /** Mission sits below cards only after intro is done; brief delay lets the last grid card finish its entrance. */
    useEffect(() => {
        if (!done) {
            setMissionVisible(false);
            return;
        }
        if (reduceMotion) {
            setMissionVisible(true);
            return;
        }
        const id = window.setTimeout(() => setMissionVisible(true), 520);
        return () => clearTimeout(id);
    }, [done, reduceMotion]);

    useEffect(() => {
        imageDoneRef.current = false;
        setStep('image');
        setExitStage(false);
        setStageOpen(true);
    }, [fi]);

    const onFlyDone = useCallback(() => {
        if (!mountedRef.current) return;
        setExitStage(false);
        setSettled(prev => {
            const n: [boolean, boolean, boolean] = [...prev];
            n[fi] = true;
            return n;
        });
        if (fi >= 2) {
            setDone(true);
            setStageOpen(false);
        } else {
            setFi(f => f + 1);
        }
    }, [fi]);

    useEffect(() => {
        if (!exitStage) return;
        const t = window.setTimeout(onFlyDone, 440);
        return () => window.clearTimeout(t);
    }, [exitStage, onFlyDone]);

    useEffect(() => {
        if (step !== 'frame' || reduceMotion || done) return;
        const t = window.setTimeout(() => {
            if (mountedRef.current) setExitStage(true);
        }, 700);
        return () => window.clearTimeout(t);
    }, [step, reduceMotion, done, fi]);

    const founder = FOUNDERS_DATA[fi];
    const runIntro = !reduceMotion && !done;
    const dimBackdrop = runIntro;

    const showStage = runIntro && stageOpen && !settled[fi] && founder;

    return (
        <main className={`${pageStyles.page} ${introStyles.pageWrap}`}>
            <motion.header
                className={pageStyles.header}
                initial={false}
                animate={{
                    opacity: done || reduceMotion ? 1 : 0.45,
                    filter: done || reduceMotion ? 'blur(0px)' : 'blur(0.55px)',
                }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className={pageStyles.eyebrow}>
                    <span className={pageStyles.eyebrowDot} aria-hidden />
                    Team
                </div>
                <h1 className={pageStyles.title}>Meet the Founders</h1>
                <p className={pageStyles.subtitle}>
                    The team behind the vision, product, and mission of Vestera.
                </p>
            </motion.header>

            <motion.div
                className={introStyles.backdrop}
                aria-hidden
                initial={false}
                animate={{
                    opacity: dimBackdrop ? 1 : 0,
                    backdropFilter: dimBackdrop ? 'blur(7px)' : 'blur(0px)',
                    WebkitBackdropFilter: dimBackdrop ? 'blur(7px)' : 'blur(0px)',
                }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    pointerEvents: dimBackdrop ? 'auto' : 'none',
                }}
            />

            <div className={pageStyles.grid}>
                {FOUNDERS_DATA.map((data, i) => (
                    <div key={i} className={introStyles.slot}>
                        <AnimatePresence>
                            {settled[i] && (
                                <motion.div
                                    initial={{ opacity: 0, y: 26 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                                    className={introStyles.gridCard}
                                >
                                    <FounderCard
                                        name={data.name}
                                        role={data.role}
                                        bio={data.bio}
                                        initials={data.initials}
                                        image={data.image}
                                        imageObjectPosition={data.imageObjectPosition}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {missionVisible && (
                <motion.section
                    className={pageStyles.mission}
                    aria-labelledby="founders-mission-heading"
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: reduceMotion ? 0 : 0.5,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                >
                    <div className={pageStyles.missionInner}>
                        <h2 id="founders-mission-heading" className={pageStyles.missionTitle}>
                            Our Mission
                        </h2>
                        <p className={pageStyles.missionText}>
                            Vestera’s mission is to make financial education accessible, practical, and
                            engaging for the next generation. We aim to give students and young investors the tools,
                            knowledge, and confidence to understand markets, practice investing, and build a strong
                            financial future.
                        </p>
                    </div>
                </motion.section>
            )}

            <AnimatePresence>
                {showStage && founder && (
                    <motion.div
                        key={`stage-${fi}`}
                        className={introStyles.stageRoot}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                    >
                        <motion.div
                            className={introStyles.stageCard}
                            animate={
                                exitStage
                                    ? {
                                          opacity: 0,
                                          y: -20,
                                          scale: 0.93,
                                          filter: 'blur(10px)',
                                      }
                                    : {
                                          opacity: 1,
                                          y: 0,
                                          scale: 1,
                                          filter: 'blur(0px)',
                                      }
                            }
                            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <article
                                className={`${cardStyles.card} ${introStyles.revealCard} ${
                                    step === 'frame' || exitStage ? introStyles.revealCardFrameOn : ''
                                }`}
                            >
                                <div
                                    className={
                                        founder.image
                                            ? `${cardStyles.avatarWrap} ${cardStyles.avatarWrapPhoto}`
                                            : `${cardStyles.avatarWrap} ${cardStyles.avatarWrapPlaceholder}`
                                    }
                                    aria-hidden
                                >
                                    <motion.div
                                        key={`av-${fi}`}
                                        className={
                                            founder.image
                                                ? cardStyles.avatarHeroFrame
                                                : cardStyles.avatarInnerInitials
                                        }
                                        initial={{ opacity: 0, scale: 0.86 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{
                                            duration: 0.55,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                        onAnimationComplete={() => {
                                            if (exitStage || step !== 'image' || imageDoneRef.current) return;
                                            imageDoneRef.current = true;
                                            setStep('name');
                                        }}
                                    >
                                        <FounderAvatarContent
                                            image={founder.image}
                                            initials={founder.initials}
                                            name={founder.name}
                                            photoClassName={cardStyles.avatarHeroPhoto}
                                            objectPosition={founder.imageObjectPosition}
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                        />
                                    </motion.div>
                                </div>
                                <div className={cardStyles.body}>
                                    <TypingText
                                        key={`${fi}-name`}
                                        as="h2"
                                        text={founder.name}
                                        className={cardStyles.name}
                                        minIntervalMs={20}
                                        maxIntervalMs={35}
                                        pauseAfterMs={140}
                                        active={step === 'name'}
                                        onComplete={() => setStep('role')}
                                    />
                                    <TypingText
                                        key={`${fi}-role`}
                                        text={founder.role}
                                        className={cardStyles.role}
                                        minIntervalMs={20}
                                        maxIntervalMs={35}
                                        pauseAfterMs={120}
                                        active={step === 'role'}
                                        onComplete={() => setStep('bio')}
                                    />
                                    <TypingText
                                        key={`${fi}-bio`}
                                        text={founder.bio}
                                        className={cardStyles.bio}
                                        minIntervalMs={20}
                                        maxIntervalMs={35}
                                        pauseAfterMs={160}
                                        active={step === 'bio'}
                                        onComplete={() => setStep('frame')}
                                    />
                                </div>
                            </article>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
