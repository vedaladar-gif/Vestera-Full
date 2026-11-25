import OrganizationInquiry from '@/components/OrganizationInquiry';
import { CHAPTERS } from '@/lib/chapterDirectory';
export const metadata={title:'Programs & Partners | Vestera'};
const partners=[
 ['Apex Elementary School','Apex, NC (WCPSS)','After-school finance club · four-session cohort','Active'],
 ['YMCA of the Triangle','Wake County, NC','Youth enrichment & financial literacy','Active'],
 ...[['Southeast Raleigh Elementary','Raleigh'],['Alston Ridge Elementary','Cary'],['Davis Drive Elementary','Cary'],['Wakefield Elementary','Raleigh']].map(([name,city])=>[name,city+', NC (WCPSS)','Elementary financial literacy outreach','Partner school'])
];
export default function Programs(){return <main className="org-page program-page">
 <header><p className="org-caption">Programs &amp; partners</p><h1>Financial literacy for your school.</h1><p>Plan a workshop with Vestera or bring the curriculum to your community as a student chapter lead.</p></header>
 <nav className="program-tabs" aria-label="Program sections"><a href="#partners">Active Partners</a><a href="#schools">For Schools &amp; PTAs</a><a href="#chapters">Start a Chapter</a></nav>
 <section id="partners"><h2>Partner schools &amp; organizations</h2><div className="table-frame"><table><thead><tr>{['Organization','Location / district','Program format','Status'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{partners.map(([name,...cells])=><tr key={name}><th scope="row">{name}</th>{cells.map(cell=><td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div>
 <h3>Student chapters</h3><div className="org-directory">{CHAPTERS.map(c=><div key={c.name}><strong>{c.name}</strong><span>{c.location}</span></div>)}</div></section>
 <section id="schools"><h2>Bring Vestera to your school</h2><div className="benefits"><article><h3>Free for schools and families</h3><p>Vestera provides slide decks, digital simulations, and printed worksheets.</p></article><article><h3>Four workshop sessions</h3><ol><li>Needs, wants and budgeting</li><li>Banking and saving</li><li>Compound interest</li><li>Stocks and smart investing</li></ol></article><article><h3>Student mentors</h3><p>Vetted high school finance students lead sessions with your PTA advisor or after-school coordinator.</p></article></div><h3>Request a workshop</h3><OrganizationInquiry kind="school"/></section>
 <section id="chapters" className="org-spread"><div><h2>Start a chapter</h2><p>Bring Vestera to elementary schools in your area with our complete curriculum, interactive web platform, PTA outreach templates, and mentorship from the executive team.</p></div><OrganizationInquiry kind="chapter"/></section></main>;}
