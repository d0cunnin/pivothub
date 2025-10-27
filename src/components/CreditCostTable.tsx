import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Tool {
  name: string;
  credits: number;
  note?: string;
}

const toolsByCategory: Record<string, Tool[]> = {
  'Build It (Business Tools)': [
    { name: 'Business Idea Generator', credits: 2 },
    { name: 'Business Name Checker', credits: 2 },
    { name: 'Business Foundation Builder', credits: 2 },
    { name: 'Business Plan Generator', credits: 4 },
    { name: 'Marketing Strategy Generator', credits: 3 },
    { name: 'Pitch Deck Generator', credits: 3 },
    { name: 'Logo Generator', credits: 2 },
    { name: 'Legal Documents Generator', credits: 3 },
    { name: 'Startup Checklist', credits: 2 },
    { name: 'Social Media Content Generator', credits: 2 },
    { name: 'Business Mentor Chatbot', credits: 1, note: 'per message' },
    { name: 'Business Resources Finder', credits: 2 },
  ],
  'Launch It (Go-to-Market)': [
    { name: 'Launch Strategy Generator', credits: 3 },
  ],
  'Schedule It (Time Management)': [
    { name: 'Schedule Builder', credits: 2, note: 'Coming Soon' },
  ],
  'Host It (Event Planning)': [
    { name: 'Event Planning Generator', credits: 4, note: 'Coming Soon' },
  ],
  'Prep It (Career Tools)': [
    { name: 'Career Advisor Chatbot', credits: 1, note: 'per message' },
    { name: 'Interview Questions Coach', credits: 2 },
    { name: 'Interview Feedback Coach', credits: 2 },
    { name: 'Resume & Cover Letter Coach', credits: 2 },
  ],
  'Teach It (Education Tools)': [
    { name: 'Teaching Materials Generator', credits: 5 },
  ],
  'Fund It (Grant Tools)': [
    { name: 'LOI & Grant Proposal Generator', credits: 4 },
    { name: 'Grant Resources (External Links)', credits: 0, note: 'Free' },
  ],
  'Earn It (Side Income)': [
    { name: 'Side Income Assessment', credits: 2 },
    { name: 'Side Income Blueprint Report', credits: 0, note: 'Included after assessment' },
  ],
  'Assess It (Self-Discovery)': [
    { name: 'Career Assessment', credits: 2 },
    { name: 'Skills Assessment', credits: 2 },
    { name: 'Personality Assessment', credits: 2 },
  ],
  'Learn It (Skills Development)': [
    { name: 'Video Courses', credits: 0, note: 'Included with all plans' },
  ],
};

const getCostBadgeVariant = (credits: number): "default" | "secondary" | "outline" | "destructive" => {
  if (credits === 0) return "outline";
  if (credits === 1) return "secondary";
  if (credits === 2) return "default";
  return "destructive";
};

const getCostLabel = (credits: number): string => {
  if (credits === 0) return "FREE";
  if (credits === 1) return "1 Credit";
  return `${credits} Credits`;
};

export const CreditCostTable = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Object.entries(toolsByCategory).map(([category, tools]) => (
        <Card key={category} className="overflow-hidden">
          <CardHeader className="bg-accent/5 pb-3">
            <CardTitle className="text-lg">{category}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {tools.map((tool, index) => (
                <div key={index} className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-tight">{tool.name}</p>
                    {tool.note && (
                      <p className="text-xs text-muted-foreground mt-0.5">{tool.note}</p>
                    )}
                  </div>
                  <Badge variant={getCostBadgeVariant(tool.credits)} className="shrink-0 text-xs">
                    {getCostLabel(tool.credits)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
