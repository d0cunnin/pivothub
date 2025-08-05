import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Target, DollarSign, Users, Calendar } from 'lucide-react';

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
    // Simulate API call
    setTimeout(() => {
      const mockStrategy: MarketingStrategy[] = [
        {
          phase: "Phase 1: Foundation & Awareness",
          timeline: "Months 1-3",
          objectives: [
            "Establish brand identity and online presence",
            "Build initial customer awareness",
            "Create foundational marketing materials"
          ],
          tactics: [
            "Develop professional website with SEO optimization",
            "Set up and optimize social media profiles",
            "Create valuable content (blog posts, guides)",
            "Network within industry and local business communities",
            "Implement basic email marketing"
          ],
          budget: "25% of total marketing budget",
          metrics: ["Website traffic", "Social media followers", "Email subscribers", "Brand mentions"]
        },
        {
          phase: "Phase 2: Engagement & Lead Generation",
          timeline: "Months 4-6",
          objectives: [
            "Generate qualified leads",
            "Build customer relationships",
            "Establish thought leadership"
          ],
          tactics: [
            "Launch targeted social media advertising",
            "Create lead magnets (free resources, webinars)",
            "Implement content marketing strategy",
            "Start email nurture sequences",
            "Participate in industry events and speaking opportunities"
          ],
          budget: "35% of total marketing budget",
          metrics: ["Lead generation rate", "Email open rates", "Social engagement", "Cost per lead"]
        },
        {
          phase: "Phase 3: Conversion & Retention",
          timeline: "Months 7-12",
          objectives: [
            "Convert leads to customers",
            "Increase customer lifetime value",
            "Build customer loyalty and referrals"
          ],
          tactics: [
            "Optimize conversion funnels",
            "Implement retargeting campaigns",
            "Launch customer referral program",
            "Create customer success stories and case studies",
            "Develop loyalty programs and upsell strategies"
          ],
          budget: "40% of total marketing budget",
          metrics: ["Conversion rate", "Customer acquisition cost", "Customer lifetime value", "Referral rate"]
        }
      ];
      setStrategy(mockStrategy);
      setIsGenerating(false);
    }, 2500);
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

        <Button type="submit" disabled={isGenerating} size="lg" className="w-full" variant="default">
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