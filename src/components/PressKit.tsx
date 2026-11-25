'use client';
import {useState} from 'react';
const bio = 'Vestera is a student-led financial literacy organization based in Wake County, North Carolina. High school mentors work with elementary schools, PTAs, and youth organizations to offer free local workshops on budgeting, banking, saving, and investing. Through four interactive sessions, students practice making everyday money decisions with worksheets, games, and simulations. Vestera also supports student-led chapters with curriculum and outreach materials, helping local mentors bring financial education to younger learners in their own schools and communities.';
export default function PressKit(){
  const [status,setStatus]=useState('');
  return <aside className="press-kit"><h3>Press &amp; media kit</h3><p>{bio}</p>
    <a download href="/vestera-brand-assets.zip">Download brand assets (.ZIP)</a>{' · '}
    <button onClick={async()=>{try{await navigator.clipboard.writeText(bio);setStatus('Official bio copied.');}catch{setStatus('Select the bio above to copy it.');}}}>Copy official bio</button><span role="status">{status}</span></aside>;
}
