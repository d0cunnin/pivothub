import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileDown, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface Criterion {
  name: string;
  weight: number;
  descriptors: Record<string, string>;
}
interface Rubric {
  title: string;
  scale: string[];
  criteria: Criterion[];
  totalPoints: number;
}

export default function RubricBuilder() {
  const [loading, setLoading] = useState(false);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [form, setForm] = useState({ assignment: '', gradeLevel: '', criteriaCount: '5', scaleLevels: '4' });
  const update = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleGenerate = async () => {
    if (!form.assignment.trim() || !form.gradeLevel.trim()) { toast.error('Assignment and grade level required.'); return; }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Please sign in.'); return; }
      const { data, error } = await supabase.functions.invoke('rubric-builder', {
        body: form,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setRubric(data.rubric);
      toast.success('Rubric generated! (3 credits used)');
    } catch (e: any) { toast.error(e.message || 'Generation failed'); }
    finally { setLoading(false); }
  };

  const handlePDF = () => {
    if (!rubric) return;
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;
    let y = margin;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
    doc.text(rubric.title, margin, y); y += 8;

    const colWidth = (pageW - margin * 2 - 50) / rubric.scale.length;
    const rowH = 18;

    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('Criterion', margin, y + 5);
    rubric.scale.forEach((s, i) => {
      doc.text(s, margin + 50 + i * colWidth + 2, y + 5);
    });
    y += rowH;

    doc.setFont('helvetica', 'normal');
    rubric.criteria.forEach(c => {
      if (y > pageH - margin - rowH) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      const nameLines = doc.splitTextToSize(`${c.name} (${c.weight}%)`, 48);
      doc.text(nameLines, margin, y + 5);
      doc.setFont('helvetica', 'normal');
      rubric.scale.forEach((s, i) => {
        const d = c.descriptors[s] || '';
        const wrapped = doc.splitTextToSize(d, colWidth - 4);
        doc.text(wrapped, margin + 50 + i * colWidth + 2, y + 5);
      });
      doc.line(margin, y, pageW - margin, y);
      y += Math.max(rowH, 5 * Math.max(...rubric.scale.map(s => doc.splitTextToSize(c.descriptors[s] || '', colWidth - 4).length)));
    });

    doc.save(`rubric-${form.assignment.slice(0, 20).replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <Card className="max-w-5xl mx-auto">
      {!rubric ? (
        <>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />Rubric Builder</CardTitle>
            <CardDescription>Multi-level scoring rubrics with observable, level-by-level descriptors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Assignment Description *</Label><Textarea rows={3} value={form.assignment} onChange={e => update('assignment', e.target.value)} placeholder="Persuasive essay arguing for a school policy change" /></div>
            <div className="grid md:grid-cols-3 gap-4">
              <div><Label>Grade Level *</Label><Input value={form.gradeLevel} onChange={e => update('gradeLevel', e.target.value)} placeholder="10th grade" /></div>
              <div><Label>Criteria Count</Label><Input type="number" min={3} max={8} value={form.criteriaCount} onChange={e => update('criteriaCount', e.target.value)} /></div>
              <div>
                <Label>Scale Levels</Label>
                <Select value={form.scaleLevels} onValueChange={v => update('scaleLevels', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 levels</SelectItem>
                    <SelectItem value="4">4 levels</SelectItem>
                    <SelectItem value="5">5 levels</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={loading} size="lg" className="w-full">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</> : <>Generate Rubric (3 Credits)</>}
            </Button>
          </CardContent>
        </>
      ) : (
        <>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>{rubric.title}</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" onClick={handlePDF}><FileDown className="h-4 w-4 mr-1" />PDF</Button>
                <Button variant="secondary" size="sm" onClick={() => setRubric(null)}>New</Button>
              </div>
            </div>
            <CardDescription>Total: {rubric.totalPoints} points</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[140px]">Criterion</TableHead>
                  {rubric.scale.map(s => <TableHead key={s}>{s}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rubric.criteria.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium align-top">{c.name}<div className="text-xs text-muted-foreground">{c.weight}%</div></TableCell>
                    {rubric.scale.map(s => (
                      <TableCell key={s} className="align-top text-sm">{c.descriptors[s] || '—'}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </>
      )}
    </Card>
  );
}
