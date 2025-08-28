import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Target, DollarSign, Users, Calendar } from 'lucide-react';
import { sanitizeAIContent } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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
      const { data, error } = await supabase.functions.invoke('generate-business-content', {
        body: {
          type: 'marketing-strategy',
          data: { businessType, targetMarket, budget, goals, currentStage }
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
          timeline: "Months 1-3",
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
          timeline: "Months 4-8",
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
    
    sections.forEach((section, index) => {
      if (index === 0 && !section.includes('Phase')) return; // Skip intro text
      
      const lines = section.split('\n').filter(line => line.trim());
      const phase: MarketingStrategy = {
        phase: `Phase ${index + 1}`,
        timeline: "3-4 months",
        objectives: [],
        tactics: [],
        budget: "33% of budget",
        metrics: []
      };

      let currentSection = '';
      
      lines.forEach(line => {
        const cleanLine = line.trim().toLowerCase();
        
        if (cleanLine.includes('timeline') || cleanLine.includes('duration')) {
          phase.timeline = line.split(':')[1]?.trim() || phase.timeline;
        } else if (cleanLine.includes('objective') || cleanLine.includes('goal')) {
          currentSection = 'objectives';
        } else if (cleanLine.includes('tactic') || cleanLine.includes('strategy') || cleanLine.includes('action')) {
          currentSection = 'tactics';
        } else if (cleanLine.includes('budget') || cleanLine.includes('cost')) {
          if (line.includes(':')) {
            phase.budget = line.split(':')[1]?.trim() || phase.budget;
          } else {
            currentSection = 'budget';
          }
        } else if (cleanLine.includes('metric') || cleanLine.includes('kpi') || cleanLine.includes('measure')) {
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
        timeline: "Initial 3 months",
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

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-5 w-5 text-secondary" />
        <h3 className="text-xl font-bold text-foreground">Marketing Strategy Generator</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">Generate a comprehensive marketing strategy for your business. Get specific tactics, channels, and budget recommendations to reach your audience.</p>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Business Type</label>
          <Input
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            placeholder="e.g., SaaS startup, Local restaurant, Consulting firm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Target Market</label>
          <Textarea
            value={targetMarket}
            onChange={(e) => setTargetMarket(e.target.value)}
            placeholder="Describe your ideal customers (demographics, interests, pain points)"
            rows={2}
            required
          />
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
          <label className="block text-sm font-medium mb-2 text-foreground">Primary Goals</label>
          <Textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="What are your main marketing objectives? (e.g., increase awareness, generate leads, drive sales)"
            rows={2}
            required
          />
        </div>

        <Button type="submit" disabled={isGenerating} size="lg" className="w-full" variant="hero">
          {isGenerating ? "Generating Strategy..." : "Generate Marketing Strategy"}
        </Button>
      </form>

      {strategy.length > 0 && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h4 className="text-xl font-semibold text-foreground mb-2">Your Marketing Roadmap</h4>
            <p className="text-muted-foreground">A comprehensive 12-month strategy tailored to your business</p>
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