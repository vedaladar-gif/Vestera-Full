'use client';

import { useState, type FormEvent } from 'react';

type Field = {label: string; type?: string; required?: boolean; options?: string[]; hint?: string};
type FormDefinition = {subject: string; button: string; fields: Field[]};
const tiers = ['Classroom Supporter','Chapter Sponsor','Regional Presenting Partner','In-Kind / Custom Partnership'];
const forms: Record<'school'|'chapter'|'sponsor', FormDefinition> = {
  school: {subject:'New School / PTA Program Request', button:'Request a Vestera Program', fields:[
    {label:'School or organization name',required:true},{label:'Your name',required:true},
    {label:'Your role',options:['Principal / Administrator','PTA / PTO Board Member','Teacher','YMCA / Youth Program Director','Parent']},
    {label:'Email address',type:'email',required:true},{label:'Preferred format',type:'checkbox',options:['After-School Club','In-Class Workshop','Camp / Special Event']},
    {label:'Target grades and estimated student count',hint:'4th–5th grade, about 25 students'},{label:'Additional details or preferred dates',type:'textarea'}]},
  chapter: {subject:'New Vestera Chapter Application',button:'Apply to Start a Chapter',fields:[
    {label:'Applicant full name',required:true},{label:'High school and graduation year',required:true},{label:'City and state',required:true},
    {label:'Email address',type:'email',required:true},{label:'Instagram handle (optional)'},{label:'Target elementary or middle schools'},
    {label:'Why do you want to lead a Vestera chapter?',type:'textarea',hint:'Two or three sentences'}]},
  sponsor: {subject:'New Vestera Sponsor Inquiry',button:'Submit Sponsorship Inquiry',fields:[
    {label:'Company or firm name',required:true},{label:'Contact name and title',required:true},{label:'Work email',type:'email',required:true},
    {label:'Company website URL',type:'url'},{label:'Sponsorship interest',options:tiers},{label:'Message or questions',type:'textarea'}]}
};

export default function OrganizationInquiry({kind}:{kind:keyof typeof forms}) {
  const {subject,button,fields} = forms[kind];
  const [notice,setNotice] = useState('');
  const [busy,setBusy] = useState(false);
  const endpoint = process.env.NEXT_PUBLIC_VESTERA_FORMSPREE_ID;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!endpoint) {
      const message = fields.map(({label}) => label + ': ' + data.getAll(label).join(', ')).join('\n');
      window.location.href = 'mailto:vesteratrading@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(message);
      setNotice('Send the prepared message in your email app to finish. You can also email vesteratrading@gmail.com directly.');
      return;
    }
    setBusy(true);
    setNotice('');
    try {
      const response = await fetch('https://formspree.io/f/'+encodeURIComponent(endpoint),{method:'POST',body:data,headers:{Accept:'application/json'}});
      if (!response.ok) throw new Error();
      form.reset();
      setNotice("Thanks! Your message has been sent to the Vestera team (vesteratrading@gmail.com). We'll respond within 48 hours.");
    } catch {setNotice('Your message could not be sent. Please try again or email vesteratrading@gmail.com.');}
    finally {setBusy(false);}
  }
  return <form className="org-form" onSubmit={submit}>
    <input type="hidden" name="subject" value={subject}/>
    {fields.map(field => field.type === 'checkbox' ? <fieldset key={field.label}><legend>{field.label}</legend>{field.options?.map(value => <label key={value}><input type="checkbox" name={field.label} value={value}/> {value}</label>)}</fieldset> :
      <label key={field.label}>{field.label}{field.required && ' *'}
        {field.options ? <select name={field.label} defaultValue=""><option value="">Select an option</option>{field.options.map(option=><option key={option}>{option}</option>)}</select>
        : field.type === 'textarea' ? <textarea name={field.label} rows={3} maxLength={1800} placeholder={field.hint}/>
        : <input name={field.label} type={field.type || 'text'} required={field.required} maxLength={200} placeholder={field.hint}/>}
      </label>)}
    {!endpoint && <small>This opens a draft addressed to vesteratrading@gmail.com.</small>}
    <button className="org-launch" disabled={busy}>{busy ? 'Sending…' : button}</button>
    {notice && <p role="status" className={notice.startsWith('Thanks')?'sent':''}>{notice}</p>}
  </form>;
}
