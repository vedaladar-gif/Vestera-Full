import OrganizationInquiry from '@/components/OrganizationInquiry';
export const metadata={title:'Community Sponsorship | Vestera'};
const benefits=[
 ['Logo & link on vestera.app','Sponsors page','Featured spotlight','Homepage and sponsors page'],
 ['Instagram recognition','One thank-you post','Dedicated spotlight post','Co-branded campaign and stories'],
 ['Logo on workshop slides','—','Included','Title slide partner'],
 ['Mention in PTA and parent recaps','—','Included','Included'],
 ['End-of-semester impact report','—','—','Custom metrics and photos']
];
export default function Sponsors(){return <main className="org-page">
 <header><p className="org-caption">Sponsors</p><h1>Community support for free financial education.</h1></header>
 <section className="sponsor-feature"><div><small>Founding community sponsor</small><strong>Winnie Beach CPA</strong></div><div><h2>Thank you to Winnie Beach CPA for powering youth financial literacy.</h2><p>Winnie Beach CPA’s generous sponsorship directly supports Vestera’s free workshops, printed student workbooks, and digital learning tools for elementary students across Wake County.</p><a href="https://winniebeachcpa.com/" target="_blank" rel="noopener noreferrer">Visit Winnie Beach CPA ↗</a></div></section>
 <section><h2>Sponsorship opportunities</h2><div className="table-frame"><table><thead><tr><th>Benefit</th><th>Classroom Supporter</th><th>Chapter Sponsor <small>Most popular</small></th><th>Regional Presenting Partner</th></tr></thead><tbody>{benefits.map(([name,...values])=><tr key={name}><th scope="row">{name}</th>{values.map((value,i)=><td key={i}>{value}</td>)}</tr>)}</tbody></table></div><a className="org-launch" href="/sponsor-one-pager.pdf" download>Download sponsor one-pager (PDF) ↓</a><p>Questions? <a href="mailto:vesteratrading@gmail.com">Email vesteratrading@gmail.com</a></p></section>
 <section className="org-spread"><h2>Become a sponsor</h2><OrganizationInquiry kind="sponsor"/></section></main>;}
