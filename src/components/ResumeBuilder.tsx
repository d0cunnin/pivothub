import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileDown, Sparkles, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { invokeFunction } from '@/lib/invokeFunction';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface ExperienceItem {
  title: string;
  company: string;
  dates: string;
  bullets: string[];
}
interface EducationItem {
  credential: string;
  institution: string;
  year: string;
}
interface ResumePayload {
  headline: string;
  summary: string;
  coreSkills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: string[];
  keywords: string[];
}
interface ContactPayload {
  fullName: string;
  email: string | null;
  phone: string | null;
  location: string | null;
}

export default function ResumeBuilder() {
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState<ResumePayload | null>(null);
  const [contact, setContact] = useState<ContactPayload | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    targetRole: '',
    yearsExperience: '',
    summaryFocus: '',
    topSkills: '',
    workHistory: '',
    education: '',
    certifications: '',
    tone: 'professional' as 'professional' | 'modern' | 'executive',
  });

  const update = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleGenerate = async () => {
    if (!form.fullName.trim() || !form.targetRole.trim() || !form.topSkills.trim() || !form.workHistory.trim()) {
      toast.error('Please fill in name, target role, skills, and work history.');
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to continue.');
        return;
      }
      const { data, error } = await invokeFunction('resume-builder', {
        body: form,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.resume) throw new Error('No resume returned.');
      setResume(data.resume);
      setContact(data.contact);
      toast.success('Resume generated! (5 credits used)');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to generate resume.');
    } finally {
      setLoading(false);
    }
  };

  const buildPlainText = () => {
    if (!resume || !contact) return '';
    const lines: string[] = [];
    lines.push(contact.fullName.toUpperCase());
    const contactBits = [contact.email, contact.phone, contact.location].filter(Boolean);
    if (contactBits.length) lines.push(contactBits.join(' | '));
    lines.push('');
    if (resume.headline) { lines.push(resume.headline); lines.push(''); }
    lines.push('PROFESSIONAL SUMMARY');
    lines.push(resume.summary); lines.push('');
    lines.push('CORE SKILLS');
    lines.push(resume.coreSkills.join(' • ')); lines.push('');
    lines.push('EXPERIENCE');
    resume.experience.forEach(e => {
      lines.push(`${e.title} — ${e.company} (${e.dates})`);
      e.bullets.forEach(b => lines.push(`  • ${b}`));
      lines.push('');
    });
    if (resume.education?.length) {
      lines.push('EDUCATION');
      resume.education.forEach(e => lines.push(`${e.credential} — ${e.institution} (${e.year})`));
      lines.push('');
    }
    if (resume.certifications?.length) {
      lines.push('CERTIFICATIONS');
      resume.certifications.forEach(c => lines.push(`• ${c}`));
    }
    return lines.join('\n');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildPlainText());
    toast.success('Copied to clipboard');
  };

  const handleDownloadPDF = () => {
    if (!resume || !contact) return;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 18;
    const maxW = pageW - margin * 2;
    let y = margin;

    const ensureSpace = (need: number) => {
      if (y + need > pageH - margin) { doc.addPage(); y = margin; }
    };

    doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
    doc.text(contact.fullName, margin, y); y += 8;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    const cb = [contact.email, contact.phone, contact.location].filter(Boolean).join(' | ');
    if (cb) { doc.text(cb, margin, y); y += 6; }
    if (resume.headline) { doc.setFont('helvetica', 'italic'); doc.text(resume.headline, margin, y); y += 8; }

    const section = (title: string, body: () => void) => {
      ensureSpace(14);
      y += 2;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      doc.text(title, margin, y); y += 2;
      doc.setLineWidth(0.3); doc.line(margin, y, pageW - margin, y); y += 5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      body();
    };

    section('PROFESSIONAL SUMMARY', () => {
      const lines = doc.splitTextToSize(resume.summary, maxW);
      ensureSpace(lines.length * 5);
      doc.text(lines, margin, y); y += lines.length * 5 + 2;
    });

    section('CORE SKILLS', () => {
      const skills = resume.coreSkills.join(' • ');
      const lines = doc.splitTextToSize(skills, maxW);
      ensureSpace(lines.length * 5);
      doc.text(lines, margin, y); y += lines.length * 5 + 2;
    });

    section('EXPERIENCE', () => {
      resume.experience.forEach(exp => {
        ensureSpace(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${exp.title} — ${exp.company}`, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(exp.dates, pageW - margin, y, { align: 'right' });
        y += 5;
        exp.bullets.forEach(b => {
          const lines = doc.splitTextToSize(`• ${b}`, maxW - 4);
          ensureSpace(lines.length * 5);
          doc.text(lines, margin + 4, y); y += lines.length * 5;
        });
        y += 3;
      });
    });

    if (resume.education?.length) {
      section('EDUCATION', () => {
        resume.education.forEach(ed => {
          ensureSpace(6);
          doc.text(`${ed.credential} — ${ed.institution} (${ed.year})`, margin, y); y += 5;
        });
      });
    }

    if (resume.certifications?.length) {
      section('CERTIFICATIONS', () => {
        resume.certifications.forEach(c => {
          ensureSpace(5);
          doc.text(`• ${c}`, margin, y); y += 5;
        });
      });
    }

    doc.save(`${contact.fullName.replace(/\s+/g, '-')}-resume.pdf`);
    toast.success('PDF downloaded');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {!resume ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Resume Builder</CardTitle>
            <CardDescription>Generate an ATS-friendly resume with quantified, results-oriented bullets.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input value={form.fullName} onChange={e => update('fullName', e.target.value)} placeholder="Jane Doe" />
              </div>
              <div>
                <Label>Target Role *</Label>
                <Input value={form.targetRole} onChange={e => update('targetRole', e.target.value)} placeholder="Senior Product Manager" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => update('phone', e.target.value)} />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={form.location} onChange={e => update('location', e.target.value)} placeholder="Austin, TX" />
              </div>
              <div>
                <Label>Years of Experience</Label>
                <Input value={form.yearsExperience} onChange={e => update('yearsExperience', e.target.value)} placeholder="8" />
              </div>
              <div>
                <Label>Tone</Label>
                <Select value={form.tone} onValueChange={v => update('tone', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Summary Focus (optional)</Label>
                <Input value={form.summaryFocus} onChange={e => update('summaryFocus', e.target.value)} placeholder="B2B SaaS growth" />
              </div>
            </div>
            <div>
              <Label>Top Skills * (comma-separated)</Label>
              <Textarea rows={2} value={form.topSkills} onChange={e => update('topSkills', e.target.value)} placeholder="Product strategy, A/B testing, SQL, Figma, Roadmapping" />
            </div>
            <div>
              <Label>Work History *</Label>
              <Textarea rows={6} value={form.workHistory} onChange={e => update('workHistory', e.target.value)} placeholder="List jobs with title, company, dates, and 1-2 sentence description of responsibilities and impact. Example:&#10;Sr PM at Acme (2020-Present): Led mobile app redesign...&#10;PM at Beta (2017-2020): Owned billing product..." />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Education</Label>
                <Textarea rows={3} value={form.education} onChange={e => update('education', e.target.value)} placeholder="BS Computer Science, UT Austin, 2015" />
              </div>
              <div>
                <Label>Certifications</Label>
                <Textarea rows={3} value={form.certifications} onChange={e => update('certifications', e.target.value)} placeholder="PMP, CSPO, Google Analytics" />
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={loading} size="lg" className="w-full">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Building Resume…</> : <><Sparkles className="mr-2 h-4 w-4" />Generate Resume (5 Credits)</>}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>{contact?.fullName}</CardTitle>
                <CardDescription>{resume.headline}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}><Copy className="h-4 w-4 mr-2" />Copy</Button>
                <Button size="sm" onClick={handleDownloadPDF}><FileDown className="h-4 w-4 mr-2" />Download PDF</Button>
                <Button variant="secondary" size="sm" onClick={() => { setResume(null); setContact(null); }}>New Resume</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="font-semibold mb-2">Professional Summary</h3>
              <p className="text-sm leading-relaxed">{resume.summary}</p>
            </section>
            <section>
              <h3 className="font-semibold mb-2">Core Skills</h3>
              <div className="flex flex-wrap gap-2">
                {resume.coreSkills.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
              </div>
            </section>
            <section>
              <h3 className="font-semibold mb-2">Experience</h3>
              <div className="space-y-4">
                {resume.experience.map((exp, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm font-medium">
                      <span>{exp.title} — {exp.company}</span>
                      <span className="text-muted-foreground">{exp.dates}</span>
                    </div>
                    <ul className="list-disc pl-5 text-sm mt-1 space-y-1">
                      {exp.bullets.map((b, j) => <li key={j}>{b}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
            {resume.education?.length > 0 && (
              <section>
                <h3 className="font-semibold mb-2">Education</h3>
                <ul className="text-sm space-y-1">
                  {resume.education.map((e, i) => <li key={i}>{e.credential} — {e.institution} ({e.year})</li>)}
                </ul>
              </section>
            )}
            {resume.certifications?.length > 0 && (
              <section>
                <h3 className="font-semibold mb-2">Certifications</h3>
                <ul className="list-disc pl-5 text-sm">
                  {resume.certifications.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </section>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
