import Image from 'next/image';
import Link from 'next/link';
import { CHAPTERS } from '@/lib/chapterDirectory';

export const metadata = { title: 'About Vestera | Mission & Leadership' };

export default function About() {
  return <main className="org-page org-story">
    <header>
      <p className="org-caption">About Vestera</p>
      <h1>Financial literacy, taught by students.</h1>
      <p>Vestera started at Green Level High School in Cary, North Carolina. Our student leaders help younger learners work through the money choices they will eventually make for themselves.</p>
    </header>
    <section id="team">
      <h2>The founding team</h2>
      <div className="org-portraits">{['Sourish', 'Kiaan', 'Vedant'].map(name =>
        <figure key={name}>
          <Image src={'/founders/' + name.toLowerCase() + '.jpg'} width={480} height={520} alt={name}/>
          <figcaption>{name}<small>Vestera co-founder</small></figcaption>
        </figure>
      )}</div>
    </section>
    <section className="org-spread" id="impact">
      <div><p className="org-caption">Our reach</p><h2>From one school to a chapter network</h2></div>
      <div><p>The chapter directory lists {CHAPTERS.length} schools. Each has a student lead or founding team that other students and educators can identify.</p>
        <Link href="/programs#partners">Find a chapter →</Link>
        <h3>Press &amp; awards inquiries</h3><p>For an interview with the founders, a program description, or information about recognition, write to <a href="mailto:vesteratrading@gmail.com">vesteratrading@gmail.com</a>.</p>
      </div>
    </section>
  </main>;
}
