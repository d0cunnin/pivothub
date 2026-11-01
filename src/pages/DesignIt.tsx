import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { ToolHero } from "@/components/tool-layout/ToolHero";
import { toast } from "sonner";
import {
  ArrowLeft, Columns2, Download, Eye, FileText, History, Image as ImageIcon, Lightbulb, Loader2, Palette, Plus, RefreshCw, Save,
  Sparkles, Trash2, Wand2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ToolIntro } from "@/components/tool-layout/ToolIntro";
import { ToolCreditBar } from "@/components/tool-layout/ToolCreditBar";
import { ToolGuard } from "@/components/ToolGuard";
import { StorageNotice } from "@/components/StorageNotice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useUsage } from "@/contexts/UsageContext";
import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/lib/invokeFunction";
import { BriefForm, CategoryPicker } from "@/components/design-it/BriefForm";
import { ChargeDialog, type PendingCharge } from "@/components/design-it/ChargeDialog";
import { ConceptView, DirectionCard, Markdown, Notice, versionKindLabel } from "@/components/design-it/VersionViews";
import { REFINEMENT_TYPES, categoryById, type DesignCategoryId } from "@/lib/designIt/categories";
import {
  DEFAULT_DESIGN_IT_COSTS, REFINE_MODE_LABELS, changeCategory, conceptVersions, createDesignProject, deleteDesignProject, designStorageError,
  diffConcepts, downloadImage, emptyBrief, evaluateStorage, formatBytes, imageDataUrl, imageVersions, latestOf, listDesignProjects,
  listVersions, missingBrief, myStorageUsage, newRequestId, refineOperation, saveDesignProject, signedImageUrls, userSpecifications,
  type DesignBrief, type DesignCosts, type DesignOperation, type DesignProject, type DesignVersion, type RefineMode, type StorageLimits,
  type StorageUsage,
} from "@/lib/designIt/logic";
import { generateDesignItPDF } from "@/lib/pdf-reports/design-it";
import heroImage from "@/assets/hero-image.jpg";

type View = "list" | "new" | "workspace";

const STAGES = ["Concept", "Directions", "Visualize", "Refine", "Summary"] as const;

const DesignIt = () => {
  const { user, isAdmin } = useAuth();
  const { remainingRequests } = useUsage();
  const [view, setView] = useState<View>("list");
  const [projects, setProjects] = useState<DesignProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [storageNote, setStorageNote] = useState<string | null>(null);
  const [costs, setCosts] = useState<DesignCosts>({ ...DEFAULT_DESIGN_IT_COSTS });
  const [limits, setLimits] = useState<StorageLimits>({ maxImagesPerUser: null, maxBytesPerUser: null });
  const [usage, setUsage] = useState<StorageUsage>({ images: 0, bytes: 0 });

  // new project
  const [newCategory, setNewCategory] = useState<DesignCategoryId | null>(null);
  const [newName, setNewName] = useState("");
  const [brief, setBrief] = useState<DesignBrief>(emptyBrief());

  // workspace
  const [project, setProject] = useState<DesignProject | null>(null);
  const [versions, setVersions] = useState<DesignVersion[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState("concept");
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<PendingCharge | null>(null);
  const [running, setRunning] = useState(false);
  const [viewing, setViewing] = useState<DesignVersion | null>(null);
  const [toDelete, setToDelete] = useState<DesignProject | null>(null);

  // operation inputs
  const [directionNotes, setDirectionNotes] = useState("");
  const [imageNotes, setImageNotes] = useState("");
  const [refineMode, setRefineMode] = useState<RefineMode>("text");
  const [refineTypes, setRefineTypes] = useState<string[]>([]);
  const [refineText, setRefineText] = useState("");
  const [refineBase, setRefineBase] = useState<string>("");
  const [compareA, setCompareA] = useState<string>("");
  const [compareB, setCompareB] = useState<string>("");
  const [exporting, setExporting] = useState(false);

  // ---------------------------------------------------------------- loading
  const refreshList = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setProjects(await listDesignProjects());
      setUsage(await myStorageUsage());
      setStorageNote(null);
    } catch (e) {
      setStorageNote(designStorageError(e));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void refreshList(); }, [refreshList]);

  // Live prices and storage settings from the server (free; no AI call).
  useEffect(() => {
    if (!user) return;
    supabase.functions.invoke("design-it", { body: { action: "config" } }).then(({ data }) => {
      if (data?.costs) setCosts({ ...DEFAULT_DESIGN_IT_COSTS, ...data.costs });
      if (data?.storageLimits) setLimits(data.storageLimits);
    }).catch(() => undefined);
  }, [user]);

  const loadVersions = useCallback(async (projectId: string) => {
    const list = await listVersions(projectId);
    setVersions(list);
    const paths = list.map((v) => v.image_path).filter(Boolean) as string[];
    try { setUrls(await signedImageUrls(paths)); } catch { setUrls({}); }
    return list;
  }, []);

  const openProject = async (p: DesignProject) => {
    setProject(p);
    setDirty(false);
    setTab("concept");
    setView("workspace");
    setVersions([]);
    try { await loadVersions(p.id); } catch (e) { toast.error(designStorageError(e)); }
  };

  // ---------------------------------------------------------------- saving (free)
  const persist = async (p: DesignProject | null = project, quiet = false) => {
    if (!p) return null;
    setSaving(true);
    try {
      const saved = await saveDesignProject(p);
      setProject(saved);
      setDirty(false);
      setProjects((list) => [saved, ...list.filter((x) => x.id !== saved.id)]);
      if (!quiet) toast.success("Project saved");
      return saved;
    } catch (e) {
      toast.error(designStorageError(e));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const createFromBrief = async () => {
    const problem = missingBrief(brief);
    if (problem) { toast.error(problem); return; }
    if (!user) { toast.error("Please sign in to save your design project."); return; }
    setSaving(true);
    try {
      const created = await createDesignProject(user.id, newName.trim() || brief.concept.slice(0, 60), brief);
      setProjects((list) => [created, ...list]);
      await openProject(created);
      toast.success("Brief saved. Develop your concept when you're ready.");
    } catch (e) {
      toast.error(designStorageError(e));
    } finally {
      setSaving(false);
    }
  };

  const selectDirection = async (versionId: string, index: number, name: string) => {
    if (!project) return;
    const next = { ...project, selected_direction: { versionId, index, name } };
    setProject(next);
    await persist(next, true);
    toast.success(`Selected "${name}"`);
  };

  // ---------------------------------------------------------------- paid operations
  const ask = (op: DesignOperation, title: string, description: string, body: Record<string, unknown>, after?: (v: DesignVersion[]) => void) => {
    if (!project) return;
    if (missingBrief(project.brief)) { toast.error(missingBrief(project.brief)!); setTab("brief"); return; }
    setPending({
      title, description, cost: costs[op],
      run: async () => {
        let current = project;
        if (dirty) {
          const saved = await persist(project, true);
          if (!saved) return;
          current = saved;
        }
        const requestId = newRequestId(); // one id per confirmed request
        const { data, error } = await invokeFunction<any>("design-it", { body: { ...body, projectId: current.id, requestId } });
        if (error) {
          if (error.timedOut) {
            toast.message("This is taking longer than usual. We'll check for your result in a moment.");
            setTimeout(() => { void loadVersions(current.id); }, 20000);
          } else {
            toast.error(error.message);
          }
          return;
        }
        const list = await loadVersions(current.id);
        if (data?.status) setProject((p) => (p ? { ...p, status: data.status } : p));
        if (data?.versions?.some((v: DesignVersion) => v.image_path)) setUsage(await myStorageUsage().catch(() => usage));
        toast.success(isAdmin ? "Done" : `Done. ${data?.creditsUsed ?? costs[op]} credit${(data?.creditsUsed ?? costs[op]) === 1 ? "" : "s"} used.`);
        after?.(list);
      },
    });
  };

  const confirmPending = async () => {
    if (!pending || running) return;
    setRunning(true);
    try { await pending.run(); } finally { setRunning(false); setPending(null); }
  };

  // ---------------------------------------------------------------- derived
  const concepts = useMemo(() => conceptVersions(versions), [versions]);
  const images = useMemo(() => imageVersions(versions), [versions]);
  const directionSets = useMemo(() => versions.filter((v) => v.kind === "directions"), [versions]);
  const currentConcept = useMemo(() => latestOf(versions, ["concept", "refinement"]), [versions]);
  const summary = useMemo(() => latestOf(versions, ["summary"]), [versions]);
  const storage = evaluateStorage(usage, limits);
  const sel = project?.selected_direction;
  const cat = project ? categoryById(project.brief.category) : null;
  const stageDone = [concepts.length > 0, directionSets.length > 0, images.length > 0, versions.some((v) => v.kind === "refinement" || !!v.content?.revisedFrom), !!summary];

  const conceptA = versions.find((v) => v.id === compareA);
  const conceptB = versions.find((v) => v.id === compareB);
  const pairIsText = conceptA && conceptB && [conceptA, conceptB].every((v) => v.kind === "concept" || v.kind === "refinement");
  const pairIsImage = conceptA && conceptB && [conceptA, conceptB].every((v) => v.kind === "image");

  const exportPdf = async () => {
    if (!project) return;
    setExporting(true);
    try {
      const picked = images.slice(-4);
      const imgs = (await Promise.all(picked.map(async (v) => {
        const d = await imageDataUrl(v.image_path!).catch(() => null);
        return d ? { label: `Version ${v.version_number}: ${v.label}`, ...d } : null;
      }))).filter(Boolean) as { label: string; dataUrl: string; format: string }[];
      generateDesignItPDF(project, versions, imgs).save(`${project.project_name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "design"}-summary.pdf`);
    } catch {
      toast.error("We couldn't create the PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const costLabel = (op: DesignOperation) => `${costs[op]} credit${costs[op] === 1 ? "" : "s"}`;

  // ---------------------------------------------------------------- views
  const listView = (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>My Design Projects</CardTitle>
          <CardDescription>Reopen a project to keep developing it. Reopening never uses credits.</CardDescription>
        </div>
        <Button onClick={() => { setBrief(emptyBrief()); setNewCategory(null); setNewName(""); setView("new"); }}><Plus className="h-4 w-4 mr-1" /> New Design Project</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {storageNote && <p className="text-sm text-muted-foreground">{storageNote}</p>}
        {loading && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</p>}
        {!loading && !projects.length && !storageNote && <p className="text-sm text-muted-foreground">No design projects yet.</p>}
        {projects.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
            <div className="flex-1 min-w-[12rem]">
              <p className="font-semibold">{p.project_name}</p>
              <p className="text-xs text-muted-foreground">{categoryById(p.brief.category).name} · updated {new Date(p.updated_at).toLocaleDateString()}</p>
            </div>
            <Badge variant="outline">{p.status}</Badge>
            <Button size="sm" onClick={() => openProject(p)}>Open</Button>
            <Button size="icon" variant="ghost" aria-label={`Delete ${p.project_name}`} onClick={() => setToDelete(p)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <StorageNotice extra={<p>Stored visuals: {usage.images} ({formatBytes(usage.bytes)}).</p>} />
      </CardContent>
    </Card>
  );

  const newView = (
    <Card>
      <CardHeader>
        <Button variant="ghost" size="sm" className="w-fit -ml-2 mb-1" onClick={() => setView("list")}><ArrowLeft className="h-4 w-4 mr-1" /> My projects</Button>
        <CardTitle>{newCategory ? "Design Brief" : "What are you designing?"}</CardTitle>
        <CardDescription>
          {newCategory ? "Answer what you can. Only the questions for your category are shown. Saving your brief is free." : "Choose a category to see the questions that fit your project."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!newCategory ? (
          <CategoryPicker value={newCategory} onChange={(c) => { setNewCategory(c); setBrief((b) => changeCategory(b, c)); }} />
        ) : (
          <>
            <div className="space-y-1">
              <Label htmlFor="di-name">Project name</Label>
              <Input id="di-name" maxLength={200} className="sm:w-96" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Café rebrand" />
            </div>
            <BriefForm value={brief} onChange={setBrief} />
            {brief.category === "architecture" && <Notice text="Architectural Concepts gives conceptual design assistance only, not construction drawings, engineering approvals or professional certifications." />}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setNewCategory(null)}>Change category</Button>
              <Button className="flex-1" disabled={saving} onClick={createFromBrief}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save brief and continue (free)
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const versionPicker = (value: string, onChange: (v: string) => void, list: DesignVersion[], id: string, placeholder = "Choose a version") => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id}><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>{list.map((v) => <SelectItem key={v.id} value={v.id}>v{v.version_number} · {versionKindLabel(v.kind)} · {v.label}</SelectItem>)}</SelectContent>
    </Select>
  );

  const imageGrid = (list: DesignVersion[]) => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[...list].reverse().map((v) => (
        <figure key={v.id} className="rounded-lg border overflow-hidden">
          {urls[v.image_path!] ? <img src={urls[v.image_path!]} alt={v.label} className="w-full aspect-square object-cover bg-muted" loading="lazy" />
            : <div className="aspect-square bg-muted flex items-center justify-center text-xs text-muted-foreground">Image unavailable</div>}
          <figcaption className="p-2 flex items-center justify-between gap-2">
            <span className="text-xs">v{v.version_number} · {v.label}</span>
            <Button size="icon" variant="ghost" aria-label={`Download version ${v.version_number}`}
              onClick={() => downloadImage(v.image_path!, `${project?.project_name}-v${v.version_number}`).catch(() => toast.error("Download failed. Please try again."))}>
              <Download className="h-4 w-4" />
            </Button>
          </figcaption>
        </figure>
      ))}
    </div>
  );

  const workspace = project && cat && (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" className="-ml-2" onClick={() => { if (!dirty || window.confirm("Leave without saving your changes?")) { setView("list"); void refreshList(); } }}>
              <ArrowLeft className="h-4 w-4 mr-1" /> My projects
            </Button>
            <Badge variant="outline">{cat.name}</Badge>
            <Badge>{project.status}</Badge>
            {dirty && <Badge variant="outline">Unsaved changes</Badge>}
          </div>
          <Input aria-label="Project name" className="text-lg font-semibold" maxLength={200} value={project.project_name}
            onChange={(e) => { setProject({ ...project, project_name: e.target.value }); setDirty(true); }} />
          <ol className="flex flex-wrap gap-2 text-xs" aria-label="Design progress">
            {STAGES.map((s, i) => (
              <li key={s} className={`rounded-full border px-2.5 py-1 ${stageDone[i] ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"}`}>{i + 1}. {s}</li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            {dirty && <Button size="sm" onClick={() => persist()} disabled={saving}><Save className="h-4 w-4 mr-1" /> Save</Button>}
            <Button size="sm" variant="outline" onClick={exportPdf} disabled={exporting || !versions.length}>
              {exporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />} Download summary PDF (free)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="concept"><Lightbulb className="h-4 w-4 mr-1" />Concept</TabsTrigger>
          <TabsTrigger value="directions"><Sparkles className="h-4 w-4 mr-1" />Directions</TabsTrigger>
          <TabsTrigger value="visualize"><ImageIcon className="h-4 w-4 mr-1" />Visualize</TabsTrigger>
          <TabsTrigger value="refine"><Wand2 className="h-4 w-4 mr-1" />Refine</TabsTrigger>
          <TabsTrigger value="versions"><History className="h-4 w-4 mr-1" />Versions</TabsTrigger>
          <TabsTrigger value="summary"><FileText className="h-4 w-4 mr-1" />Summary</TabsTrigger>
          <TabsTrigger value="brief"><Palette className="h-4 w-4 mr-1" />Brief</TabsTrigger>
        </TabsList>

        {/* Stage 1 */}
        <TabsContent value="concept">
          <Card><CardContent className="pt-6 space-y-4">
            {currentConcept ? (
              <>
                <p className="text-xs text-muted-foreground">Showing version {currentConcept.version_number} ({currentConcept.label}). Older versions are in the Versions tab.</p>
                <ConceptView v={currentConcept} />
                <div className="flex flex-wrap gap-2 border-t pt-4">
                  <Button variant="outline" onClick={() => setTab("directions")}><Sparkles className="h-4 w-4 mr-1" /> Explore directions</Button>
                  <Button variant="outline" onClick={() => setTab("visualize")}><ImageIcon className="h-4 w-4 mr-1" /> Visualize</Button>
                  <Button variant="outline" onClick={() => setTab("refine")}><Wand2 className="h-4 w-4 mr-1" /> Refine</Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Turn your brief into a structured design concept: overview, objectives, creative direction, key elements, materials, functional considerations, improvements and challenges. No image is created at this stage.</p>
                <Button onClick={() => ask("concept", "Develop your design concept", "The AI will read your saved brief and create your initial design concept.", { action: "concept" })}>
                  <Lightbulb className="h-4 w-4 mr-1" /> Develop concept ({costLabel("concept")})
                </Button>
              </div>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* Stage 2 */}
        <TabsContent value="directions">
          <Card><CardContent className="pt-6 space-y-4">
            {sel && <p className="text-sm">Selected direction: <span className="font-semibold">{sel.name}</span></p>}
            {!directionSets.length && <p className="text-sm text-muted-foreground">Explore different written creative directions, then select the one you want to take forward. Selecting a direction is free.</p>}
            {[...directionSets].reverse().map((set) => (
              <div key={set.id} className="space-y-2">
                <p className="text-xs text-muted-foreground">Version {set.version_number} · {new Date(set.created_at).toLocaleString()}</p>
                <div className="grid gap-3 md:grid-cols-3">
                  {(set.content?.directions ?? []).map((d: any, i: number) => (
                    <DirectionCard key={i} d={d} selected={sel?.versionId === set.id && sel?.index === i} onSelect={() => selectDirection(set.id, i, d.name)} />
                  ))}
                </div>
              </div>
            ))}
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="di-dir-notes">Anything to steer the new directions? (optional)</Label>
              <Input id="di-dir-notes" maxLength={500} value={directionNotes} onChange={(e) => setDirectionNotes(e.target.value)} placeholder="e.g. one direction that feels more luxurious" />
              <Button onClick={() => ask("directions", "Explore creative directions", "The AI will write 3 new, distinct creative directions for your design.", { action: "directions", instructions: directionNotes }, () => setDirectionNotes(""))}>
                <Sparkles className="h-4 w-4 mr-1" /> {directionSets.length ? "Explore 3 more directions" : "Explore 3 directions"} ({costLabel("directions")})
              </Button>
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* Stage 3 */}
        <TabsContent value="visualize">
          <Card><CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Create a concept visual from your {currentConcept ? `latest concept (v${currentConcept.version_number})` : "brief"}{sel ? ` and the "${sel.name}" direction` : ""}.
              Images are only created when you ask. Visuals are AI concept images, not technical drawings.
            </p>
            {images.length > 0 && imageGrid(images)}
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="di-img-notes">Extra direction for this visual (optional)</Label>
              <Input id="di-img-notes" maxLength={500} value={imageNotes} onChange={(e) => setImageNotes(e.target.value)} placeholder="e.g. front view on a white background" />
              {!storage.canStoreNewImage && <p className="text-sm text-destructive">{storage.message}</p>}
              <Button disabled={!storage.canStoreNewImage}
                onClick={() => ask("image", images.length ? "Generate another visual" : "Generate a visual", "The AI will create one new concept image for this project.", { action: "image", instructions: imageNotes }, () => setImageNotes(""))}>
                <ImageIcon className="h-4 w-4 mr-1" /> Generate visual ({costLabel("image")})
              </Button>
            </div>
            <StorageNotice extra={<p>Stored visuals across your projects: {usage.images} ({formatBytes(usage.bytes)}).</p>} />
          </CardContent></Card>
        </TabsContent>

        {/* Stage 4 */}
        <TabsContent value="refine">
          <Card><CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">What kind of refinement?</p>
              <RadioGroup value={refineMode} onValueChange={(v) => { setRefineMode(v as RefineMode); setRefineBase(""); }} className="grid gap-2 sm:grid-cols-3">
                {(["text", "image", "both"] as RefineMode[]).map((m) => (
                  <label key={m} className={`flex items-start gap-2 rounded-md border p-2 text-sm cursor-pointer ${refineMode === m ? "border-primary" : ""}`}>
                    <RadioGroupItem value={m} className="mt-0.5" />
                    <span><span className="font-medium">{REFINE_MODE_LABELS[m]}</span><br /><span className="text-xs text-muted-foreground">{costLabel(refineOperation(m))}</span></span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-1">
              <Label htmlFor="di-refine-base">Start from</Label>
              {versionPicker(refineBase, setRefineBase, refineMode === "image" ? images : concepts, "di-refine-base",
                refineMode === "image" ? (images.length ? "Latest visual" : "Generate a visual first") : (concepts.length ? "Latest concept" : "Develop the concept first"))}
              {refineMode === "both" && <p className="text-xs text-muted-foreground">The new visual is based on your latest image{images.length ? "" : " (generate a visual first)"}.</p>}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Changes</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {REFINEMENT_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={refineTypes.includes(t)} onCheckedChange={() => setRefineTypes((xs) => (xs.includes(t) ? xs.filter((x) => x !== t) : [...xs, t]))} /> {t}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="di-refine-text">Describe the change</Label>
              <Textarea id="di-refine-text" rows={3} maxLength={2000} value={refineText} onChange={(e) => setRefineText(e.target.value)} placeholder="e.g. swap the gold for #2E7D32 green and make the handle shorter" />
            </div>
            {(refineMode !== "text") && !storage.canStoreNewImage && <p className="text-sm text-destructive">{storage.message}</p>}
            <Button
              disabled={(refineMode === "text" && !concepts.length) || (refineMode === "image" && !images.length) || (refineMode === "both" && (!concepts.length || !images.length)) || (refineMode !== "text" && !storage.canStoreNewImage)}
              onClick={() => {
                if (!refineTypes.length && !refineText.trim()) { toast.error("Choose or describe at least one change."); return; }
                ask(refineOperation(refineMode), REFINE_MODE_LABELS[refineMode], "This creates a new version. Your earlier versions stay unchanged.",
                  { action: "refine", mode: refineMode, baseVersionId: refineBase || undefined, refinements: refineTypes, instructions: refineText },
                  () => { setRefineText(""); setRefineTypes([]); setTab(refineMode === "text" ? "concept" : "visualize"); });
              }}>
              <Wand2 className="h-4 w-4 mr-1" /> Refine ({costLabel(refineOperation(refineMode))})
            </Button>
            <p className="text-xs text-muted-foreground">Each refinement is a separate paid request. There are no unlimited revisions.</p>
          </CardContent></Card>
        </TabsContent>

        {/* Versions and comparison (free) */}
        <TabsContent value="versions">
          <Card><CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground">Every AI result is saved as its own version. Viewing and comparing saved versions is free.</p>
            {!versions.length && <p className="text-sm text-muted-foreground">No versions yet.</p>}
            <div className="divide-y rounded-lg border">
              {[...versions].reverse().map((v) => (
                <div key={v.id} className="flex flex-wrap items-center gap-2 p-2 text-sm">
                  <span className="font-mono text-xs w-8">v{v.version_number}</span>
                  <Badge variant="outline">{versionKindLabel(v.kind)}</Badge>
                  <span className="flex-1 min-w-[10rem]">{v.label}</span>
                  <span className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString()}</span>
                  <Button size="sm" variant="ghost" onClick={() => setViewing(v)}><Eye className="h-4 w-4 mr-1" /> View</Button>
                </div>
              ))}
            </div>
            {versions.length > 1 && (
              <div className="space-y-3 border-t pt-4">
                <p className="font-medium flex items-center gap-2"><Columns2 className="h-4 w-4" /> Compare two versions (free)</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {versionPicker(compareA, setCompareA, [...concepts, ...images], "di-cmp-a", "First version")}
                  {versionPicker(compareB, setCompareB, [...concepts, ...images], "di-cmp-b", "Second version")}
                </div>
                {conceptA && conceptB && !pairIsText && !pairIsImage && <p className="text-sm text-muted-foreground">Choose two written versions or two visuals.</p>}
                {pairIsImage && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[conceptA!, conceptB!].map((v) => (
                      <figure key={v.id} className="rounded-lg border overflow-hidden">
                        {urls[v.image_path!] && <img src={urls[v.image_path!]} alt={v.label} className="w-full aspect-square object-cover" />}
                        <figcaption className="p-2 text-xs">v{v.version_number} · {v.label}</figcaption>
                      </figure>
                    ))}
                  </div>
                )}
                {pairIsText && (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border">
                        <thead><tr className="bg-muted/50"><th className="p-2 text-left w-36">Section</th><th className="p-2 text-left">v{conceptA!.version_number}</th><th className="p-2 text-left">v{conceptB!.version_number}</th></tr></thead>
                        <tbody>
                          {diffConcepts(conceptA!, conceptB!).map((r) => (
                            <tr key={r.key} className="border-t align-top">
                              <td className="p-2 font-medium">{r.label}{r.changed && <Badge variant="secondary" className="ml-1">changed</Badge>}</td>
                              <td className="p-2 whitespace-pre-line text-muted-foreground">{r.left || "—"}</td>
                              <td className="p-2 whitespace-pre-line text-muted-foreground">{r.right || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Button variant="outline" disabled={compareA === compareB}
                      onClick={() => ask("compare", "AI comparison", "The AI will analyse what changed, the strengths of each version and which fits your brief better.", { action: "compare", compareIds: [compareA, compareB] }, (list) => { const c = latestOf(list, ["comparison"]); if (c) setViewing(c); })}>
                      <RefreshCw className="h-4 w-4 mr-1" /> Ask the AI to analyse them ({costLabel("compare")})
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* Stage 5 */}
        <TabsContent value="summary">
          <Card><CardContent className="pt-6 space-y-5">
            <Notice text={summary?.content?.notice} />
            <section>
              <h3 className="font-semibold mb-2">Your specifications <span className="text-xs font-normal text-muted-foreground">(from your brief)</span></h3>
              <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[12rem_1fr]">
                {userSpecifications(project.brief).map(([k, v]) => (
                  <div key={k} className="contents"><dt className="font-medium">{k}</dt><dd className="text-muted-foreground whitespace-pre-line">{v}</dd></div>
                ))}
              </dl>
            </section>
            {sel && <p className="text-sm"><span className="font-semibold">Selected creative direction:</span> {sel.name}</p>}
            {summary ? (
              <section className="space-y-3 border-t pt-4">
                <h3 className="font-semibold">AI design suggestions <span className="text-xs font-normal text-muted-foreground">(summary v{summary.version_number}, based on concept v{summary.content.basedOn})</span></h3>
                <p className="text-sm text-muted-foreground">{summary.content.finalConcept}</p>
                {summary.content.palette?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {summary.content.palette.map((c: any, i: number) => (
                      <span key={i} className="inline-flex items-center gap-2 rounded border px-2 py-1 text-xs">
                        {c.hex && <span className="h-4 w-4 rounded-sm border" style={{ backgroundColor: c.hex }} />} {c.name} {c.hex} {c.use && `· ${c.use}`}
                      </span>
                    ))}
                  </div>
                )}
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    ["Design objectives", summary.content.objectives], ["Suggested materials and components", summary.content.materials],
                    ["Suggested specifications to confirm", summary.content.specifications], ["Functional considerations", summary.content.functional],
                    ["Outstanding design questions", summary.content.outstandingQuestions], ["Suggested next steps", summary.content.nextSteps],
                  ].filter(([, items]) => (items as string[])?.length).map(([title, items]) => (
                    <div key={title as string}>
                      <p className="text-sm font-semibold mb-1">{title as string}</p>
                      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-0.5">{(items as string[]).map((x, i) => <li key={i}>{x}</li>)}</ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <p className="text-sm text-muted-foreground border-t pt-4">When you're happy with your concept, create a final summary with a suggested palette, materials, specifications to confirm, open questions and next steps.</p>
            )}
            {images.length > 0 && (
              <section className="space-y-2 border-t pt-4">
                <h3 className="font-semibold">Visual references</h3>
                {imageGrid(images)}
              </section>
            )}
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button disabled={!concepts.length} onClick={() => ask("summary", summary ? "Update the final summary" : "Create the final summary", "The AI will summarize your latest concept into a final design summary.", { action: "summary" })}>
                <FileText className="h-4 w-4 mr-1" /> {summary ? "Update summary" : "Create final summary"} ({costLabel("summary")})
              </Button>
              <Button variant="outline" onClick={exportPdf} disabled={exporting || !versions.length}><Download className="h-4 w-4 mr-1" /> Download PDF (free)</Button>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="brief">
          <Card><CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground">Editing your brief is free and never regenerates anything. New AI requests use your latest saved brief.</p>
            <BriefForm value={project.brief} onChange={(b) => { setProject({ ...project, brief: b, category: b.category }); setDirty(true); }} />
            <Button size="sm" disabled={saving} onClick={() => { const problem = missingBrief(project.brief); if (problem) { toast.error(problem); return; } void persist(); }}>
              <Save className="h-4 w-4 mr-1" /> Save brief
            </Button>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Design It - AI Design Concept Studio | PivotHub</title>
        <meta name="description" content="Develop design ideas into structured concepts: explore creative directions, generate concept visuals, refine and compare versions, and export a design summary." />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <ToolHero
        badge="DESIGN IT · CONCEPT STUDIO"
        title="Design It"
        subtitle="Imagine It. Design It. Develop It."
        credits={`${costs.concept} Credits per concept`}
      />

        <ToolIntro
          about="Develop your idea into a structured design concept. Describe what you want to create, explore different creative directions, generate concept visuals when you choose to, refine the design step by step and keep every version organised. Works for products, brands, fashion, interiors, digital interfaces, events, architectural concepts and other creative projects."
          forWho="Creators, founders, makers and small businesses shaping a design idea before prototyping, hiring a designer or going to production."
          steps={["Choose a category and fill in your design brief (free).", "Develop the concept, explore directions and create visuals; each paid step shows its cost first.", "Refine, compare versions and download your design summary."]}
          items={[
            { icon: Lightbulb, name: "Design concept", description: "Overview, objectives, key elements, materials and challenges." },
            { icon: Sparkles, name: "Creative directions", description: "Distinct written directions to choose from." },
            { icon: ImageIcon, name: "Concept visuals", description: "AI images created only when you ask, with credit confirmation." },
            { icon: History, name: "Versions and summary", description: "Version history, free comparisons and a downloadable summary." },
          ]}
        />

        <main className="flex-grow container mx-auto px-4 py-10 max-w-5xl">
          <ToolCreditBar cost={`Free brief and project saving · concept ${costs.concept} · directions ${costs.directions} · visual ${costs.image} · refinements from ${Math.min(costs.refine_text, costs.refine_image)} credits`} />
          <ToolGuard toolName="design-it" showCreditInfo={false}>
            {view === "list" && listView}
            {view === "new" && newView}
            {view === "workspace" && workspace}
          </ToolGuard>
        </main>
        <Footer />
      </div>

      <ChargeDialog pending={pending} balance={remainingRequests} isAdmin={isAdmin} running={running} onCancel={() => setPending(null)} onConfirm={confirmPending} />

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Version {viewing?.version_number}: {viewing?.label}</DialogTitle></DialogHeader>
          {viewing && (viewing.kind === "concept" || viewing.kind === "refinement") && <ConceptView v={viewing} />}
          {viewing?.kind === "directions" && <div className="grid gap-3">{(viewing.content?.directions ?? []).map((d: any, i: number) => <DirectionCard key={i} d={d} selected={sel?.versionId === viewing.id && sel?.index === i} />)}</div>}
          {viewing?.kind === "image" && (urls[viewing.image_path!] ? <img src={urls[viewing.image_path!]} alt={viewing.label} className="w-full rounded-lg" /> : <p className="text-sm text-muted-foreground">Image unavailable.</p>)}
          {viewing?.kind === "comparison" && <Markdown text={viewing.content?.analysis ?? ""} />}
          {viewing?.kind === "summary" && <p className="text-sm text-muted-foreground">{viewing.content?.finalConcept} <button className="text-primary underline" onClick={() => { setViewing(null); setTab("summary"); }}>Open the Summary tab</button></p>}
          {viewing?.content?.request && <p className="text-xs text-muted-foreground border-t pt-2">Your request: {viewing.content.request}</p>}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this design project?</AlertDialogTitle>
            <AlertDialogDescription>"{toDelete?.project_name}", all its versions and its stored images will be permanently deleted. Download anything you want to keep first.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              const p = toDelete; setToDelete(null); if (!p) return;
              try { await deleteDesignProject(p.id); setProjects((l) => l.filter((x) => x.id !== p.id)); setUsage(await myStorageUsage().catch(() => usage)); toast.success("Project deleted"); }
              catch (e) { toast.error(designStorageError(e)); }
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DesignIt;
