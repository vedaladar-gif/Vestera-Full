import Image from 'next/image';
import Link from 'next/link';
import PressKit from '@/components/PressKit';

export const metadata = { title: 'About Vestera | Mission & Leadership' };

export default function About() {
  return <main className="org-page org-story">
    <header id="team" className="mission-intro">
      <p className="org-caption">Our mission</p>
      <h1>Bridging the financial literacy gap before high school.</h1>
      <p>Most students graduate high school without ever learning how compound interest, budgeting, or investing actually work. Vestera pairs trained high school mentors with local elementary schools and youth programs to teach foundational financial literacy through interactive simulations, games, and hands-on workshops—completely free of charge.</p>
    </header>
    <section>
      <h2>The founding team</h2>
      <div className="org-portraits">{[['Sourish','School outreach & design','Sourish coordinates school outreach. He also helps design the Vestera website.'],['Kiaan','Community outreach & web','Kiaan identifies schools and youth organizations for the team to contact. He also helps build the website.'],['Vedant','Web development','Vedant develops the Vestera website. His work supports the online platform students use alongside the workshops.']].map(([name,role,description]) =>
        <figure key={name}>
          <Image src={'/founders/' + name.toLowerCase() + '.jpg'} width={480} height={520} alt={name}/>
          <figcaption>{name}<small>Co-founder · {role}</small><small>Green Level High School</small><p>{description}</p></figcaption>
        </figure>
      )}</div>
    </section>
    <aside className="press-kit">Vestera thanks the faculty advisors, PTA coordinators, and community supporters who help bring workshops to students, including founding sponsor Winnie Beach CPA.</aside>
    <section id="impact"><h2>Inside the workshops</h2>
      <div className="workshop-gallery">
        <figure><Image src="/images/workshops/banking.webp" width={900} height={675} alt="Mentor comparing debit and credit cards on a classroom screen"/><figcaption>Banking lesson · Comparing debit and credit cards</figcaption></figure>
        <figure><Image src="/images/workshops/curriculum.webp" width={900} height={675} alt="Two Vestera presenters beside the Curriculum Night screen"/><figcaption>Curriculum Night · Introducing the program</figcaption></figure>
      </div>
      <h2>Milestones</h2><ol className="milestones"><li><b>2026</b> Expanded outreach across six Wake County elementary schools and YMCA of the Triangle.</li><li><b>2026</b> Launched the four-session after-school curriculum at Apex Elementary School.</li><li><b>2025–2026</b> Recognition through regional DECA and youth entrepreneurship initiatives, and founding sponsorship from Winnie Beach CPA.</li></ol>
      <PressKit/><p><Link href="/programs#partners">Explore the partner directory →</Link></p></section>
  </main>;
}
