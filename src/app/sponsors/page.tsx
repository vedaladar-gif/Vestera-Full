import Link from 'next/link';
export const metadata = { title: 'Community Sponsorship | Vestera' };
const email = 'mailto:vesteratrading@gmail.com?subject=Community%20sponsorship%20inquiry';

export default function Sponsors() {
  return <main className="org-page">
    <header className="sponsor-intro"><div><p className="org-caption">Community sponsorship</p><h1>Help a chapter run its next workshop.</h1></div>
      <div><p>A local business, PTA, or community group can help with one practical part of a session. Start with what you have to offer and the community you want to reach.</p><a className="org-launch" href={email}>Contact the team →</a></div>
    </header>
    <section><h2>What support can look like</h2><dl className="support-list">
      <div><dt>Materials</dt><dd>Offer printing for a budgeting exercise or supplies students can use to record their choices during a game.</dd></div>
      <div><dt>A place to meet</dt><dd>Suggest a library room, classroom, or community space. Include the location, seating capacity, and whether there is a shared screen.</dd></div>
      <div><dt>Time with a professional</dt><dd>Volunteer for a classroom Q&amp;A. Pick a subject students can connect to daily life, such as reading a paycheck or planning for a purchase.</dd></div>
    </dl></section>
    <section className="org-spread"><h2>Arranging support &amp; recognition</h2><div><p>Email your organization’s name, the support you can offer, and any dates you have in mind. The team can discuss a chapter, workshop format, and how your contribution should be credited.</p><a href={email}>vesteratrading@gmail.com</a><p><Link href="/programs#schools">See a sample workshop →</Link></p></div></section>
  </main>;
}
