import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import {
  BookOpen, ListTree, FileText, CalendarCheck, Loader2, Plus, Copy, Trash2, Pencil, Download, Send, Save, RefreshCw, ArrowLeft, Check,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ToolIntro } from "@/components/tool-layout/ToolIntro";
import { ToolCreditBar } from "@/components/tool-layout/ToolCreditBar";
import { ToolGuard } from "@/components/ToolGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { invokeFunction } from "@/lib/invokeFunction";
import { BookForm, missingRequired } from "@/components/write-it/BookForm";
import { TocEditor } from "@/components/write-it/TocEditor";
import { generateWriteItPDF, type WriteItExport } from "@/lib/pdf-reports/write-it";
import {
  EMPTY_INPUTS, PROGRESS_STATUSES, WRITE_IT_COSTS, buildPublishPackage, chaptersFromParts, conceptToText, createProject,
  deleteProject, groupByPart, listProjects, progressPercent, saveProject, storageErrorMessage,
  type BookInputs, type BookPlan, type Chapter, type ProgressStatus, type WriteItProject,
} from "@/lib/writeIt";
import heroImage from "@/assets/hero-image.jpg";

type View = "list" | "new" | "workspace";
type Busy = null | "plan" | "outlines" | "toc" | "roadmap" | "save" | `outline-${string}`;

const statusVariant = (s: ProgressStatus) => (s === "Completed" ? "default" : s === "In Progress" ? "secondary" : "outline");

const WriteIt = () => {
  const { user } = useAuth();
  const [view, setView] = useState<View>("list");
  const [projects, setProjects] = useState<WriteItProject[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [storageNote, setStorageNote] = useState<string | null>(null);
  const [inputs, setInputs] = useState<BookInputs>(EMPTY_INPUTS);
  const [project, setProject] = useState<WriteItProject | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [tab, setTab] = useState("concept");
  const [tocFeedback, setTocFeedback] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [toDelete, setToDelete] = useState<WriteItProject | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoadingList(true);
    try {
      setProjects(await listProjects());
      setStorageNote(null);
    } catch (e) {
      setStorageNote(storageErrorMessage(e));
    } finally {
      setLoadingList(false);
    }
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  /** Apply a change to the open project and mark it unsaved. */
  const edit = (patch: Partial<WriteItProject> | ((p: WriteItProject) => WriteItProject)) => {
    setProject((p) => (p ? (typeof patch === "function" ? patch(p) : { ...p, ...patch }) : p));
    setDirty(true);
  };
  const editPlan = (patch: Partial<BookPlan>) => edit((p) => ({ ...p, plan: { ...p.plan, ...patch } }));

  const persist = async (p: WriteItProject | null = project, quiet = false) => {
    if (!p) return;
    if (p.id.startsWith("local-")) {
      if (!quiet) toast.error(storageNote ?? "Saving projects isn't available yet. Download the PDF to keep your plan.");
      return;
    }
    setBusy((b) => b ?? "save");
    try {
      const saved = await saveProject(p);
      setProject(saved);
      setDirty(false);
      setProjects((list) => [saved, ...list.filter((x) => x.id !== saved.id)]);
      if (!quiet) toast.success("Project saved");
    } catch (e) {
      toast.error(storageErrorMessage(e));
    } finally {
      setBusy((b) => (b === "save" ? null : b));
    }
  };

  const call = async (action: keyof typeof WRITE_IT_COSTS, extra: Record<string, unknown>, p: WriteItProject | null, src: BookInputs) => {
    const { data, error } = await invokeFunction<any>("write-it", {
      body: {
        action,
        inputs: src,
        concept: conceptToText(p?.plan.concept),
        chapters: (p?.chapters ?? []).map((c) => ({ part: c.part, title: c.title, summary: c.summary, status: c.status })),
        ...extra,
      },
    });
    if (error || !data) throw new Error(error?.message || "We could not complete this step. Please try again.");
    return data;
  };

  // ---------------------------------------------------------------- actions
  const createPlan = async () => {
    const problem = missingRequired(inputs);
    if (problem) { toast.error(problem); return; }
    if (!user) { toast.error("Please sign in to plan your book."); return; }
    setBusy("plan");
    try {
      const data = await call("plan", {}, null, inputs);
      const { chapters, partNames } = chaptersFromParts(data.parts ?? []);
      const plan: BookPlan = {
        understanding: data.understanding, concept: data.concept, titles: data.titles, structure: data.structure, gaps: data.gaps,
        selectedTitle: inputs.title, selectedSubtitle: inputs.subtitle, parts: partNames,
      };
      const name = inputs.title || data.titles?.[0]?.title || "Untitled book";
      const draft = { project_name: name, status: "Planning" as ProgressStatus, inputs, plan, chapters, roadmap: { completionDate: inputs.completionDate } };
      let created: WriteItProject;
      try {
        created = await createProject(user.id, draft);
        setProjects((list) => [created, ...list]);
      } catch (e) {
        setStorageNote(storageErrorMessage(e));
        const now = new Date().toISOString();
        created = { id: `local-${Date.now()}`, ...draft, publish_package: null, sent_to_publish_at: null, created_at: now, updated_at: now };
      }
      setProject(created);
      setDirty(false);
      setTab("concept");
      setView("workspace");
      toast.success("Your book plan is ready");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const generateOutlines = async (chapter?: Chapter) => {
    if (!project) return;
    if (dirty) await persist(project, true);
    const index = chapter ? project.chapters.findIndex((c) => c.id === chapter.id) : -1;
    setBusy(chapter ? `outline-${chapter.id}` : "outlines");
    try {
      const data = await call(chapter ? "outline" : "outlines", chapter ? { chapterNumber: index + 1 } : {}, project, project.inputs);
      const outlines: Record<string, string> = data.outlines ?? {};
      const next = { ...project, chapters: project.chapters.map((c, i) => (outlines[i + 1] ? { ...c, outline: outlines[i + 1] } : c)) };
      setProject(next);
      await persist(next, true);
      toast.success(chapter ? "Outline updated" : "Chapter outlines are ready");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const regenerateToc = async () => {
    if (!project) return;
    setBusy("toc");
    try {
      const data = await call("toc", { feedback: tocFeedback }, project, project.inputs);
      const { chapters, partNames } = chaptersFromParts(data.parts ?? []);
      // Keep outlines and statuses for chapters whose titles did not change.
      const old = new Map(project.chapters.map((c) => [c.title.trim().toLowerCase(), c]));
      const merged = chapters.map((c) => {
        const prev = old.get(c.title.trim().toLowerCase());
        return prev ? { ...c, id: prev.id, outline: prev.outline, status: prev.status } : c;
      });
      const next = { ...project, chapters: merged, plan: { ...project.plan, structure: data.structure ?? project.plan.structure, parts: partNames } };
      setProject(next);
      setTocFeedback("");
      await persist(next, true);
      toast.success("New table of contents ready. Review and edit it below.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const generateRoadmap = async () => {
    if (!project) return;
    setBusy("roadmap");
    try {
      const data = await call("roadmap", {
        hoursPerWeek: project.roadmap.hoursPerWeek, daysPerWeek: project.roadmap.daysPerWeek, completionDate: project.roadmap.completionDate,
      }, project, project.inputs);
      const next = { ...project, roadmap: { ...project.roadmap, text: data.roadmap } };
      setProject(next);
      await persist(next, true);
      toast.success("Writing roadmap ready");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const duplicate = async (p: WriteItProject) => {
    if (!user) return;
    try {
      const copy = await createProject(user.id, { ...p, project_name: `${p.project_name} (copy)` });
      setProjects((list) => [copy, ...list]);
      toast.success("Project duplicated");
    } catch (e) {
      toast.error(storageErrorMessage(e));
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteProject(toDelete.id);
      setProjects((list) => list.filter((x) => x.id !== toDelete.id));
      if (project?.id === toDelete.id) { setProject(null); setView("list"); }
      toast.success("Project deleted");
    } catch (e) {
      toast.error(storageErrorMessage(e));
    } finally {
      setToDelete(null);
    }
  };

  const exportPdf = (kind: WriteItExport) => {
    if (!project) return;
    const name = (project.plan.selectedTitle || project.project_name).replace(/[^a-z0-9]+/gi, "_").slice(0, 60);
    generateWriteItPDF(project, kind).save(`${name}_${kind === "plan" ? "Book_Development_Plan" : kind === "toc" ? "Table_of_Contents" : kind === "outlines" ? "Chapter_Outlines" : "Writing_Roadmap"}.pdf`);
  };

  const sendToPublish = async () => {
    if (!project) return;
    const pkg = buildPublishPackage(project, authorName.trim());
    const next = { ...project, publish_package: pkg, sent_to_publish_at: new Date().toISOString() };
    setProject(next);
    await persist(next, true);
    setPublishOpen(false);
    toast.success("Your book details are saved for Publish It.");
  };

  const openProject = (p: WriteItProject) => {
    setProject(p);
    setDirty(false);
    setTab("concept");
    setView("workspace");
  };

  const progress = useMemo(() => progressPercent(project?.chapters ?? []), [project?.chapters]);
  const outlinedCount = project?.chapters.filter((c) => c.outline.trim()).length ?? 0;

  // ------------------------------------------------------------------- views
  const listView = (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>My Book Projects</CardTitle>
          <CardDescription>Open a saved plan or start a new one.</CardDescription>
        </div>
        <Button onClick={() => { setInputs(EMPTY_INPUTS); setView("new"); }}><Plus className="h-4 w-4 mr-1" /> Start a New Book Plan</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {storageNote && <p className="text-sm text-muted-foreground">{storageNote}</p>}
        {loadingList && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading your projects...</p>}
        {!loadingList && !projects.length && !storageNote && (
          <p className="text-sm text-muted-foreground">No book projects yet. Start a new plan to organize your ideas.</p>
        )}
        {projects.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
            <div className="flex-1 min-w-[12rem]">
              <p className="font-semibold">{p.plan.selectedTitle || p.project_name}</p>
              <p className="text-xs text-muted-foreground">
                {p.inputs.category || "Book"} · {p.chapters.length} chapters · updated {new Date(p.updated_at).toLocaleDateString()}
              </p>
              <Progress value={progressPercent(p.chapters)} className="h-1.5 mt-2 max-w-xs" aria-label="Chapters completed" />
            </div>
            <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
            <div className="flex gap-1">
              <Button size="sm" onClick={() => openProject(p)}>Open</Button>
              <Button size="icon" variant="ghost" aria-label="Duplicate" onClick={() => duplicate(p)}><Copy className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => setToDelete(p)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const newView = (
    <Card>
      <CardHeader>
        <Button variant="ghost" size="sm" className="w-fit -ml-2 mb-1" onClick={() => setView("list")}><ArrowLeft className="h-4 w-4 mr-1" /> My projects</Button>
        <CardTitle>Plan Your Book</CardTitle>
        <CardDescription>Answer a few questions. Write It organizes your ideas into a concept, title ideas, a structure and a table of contents. It does not write your book.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <BookForm value={inputs} onChange={setInputs} />
        <Button size="lg" className="w-full" disabled={busy === "plan"} onClick={createPlan}>
          {busy === "plan" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Organizing your book (about a minute)...</> : <>Create My Book Plan ({WRITE_IT_COSTS.plan} credits)</>}
        </Button>
      </CardContent>
    </Card>
  );

  const md = (text: string) => (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown remarkPlugins={[remarkGfm]}
        components={{ table: ({ node, ...props }) => <div className="overflow-x-auto not-prose my-3"><table className="w-full text-sm border-collapse [&_th]:border [&_td]:border [&_th]:p-2 [&_td]:p-2 [&_th]:bg-muted [&_th]:text-left" {...props} /></div> }}>
        {text}
      </ReactMarkdown>
    </div>
  );

  const workspace = project && (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" className="-ml-2" onClick={() => { if (!dirty || window.confirm("Leave without saving your changes?")) setView("list"); }}>
              <ArrowLeft className="h-4 w-4 mr-1" /> My projects
            </Button>
            {dirty && <Badge variant="outline">Unsaved changes</Badge>}
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
            <div className="space-y-1">
              <Label htmlFor="wi-project-name">Project name</Label>
              <Input id="wi-project-name" value={project.project_name} maxLength={200} onChange={(e) => edit({ project_name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="wi-project-status">Status</Label>
              <Select value={project.status} onValueChange={(v) => edit({ status: v as ProgressStatus })}>
                <SelectTrigger id="wi-project-status" className="w-full sm:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>{PROGRESS_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{project.chapters.filter((c) => c.status === "Completed").length} of {project.chapters.length} chapters completed · {outlinedCount} outlined</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" aria-label="Book progress" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => persist()} disabled={busy !== null}><Save className="h-4 w-4 mr-1" /> Save</Button>
            <Select onValueChange={(v) => exportPdf(v as WriteItExport)}>
              <SelectTrigger className="w-auto h-9" aria-label="Download PDF"><Download className="h-4 w-4 mr-1" /><SelectValue placeholder="Download PDF" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="plan">Book Development Plan</SelectItem>
                <SelectItem value="toc">Table of Contents</SelectItem>
                <SelectItem value="outlines">Chapter Outlines</SelectItem>
                <SelectItem value="roadmap">Writing Roadmap</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => setPublishOpen(true)}><Send className="h-4 w-4 mr-1" /> Send to Publish It</Button>
          </div>
          {project.sent_to_publish_at && (
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Check className="h-3 w-3" /> Book details saved for Publish It on {new Date(project.sent_to_publish_at).toLocaleDateString()}.</p>
          )}
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="concept">Concept</TabsTrigger>
          <TabsTrigger value="title">Title</TabsTrigger>
          <TabsTrigger value="toc">Table of Contents</TabsTrigger>
          <TabsTrigger value="outlines">Chapter Outlines</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          <TabsTrigger value="details">Book Details</TabsTrigger>
        </TabsList>

        <TabsContent value="concept">
          <Card>
            <CardContent className="pt-6 space-y-5">
              {project.plan.understanding && (
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="font-semibold mb-1">Our Understanding of Your Book</p>
                  <p className="text-sm">{project.plan.understanding}</p>
                </div>
              )}
              {([
                ["refinedConcept", "Refined concept"], ["centralTheme", "Central theme"], ["purposeStatement", "Purpose statement"],
                ["intendedAudience", "Intended audience"], ["mainMessage", "Main message"], ["organizingApproach", "How to organize the subject"],
              ] as const).map(([k, label]) => (
                <div key={k} className="space-y-1">
                  <Label htmlFor={`wi-c-${k}`}>{label}</Label>
                  <Textarea id={`wi-c-${k}`} rows={k === "refinedConcept" || k === "organizingApproach" ? 3 : 2}
                    value={(project.plan.concept?.[k] as string) ?? ""}
                    onChange={(e) => editPlan({ concept: { ...project.plan.concept, [k]: e.target.value } })} />
                </div>
              ))}
              {([["readerNeeds", "What readers need"], ["readerOutcomes", "What readers will take away"]] as const).map(([k, label]) => (
                <div key={k} className="space-y-1">
                  <Label htmlFor={`wi-c-${k}`}>{label} <span className="text-muted-foreground font-normal">(one per line)</span></Label>
                  <Textarea id={`wi-c-${k}`} rows={4} value={(project.plan.concept?.[k] ?? []).join("\n")}
                    onChange={(e) => editPlan({ concept: { ...project.plan.concept, [k]: e.target.value.split("\n") } })} />
                </div>
              ))}
              {project.plan.structure?.type && (
                <div className="rounded-lg border p-4">
                  <p className="font-semibold">Recommended structure: {project.plan.structure.type}</p>
                  <p className="text-sm text-muted-foreground mt-1">{project.plan.structure.explanation}</p>
                </div>
              )}
              {!!project.plan.gaps?.length && (
                <div className="text-sm">
                  <p className="font-semibold">To strengthen your plan, consider clarifying:</p>
                  <ul className="list-disc pl-5 text-muted-foreground">{project.plan.gaps.map((g) => <li key={g}>{g}</li>)}</ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="title">
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="wi-sel-title">Your title</Label>
                  <Input id="wi-sel-title" maxLength={200} value={project.plan.selectedTitle ?? ""} onChange={(e) => editPlan({ selectedTitle: e.target.value })} placeholder="Choose below or type your own" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="wi-sel-subtitle">Your subtitle</Label>
                  <Input id="wi-sel-subtitle" maxLength={300} value={project.plan.selectedSubtitle ?? ""} onChange={(e) => editPlan({ selectedSubtitle: e.target.value })} />
                </div>
              </div>
              <Button size="sm" onClick={() => persist()} disabled={busy !== null}><Save className="h-4 w-4 mr-1" /> Save title</Button>
              <div className="space-y-2">
                <p className="text-sm font-medium">Suggestions</p>
                {(project.plan.titles ?? []).map((t) => {
                  const chosen = project.plan.selectedTitle === t.title && (project.plan.selectedSubtitle ?? "") === t.subtitle;
                  return (
                    <div key={`${t.title}|${t.subtitle}`} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                      <div className="flex-1 min-w-[12rem]">
                        <p className="font-semibold">{t.title}</p>
                        {t.subtitle && <p className="text-sm">{t.subtitle}</p>}
                        {t.why && <p className="text-xs text-muted-foreground mt-1">{t.why}</p>}
                      </div>
                      <Button size="sm" variant={chosen ? "default" : "outline"} onClick={() => editPlan({ selectedTitle: t.title, selectedSubtitle: t.subtitle })}>
                        {chosen ? <><Check className="h-4 w-4 mr-1" /> Selected</> : "Use this"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="toc">
          <Card>
            <CardContent className="pt-6 space-y-5">
              <TocEditor chapters={project.chapters} parts={project.plan.parts ?? []}
                onChange={(chapters, parts) => edit((p) => ({ ...p, chapters, plan: { ...p.plan, parts } }))} />
              <Button size="sm" onClick={() => persist()} disabled={busy !== null}><Save className="h-4 w-4 mr-1" /> Save table of contents</Button>
              <div className="rounded-lg border p-4 space-y-2">
                <Label htmlFor="wi-toc-feedback">Want a different structure?</Label>
                <Textarea id="wi-toc-feedback" rows={2} maxLength={1000} value={tocFeedback} onChange={(e) => setTocFeedback(e.target.value)}
                  placeholder="For example: split into three parts, or add a chapter on getting started" />
                <Button size="sm" variant="outline" disabled={busy !== null} onClick={regenerateToc}>
                  {busy === "toc" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                  Suggest a new table of contents ({WRITE_IT_COSTS.toc} credit)
                </Button>
                <p className="text-xs text-muted-foreground">Chapters that keep the same title keep their outlines and status.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outlines">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">Outlines are planning notes for you to write from, not chapter text. Edit them as your ideas grow.</p>
              <Button disabled={busy !== null || !project.chapters.length} onClick={() => generateOutlines()}>
                {busy === "outlines" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Outlining every chapter (about a minute)...</>
                  : <><ListTree className="h-4 w-4 mr-2" /> {outlinedCount ? "Re-create" : "Create"} outlines for all chapters ({WRITE_IT_COSTS.outlines} credits)</>}
              </Button>
              <Accordion type="multiple" className="w-full">
                {groupByPart(project.chapters, project.plan.parts).flatMap((g) => g.chapters).map((c) => {
                  const n = project.chapters.findIndex((x) => x.id === c.id) + 1;
                  return (
                    <AccordionItem key={c.id} value={c.id}>
                      <AccordionTrigger className="text-left">
                        <span className="flex flex-wrap items-center gap-2">
                          Chapter {n}: {c.title}
                          <Badge variant={statusVariant(c.status)} className="font-normal">{c.status}</Badge>
                          {!c.outline && <span className="text-xs text-muted-foreground">(no outline yet)</span>}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <div className="flex flex-wrap gap-2 items-center">
                          <Select value={c.status} onValueChange={(v) => edit((p) => ({ ...p, chapters: p.chapters.map((x) => (x.id === c.id ? { ...x, status: v as ProgressStatus } : x)) }))}>
                            <SelectTrigger className="w-44" aria-label={`Status for chapter ${n}`}><SelectValue /></SelectTrigger>
                            <SelectContent>{PROGRESS_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                          <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => generateOutlines(c)}>
                            {busy === `outline-${c.id}` ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                            {c.outline ? "Regenerate" : "Create"} this outline ({WRITE_IT_COSTS.outline} credit)
                          </Button>
                        </div>
                        {c.outline && md(c.outline)}
                        <details>
                          <summary className="text-sm cursor-pointer flex items-center gap-1"><Pencil className="h-3 w-3" /> Edit outline</summary>
                          <Textarea className="mt-2 font-mono text-xs" rows={14} value={c.outline}
                            onChange={(e) => edit((p) => ({ ...p, chapters: p.chapters.map((x) => (x.id === c.id ? { ...x, outline: e.target.value } : x)) }))} />
                        </details>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
              {dirty && <Button size="sm" onClick={() => persist()} disabled={busy !== null}><Save className="h-4 w-4 mr-1" /> Save changes</Button>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roadmap">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="wi-hours">Writing hours per week</Label>
                  <Input id="wi-hours" type="number" min={1} max={80} value={project.roadmap.hoursPerWeek ?? ""} onChange={(e) => edit((p) => ({ ...p, roadmap: { ...p.roadmap, hoursPerWeek: e.target.value } }))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="wi-days">Writing days per week</Label>
                  <Input id="wi-days" type="number" min={1} max={7} value={project.roadmap.daysPerWeek ?? ""} onChange={(e) => edit((p) => ({ ...p, roadmap: { ...p.roadmap, daysPerWeek: e.target.value } }))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="wi-due">Target completion date</Label>
                  <Input id="wi-due" type="date" value={project.roadmap.completionDate ?? ""} onChange={(e) => edit((p) => ({ ...p, roadmap: { ...p.roadmap, completionDate: e.target.value } }))} />
                </div>
              </div>
              <Button disabled={busy !== null || !project.chapters.length} onClick={generateRoadmap}>
                {busy === "roadmap" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Building your roadmap...</>
                  : <><CalendarCheck className="h-4 w-4 mr-2" /> {project.roadmap.text ? "Update" : "Create"} my writing roadmap ({WRITE_IT_COSTS.roadmap} credit)</>}
              </Button>
              {project.roadmap.text && (
                <>
                  {md(project.roadmap.text)}
                  <details>
                    <summary className="text-sm cursor-pointer flex items-center gap-1"><Pencil className="h-3 w-3" /> Edit roadmap</summary>
                    <Textarea className="mt-2 font-mono text-xs" rows={12} value={project.roadmap.text}
                      onChange={(e) => edit((p) => ({ ...p, roadmap: { ...p.roadmap, text: e.target.value } }))} />
                  </details>
                </>
              )}
              {dirty && <Button size="sm" onClick={() => persist()} disabled={busy !== null}><Save className="h-4 w-4 mr-1" /> Save changes</Button>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">Update your answers anytime. New outlines and roadmaps use these details.</p>
              <BookForm value={project.inputs} onChange={(v) => edit({ inputs: v })} />
              <Button size="sm" onClick={() => persist()} disabled={busy !== null}><Save className="h-4 w-4 mr-1" /> Save book details</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Write It - Book Planning and Outlining | PivotHub</title>
        <meta name="description" content="Organize your ideas and structure your book: concept, title ideas, table of contents, detailed chapter outlines and a writing roadmap. You write the book." />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <section className="relative h-[320px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80" />
          </div>
          <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
            <Badge className="mb-4 bg-white/15 text-white border-white/30">WRITE IT · BOOK PLANNING</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Write It</h1>
            <p className="text-lg text-white/90">Organize Your Ideas. Structure Your Book.</p>
          </div>
        </section>

        <ToolIntro
          about="Plan your book before you write it. Describe your idea and Write It helps you shape the concept, choose a title, pick a structure that fits your type of book, build a table of contents, outline every chapter and set a writing schedule. Write It does not write your book; you do."
          forWho="Aspiring and established authors of nonfiction, fiction, memoirs, devotionals, workbooks, children's books and more."
          steps={["Answer a few questions about your book idea.", "Review and edit your concept, title, table of contents and chapter outlines.", "Set your writing roadmap, download your plan as a PDF, and start writing."]}
          items={[
            { icon: BookOpen, name: "Book concept", description: "Your idea refined into a clear concept, theme, audience and message." },
            { icon: ListTree, name: "Table of contents", description: "A structure that fits your type of book, which you can edit and reorder." },
            { icon: FileText, name: "Chapter outlines", description: "Purpose, sections, key questions and research ideas for every chapter." },
            { icon: CalendarCheck, name: "Writing roadmap", description: "Milestones that fit your schedule and target date." },
          ]}
        />

        <main className="flex-grow container mx-auto px-4 py-10 max-w-5xl">
          <ToolCreditBar cost={`${WRITE_IT_COSTS.plan} credits for your book plan · ${WRITE_IT_COSTS.outlines} for all chapter outlines · 1 for smaller updates`} />
          <ToolGuard toolName="write-it" showCreditInfo={false}>
            {view === "list" && listView}
            {view === "new" && newView}
            {view === "workspace" && workspace}
          </ToolGuard>
        </main>
        <Footer />
      </div>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send to Publish It</DialogTitle>
            <DialogDescription>
              We'll save your title, subtitle, author name, category, concept, description, audience and table of contents for Publish It.
              Publish It is coming soon; your details will be ready for it. An outline is not a finished manuscript, so Publish It will still ask whether your manuscript is ready.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="wi-author">Author name</Label>
            <Input id="wi-author" value={authorName} maxLength={200} onChange={(e) => setAuthorName(e.target.value)} placeholder="Name as it should appear on the book" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishOpen(false)}>Cancel</Button>
            <Button onClick={sendToPublish} disabled={!authorName.trim()}>Save for Publish It</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>"{toDelete?.plan.selectedTitle || toDelete?.project_name}" and all its outlines will be permanently deleted.</AlertDialogDescription>
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

export default WriteIt;
