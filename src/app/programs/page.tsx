import Link from 'next/link';
import ChapterApplyForm from '../chapters/ChapterApplyForm';
import { CHAPTERS } from '@/lib/chapterDirectory';

export const metadata = { title: 'School Programs & Chapters | Vestera' };

export default function Programs() {
  return <main className="org-page">
    <header><p className="org-caption">Programs &amp; partners</p><h1>Plan a Vestera workshop.</h1>
      <p>Use one screen for a group activity, give students time to explore the Academy, or start a chapter that meets throughout the school year.</p>
      <Link className="org-launch" href="/partners">Ask about a school program →</Link>
    </header>
    <section className="org-spread" id="schools">
      <div><p className="org-caption">For teachers and PTAs</p><h2>A first session with Bank Rush</h2><p>Try this sequence with a class or after-school group.</p></div>
      <ol className="session-plan">
        <li><strong>Open the service desk</strong><p>Project <Link href="/games/bank-rush">Bank Rush</Link>. Read a customer’s request aloud and ask students which account they would use.</p></li>
        <li><strong>Talk through the choice</strong><p>Before selecting an answer, ask when the customer needs their money. Compare the class’s reasoning with the game feedback.</p></li>
        <li><strong>Keep exploring</strong><p>Invite students to try the <Link href="/learn">Academy</Link>. Ask each learner to name one decision they would make differently.</p></li>
      </ol>
    </section>
    <section id="partners"><h2>Schools in the chapter network</h2><div className="org-directory">
      {CHAPTERS.map(chapter => <div key={chapter.name}><strong>{chapter.name}</strong><span>{chapter.location}</span></div>)}
    </div><Link href="/partners">Partner organizations &amp; inquiries →</Link></section>
    <section id="chapters" className="org-spread"><h2>Start a student chapter</h2><div><p>Tell us which school you represent, who you hope to teach, and what you would like your first activity to be. The chapter application goes to the Vestera team.</p><ChapterApplyForm/></div></section>
  </main>;
}
