import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ArrowRight, DollarSign, Clock, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { generateSideIncomeReportPDF } from "@/lib/pdf-generator";

interface SideIncomeReportProps {
  assessmentId: string; // Now contains stringified assessment data
}

export default function SideIncomeReport({ assessmentId }: SideIncomeReportProps) {
  const [generating, setGenerating] = useState(true);
  const [report, setReport] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const assessmentData = JSON.parse(assessmentId);
      console.log('📤 Sending assessment to edge function:', {
        keys: Object.keys(assessmentData),
        constraintsType: typeof assessmentData.constraints,
        constraintsValue: assessmentData.constraints,
        skillsCount: assessmentData.skills?.length
      });
      
      const { data, error } = await supabase.functions.invoke('generate-side-income-report', {
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
      toast({
        title: "Success!",
        description: "Your personalized blueprint is ready!",
      });
    } catch (error: any) {
      console.error('❌ Error generating report:', error);
      toast({
        title: "Report Generation Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
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
          <p className="text-muted-foreground leading-relaxed">{report.executive_summary}</p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Skills Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{report.skills_analysis}</p>
        </CardContent>
      </Card>

      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Recommended Income Paths</h2>
        <div className="space-y-4">
          {report.recommended_paths?.map((path: any, index: number) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {path.title}
                      <Badge variant="secondary">Path {index + 1}</Badge>
                    </CardTitle>
                    <CardDescription className="mt-2">{path.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Startup Cost</p>
                      <p className="font-semibold">{path.startup_cost}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Time/Week</p>
                      <p className="font-semibold">{path.time_commitment}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Income Potential</p>
                      <p className="font-semibold">{path.income_potential}</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2">Getting Started Steps:</h4>
                  <ol className="space-y-2">
                    {path.steps?.map((step: string, stepIndex: number) => (
                      <li key={stepIndex} className="flex gap-2">
                        <span className="font-semibold text-primary">{stepIndex + 1}.</span>
                        <span className="text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
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
            {report.immediate_actions?.map((action: string, index: number) => (
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Resources & Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.resources?.map((category: any, index: number) => (
            <div key={index}>
              <h4 className="font-semibold mb-2">{category.category}</h4>
              <ul className="space-y-1 ml-4">
                {category.items?.map((item: string, itemIndex: number) => (
                  <li key={itemIndex} className="text-muted-foreground">• {item}</li>
                ))}
              </ul>
            </div>
          ))}
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
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge>Month 1</Badge>
                  Foundation Building
                </h4>
                <ul className="space-y-2">
                  {report.ninety_day_plan.month_1?.map((goal: string, index: number) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-primary">▹</span>
                      <span className="text-muted-foreground">{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge>Month 2</Badge>
                  Growth & Optimization
                </h4>
                <ul className="space-y-2">
                  {report.ninety_day_plan.month_2?.map((goal: string, index: number) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-primary">▹</span>
                      <span className="text-muted-foreground">{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge>Month 3</Badge>
                  Scale & Expand
                </h4>
                <ul className="space-y-2">
                  {report.ninety_day_plan.month_3?.map((goal: string, index: number) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-primary">▹</span>
                      <span className="text-muted-foreground">{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}