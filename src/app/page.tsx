'use client';

import { useEffect, useState } from 'react';
import { startTour } from '@/lib/onboarding';
import './approved-home.css';

const markup = `
<main id="top">
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-art" role="img" aria-label="Students exploring a colorful town filled with places to learn about money"></div>
        <div class="hero-shade"></div>
        <div class="hero-content page-width">
          <div class="eyebrow"><span class="spark">✦</span> Money skills for real life</div>
          <h1 id="hero-title">Grow smart with <em>money.</em></h1>
          <p class="hero-copy">Learn how money works through stories, challenges, and games built for curious minds—not finance experts.</p>
          <div class="hero-actions">
            <a class="primary-button" href="/learn">Start exploring <span aria-hidden="true">→</span></a>
            <button class="watch-button" type="button" data-scroll="#path">
              <span class="play" aria-hidden="true">▶</span>
              See how it works
            </button>
          </div>
          <button class="demo-link" type="button" data-demo-tour>Try the guided trading demo →</button>
          <div class="proof">
            <div class="avatars" aria-hidden="true">
              <span>AM</span><span>JL</span><span>SK</span>
            </div>
            <p><strong>Built for real decisions</strong><br />Made for every learner</p>
          </div>
        </div>

        <aside class="weekly-card" aria-label="Weekly learning progress">
          <div class="weekly-head">
            <span>Example week</span>
            <span class="streak">🔥 4 day streak</span>
          </div>
          <div class="weekly-score">
            <strong>3</strong><span>of 5<br />missions</span>
          </div>
          <div class="progress-track"><i></i></div>
          <div class="next-up">
            <span class="next-icon">$</span>
            <span><small>Up next</small><strong>Build a smart budget</strong></span>
            <span aria-hidden="true">→</span>
          </div>
        </aside>
      </section>

      <section class="trust-strip" aria-label="Vestera learning benefits">
        <div class="page-width trust-grid">
          <p>One learning world.<br /><strong>Skills that grow with you.</strong></p>
          <div><span>01</span><strong>Learn it</strong><small>Short, clear lessons</small></div>
          <div><span>02</span><strong>Try it</strong><small>Decisions that matter</small></div>
          <div><span>03</span><strong>Play it</strong><small>Games with a purpose</small></div>
        </div>
      </section>

      <section class="learning-section page-width" id="learn">
        <div class="section-kicker"><span>01</span> Your learning world</div>
        <div class="section-heading">
          <h2>Learn by making<br /><em>real choices.</em></h2>
          <p>Every path turns a big money idea into a story you can understand, a choice you can make, and a skill you can use.</p>
        </div>

        <div class="lesson-grid" id="path">
          <article class="lesson-card sky">
            <div class="card-top"><span>Start here</span><span>6 lessons</span></div>
            <div class="lesson-art wallet-art" aria-hidden="true">
              <div class="money-in-card">
                <span>Money in</span>
                <strong>+$20</strong>
                <small>Weekend job</small>
              </div>
              <div class="flow-branch"><i></i><b></b><b></b></div>
              <div class="money-choice save-choice">
                <span><i>↓</i> Save</span>
                <strong>$8</strong>
                <small>Future goal</small>
              </div>
              <div class="money-choice spend-choice">
                <span><i>→</i> Spend</span>
                <strong>$12</strong>
                <small>Today</small>
              </div>
              <div class="money-rule">Every dollar has a job <span>✓</span></div>
            </div>
            <div class="card-copy">
              <span class="number">01</span>
              <h3>Money basics</h3>
              <p>Earn, save, spend, and understand where money goes.</p>
              <a href="/learn">Explore the path <span>→</span></a>
            </div>
          </article>

          <article class="lesson-card green">
            <div class="card-top"><span>Next step</span><span>8 lessons</span></div>
            <div class="lesson-art goal-art" aria-hidden="true">
              <div class="goal-summary">
                <span>Saving for</span>
                <strong>My first big goal</strong>
                <div class="goal-meter"><i></i></div>
                <small><b>$84</b> of $120 saved</small>
              </div>
              <div class="goal-jar">
                <div class="jar-lid"></div>
                <div class="jar-shine"></div>
                <div class="jar-fill"><i>$</i><i>¢</i><i>$</i><i>¢</i></div>
                <strong>70%</strong>
              </div>
              <div class="milestone-line"><i></i><span class="done">✓</span><span class="done">✓</span><span>★</span></div>
            </div>
            <div class="card-copy">
              <span class="number">02</span>
              <h3>Goals & saving</h3>
              <p>Make a plan, handle tradeoffs, and reach something meaningful.</p>
              <a href="/learn">Explore the path <span>→</span></a>
            </div>
          </article>

          <article class="lesson-card gold">
            <div class="card-top"><span>Level up</span><span>7 lessons</span></div>
            <div class="lesson-art growth-art" aria-hidden="true">
              <div class="growth-dashboard">
                <div class="growth-heading"><span>Compound growth</span><b>↗ 18%</b></div>
                <svg viewBox="0 0 300 125" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stop-color="#4175e8" stop-opacity=".38" />
                      <stop offset="1" stop-color="#4175e8" stop-opacity="0" />
                    </linearGradient>
                  </defs>
                  <path class="growth-area" d="M0,112 C42,105 54,92 82,93 C116,94 121,70 155,68 C191,65 194,48 226,43 C255,38 268,17 300,8 L300,125 L0,125 Z" />
                  <path class="growth-line" d="M0,112 C42,105 54,92 82,93 C116,94 121,70 155,68 C191,65 194,48 226,43 C255,38 268,17 300,8" />
                  <circle cx="82" cy="93" r="4" /><circle cx="155" cy="68" r="4" /><circle cx="226" cy="43" r="4" /><circle cx="300" cy="8" r="5" />
                </svg>
                <div class="growth-years"><span>Today</span><span>Year 5</span><span>Year 10</span></div>
              </div>
              <div class="growth-coins"><span><i></i></span><span><i></i><i></i></span><span><i></i><i></i><i></i></span></div>
            </div>
            <div class="card-copy">
              <span class="number">03</span>
              <h3>Growing money</h3>
              <p>Meet investing, risk, and the quiet power of time.</p>
              <a href="/learn">Explore the path <span>→</span></a>
            </div>
          </article>
        </div>
      </section>

      <section class="game-section" id="games">
        <div class="page-width game-grid">
          <div class="game-copy">
            <div class="section-kicker light"><span>02</span> Games that teach</div>
            <h2>Make the call.<br /><em>See what happens.</em></h2>
            <p>Vestera games turn financial choices into missions. The answer is not always obvious—and that is the point.</p>
            <a class="cream-button" href="/games">Enter the arcade <span>→</span></a>
          </div>

          <div class="game-browser" id="game-preview">
            <div class="browser-bar"><i></i><i></i><i></i><span>vestera / games</span></div>
            <div class="game-screen">
              <div class="game-score"><span>LEVEL 2</span><strong>720 <small>XP</small></strong></div>
              <div class="game-title"><small>Bank Rush</small><strong>Which account<br />should Emma use?</strong></div>
              <div class="account-row">
                <button type="button" class="account active"><span>Everyday</span><strong>$39</strong><small>For spending</small></button>
                <button type="button" class="account"><span>Savings</span><strong>$85</strong><small>For later</small></button>
              </div>
              <div class="game-footer"><span>Think about what the money is for.</span><a href="/games/bank-rush" class="game-play-link">Play Bank Rush →</a></div>
            </div>
          </div>
        </div>
      </section>

      <section class="progress-section page-width" id="progress">
        <div class="progress-intro">
          <div class="section-kicker"><span>03</span> Progress you can feel</div>
          <h2>A path that grows<br /><em>with every win.</em></h2>
          <p>No confusing charts. Students see the skill they gained, why it matters, and what they are ready to try next.</p>
        </div>

        <div class="progress-panel">
          <div class="profile-line">
            <div class="profile-avatar">K</div>
            <div><small>Example learning path</small><strong>Money Explorer</strong></div>
            <span class="level-chip">Level 4</span>
          </div>
          <div class="skill-ring-wrap">
            <div class="skill-ring"><span><strong>68%</strong>complete</span></div>
            <div class="skill-copy">
              <small>Strongest skill</small>
              <strong>Smart spending</strong>
              <p>You compare choices before you buy.</p>
            </div>
          </div>
          <div class="skill-bars">
            <div><span>Saving</span><i><b style="width: 82%"></b></i><strong>82</strong></div>
            <div><span>Budgeting</span><i><b style="width: 66%"></b></i><strong>66</strong></div>
            <div><span>Investing</span><i><b style="width: 41%"></b></i><strong>41</strong></div>
          </div>
          <a class="panel-button" href="/stats">View full progress <span>↗</span></a>
        </div>
      </section>

      <section class="family-section" id="families">
        <div class="page-width family-card">
          <div class="family-copy">
            <span class="mini-label">For families & educators</span>
            <h2>Money conversations<br />start right here.</h2>
            <p>Give young people a safe place to practice before the choices become real.</p>
            <a href="/partners">Bring Vestera home <span>→</span></a>
          </div>
          <div class="family-quote">
            <span class="quote-mark">✦</span>
            <p>Practice together, then talk through the choices that matter.</p>
            <div><strong>For families</strong><span>A shared starting point</span></div>
          </div>
        </div>
      </section>
    </main>
`;

export default function Home() {
  const [demoLoading, setDemoLoading] = useState(false);
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-demo-tour]')) {
        if (demoLoading) return;
        setDemoLoading(true);
        void fetch('/api/auth/demo-login', { method: 'POST', credentials: 'same-origin' })
          .catch(() => undefined)
          .finally(() => { startTour(); window.location.assign('/trade'); });
        return;
      }
      const button = target.closest<HTMLButtonElement>('[data-scroll]');
      if (button) document.querySelector(button.dataset.scroll || '')?.scrollIntoView({ behavior: 'smooth' });
      const account = target.closest<HTMLButtonElement>('.account');
      if (account) {
        account.parentElement?.querySelectorAll('.account').forEach(item => item.classList.remove('active'));
        account.classList.add('active');
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [demoLoading]);
  return <div className="approved-home" dangerouslySetInnerHTML={{ __html: markup }} />;
}
