import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Target, DollarSign, Users, Calendar, Download } from 'lucide-react';
import { sanitizeAIContent } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

interface MarketingStrategy {
  phase: string;
  timeline: string;
  objectives: string[];
  tactics: string[];
  budget: string;
  metrics: string[];
}

export const MarketingStrategyGenerator = () => {
  const [businessType, setBusinessType] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [budget, setBudget] = useState('');
  const [goals, setGoals] = useState('');
  const [currentStage, setCurrentStage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategy, setStrategy] = useState<MarketingStrategy[]>([]);

  const generateStrategy = async () => {
    setIsGenerating(true);
    
    try {
      // Get user session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please sign in to use this tool");
      }

      const { data, error } = await supabase.functions.invoke('generate-business-content', {
        body: {
          type: 'marketing-strategy',
          data: { businessType, targetMarket, budget, goals, currentStage }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Parse AI response into structured strategy format
      const sanitizedContent = sanitizeAIContent(data.content);
      const phases = parseMarketingStrategy(sanitizedContent);
      
      setStrategy(phases);
    } catch (error) {
      console.error('Error generating strategy:', error);
      // Fallback strategy based on user input
      const fallbackStrategies = [
        {
          phase: "Phase 1: Foundation & Brand Building",
          timeline: "Months 1-4",
          objectives: [
            `Establish ${businessType} brand presence`,
            "Build core marketing infrastructure",
            "Define brand voice and messaging"
          ],
          tactics: [
            "Create professional website with SEO optimization",
            "Set up social media profiles on relevant platforms",
            "Develop brand guidelines and visual identity",
            "Launch basic content marketing strategy"
          ],
          budget: "35% of total budget",
          metrics: ["Website traffic", "Social media followers", "Brand awareness surveys"]
        },
        {
          phase: "Phase 2: Audience Engagement & Lead Generation",
          timeline: "Months 5-8",
          objectives: [
            "Generate qualified leads from target market",
            "Build engaged community around brand",
            "Establish thought leadership"
          ],
          tactics: [
            "Launch targeted advertising campaigns",
            "Create valuable content (blogs, videos, podcasts)",
            "Implement email marketing automation",
            "Partner with influencers in your industry"
          ],
          budget: "40% of total budget",
          metrics: ["Lead generation rate", "Email subscribers", "Engagement rates"]
        },
        {
          phase: "Phase 3: Conversion & Scale",
          timeline: "Months 9-12",
          objectives: [
            "Optimize conversion rates",
            "Scale successful marketing channels",
            "Expand to new market segments"
          ],
          tactics: [
            "A/B test landing pages and sales funnels",
            "Increase ad spend on high-performing campaigns",
            "Launch referral and loyalty programs",
            "Explore new marketing channels and partnerships"
          ],
          budget: "25% of total budget",
          metrics: ["Conversion rate", "Customer acquisition cost", "Revenue growth"]
        }
      ];
      setStrategy(fallbackStrategies);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to parse AI strategy response
  const parseMarketingStrategy = (content: string): MarketingStrategy[] => {
    const phases: MarketingStrategy[] = [];
    const sections = content.split(/Phase \d+|PHASE \d+/i).filter(section => section.trim());
    
    const defaultTimelines = ["Months 1-4", "Months 5-8", "Months 9-12"];
    
    sections.forEach((section, index) => {
      if (index === 0 && !section.includes('Phase')) return; // Skip intro text
      
      const lines = section.split('\n').filter(line => line.trim());
      const phase: MarketingStrategy = {
        phase: `Phase ${index + 1}`,
        timeline: defaultTimelines[index] || "Months 1-4",
        objectives: [],
        tactics: [],
        budget: "33% of budget",
        metrics: []
      };

      let currentSection = '';
      
      lines.forEach(line => {
        const cleanLine = line.trim().toLowerCase();
        
        if (cleanLine.includes('timeline') || cleanLine.includes('month')) {
          const timelineMatch = line.match(/months?\s+\d+[-–]\d+/i);
          if (timelineMatch) {
            phase.timeline = timelineMatch[0];
          } else if (line.includes(':')) {
            phase.timeline = line.split(':')[1]?.trim() || phase.timeline;
          }
        } else if (cleanLine.includes('objective') || cleanLine.includes('goal')) {
          currentSection = 'objectives';
        } else if (cleanLine.includes('tactic') || cleanLine.includes('strategy') || cleanLine.includes('action')) {
          currentSection = 'tactics';
        } else if (cleanLine.includes('budget') || cleanLine.includes('cost') || cleanLine.includes('allocation')) {
          if (line.includes(':')) {
            phase.budget = line.split(':')[1]?.trim() || phase.budget;
          } else {
            currentSection = 'budget';
          }
        } else if (cleanLine.includes('metric') || cleanLine.includes('kpi') || cleanLine.includes('measure') || cleanLine.includes('track')) {
          currentSection = 'metrics';
        } else if (line.trim().startsWith('•') || line.trim().startsWith('-') || /^\d+\./.test(line.trim())) {
          const content = line.replace(/^[•\-\d\.]\s*/, '').trim();
          if (content && currentSection) {
            switch (currentSection) {
              case 'objectives':
                phase.objectives.push(content);
                break;
              case 'tactics':
                phase.tactics.push(content);
                break;
              case 'metrics':
                phase.metrics.push(content);
                break;
            }
          }
        } else if (line.includes(':') && currentSection) {
          const content = line.split(':')[1]?.trim();
          if (content) {
            switch (currentSection) {
              case 'objectives':
                phase.objectives.push(content);
                break;
              case 'tactics':
                phase.tactics.push(content);
                break;
              case 'metrics':
                phase.metrics.push(content);
                break;
            }
          }
        }
      });

      // Set phase name from first line if available
      if (lines.length > 0) {
        const firstLine = lines[0].trim();
        if (firstLine && !firstLine.toLowerCase().includes('timeline')) {
          phase.phase = firstLine.replace(/^Phase \d+:?\s*/i, '') || phase.phase;
        }
      }

      // Ensure minimum content
      if (phase.objectives.length === 0) {
        phase.objectives.push(`Key objectives for ${businessType} marketing`);
      }
      if (phase.tactics.length === 0) {
        phase.tactics.push("Strategic marketing initiatives", "Digital marketing campaigns");
      }
      if (phase.metrics.length === 0) {
        phase.metrics.push("Performance tracking", "ROI measurement");
      }

      phases.push(phase);
    });

    // Ensure we have at least 1 phase
    if (phases.length === 0) {
      phases.push({
        phase: "Marketing Strategy Foundation",
        timeline: "Months 1-4",
        objectives: [`Build ${businessType} market presence`],
        tactics: ["Digital marketing setup", "Brand development"],
        budget: "100% of allocated budget",
        metrics: ["Market reach", "Brand awareness"]
      });
    }

    return phases.slice(0, 3); // Limit to 3 phases
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateStrategy();
  };

  const downloadStrategyAsText = () => {
    let content = `MARKETING STRATEGY\n`;
    content += `Business Type: ${businessType}\n`;
    content += `Target Market: ${targetMarket}\n`;
    content += `Budget: ${budget}\n`;
    content += `Goals: ${goals}\n`;
    content += `Current Stage: ${currentStage}\n`;
    content += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    content += `${'='.repeat(80)}\n\n`;

    strategy.forEach((phase, index) => {
      content += `\n${phase.phase}\n`;
      content += `${'-'.repeat(phase.phase.length)}\n`;
      content += `Timeline: ${phase.timeline}\n`;
      content += `Budget Allocation: ${phase.budget}\n\n`;
      
      content += `OBJECTIVES:\n`;
      phase.objectives.forEach(obj => content += `  • ${obj}\n`);
      content += `\n`;
      
      content += `MARKETING TACTICS:\n`;
      phase.tactics.forEach(tactic => content += `  • ${tactic}\n`);
      content += `\n`;
      
      content += `KEY METRICS:\n`;
      phase.metrics.forEach(metric => content += `  • ${metric}\n`);
      content += `\n${'='.repeat(80)}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketing-strategy-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadStrategyAsPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPosition = 20;
    
    // Disclaimer text for footer
    const disclaimer = "DISCLAIMER: This marketing strategy is provided for educational and planning purposes only. PivotHub does not guarantee specific results, revenue, or ROI. Success depends on proper implementation, market conditions, budget allocation, and external factors beyond our control. All projections are hypothetical. Individual results may vary.";
    
    // Function to add footer to every page
    const addFooter = (pageNum: number) => {
      doc.setFontSize(7);
      doc.setTextColor(100);
      const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 40);
      doc.text(disclaimerLines, pageWidth / 2, pageHeight - 25, { 
        align: 'center',
        maxWidth: pageWidth - 40
      });
      doc.setFontSize(8);
      doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 10, { 
        align: 'center' 
      });
    };
    
    // Function to check if we need a new page
    const checkNewPage = (neededSpace: number) => {
      if (yPosition + neededSpace > pageHeight - 40) {
        addFooter(doc.getCurrentPageInfo().pageNumber);
        doc.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };
    
    // Cover Page
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 80, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.text('Marketing Strategy', pageWidth / 2, 35, { align: 'center' });
    doc.setFontSize(18);
    const businessLines = doc.splitTextToSize(businessType, pageWidth - 40);
    doc.text(businessLines, pageWidth / 2, 50, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 70, { align: 'center' });
    
    // Reset colors for content
    doc.setTextColor(0, 0, 0);
    yPosition = 100;
    
    // Business Overview
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Business Overview', margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Target Market: ${targetMarket}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Budget: ${budget}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Current Stage: ${currentStage}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Primary Goals: ${goals}`, margin, yPosition);
    yPosition += 15;
    
    addFooter(1);
    
    // Strategy Phases
    strategy.forEach((phase, index) => {
      checkNewPage(60);
      
      // Phase Header
      doc.setFillColor(41, 128, 185);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(`${index + 1}. ${phase.phase}`, margin + 5, yPosition + 8);
      
      yPosition += 18;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Timeline: ${phase.timeline}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Budget Allocation: ${phase.budget}`, margin, yPosition);
      yPosition += 10;
      
      // Objectives
      checkNewPage(30);
      doc.setFont(undefined, 'bold');
      doc.text('Objectives:', margin, yPosition);
      yPosition += 7;
      doc.setFont(undefined, 'normal');
      
      phase.objectives.forEach(obj => {
        checkNewPage(10);
        const objLines = doc.splitTextToSize(`• ${obj}`, pageWidth - 2 * margin - 5);
        doc.text(objLines, margin + 5, yPosition);
        yPosition += objLines.length * 5;
      });
      yPosition += 5;
      
      // Tactics
      checkNewPage(30);
      doc.setFont(undefined, 'bold');
      doc.text('Marketing Tactics:', margin, yPosition);
      yPosition += 7;
      doc.setFont(undefined, 'normal');
      
      phase.tactics.forEach(tactic => {
        checkNewPage(10);
        const tacticLines = doc.splitTextToSize(`• ${tactic}`, pageWidth - 2 * margin - 5);
        doc.text(tacticLines, margin + 5, yPosition);
        yPosition += tacticLines.length * 5;
      });
      yPosition += 5;
      
      // Metrics
      checkNewPage(30);
      doc.setFont(undefined, 'bold');
      doc.text('Key Metrics:', margin, yPosition);
      yPosition += 7;
      doc.setFont(undefined, 'normal');
      
      phase.metrics.forEach(metric => {
        checkNewPage(10);
        const metricLines = doc.splitTextToSize(`• ${metric}`, pageWidth - 2 * margin - 5);
        doc.text(metricLines, margin + 5, yPosition);
        yPosition += metricLines.length * 5;
      });
      yPosition += 15;
    });
    
    // Add footer to last page
    addFooter(doc.getCurrentPageInfo().pageNumber);
    
    // Save PDF
    doc.save(`marketing-strategy-${businessType.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-5 w-5 text-secondary" />
        <h3 className="text-xl font-bold text-foreground">Marketing Strategy Generator</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">Create a complete marketing strategy with customer personas, messaging, timeline, and tactics.</p>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Business Type *</label>
          <Input
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            placeholder="Be specific: e.g., B2B SaaS for accounting firms, Organic food delivery service, Executive leadership coaching"
            required
            className={businessType.length < 15 ? "border-orange-300" : "border-green-300"}
          />
          <p className="text-xs text-muted-foreground">
            {businessType.length < 15 ? `Add ${15 - businessType.length} more characters for targeted strategy` : "Good specificity ✓"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Target Market *</label>
          <Textarea
            value={targetMarket}
            onChange={(e) => setTargetMarket(e.target.value)}
            placeholder="Provide detailed customer profile: 'Marketing managers at tech startups (50-500 employees), aged 28-40, frustrated with scattered tools, active on LinkedIn and industry forums, budget $500-2000/month for marketing tools'"
            rows={3}
            required
            className={targetMarket.length < 50 ? "border-orange-300" : "border-green-300"}
          />
          <p className="text-xs text-muted-foreground">
            {targetMarket.length < 50 ? `Add ${50 - targetMarket.length} more characters for better targeting` : "Excellent targeting ✓"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Marketing Budget</label>
          <Select value={budget} onValueChange={setBudget}>
            <SelectTrigger>
              <SelectValue placeholder="Select monthly marketing budget" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="under-500">Under $500</SelectItem>
              <SelectItem value="500-1000">$500 - $1,000</SelectItem>
              <SelectItem value="1000-2500">$1,000 - $2,500</SelectItem>
              <SelectItem value="2500-5000">$2,500 - $5,000</SelectItem>
              <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
              <SelectItem value="over-10000">Over $10,000</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Business Stage</label>
          <Select value={currentStage} onValueChange={setCurrentStage}>
            <SelectTrigger>
              <SelectValue placeholder="Select current business stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pre-launch">Pre-launch</SelectItem>
              <SelectItem value="just-launched">Just launched (0-6 months)</SelectItem>
              <SelectItem value="early-stage">Early stage (6-18 months)</SelectItem>
              <SelectItem value="growth-stage">Growth stage (18+ months)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Primary Goals *</label>
          <Textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="Set specific, measurable objectives: 'Increase brand awareness by 40%, generate 100 qualified leads monthly, achieve $50K MRR within 12 months, build email list to 5,000 subscribers'"
            rows={3}
            required
            className={goals.length < 30 ? "border-orange-300" : "border-green-300"}
          />
          <p className="text-xs text-muted-foreground">
            {goals.length < 30 ? `Add ${30 - goals.length} more characters for specific goals` : "Clear objectives ✓"}
          </p>
        </div>

        <Button 
          type="submit" 
          disabled={isGenerating || businessType.length < 15 || targetMarket.length < 50 || goals.length < 30} 
          size="lg" 
          className="w-full" 
          variant="hero"
        >
          {isGenerating ? "Generating Strategy..." : "Generate Marketing Strategy (3 Credits)"}
        </Button>
      </form>

      {strategy.length > 0 && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-foreground mb-2">Your Marketing Roadmap</h4>
                <p className="text-muted-foreground">A comprehensive 12-month strategy tailored to your business</p>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={downloadStrategyAsPDF}
                  variant="default"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button 
                  onClick={downloadStrategyAsText}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Text
                </Button>
              </div>
            </div>
          </div>

          {strategy.map((phase, index) => (
            <Card key={index} className="p-6 border-l-4 border-secondary">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h5 className="text-lg font-semibold text-foreground">{phase.phase}</h5>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{phase.timeline}</span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-secondary" />
                      <h6 className="font-medium text-foreground">Objectives</h6>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {phase.objectives.map((objective, objIndex) => (
                        <li key={objIndex} className="flex items-start gap-2">
                          <span className="text-secondary mt-1">•</span>
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-secondary" />
                      <h6 className="font-medium text-foreground">Key Metrics</h6>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {phase.metrics.map((metric, metricIndex) => (
                        <li key={metricIndex} className="flex items-start gap-2">
                          <span className="text-secondary mt-1">•</span>
                          <span>{metric}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-secondary" />
                    <h6 className="font-medium text-foreground">Marketing Tactics</h6>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {phase.tactics.map((tactic, tacticIndex) => (
                      <li key={tacticIndex} className="flex items-start gap-2">
                        <span className="text-secondary mt-1">•</span>
                        <span>{tactic}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-secondary" />
                  <span className="font-medium text-foreground">Budget Allocation:</span>
                  <span className="text-muted-foreground">{phase.budget}</span>
                </div>
              </div>
            </Card>
          ))}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Next Steps:</strong> Start with Phase 1 and track your metrics weekly. Adjust tactics based on performance and move to the next phase when objectives are met.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};