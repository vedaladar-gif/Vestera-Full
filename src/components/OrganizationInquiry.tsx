'use client';

import { useState, type FormEvent } from 'react';
import { submitInquiry } from '@/lib/submitInquiry';

type Field = {label: string; type?: string; required?: boolean; options?: string[]; hint?: string};
type FormDefinition = {nameField: string; organizationField: string; button: string; fields: Field[]};
const tiers = ['Classroom Supporter','Chapter Sponsor','Regional Presenting Partner','In-Kind / Custom Partnership'];
const forms: Record<'school'|'chapter'|'sponsor', FormDefinition> = {
  school: {nameField:'Your name',organizationField:'School or organization name', button:'Request a Vestera Program', fields:[
    {label:'School or organization name',required:true},{label:'Your name',required:true},
    {label:'Your role',options:['Principal / Administrator','PTA / PTO Board Member','Teacher','YMCA / Youth Program Director','Parent']},
    {label:'Email address',type:'email',required:true},{label:'Preferred format',type:'checkbox',options:['After-School Club','In-Class Workshop','Camp / Special Event']},
    {label:'Target grades and estimated student count',hint:'4th–5th grade, about 25 students'},{label:'Additional details or preferred dates',type:'textarea'}]},
  chapter: {nameField:'Applicant full name',organizationField:'High school and graduation year',button:'Apply to Start a Chapter',fields:[
    {label:'Applicant full name',required:true},{label:'High school and graduation year',required:true},{label:'City and state',required:true},
    {label:'Email address',type:'email',required:true},{label:'Instagram handle (optional)'},{label:'Target elementary or middle schools'},
    {label:'Why do you want to lead a Vestera chapter?',type:'textarea',hint:'Two or three sentences'}]},
  sponsor: {nameField:'Contact name and title',organizationField:'Company or firm name',button:'Submit Sponsorship Inquiry',fields:[
    {label:'Company or firm name',required:true},{label:'Contact name and title',required:true},{label:'Work email',type:'email',required:true},
    {label:'Company website URL',type:'url'},{label:'Sponsorship interest',options:tiers},{label:'Message or questions',type:'textarea'}]}
};

export default function OrganizationInquiry({kind}:{kind:keyof typeof forms}) {
  const {nameField,organizationField,button,fields} = forms[kind];
  const [notice,setNotice] = useState('');
  const [busy,setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const emailField = fields.find(field => field.type === 'email')!.label;
    const details = fields.filter(({label}) => ![nameField, organizationField, emailField].includes(label))
      .map(({label}) => [label, data.getAll(label).join(', ').trim()])
      .filter(([, value]) => value)
      .map(([label, value]) => label + ': ' + value).join('\n');
    setBusy(true);
    setNotice('');
    try {
      const result = await submitInquiry({
        type:kind, fullName:String(data.get(nameField) || ''), organization:String(data.get(organizationField) || ''),
        email:String(data.get(emailField) || ''), message:details,
      });
      if (result.navigating) return;
      form.reset();
      setNotice(result.notice || 'Thanks! Your inquiry was submitted to the Vestera team.');
    } catch (error) {setNotice(error instanceof Error ? error.message : 'Please try again or email vesteratrading@gmail.com.');}
    finally {setBusy(false);}
  }
  return <form className="org-form" onSubmit={submit}>
    {fields.map(field => field.type === 'checkbox' ? <fieldset key={field.label}><legend>{field.label}</legend>{field.options?.map(value => <label key={value}><input type="checkbox" name={field.label} value={value}/> {value}</label>)}</fieldset> :
      <label key={field.label}>{field.label}{field.required && ' *'}
        {field.options ? <select name={field.label} defaultValue=""><option value="">Select an option</option>{field.options.map(option=><option key={option}>{option}</option>)}</select>
        : field.type === 'textarea' ? <textarea name={field.label} rows={3} maxLength={1800} placeholder={field.hint}/>
        : <input name={field.label} type={field.type || 'text'} required={field.required} maxLength={200} placeholder={field.hint}/>}
      </label>)}
    <small>Complete the verification on the next screen to email vesteratrading@gmail.com.</small>
    <button className="org-launch" disabled={busy}>{busy ? 'Sending…' : button}</button>
    {notice && <p role="status" className={notice.startsWith('Thanks')?'sent':''}>{notice}</p>}
  </form>;
}
