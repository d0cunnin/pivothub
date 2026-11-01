import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { ArrowLeft, BookCheck, ClipboardList, Download, FileSignature, Loader2, Map as MapIcon, Plus, Save, Sparkles, Trash2, Hash } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ToolIntro } from "@/components/tool-layout/ToolIntro";
import { ToolCreditBar } from "@/components/tool-layout/ToolCreditBar";
import { ToolGuard } from "@/components/ToolGuard";
import { StorageNotice } from "@/components/StorageNotice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useUsage } from "@/contexts/UsageContext";
import { ChargeDialog } from "@/components/design-it/ChargeDialog";
import { invokeFunction } from "@/lib/invokeFunction";
import { AssessmentForm } from "@/components/publish-it/AssessmentForm";
import { BulletList, ComparisonTable, SourceLink, StepGuide, VerifiedNote } from "@/components/publish-it/Guides";
import { generatePublishItPDF } from "@/lib/pdf-reports/publish-it";
import {
  AUDIOBOOK_CHECKLIST, AUDIOBOOK_GUIDE, BOTH_PLATFORMS_GUIDANCE, COPYRIGHT_CHECKLIST, COPYRIGHT_GUIDE, COST_CATEGORIES, EBOOK_PLATFORMS, EPUB_NOTES,
  INGRAM_STEPS, ISBN_GUIDE, KDP_STEPS, VERIFIED_FEES, VERIFIED_ON,
} from "@/lib/publishIt/content";
import {
  EMPTY_ASSESSMENT, TASK_STATUSES, bookFromWriteIt, buildRoadmap, normalizePublishProject, deletePublishProject, evaluateReadiness, hasPrint,
  listPublishProjects, missingAssessment, readinessPercent, savePublishProject, storageError,
  type Assessment, type IsbnRecord, type PublishProject, type ReadinessStatus, type TaskStatus,
} from "@/lib/publishIt/logic";
import { listProjects as listWriteItProjects, type WriteItProject } from "@/lib/writeIt";
import heroImage from "@/assets/hero-image.jpg";

type View = "list" | "new" | "workspace";
const SUMMARY_COST = 2;
const PLAN_COST = 2;

const readinessBadge = (s: ReadinessStatus | TaskStatus) =>
  s === "Complete" || s === "Completed" ? "default" : s === "In Progress" ? "secondary" : s === "Needs Attention" ? "destructive" : "outline";

const EMPTY_ISBN: IsbnRecord = { isbn: "", title: "", format: "", imprint: "", obtained: "", status: "" };

const PublishIt = () => {
  const { user, isAdmin } = useAuth();
  const { remainingRequests } = useUsage();
  const [confirmPlan, setConfirmPlan] = useState(false);
  const [view, setView] = useState<View>("list");
  const [projects, setProjects] = useState<PublishProject[]>([]);
  const [writeItProjects, setWriteItProjects] = useState<WriteItProject[]>([]);
  const [importedFrom, setImportedFrom] = useState<string | null>(null);
  const [storageNote, setStorageNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<Assessment>(EMPTY_ASSESSMENT);
  const [project, setProject] = useState<PublishProject | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<null | "save" | "summary" | "create">(null);
  const [tab, setTab] = useState("overview");
  const [newIsbn, setNewIsbn] = useState<IsbnRecord>(EMPTY_ISBN);
  const [toDelete, setToDelete] = useState<PublishProject | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setProjects(await listPublishProjects());
      setStorageNote(null);
    } catch (e) {
      setStorageNote(storageError(e));
    } finally {
      setLoading(false);
    }
    try { setWriteItProjects(await listWriteItProjects()); } catch { setWriteItProjects([]); }
  }, [user]);
  useEffect(() => { void refresh(); }, [refresh]);

  const edit = (fn: (p: PublishProject) => PublishProject) => { setProject((p) => (p ? fn(p) : p)); setDirty(true); };

  const persist = async (p: PublishProject | null = project, quiet = false) => {
    if (!p) return;
    if (p.id.startsWith("local-")) { if (!quiet) toast.error(storageNote ?? "Saving isn't available yet. Download your plan as a PDF."); return; }
    setBusy((b) => b ?? "save");
    try {
      const saved = await savePublishProject(p);
      setProject(saved); setDirty(false);
      setProjects((list) => [saved, ...list.filter((x) => x.id !== saved.id)]);
      if (!quiet) toast.success("Project saved");
    } catch (e) {
      toast.error(storageError(e));
    } finally {
      setBusy((b) => (b === "save" ? null : b));
    }
  };

  const startNew = () => { setAssessment(EMPTY_ASSESSMENT); setImportedFrom(null); setView("new"); };

  const importWriteIt = (id: string) => {
    const w = writeItProjects.find((x) => x.id === id);
    if (!w) return;
    // Book details only; manuscript readiness is always asked fresh.
    setAssessment({ ...EMPTY_ASSESSMENT, book: { ...EMPTY_ASSESSMENT.book, ...bookFromWriteIt(w) } });
    setImportedFrom(id);
    toast.success("Book details imported. Please answer the manuscript readiness questions.");
  };

  const createPlan = async () => {
    const problem = missingAssessment(assessment);
    if (problem) { toast.error(problem); return; }
    if (!user) { toast.error("Please sign in to save your publishing plan."); return; }
    if (!isAdmin && remainingRequests < PLAN_COST) {
      toast.error(`Creating a publishing plan needs ${PLAN_COST} credits and you have ${remainingRequests}. Add credits on the Pricing page to continue.`);
      return;
    }
    setConfirmPlan(true);
  };

  const confirmCreatePlan = async () => {
    if (busy === "create" || !user) return;
    setBusy("create");
    try {
      const { data, error } = await invokeFunction<any>("publish-it", {
        body: { action: "create", assessment, writeItProjectId: importedFrom },
      });
      if (error || !data?.project) throw new Error(error?.message || "We could not create your plan. Please try again. You were not charged.");
      const created = normalizePublishProject(data.project);
      setProjects((list) => [created, ...list.filter((x) => x.id !== created.id)]);
      setProject(created);
      setDirty(false); setTab("overview"); setView("workspace");
      toast.success(isAdmin || !data.creditsUsed ? "Your publishing plan is ready" : `Your publishing plan is ready. ${data.creditsUsed} credits used.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
      setConfirmPlan(false);
    }
  };

  const getSummary = async () => {
    if (!project) return;
    setBusy("summary");
    try {
      const { data, error } = await invokeFunction<any>("publish-it", {
        body: { assessment: project.assessment, readiness: evaluateReadiness(project.assessment, project.progress.readiness).map((r) => ({ label: r.label, status: r.status })) },
      });
      if (error || !data?.summary) throw new Error(error?.message || "We could not create your summary. Please try again.");
      const next = { ...project, ai_summary: data.summary };
      setProject(next);
      await persist(next, true);
      toast.success("Your publishing summary is ready");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deletePublishProject(toDelete.id);
      setProjects((l) => l.filter((x) => x.id !== toDelete.id));
      if (project?.id === toDelete.id) { setProject(null); setView("list"); }
      toast.success("Project deleted");
    } catch (e) {
      toast.error(storageError(e));
    } finally {
      setToDelete(null);
    }
  };

  const readiness = useMemo(() => (project ? evaluateReadiness(project.assessment, project.progress.readiness) : []), [project]);
  const roadmap = useMemo(() => (project ? buildRoadmap(project.assessment) : []), [project]);
  const taskStatus = (id: string): TaskStatus => project?.progress.tasks?.[id] ?? "Not Started";
  const tasksDone = roadmap.filter((t) => taskStatus(t.id) === "Completed").length;
  const a = project?.assessment;
  const ingram = a?.printPlatform === "ingramspark" || a?.printPlatform === "both";
  const kdp = a?.printPlatform === "kdp" || a?.printPlatform === "both";

  // ------------------------------------------------------------------- views
  const listView = (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>My Publishing Projects</CardTitle>
          <CardDescription>Reopen a plan to update your progress, or start a new one.</CardDescription>
        </div>
        <Button onClick={startNew}><Plus className="h-4 w-4 mr-1" /> Start a Publishing Plan</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {storageNote && <p className="text-sm text-muted-foreground">{storageNote}</p>}
        {loading && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</p>}
        {!loading && !projects.length && !storageNote && <p className="text-sm text-muted-foreground">No publishing projects yet.</p>}
        {projects.map((p) => {
          const items = evaluateReadiness(p.assessment, p.progress.readiness);
          return (
            <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
              <div className="flex-1 min-w-[12rem]">
                <p className="font-semibold">{p.assessment.book.title || p.project_name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.assessment.book.author && `by ${p.assessment.book.author} · `}{p.assessment.formats.join(", ") || "No formats yet"} · updated {new Date(p.updated_at).toLocaleDateString()}
                </p>
                <Progress value={readinessPercent(items)} className="h-1.5 mt-2 max-w-xs" aria-label="Readiness" />
              </div>
              <Button size="sm" onClick={() => { setProject(p); setDirty(false); setTab("overview"); setView("workspace"); }}>Open</Button>
              <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => setToDelete(p)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          );
        })}
        <StorageNotice />
      </CardContent>
    </Card>
  );

  const newView = (
    <Card>
      <CardHeader>
        <Button variant="ghost" size="sm" className="w-fit -ml-2 mb-1" onClick={() => setView("list")}><ArrowLeft className="h-4 w-4 mr-1" /> My projects</Button>
        <CardTitle>Publishing Assessment</CardTitle>
        <CardDescription>Answer a few questions to get your readiness report, roadmap and platform instructions. No files are uploaded.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {writeItProjects.length > 0 && (
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <Label htmlFor="pi-import">Planned this book in Write It? Import its details (optional)</Label>
            <Select onValueChange={importWriteIt} value={importedFrom ?? undefined}>
              <SelectTrigger id="pi-import" className="sm:w-96"><SelectValue placeholder="Choose a Write It project" /></SelectTrigger>
              <SelectContent>{writeItProjects.map((w) => <SelectItem key={w.id} value={w.id}>{w.plan.selectedTitle || w.project_name}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">An outline is not a finished manuscript, so you'll still answer the readiness questions.</p>
          </div>
        )}
        <AssessmentForm value={assessment} onChange={setAssessment} />
        <Button size="lg" className="w-full" disabled={busy === "create"} onClick={createPlan}>
          {busy === "create" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Building your plan...</> : `Create My Publishing Plan (${PLAN_COST} credits)`}
        </Button>
      </CardContent>
    </Card>
  );

  const md = (text: string) => (
    <div className="prose prose-sm max-w-none dark:prose-invert"><ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown></div>
  );

  const workspace = project && a && (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" className="-ml-2" onClick={() => { if (!dirty || window.confirm("Leave without saving your changes?")) setView("list"); }}>
              <ArrowLeft className="h-4 w-4 mr-1" /> My projects
            </Button>
            {dirty && <Badge variant="outline">Unsaved changes</Badge>}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{a.book.title}</h2>
            <p className="text-sm text-muted-foreground">
              {[a.book.author && `by ${a.book.author}`, a.formats.join(", "),
                a.printPlatform && (a.printPlatform === "both" ? "IngramSpark + KDP" : a.printPlatform === "kdp" ? "Amazon KDP" : "IngramSpark")].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Readiness</span><span>{readinessPercent(readiness)}%</span></div>
              <Progress value={readinessPercent(readiness)} className="h-2" aria-label="Readiness" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Roadmap tasks completed</span><span>{tasksDone} of {roadmap.length}</span></div>
              <Progress value={roadmap.length ? (tasksDone / roadmap.length) * 100 : 0} className="h-2" aria-label="Roadmap progress" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => persist()} disabled={busy !== null}><Save className="h-4 w-4 mr-1" /> Save</Button>
            <Button size="sm" variant="outline" onClick={() => generatePublishItPDF(project, "plan").save(`${a.book.title.replace(/[^a-z0-9]+/gi, "_").slice(0, 60)}_Publishing_Plan.pdf`)}><Download className="h-4 w-4 mr-1" /> Publishing plan PDF</Button>
            <Button size="sm" variant="outline" onClick={() => generatePublishItPDF(project, "checklist").save(`${a.book.title.replace(/[^a-z0-9]+/gi, "_").slice(0, 60)}_Publishing_Checklist.pdf`)}><Download className="h-4 w-4 mr-1" /> Checklist PDF</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="overview">Readiness</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          {hasPrint(a) && <TabsTrigger value="print">Print</TabsTrigger>}
          {a.formats.includes("E-book") && <TabsTrigger value="ebook">E-book</TabsTrigger>}
          {a.formats.includes("Audiobook") && <TabsTrigger value="audio">Audiobook</TabsTrigger>}
          <TabsTrigger value="isbn">ISBN</TabsTrigger>
          <TabsTrigger value="copyright">Copyright</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
          <TabsTrigger value="details">Book Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card><CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground">Only items you confirm are marked Complete. Update any status as you make progress.</p>
            <div className="divide-y rounded-lg border">
              {readiness.map((r) => (
                <div key={r.key} className="grid gap-2 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="font-medium text-sm">{r.label}</p>
                    {r.status !== "Complete" && <p className="text-xs text-muted-foreground">{r.help}</p>}
                  </div>
                  <Select value={r.status} onValueChange={(v) => edit((p) => ({ ...p, progress: { ...p.progress, readiness: { ...p.progress.readiness, [r.key]: v as ReadinessStatus } } }))}>
                    <SelectTrigger className="w-44" aria-label={`Status: ${r.label}`}><Badge variant={readinessBadge(r.status)}>{r.status}</Badge></SelectTrigger>
                    <SelectContent>{(["Complete", "In Progress", "Needs Attention", "Not Started"] as ReadinessStatus[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="rounded-lg border p-4 space-y-3">
              <p className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4" /> Your personalized publishing summary</p>
              {project.ai_summary ? md(project.ai_summary) : <p className="text-sm text-muted-foreground">Get a plain-language summary of where you stand, your top priorities and the decisions ahead.</p>}
              <Button size="sm" variant={project.ai_summary ? "outline" : "default"} disabled={busy !== null} onClick={getSummary}>
                {busy === "summary" ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Writing your summary...</> : <>{project.ai_summary ? "Update" : "Create"} my summary ({SUMMARY_COST} credits)</>}
              </Button>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="roadmap">
          <Card><CardContent className="pt-6 space-y-5">
            <p className="text-sm text-muted-foreground">Your stages, in order, based on your answers. Mark each task as you go; nothing is marked complete for you.</p>
            {Array.from(new Set(roadmap.map((t) => t.stage))).map((stage) => (
              <section key={stage} className="space-y-2">
                <h3 className="font-semibold">{stage}</h3>
                {roadmap.filter((t) => t.stage === stage).map((t) => (
                  <div key={t.id} className="rounded-lg border p-3 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{t.task}</p>
                      <Select value={taskStatus(t.id)} onValueChange={(v) => edit((p) => ({ ...p, progress: { ...p.progress, tasks: { ...p.progress.tasks, [t.id]: v as TaskStatus } } }))}>
                        <SelectTrigger className="w-44" aria-label={`Status: ${t.task}`}><Badge variant={readinessBadge(taskStatus(t.id))}>{taskStatus(t.id)}</Badge></SelectTrigger>
                        <SelectContent>{TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <p className="text-sm">{t.explanation}</p>
                    <p className="text-sm text-muted-foreground"><strong>Why it matters:</strong> {t.why}</p>
                    <p className="text-sm"><strong>How:</strong> {t.instructions}</p>
                    {t.source && <SourceLink k={t.source} />}
                  </div>
                ))}
              </section>
            ))}
            {dirty && <Button size="sm" onClick={() => persist()} disabled={busy !== null}><Save className="h-4 w-4 mr-1" /> Save progress</Button>}
            <VerifiedNote />
          </CardContent></Card>
        </TabsContent>

        {hasPrint(a) && (
          <TabsContent value="print">
            <Card><CardContent className="pt-6 space-y-6">
              <p className="text-sm text-muted-foreground">You prepare your files and submit them directly on the platform's website. PivotHub does not receive, upload or publish your files.</p>
              {ingram && <section className="space-y-2"><h3 className="text-lg font-semibold">IngramSpark</h3><StepGuide steps={INGRAM_STEPS} idPrefix="ing" /></section>}
              {kdp && <section className="space-y-2"><h3 className="text-lg font-semibold">Amazon KDP ({a.formats.filter((f) => f === "Paperback" || f === "Hardcover").join(" and ")})</h3><StepGuide steps={KDP_STEPS} idPrefix="kdp" /></section>}
              {a.printPlatform === "both" && (
                <section className="rounded-lg border p-4 space-y-2">
                  <h3 className="font-semibold">Using IngramSpark and KDP together</h3>
                  <BulletList items={BOTH_PLATFORMS_GUIDANCE} />
                  <SourceLink k="ingramAndKdp" />
                </section>
              )}
              <VerifiedNote />
            </CardContent></Card>
          </TabsContent>
        )}

        {a.formats.includes("E-book") && (
          <TabsContent value="ebook">
            <Card><CardContent className="pt-6 space-y-5">
              <BulletList items={EPUB_NOTES} />
              {EBOOK_PLATFORMS.map((e) => (
                <section key={e.name} className="rounded-lg border p-4 space-y-2">
                  <h3 className="font-semibold">{e.name}</h3>
                  <p className="text-sm">{e.summary}</p>
                  <BulletList items={e.points} />
                  <div className="flex flex-wrap gap-x-4">{e.sources.map((k) => <SourceLink key={k} k={k} />)}</div>
                </section>
              ))}
              <VerifiedNote />
            </CardContent></Card>
          </TabsContent>
        )}

        {a.formats.includes("Audiobook") && (
          <TabsContent value="audio">
            <Card><CardContent className="pt-6 space-y-5">
              <BulletList items={AUDIOBOOK_GUIDE} />
              <div className="flex flex-wrap gap-x-4"><SourceLink k="acx" /><SourceLink k="acxAudio" /><SourceLink k="kdpVirtualVoice" /></div>
              <section className="space-y-2">
                <h3 className="font-semibold">Your audiobook checklist</h3>
                {AUDIOBOOK_CHECKLIST.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={!!project.progress.audiobook?.[c]} onCheckedChange={(v) => edit((p) => ({ ...p, progress: { ...p.progress, audiobook: { ...p.progress.audiobook, [c]: v === true } } }))} /> {c}
                  </label>
                ))}
              </section>
              {dirty && <Button size="sm" onClick={() => persist()} disabled={busy !== null}><Save className="h-4 w-4 mr-1" /> Save progress</Button>}
              <VerifiedNote />
            </CardContent></Card>
          </TabsContent>
        )}

        <TabsContent value="isbn">
          <Card><CardContent className="pt-6 space-y-5">
            <BulletList items={ISBN_GUIDE} />
            <div className="flex flex-wrap gap-x-4"><SourceLink k="bowker" /><SourceLink k="kdpIsbn" /><SourceLink k="ingramFreeIsbn" /></div>
            <p className="text-xs text-muted-foreground">PivotHub does not buy or assign ISBNs. Purchase directly from Bowker or choose a platform ISBN during setup.</p>
            <section className="space-y-2">
              <h3 className="font-semibold">Your ISBN records</h3>
              {project.isbn_records.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead><tr className="bg-muted text-left">{["ISBN", "Title", "Format", "Publisher/imprint", "Obtained", "Status", ""].map((h) => <th key={h} className="border p-2">{h}</th>)}</tr></thead>
                    <tbody>
                      {project.isbn_records.map((r, i) => (
                        <tr key={`${r.isbn}-${i}`}>
                          {[r.isbn, r.title, r.format, r.imprint, r.obtained, r.status].map((v, j) => <td key={j} className="border p-2">{v}</td>)}
                          <td className="border p-2"><Button size="icon" variant="ghost" aria-label="Remove ISBN record" onClick={() => edit((p) => ({ ...p, isbn_records: p.isbn_records.filter((_, k) => k !== i) }))}><Trash2 className="h-4 w-4" /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-3">
                <Input aria-label="ISBN" placeholder="ISBN" value={newIsbn.isbn} maxLength={20} onChange={(e) => setNewIsbn({ ...newIsbn, isbn: e.target.value })} />
                <Input aria-label="Book title" placeholder="Book title" value={newIsbn.title} maxLength={200} onChange={(e) => setNewIsbn({ ...newIsbn, title: e.target.value })} />
                <Select value={newIsbn.format} onValueChange={(v) => setNewIsbn({ ...newIsbn, format: v })}>
                  <SelectTrigger aria-label="Format"><SelectValue placeholder="Format" /></SelectTrigger>
                  <SelectContent>{["Paperback", "Hardcover", "E-book", "Audiobook"].map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
                <Input aria-label="Publisher or imprint" placeholder="Publisher/imprint" value={newIsbn.imprint} maxLength={200} onChange={(e) => setNewIsbn({ ...newIsbn, imprint: e.target.value })} />
                <Input aria-label="Date obtained" type="date" value={newIsbn.obtained} onChange={(e) => setNewIsbn({ ...newIsbn, obtained: e.target.value })} />
                <Select value={newIsbn.status} onValueChange={(v) => setNewIsbn({ ...newIsbn, status: v })}>
                  <SelectTrigger aria-label="Status"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>{["Planned", "Purchased", "Assigned", "In use"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button size="sm" variant="outline" disabled={!newIsbn.isbn.trim()} onClick={() => { edit((p) => ({ ...p, isbn_records: [...p.isbn_records, newIsbn] })); setNewIsbn({ ...EMPTY_ISBN, title: a.book.title }); }}>
                <Hash className="h-4 w-4 mr-1" /> Add ISBN record
              </Button>
              {dirty && <div><Button size="sm" onClick={() => persist()} disabled={busy !== null}><Save className="h-4 w-4 mr-1" /> Save</Button></div>}
            </section>
            <VerifiedNote />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="copyright">
          <Card><CardContent className="pt-6 space-y-5">
            <BulletList items={COPYRIGHT_GUIDE} />
            <p className="text-sm"><strong>Online registration fees (checked {VERIFIED_ON}):</strong></p>
            <BulletList items={VERIFIED_FEES.map((f) => `${f.item}: ${f.amount}`)} />
            <div className="flex flex-wrap gap-x-4"><SourceLink k="copyright" /><SourceLink k="copyrightFees" /></div>
            <p className="text-xs text-muted-foreground">PivotHub does not register copyrights for you. You apply directly with the U.S. Copyright Office.</p>
            <section className="space-y-2">
              <h3 className="font-semibold">Copyright checklist</h3>
              {COPYRIGHT_CHECKLIST.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={!!project.progress.copyright?.[c]} onCheckedChange={(v) => edit((p) => ({ ...p, progress: { ...p.progress, copyright: { ...p.progress.copyright, [c]: v === true } } }))} /> {c}
                </label>
              ))}
            </section>
            {dirty && <Button size="sm" onClick={() => persist()} disabled={busy !== null}><Save className="h-4 w-4 mr-1" /> Save progress</Button>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card><CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground">Enter your own estimates or quotes. PivotHub does not invent prices; platform printing costs and earnings are shown on each platform during setup.</p>
            <div className="divide-y rounded-lg border">
              {COST_CATEGORIES.map((c) => (
                <div key={c.key} className="grid gap-2 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="text-sm font-medium">{c.label} <Badge variant="outline" className="ml-1 font-normal">{c.type}</Badge></p>
                    <p className="text-xs text-muted-foreground">{c.note}</p>
                  </div>
                  <div className="flex items-center gap-1"><span className="text-sm">$</span>
                    <Input aria-label={`${c.label} estimate`} type="number" min={0} step="0.01" className="w-32" value={project.costs[c.key] ?? ""}
                      onChange={(e) => edit((p) => ({ ...p, costs: { ...p.costs, [c.key]: e.target.value } }))} />
                  </div>
                </div>
              ))}
            </div>
            {(() => {
              const total = COST_CATEGORIES.reduce((s, c) => s + (parseFloat(project.costs[c.key] ?? "") || 0), 0);
              const budget = parseFloat(a.budget);
              return (
                <p className="text-sm font-semibold">
                  Your estimated total: ${total.toFixed(2)}
                  {!a.budgetUndetermined && budget > 0 && <span className={`ml-2 font-normal ${total > budget ? "text-destructive" : "text-muted-foreground"}`}>(budget ${budget.toFixed(2)})</span>}
                </p>
              );
            })()}
            <div className="text-sm space-y-1">
              <p className="font-medium">Official fees checked {VERIFIED_ON}:</p>
              <BulletList items={VERIFIED_FEES.map((f) => `${f.item}: ${f.amount}`)} />
              <div className="flex flex-wrap gap-x-4"><SourceLink k="copyrightFees" /><SourceLink k="bowker" /></div>
            </div>
            {dirty && <Button size="sm" onClick={() => persist()} disabled={busy !== null}><Save className="h-4 w-4 mr-1" /> Save estimates</Button>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="compare">
          <Card><CardContent className="pt-6"><ComparisonTable /></CardContent></Card>
        </TabsContent>

        <TabsContent value="details">
          <Card><CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground">Update your answers anytime; your readiness report and roadmap update with them.</p>
            <AssessmentForm value={a} onChange={(v) => edit((p) => ({ ...p, assessment: v, project_name: v.book.title || p.project_name }))} />
            <Button size="sm" onClick={() => { const problem = missingAssessment(a); if (problem) { toast.error(problem); return; } void persist(); }} disabled={busy !== null}><Save className="h-4 w-4 mr-1" /> Save book details</Button>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Publish It - Book Publishing Guide and Planner | PivotHub</title>
        <meta name="description" content="Plan your book's publication: readiness check, IngramSpark and KDP step-by-step instructions, ISBN and copyright guidance, e-books, audiobooks and cost planning." />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <section className="relative h-[320px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80" />
          </div>
          <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
            <Badge className="mb-4 bg-white/15 text-white border-white/30">PUBLISH IT · PUBLISHING GUIDE</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Publish It</h1>
            <p className="text-lg text-white/90">From Manuscript to Marketplace.</p>
          </div>
        </section>

        <ToolIntro
          about="Understand the publishing process and follow clear steps. Check your readiness, choose your formats, compare IngramSpark and Amazon KDP, learn about ISBNs and copyright, and plan print, e-book and audiobook publishing with links to each official site. Publish It does not upload, format or publish your book; you submit directly on the platforms you choose."
          forWho="Independent authors preparing to publish a print book, e-book or audiobook."
          steps={["Answer the publishing assessment (or import a Write It project).", "Review your readiness, roadmap and platform instructions.", "Work through each step on the official sites and track your progress here."]}
          items={[
            { icon: BookCheck, name: "Readiness report", description: "What is done and what still needs attention, with explanations." },
            { icon: MapIcon, name: "Publishing roadmap", description: "Sequential stages with official links you can mark as you go." },
            { icon: ClipboardList, name: "Platform instructions", description: "Step-by-step guides for IngramSpark, KDP, e-book platforms and ACX." },
            { icon: FileSignature, name: "ISBN and copyright", description: "Plain-language guidance, records and checklists." },
          ]}
        />

        <main className="flex-grow container mx-auto px-4 py-10 max-w-5xl">
          <ToolCreditBar cost={`Publishing plan ${PLAN_COST} credits · updating and reopening your plan is free · optional personalized summary ${SUMMARY_COST} credits`} />
          <ToolGuard toolName="publish-it" showCreditInfo={false}>
            {view === "list" && listView}
            {view === "new" && newView}
            {view === "workspace" && workspace}
          </ToolGuard>
        </main>
        <Footer />
      </div>

      <ChargeDialog
        pending={confirmPlan ? { title: "Create your publishing plan", description: "You'll get your readiness report, publishing roadmap and the platform instructions that fit your answers. Reopening and updating your plan afterwards is free.", cost: PLAN_COST, run: confirmCreatePlan } : null}
        balance={remainingRequests} isAdmin={isAdmin} running={busy === "create"} onCancel={() => setConfirmPlan(false)} onConfirm={confirmCreatePlan} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this publishing project?</AlertDialogTitle>
            <AlertDialogDescription>"{toDelete?.assessment.book.title || toDelete?.project_name}" and its progress will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PublishIt;
