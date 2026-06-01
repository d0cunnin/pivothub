import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileDown, Sparkles, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface Question {
  id: number;
  type: 'multiple-choice' | 'short-answer' | 'true-false';
  prompt: string;
  options?: string[];
  answer: string;
  explanation?: string;
}
interface Quiz {
  title: string;
  instructions: string;
  questions: Question[];
}

export default function QuizGenerator() {
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [form, setForm] = useState({ topic: '', gradeLevel: '', numQuestions: '10', questionType: 'mixed', difficulty: 'medium' });
  const update = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleGenerate = async () => {
    if (!form.topic.trim() || !form.gradeLevel.trim()) { toast.error('Topic and grade level required.'); return; }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Please sign in.'); return; }
      const { data, error } = await supabase.functions.invoke('quiz-generator', {
        body: form,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setQuiz(data.quiz);
      toast.success('Quiz generated! (4 credits used)');
    } catch (e: any) { toast.error(e.message || 'Generation failed'); }
    finally { setLoading(false); }
  };

  const handlePDF = () => {
    if (!quiz) return;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 18;
    const maxW = pageW - margin * 2;
    let y = margin;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text(quiz.title, margin, y); y += 8;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    const ins = doc.splitTextToSize(quiz.instructions, maxW);
    doc.text(ins, margin, y); y += ins.length * 5 + 4;

    quiz.questions.forEach(q => {
      if (y > pageH - margin - 20) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      const head = doc.splitTextToSize(`${q.id}. ${q.prompt}`, maxW);
      doc.text(head, margin, y); y += head.length * 5;
      doc.setFont('helvetica', 'normal');
      if (q.type === 'multiple-choice' && q.options) {
        q.options.forEach((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          const w = doc.splitTextToSize(`  ${letter}. ${opt}`, maxW - 4);
          doc.text(w, margin + 4, y); y += w.length * 5;
        });
      } else if (q.type === 'true-false') {
        doc.text('  True / False', margin + 4, y); y += 5;
      } else {
        doc.text('  ____________________________________________', margin + 4, y); y += 8;
      }
      y += 3;
    });

    // Answer key
    doc.addPage(); y = margin;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
    doc.text('Answer Key', margin, y); y += 8;
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    quiz.questions.forEach(q => {
      if (y > pageH - margin) { doc.addPage(); y = margin; }
      const line = doc.splitTextToSize(`${q.id}. ${q.answer}${q.explanation ? ` — ${q.explanation}` : ''}`, maxW);
      doc.text(line, margin, y); y += line.length * 5 + 1;
    });

    doc.save(`quiz-${form.topic.replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <Card className="max-w-3xl mx-auto">
      {!quiz ? (
        <>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />Quiz Generator</CardTitle>
            <CardDescription>Generate quizzes with answer keys — multiple choice, true/false, or short answer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Topic *</Label><Input value={form.topic} onChange={e => update('topic', e.target.value)} placeholder="Photosynthesis" /></div>
              <div><Label>Grade Level *</Label><Input value={form.gradeLevel} onChange={e => update('gradeLevel', e.target.value)} placeholder="7th grade" /></div>
              <div><Label># Questions</Label><Input type="number" min={3} max={25} value={form.numQuestions} onChange={e => update('numQuestions', e.target.value)} /></div>
              <div>
                <Label>Question Type</Label>
                <Select value={form.questionType} onValueChange={v => update('questionType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    <SelectItem value="true-false">True / False</SelectItem>
                    <SelectItem value="short-answer">Short Answer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select value={form.difficulty} onValueChange={v => update('difficulty', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={loading} size="lg" className="w-full">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</> : <>Generate Quiz (4 Credits)</>}
            </Button>
          </CardContent>
        </>
      ) : (
        <>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>{quiz.title}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAnswers(s => !s)}>
                  {showAnswers ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {showAnswers ? 'Hide' : 'Show'} Answers
                </Button>
                <Button size="sm" onClick={handlePDF}><FileDown className="h-4 w-4 mr-1" />PDF</Button>
                <Button variant="secondary" size="sm" onClick={() => setQuiz(null)}>New</Button>
              </div>
            </div>
            <CardDescription>{quiz.instructions}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {quiz.questions.map(q => (
              <div key={q.id} className="border-b pb-4 last:border-0">
                <div className="flex gap-2">
                  <Badge variant="outline">{q.id}</Badge>
                  <span className="font-medium">{q.prompt}</span>
                </div>
                {q.type === 'multiple-choice' && q.options && (
                  <ul className="mt-2 ml-6 space-y-1 text-sm">
                    {q.options.map((opt, i) => (
                      <li key={i}><strong>{String.fromCharCode(65 + i)}.</strong> {opt}</li>
                    ))}
                  </ul>
                )}
                {q.type === 'true-false' && <p className="mt-2 ml-6 text-sm text-muted-foreground">True / False</p>}
                {q.type === 'short-answer' && <p className="mt-2 ml-6 text-sm text-muted-foreground italic">Short answer</p>}
                {showAnswers && (
                  <div className="mt-2 ml-6 text-sm bg-muted/50 p-2 rounded">
                    <strong>Answer:</strong> {q.answer}
                    {q.explanation && <p className="mt-1 text-muted-foreground">{q.explanation}</p>}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </>
      )}
    </Card>
  );
}
