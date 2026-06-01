import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, FileDown, Sparkles, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';

export default function LessonPlanGenerator() {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [form, setForm] = useState({ subject: '', gradeLevel: '', duration: '45 minutes', objectives: '', materials: '' });
  const update = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleGenerate = async () => {
    if (!form.subject.trim() || !form.gradeLevel.trim() || !form.objectives.trim()) {
      toast.error('Subject, grade level, and objectives are required.');
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Please sign in.'); return; }
      const { data, error } = await supabase.functions.invoke('lesson-plan', {
        body: form,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setContent(data.content);
      toast.success('Lesson plan generated! (5 credits used)');
    } catch (e: any) { toast.error(e.message || 'Generation failed'); }
    finally { setLoading(false); }
  };

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    toast.success('Copied');
  };

  const handlePDF = () => {
    if (!content) return;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 18;
    let y = margin;
    const lines = content.split('\n');
    for (const line of lines) {
      if (y > pageH - margin) { doc.addPage(); y = margin; }
      if (line.startsWith('## ')) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
        const w = doc.splitTextToSize(line.replace('## ', ''), pageW - margin * 2);
        doc.text(w, margin, y); y += w.length * 7 + 3;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      } else if (line.startsWith('### ')) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
        const w = doc.splitTextToSize(line.replace('### ', ''), pageW - margin * 2);
        doc.text(w, margin, y); y += w.length * 6 + 2;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      } else if (line.trim()) {
        const w = doc.splitTextToSize(line.replace(/^[-*]\s/, '• '), pageW - margin * 2);
        doc.text(w, margin, y); y += w.length * 5 + 1;
      } else { y += 3; }
    }
    doc.save(`lesson-plan-${form.subject.replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <Card className="max-w-3xl mx-auto">
      {!content ? (
        <>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />Lesson Plan Generator</CardTitle>
            <CardDescription>Standards-aligned lesson plans with warm-up, instruction, practice, and assessment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Subject *</Label><Input value={form.subject} onChange={e => update('subject', e.target.value)} placeholder="Algebra I — Linear Equations" /></div>
              <div><Label>Grade Level *</Label><Input value={form.gradeLevel} onChange={e => update('gradeLevel', e.target.value)} placeholder="9th grade" /></div>
              <div><Label>Duration</Label><Input value={form.duration} onChange={e => update('duration', e.target.value)} /></div>
              <div><Label>Materials</Label><Input value={form.materials} onChange={e => update('materials', e.target.value)} placeholder="Whiteboard, graph paper" /></div>
            </div>
            <div><Label>Learning Objectives *</Label><Textarea rows={4} value={form.objectives} onChange={e => update('objectives', e.target.value)} placeholder="Students will be able to solve two-step linear equations..." /></div>
            <Button onClick={handleGenerate} disabled={loading} size="lg" className="w-full">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</> : <>Generate Lesson Plan (5 Credits)</>}
            </Button>
          </CardContent>
        </>
      ) : (
        <>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>Lesson Plan: {form.subject}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}><Copy className="h-4 w-4 mr-1" />Copy</Button>
                <Button size="sm" onClick={handlePDF}><FileDown className="h-4 w-4 mr-1" />PDF</Button>
                <Button variant="secondary" size="sm" onClick={() => setContent(null)}>New</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}
