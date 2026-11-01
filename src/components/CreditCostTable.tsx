import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_DESIGN_IT_COSTS } from "@/lib/designIt/logic";

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
    { name: 'Pitch Deck Content Generator', credits: 3 },
    { name: 'Logo Generator', credits: 2 },
    { name: 'Biography Generator', credits: 3 },
    { name: 'Legal Documents Generator', credits: 2 },
    { name: 'Startup Checklist', credits: 2 },
    { name: 'Social Media Content Generator', credits: 2 },
    { name: 'Business Mentor Chatbot', credits: 1, note: 'per message' },
    { name: 'Business Resources Finder', credits: 1, note: 'Includes AI guidance' },
  ],
  'Launch It (Go-to-Market)': [
    { name: 'Launch Strategy Generator', credits: 3 },
  ],
  'Schedule It (Time Management)': [
    { name: 'Schedule Builder', credits: 5 },
  ],
  'Host It (Event Planning)': [
    { name: 'Event Planning Generator', credits: 4 },
  ],
  'Speak It (Voice & Content)': [
    { name: 'Speaker Launch Plan', credits: 3, note: 'Complete launch plan + PDF' },
    { name: 'Podcast Launch Plan', credits: 3, note: 'Complete launch plan + PDF' },
  ],
  'Write It (Book Planning)': [
    { name: 'Book Development Plan', credits: 3, note: 'Concept, title ideas, structure and table of contents' },
    { name: 'All Chapter Outlines', credits: 3 },
    { name: 'One Chapter Outline, New Table of Contents, or Writing Roadmap', credits: 1, note: 'each' },
  ],
  'Publish It (Publishing Guide)': [
    { name: 'Publishing Plan, Roadmap & Platform Guides', credits: 0, note: 'Free' },
    { name: 'Personalized Publishing Summary', credits: 2, note: 'Optional' },
  ],
  'Design It (Design Concepts)': [
    { name: 'Design Brief, Saving, Versions & Comparisons', credits: 0, note: 'Free' },
    { name: 'Initial Design Concept', credits: DEFAULT_DESIGN_IT_COSTS.concept },
    { name: 'Three More Creative Directions', credits: DEFAULT_DESIGN_IT_COSTS.directions },
    { name: 'Concept Visual (image)', credits: DEFAULT_DESIGN_IT_COSTS.image, note: 'per image' },
    { name: 'Text-only Refinement', credits: DEFAULT_DESIGN_IT_COSTS.refine_text },
    { name: 'Image Revision', credits: DEFAULT_DESIGN_IT_COSTS.refine_image },
    { name: 'Text and Image Refinement', credits: DEFAULT_DESIGN_IT_COSTS.refine_both },
    { name: 'AI Version Comparison', credits: DEFAULT_DESIGN_IT_COSTS.compare },
    { name: 'Final Design Summary', credits: DEFAULT_DESIGN_IT_COSTS.summary },
  ],
  'Garden It (Gardening)': [
    { name: 'Garden Plan Generator', credits: 3, note: 'Complete garden plan + shopping list' },
  ],
  'Prep It (Career Tools)': [
    { name: 'Career Advisor Chatbot', credits: 1, note: 'per message' },
    { name: 'Interview Practice Session', credits: 3, note: 'Questions + feedback on every answer' },
    { name: 'Resume & Cover Letter Coach', credits: 2 },
    { name: 'Resume Builder', credits: 3 },
  ],
  'Teach It (Education Tools)': [
    { name: 'Teaching Materials Generator', credits: 6 },
    { name: 'Lesson Plan Generator', credits: 3 },
    { name: 'Quiz Generator', credits: 2 },
    { name: 'Rubric Builder', credits: 2 },
  ],
  'Fund It (Grant Tools)': [
    { name: 'LOI & Grant Proposal Generator', credits: 7 },
    { name: 'Grant Resources (External Links)', credits: 0, note: 'Free' },
  ],
  'Earn It (Side Income)': [
    { name: 'Side Income Blueprint', credits: 5, note: 'Assessment + full plan with PDF' },
  ],
  'Create It (Platform Blueprint)': [
    { name: 'App & Platform Blueprint', credits: 10, note: 'PDF plan + AI build prompt; not a finished app' },
  ],
  'Learn It (Tech & AI Tools)': [
    { name: 'Prompt It', credits: 1 },
    { name: 'Code It', credits: 1 },
    { name: 'Study It', credits: 2 },
    { name: 'Deploy It (AI Assistant Setup Guide)', credits: 3, note: 'PDF guide + instructions; you set up the assistant' },
  ],
  'Act It (Story Studio)': [
    { name: 'Story Concept Generator', credits: 3, note: 'Characters, plot outline + PDF' },
  ],
  'Develop It (Community Programs)': [
    { name: 'Program Builder', credits: 4 },
    { name: 'Grant Readiness & Funding Prep Tool', credits: 3 },
    { name: 'Community Assessment Tool', credits: 3 },
    { name: 'Stakeholder Engagement Planner', credits: 3 },
    { name: 'Community Development Coach', credits: 1, note: 'per message' },
  ],
  'Contract It (Government Contracting)': [
    { name: 'Capability Statement', credits: 4 },
    { name: 'Contract Readiness Assessment', credits: 3 },
  ],
  'Assess It (Self-Discovery)': [
    { name: 'Career Assessment', credits: 2 },
    { name: 'Skills Assessment', credits: 2 },
    { name: 'Personality Assessment', credits: 2 },
    { name: 'Tech Readiness Assessment', credits: 2, note: 'Timed test with PDF report' },
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

const desktopColumns: string[][] = [
  ['Build It (Business Tools)', 'Launch It (Go-to-Market)', 'Schedule It (Time Management)', 'Host It (Event Planning)', 'Design It (Design Concepts)', 'Garden It (Gardening)'],
  ['Teach It (Education Tools)', 'Develop It (Community Programs)', 'Speak It (Voice & Content)', 'Write It (Book Planning)', 'Publish It (Publishing Guide)', 'Earn It (Side Income)', 'Create It (Platform Blueprint)', 'Fund It (Grant Tools)'],
  ['Prep It (Career Tools)', 'Learn It (Tech & AI Tools)', 'Assess It (Self-Discovery)', 'Contract It (Government Contracting)', 'Act It (Story Studio)'],
];

const CategoryCard = ({ category, tools }: { category: string; tools: Tool[] }) => (
  <Card className="overflow-hidden break-inside-avoid mb-4 w-full inline-block">
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
);

export const CreditCostTable = () => {
  return (
    <>
      <div className="hidden lg:grid grid-cols-3 gap-4 items-start">
        {desktopColumns.map((col, i) => (
          <div key={i} className="flex flex-col">
            {col.filter((c) => toolsByCategory[c]).map((category) => (
              <CategoryCard key={category} category={category} tools={toolsByCategory[category]} />
            ))}
          </div>
        ))}
      </div>
      <div className="lg:hidden columns-1 md:columns-2 gap-4">
        {Object.entries(toolsByCategory).map(([category, tools]) => (
          <CategoryCard key={category} category={category} tools={tools} />
        ))}
      </div>
    </>
  );
};
