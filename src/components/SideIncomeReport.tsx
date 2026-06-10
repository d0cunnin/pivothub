import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/lib/invokeFunction";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ArrowRight, DollarSign, Clock, TrendingUp, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { generateSideIncomeReportPDF } from "@/lib/pdf-generator";


interface SideIncomeReportProps {
  assessmentId: string; // Now contains stringified assessment data
}

// ---- Safe rendering helpers ----
const isPlainObject = (v: any) =>
  v !== null && typeof v === "object" && !Array.isArray(v);

/** Render anything as a safe string (never returns an object). */
const renderText = (v: any): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(renderText).filter(Boolean).join(", ");
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

/** Coerce something that may be a string, array, or object into an array of strings. */
const toStringArray = (v: any): string[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(renderText).filter(Boolean);
  if (typeof v === "string") return [v];
  if (isPlainObject(v)) return Object.values(v).map(renderText).filter(Boolean);
  return [renderText(v)];
};

function SkillsAnalysisBlock({ data }: { data: any }) {
  if (!data) return null;
  if (typeof data === "string") {
    return <p className="text-muted-foreground leading-relaxed">{data}</p>;
  }
  if (!isPlainObject(data)) {
    return <p className="text-muted-foreground leading-relaxed">{renderText(data)}</p>;
  }

  const sections: Array<{ label: string; value: any; type: "list" | "text" }> = [
    { label: "Marketable Skills", value: data.marketableSkills, type: "list" },
    { label: "Undervalued Skills", value: data.undervaluedSkills, type: "list" },
    { label: "Quick Monetization", value: data.quickMonetization, type: "text" },
    { label: "Skill Gaps to Develop", value: data.skillGaps, type: "list" },
    { label: "Learning Priority", value: data.learningPriority, type: "text" },
  ];

  return (
    <div className="space-y-4">
      {sections.map((s) => {
        if (!s.value) return null;
        if (s.type === "list") {
          const items = toStringArray(s.value);
          if (items.length === 0) return null;
          return (
            <div key={s.label}>
              <h4 className="font-semibold mb-2">{s.label}</h4>
              <ul className="space-y-1 ml-4">
                {items.map((item, i) => (
                  <li key={i} className="text-muted-foreground">• {item}</li>
                ))}
              </ul>
            </div>
          );
        }
        return (
          <div key={s.label}>
            <h4 className="font-semibold mb-1">{s.label}</h4>
            <p className="text-muted-foreground leading-relaxed">{renderText(s.value)}</p>
          </div>
        );
      })}
    </div>
  );
}

function IncomePotentialBlock({ value }: { value: any }) {
  if (!value) return <p className="font-semibold">—</p>;
  if (typeof value === "string" || typeof value === "number") {
    return <p className="font-semibold">{renderText(value)}</p>;
  }
  if (isPlainObject(value)) {
    // Show the most informative single line in the chip
    const summary = value.year1 || value.month6 || value.month3 || value.month1;
    return <p className="font-semibold">{renderText(summary || Object.values(value)[0])}</p>;
  }
  return <p className="font-semibold">{renderText(value)}</p>;
}

function IncomeTimelineGrid({ value }: { value: any }) {
  if (!isPlainObject(value)) return null;
  const rows: Array<[string, any]> = [
    ["Month 1", value.month1],
    ["Month 3", value.month3],
    ["Month 6", value.month6],
    ["Year 1", value.year1],
  ].filter(([, v]) => v) as Array<[string, any]>;
  if (rows.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
      {rows.map(([label, v]) => (
        <div key={label} className="rounded-md border bg-muted/40 p-2">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">{renderText(v)}</p>
        </div>
      ))}
    </div>
  );
}

function ResourcesBlock({ resources }: { resources: any }) {
  if (!resources) return null;

  // Legacy shape: array of { category, items }
  if (Array.isArray(resources)) {
    return (
      <div className="space-y-4">
        {resources.map((category: any, index: number) => (
          <div key={index}>
            <h4 className="font-semibold mb-2">{renderText(category?.category)}</h4>
            <ul className="space-y-1 ml-4">
              {toStringArray(category?.items).map((item, i) => (
                <li key={i} className="text-muted-foreground">• {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  if (!isPlainObject(resources)) return null;

  const sections: Array<{ key: string; label: string }> = [
    { key: "platforms", label: "Platforms" },
    { key: "learningResources", label: "Learning Resources" },
    { key: "tools", label: "Tools" },
    { key: "communities", label: "Communities" },
  ];

  return (
    <div className="space-y-4">
      {sections.map((s) => {
        const items = toStringArray(resources[s.key]);
        if (items.length === 0) return null;
        return (
          <div key={s.key}>
            <h4 className="font-semibold mb-2">{s.label}</h4>
            <ul className="space-y-1 ml-4">
              {items.map((item, i) => (
                <li key={i} className="text-muted-foreground">• {item}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function MonthBlock({
  monthLabel,
  subtitle,
  monthData,
}: {
  monthLabel: string;
  subtitle: string;
  monthData: any;
}) {
  if (!monthData) return null;

  let goal: string | null = null;
  let actions: string[] = [];

  if (Array.isArray(monthData)) {
    actions = toStringArray(monthData);
  } else if (isPlainObject(monthData)) {
    goal = monthData.goal ? renderText(monthData.goal) : null;
    actions = toStringArray(monthData.weeklyActions ?? monthData.actions);
  } else {
    actions = [renderText(monthData)];
  }

  if (!goal && actions.length === 0) return null;

  return (
    <div>
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <Badge>{monthLabel}</Badge>
        {subtitle}
      </h4>
      {goal && (
        <p className="text-sm text-muted-foreground italic mb-2">Goal: {goal}</p>
      )}
      <ul className="space-y-2">
        {actions.map((action, index) => (
          <li key={index} className="flex gap-2">
            <span className="text-primary">▹</span>
            <span className="text-muted-foreground">{action}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SideIncomeReport({ assessmentId }: SideIncomeReportProps) {
  const [generating, setGenerating] = useState(true);
  const [report, setReport] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    generateReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateReport = async () => {
    setGenerating(true);
    try {
      let assessmentData: any;
      try {
        assessmentData = assessmentId ? JSON.parse(assessmentId) : null;
      } catch (e) {
        throw new Error('Invalid assessment payload — please retake the assessment.');
      }
      if (!assessmentData) throw new Error('No assessment data found.');
      console.log('📤 Sending assessment to edge function:', {
        keys: Object.keys(assessmentData),
        constraintsType: typeof assessmentData.constraints,
        constraintsValue: assessmentData.constraints,
        skillsCount: assessmentData.skills?.length
      });

      const { data, error } = await invokeFunction('generate-side-income-report', {
        body: { assessmentData }
      });

      console.log('📬 Response received:', {
        hasData: !!data,
        hasError: !!error,
        dataKeys: data ? Object.keys(data) : [],
        error
      });

      if (error) {
        console.error('Function invocation error:', error);
        throw new Error(`Function error: ${error.message || JSON.stringify(error)}`);
      }

      if (!data) {
        throw new Error('No response data received from function');
      }

      if (data.error) {
        console.error('Function returned error:', data.error, data.details);
        throw new Error(`Report generation failed: ${data.error}${data.details ? '\n' + JSON.stringify(data.details, null, 2) : ''}`);
      }

      if (!data.report) {
        console.error('Missing report in response:', data);
        throw new Error('Report data is missing from response');
      }

      console.log('✅ Report generated successfully');
      setReport(data.report);

      if (data._is_mock) {
        toast({
          title: "Demo Data Displayed",
          description: "AI parsing failed. Showing sample data. Please try regenerating.",
          variant: "destructive",
          duration: 10000
        });
      } else {
        toast({
          title: "Success!",
          description: "Your personalized blueprint is ready!",
        });
      }
    } catch (error: any) {
      console.error('❌ Error generating report:', error);
      const msg = (error?.message || '').toString();
      if (msg.includes('401') || /authentication required/i.test(msg) || /auth session/i.test(msg)) {
        toast({
          title: "Sign in required",
          description: "Your session expired. Please sign in again to generate your blueprint.",
          variant: "destructive",
        });
        window.location.href = '/auth?redirect=/earnit';
        return;
      }
      if (/insufficient credits/i.test(msg) || /limit_exceeded/i.test(msg)) {
        toast({
          title: "Not enough credits",
          description: "This blueprint uses 2 Tool Credits. Upgrade your plan to continue.",
          variant: "destructive",
        });
        window.location.href = '/pricing';
        return;
      }
      toast({
        title: "Report Generation Failed",
        description: msg || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = () => {
    try {
      const pdf = generateSideIncomeReportPDF(report);
      pdf.save(`pivothub-side-income-blueprint-${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "PDF Downloaded",
        description: "Your blueprint has been saved as a PDF",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (generating) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Generating Your Blueprint...
            </h3>
            <p className="text-muted-foreground text-center">
              Our AI is analyzing your assessment and creating a personalized plan. This may take a minute.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Unable to Generate Your Blueprint
            </CardTitle>
            <CardDescription>
              We encountered an issue creating your personalized income plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">This is usually a temporary issue that resolves on retry.</p>
              <p className="text-sm text-muted-foreground">
                Common causes: Network hiccup, API timeout, or system maintenance.
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={generateReport}
                className="w-full"
                size="lg"
              >
                Try Generating Again
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                If this persists after 2-3 attempts, please contact support with error code: REPORT_GEN_FAIL
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Earn It Blueprint</h1>
          <p className="text-muted-foreground">Personalized plan for building sustainable income</p>
        </div>
        <Button onClick={downloadReport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {renderText(report.executive_summary)}
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Skills Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <SkillsAnalysisBlock data={report.skills_analysis} />
        </CardContent>
      </Card>

      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Recommended Income Paths</h2>
        <div className="space-y-4">
          {Array.isArray(report.recommended_paths) && report.recommended_paths.map((path: any, index: number) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {renderText(path.title)}
                      <Badge variant="secondary">Path {renderText(path.rank ?? index + 1)}</Badge>
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {renderText(path.description)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {path.whyRecommended && (
                  <div className="rounded-md bg-primary/5 border border-primary/10 p-3">
                    <p className="text-xs font-semibold text-primary mb-1">Why this fits you</p>
                    <p className="text-sm text-muted-foreground">{renderText(path.whyRecommended)}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Startup Cost</p>
                      <p className="font-semibold">{renderText(path.startup_cost)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Time/Week</p>
                      <p className="font-semibold">{renderText(path.time_commitment)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Income Potential</p>
                      <IncomePotentialBlock value={path.income_potential} />
                    </div>
                  </div>
                </div>

                {isPlainObject(path.income_potential) && (
                  <IncomeTimelineGrid value={path.income_potential} />
                )}

                {path.timeToFirstDollar && (
                  <p className="text-sm">
                    <span className="font-semibold">Time to first dollar:</span>{" "}
                    <span className="text-muted-foreground">{renderText(path.timeToFirstDollar)}</span>
                  </p>
                )}

                <Separator />
                <div>
                  <h4 className="font-semibold mb-2">Getting Started Steps:</h4>
                  <ol className="space-y-2">
                    {toStringArray(path.steps).map((step: string, stepIndex: number) => (
                      <li key={stepIndex} className="flex gap-2">
                        <span className="font-semibold text-primary">{stepIndex + 1}.</span>
                        <span className="text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {(toStringArray(path.pros).length > 0 || toStringArray(path.cons).length > 0) && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {toStringArray(path.pros).length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-emerald-600">Pros</h4>
                        <ul className="space-y-1 ml-4">
                          {toStringArray(path.pros).map((p, i) => (
                            <li key={i} className="text-muted-foreground">• {p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {toStringArray(path.cons).length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-rose-600">Cons</h4>
                        <ul className="space-y-1 ml-4">
                          {toStringArray(path.cons).map((c, i) => (
                            <li key={i} className="text-muted-foreground">• {c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Immediate Actions
          </CardTitle>
          <CardDescription>Start these today to build momentum</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {toStringArray(report.immediate_actions).map((action: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-sm">✓</span>
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {toStringArray(report.quickWinOpportunities).length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Quick Win Opportunities
            </CardTitle>
            <CardDescription>Fastest paths to your first dollar</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {toStringArray(report.quickWinOpportunities).map((q, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">★</span>
                  <span className="text-muted-foreground">{q}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Resources & Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <ResourcesBlock resources={report.resources} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>90-Day Implementation Plan</CardTitle>
          <CardDescription>Your roadmap to success</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {report.ninety_day_plan && (
            <>
              <MonthBlock
                monthLabel="Month 1"
                subtitle="Foundation Building"
                monthData={report.ninety_day_plan.month_1}
              />
              <Separator />
              <MonthBlock
                monthLabel="Month 2"
                subtitle="Growth & Optimization"
                monthData={report.ninety_day_plan.month_2}
              />
              <Separator />
              <MonthBlock
                monthLabel="Month 3"
                subtitle="Scale & Expand"
                monthData={report.ninety_day_plan.month_3}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
