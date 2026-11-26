'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, BookOpen, ChartNoAxesColumn, Check, CircleDollarSign, CreditCard, Sparkles, Star, Target, TrendingUp, Trophy, Users } from 'lucide-react';
import { startTour } from '@/lib/onboarding';
import './approved-home.css';

const impact = [
  { value: '150+', label: 'Students taught (team estimate)' },
  { value: '7', label: 'Schools and youth organizations in our outreach' },
  { value: '4', label: 'Sessions in the after-school curriculum' },
  { value: '$0', label: 'Workshop cost for schools and families' },
];

const steps = [
  { icon: BookOpen, title: 'Read a money story', text: 'Follow an everyday decision about earning, budgeting, or saving and choose what you would do.' },
  { icon: Target, title: 'Take on a challenge', text: 'Put what you learned to work in a quick quiz or a real-life money scenario.' },
  { icon: TrendingUp, title: 'Trade with practice cash', text: 'Buy and sell stocks in the simulator with pretend money and see how prices change.' },
];

const games = [
  { icon: TrendingUp, title: 'Wall Street Challenge', text: 'Manage a portfolio through eight rounds of market news.', href: '/games/wall-street-challenge' },
  { icon: CreditCard, title: 'Bank Rush', text: 'Help customers decide what to spend, save, and deposit.', href: '/games/bank-rush' },
  { icon: CircleDollarSign, title: 'Piggy Bank Boss', text: 'Make a savings plan and keep it going when surprises hit.', href: '/games/piggy-bank-boss' },
  { icon: Trophy, title: 'Leaderboard', text: 'See how you rank alongside other Vestera learners.', href: '/stats' },
];

const classroom = [
  { icon: Users, title: 'Student-led workshops', text: 'High school mentors lead hands-on sessions at your school or club.' },
  { icon: BookOpen, title: 'Ready-to-use lessons', text: 'Explore budgeting, banking, and investing with stories and worksheets.' },
  { icon: ChartNoAxesColumn, title: 'Class competitions', text: 'Practice making trades as a group, then compare decisions.' },
];

function PracticePortfolio() {
  const [answer, setAnswer] = useState<'up' | 'down'>();
  return <aside className="practice" aria-label="Example practice portfolio">
    <span className="streak"><Star size={13} fill="currentColor" aria-hidden="true"/> 5-day streak</span>
    <div className="practice-top"><strong>Practice portfolio</strong><span>Level 3 · Investor</span></div>
    <strong className="balance">$10,482.15</strong>
    <p className="gain">+$482.15 (4.8%) this week</p>
    <svg className="price-chart" viewBox="0 0 350 94" preserveAspectRatio="none" role="img" aria-label="Illustrative practice portfolio trending upward over the week">
      <path d="M0 75L35 68L70 72L105 56L140 60L175 45L210 49L245 30L280 36L315 20L350 12V94H0Z" fill="#e7edfc"/>
      <path d="M0 75L35 68L70 72L105 56L140 60L175 45L210 49L245 30L280 36L315 20L350 12" fill="none" stroke="#416ae5" strokeWidth="2.5"/>
    </svg>
    <div className="holding"><span>SNAK</span><div><strong>Sunny Snacks Co.</strong><small>12 shares</small></div><b>$1,284.00</b></div>
    <div className="quiz"><strong>Chapter 3 · Why do prices move?</strong>
      <p>Sunny Snacks just launched a new flavor that’s selling out. What happens to the stock?</p>
      <div>{(['up','down'] as const).map(choice => <button type="button" key={choice} aria-pressed={choice === answer} onClick={() => setAnswer(choice)}>It goes {choice}</button>)}</div>
      <p role="status" className="quiz-feedback">{answer === 'up' ? 'It could. Strong sales can lift expectations for profits.' : answer === 'down' ? 'It could fall if investors expected even stronger sales. A popular product alone doesn’t decide the price.' : ''}</p>
    </div>
  </aside>;
}

export default function Home() {
  const [demoState, setDemoState] = useState<'idle'|'loading'|'error'>('idle');
  async function demo() {
    if (demoState === 'loading') return;
    setDemoState('loading');
    try {
      const response = await fetch('/api/auth/demo-login', { method:'POST', credentials:'same-origin' });
      if (!response.ok) throw new Error();
      startTour();
      window.location.assign('/trade');
    } catch { setDemoState('error'); }
  }
  function actions(inHero: boolean) {
    return <><div className="home-actions">
      <Link href="/learn" className="action primary">Start learning free {inHero && <ArrowRight aria-hidden="true" size={16}/>}</Link>
      <button type="button" className="action secondary" disabled={demoState === 'loading'} onClick={demo}>
        {inHero && <TrendingUp aria-hidden="true" size={16}/>} {demoState === 'loading' ? 'Opening demo…' : 'Try the trading demo'}
      </button>
    </div>{demoState === 'error' && <p role="alert">The demo couldn’t open. Please try again.</p>}</>;
  }
  return <main className="approved-home" id="top">
    <section className="home-hero"><div className="home-wrap split">
      <div><p className="origin"><Sparkles size={15} aria-hidden="true"/>Student-led financial literacy · Wake &amp; Chatham County, NC</p>
        <h1>Grow smart<br/>with <span>money.</span></h1>
        <p className="intro">Learn how money works through stories, challenges, and a stock market simulator with practice cash. Made for curious minds of every age, not finance experts.</p>
        {actions(true)}
        <ul className="checks">{['Free to start','No real money, ever','Built by students'].map(text=><li key={text}><Check aria-hidden="true" size={14}/>{text}</li>)}</ul>
      </div>
      <PracticePortfolio/>
    </div></section>
    <section className="numbers" aria-label="Vestera in numbers"><dl className="home-wrap">
      {impact.map(({ value, label }) =>
        <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl></section>
    <section className="how band" id="how-it-works"><div className="home-wrap">
      <p className="kicker">How it works</p><h2>From your first dollar to<br/> your first trade.</h2>
      <ol className="steps">{steps.map(({icon:Icon,title,text},i)=><li key={title}><div><Icon aria-hidden="true" className="tile-icon"/><span>0{i+1}</span></div><h3>{title}</h3><p>{text}</p></li>)}</ol>
    </div></section>
    <section className="games-band band" id="games"><div className="home-wrap split">
      <div><p className="kicker">Games</p><h2>Play your way to<br/> money smarts.</h2><p>Earn badges, build your streak, and see how you rank on the leaderboard.</p><Link className="text-link" href="/games">See all games <ArrowRight aria-hidden="true" size={16}/></Link></div>
      <div className="game-tiles">{games.map(({icon:Icon,title,text,href})=><Link href={href} key={href}><Icon aria-hidden="true" size={22}/><h3>{title}</h3><p>{text}</p></Link>)}</div>
    </div></section>
    <section className="story band"><div className="home-wrap split">
      <div><p className="kicker">Made by students, for everyone</p><h2>We built the class we wish school had.</h2>
        <p>Vestera started with high school students in North Carolina. We bring the money decisions we’re learning to make into games, stories, and free after-school workshops.</p></div>
      <figure className="review"><p>Few groups in the area offer after-school programs like Vestera’s for free. Families usually pay for similar activities.</p>
        <figcaption><span className="review-avatar"><Users aria-hidden="true" size={20}/></span><div><strong>Principal, Apex Elementary School</strong><small>Paraphrased from feedback shared with Vestera</small></div></figcaption></figure>
    </div></section>
    <section className="teachers band" id="teachers"><div className="home-wrap split">
      <div><p className="kicker">For teachers &amp; clubs</p><h2>Bring Vestera to your classroom.</h2>
        <p>We partner with schools and clubs across Wake and Chatham counties to make financial literacy hands-on.</p>
        <Link className="action school-link" href="/programs#schools">Partner with us <ArrowRight aria-hidden="true" size={16}/></Link></div>
      <ul>{classroom.map(({icon:Icon,title,text})=><li key={title}><Icon aria-hidden="true" className="tile-icon"/><div><h3>{title}</h3><p>{text}</p></div></li>)}</ul>
    </div></section>
    <section className="closing"><div className="home-wrap"><h2>Your money story starts today.</h2>
      <p>Make your first trade with practice cash.<br/> No sign-up needed to try the demo.</p>{actions(false)}</div></section>
  </main>;
}
