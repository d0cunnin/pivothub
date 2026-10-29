import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckSquare, Clock, Building, Download } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/lib/invokeFunction";
import { toast } from "sonner";

const GENERIC_FAILURE_MESSAGE = "Something went wrong. Please try again.";

// User-facing failure text. On failure no results are shown, and credits are
// only charged server-side when real AI results are delivered.
const describeFailure = (error: unknown): string => {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : typeof (error as { message?: unknown } | null)?.message === "string"
          ? (error as { message: string }).message
          : "";
  const message = raw.trim() || GENERIC_FAILURE_MESSAGE;
  if (/not (been )?charged|support@/i.test(message)) return message;
  return `${/[.!?]$/.test(message) ? message : `${message}.`} You were not charged.`;
};

interface ChecklistItem {
  id: string;
  task: string;
  category: string;
  timeline: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export const StartupChecklist = () => {
  const [businessStructure, setBusinessStructure] = useState('');
  const [state, setState] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  const generateChecklist = async () => {
    console.log("StartupChecklist button clicked!");
    if (!businessStructure || !state) return;
    
    setIsGenerating(true);
    
    try {
      // Get session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found');
        throw new Error('Please sign in to generate personalized checklist');
      }

      // Use Supabase SDK with proper authentication
      const { data, error } = await invokeFunction('startup-checklist', {
        body: {
          businessType: businessStructure.replace('-', ' '),
          industry: 'General',
          location: state.replace('-', ' '),
          fundingGoal: '$50,000',
          timeline: '3-6 months',
          hasCofounder: false
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      if (!data?.checklist || !Array.isArray(data.checklist.phases)) {
        throw new Error('The result came back incomplete. Please try again. If this keeps happening, contact support@pivothub.io.');
      }

      // Transform AI response to match existing interface
      const transformedChecklist: ChecklistItem[] = [];
      let idCounter = 1;

      data.checklist.phases.forEach((phase: any) => {
        if (!Array.isArray(phase?.tasks)) return;
        phase.tasks.forEach((task: any) => {
          transformedChecklist.push({
            id: idCounter.toString(),
            task: task.title,
            category: task.category || phase.phase,
            timeline: task.estimatedTime || phase.estimatedDuration,
            completed: false,
            priority: task.priority === 'High' ? 'high' : task.priority === 'Medium' ? 'medium' : 'low'
          });
          idCounter++;
        });
      });

      setChecklist(transformedChecklist.sort((a, b) => a.timeline.localeCompare(b.timeline)));
      toast.success('Startup checklist generated successfully!');
    } catch (error) {
      console.error('Error generating checklist:', error);
      toast.error("Couldn't create your checklist", { description: describeFailure(error) });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateChecklist();
  };

  const toggleTask = (id: string) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const completedTasks = checklist.filter(item => item.completed).length;
  const progressPercentage = checklist.length > 0 ? (completedTasks / checklist.length) * 100 : 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500';
      case 'medium': return 'border-yellow-500';
      case 'low': return 'border-green-500';
      default: return 'border-gray-300';
    }
  };

  const downloadChecklist = () => {
    let content = `STARTUP CHECKLIST\n`;
    content += `Business Structure: ${businessStructure.replace('-', ' ').toUpperCase()}\n`;
    content += `State: ${state.replace('-', ' ').toUpperCase()}\n`;
    content += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    content += `Progress: ${completedTasks} of ${checklist.length} tasks completed (${Math.round(progressPercentage)}%)\n\n`;
    content += `${'='.repeat(80)}\n\n`;

    ['Foundation', 'Planning', 'Legal', 'Finance', 'Marketing', 'Operations'].forEach(category => {
      const categoryItems = checklist.filter(item => item.category === category);
      if (categoryItems.length === 0) return;
      
      content += `\n${category.toUpperCase()}\n${'-'.repeat(category.length)}\n\n`;
      
      categoryItems.forEach((item, index) => {
        const status = item.completed ? '[✓]' : '[ ]';
        content += `${status} ${item.task}\n`;
        content += `    Timeline: ${item.timeline} | Priority: ${item.priority.toUpperCase()}\n\n`;
      });
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `startup-checklist-${businessStructure}-${state}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  return (
    <Card className="p-8 shadow-soft">
      <div className="flex items-center gap-2 mb-6">
        <CheckSquare className="h-5 w-5 text-secondary" />
        <h3 className="text-xl font-bold text-foreground">Startup Checklist</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">Get a personalized startup checklist based on your business structure and state. Track your progress and never miss important steps.</p>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Business Structure *</label>
          <Select value={businessStructure} onValueChange={setBusinessStructure}>
            <SelectTrigger>
              <SelectValue placeholder="Choose your business structure" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sole-proprietorship">Sole Proprietorship</SelectItem>
              <SelectItem value="llc">Limited Liability Company (LLC)</SelectItem>
              <SelectItem value="corporation">Corporation</SelectItem>
              <SelectItem value="partnership">Partnership</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">State *</label>
          <Select value={state} onValueChange={setState}>
            <SelectTrigger>
              <SelectValue placeholder="Choose your state" />
            </SelectTrigger>
            <SelectContent className="max-h-48">
              {states.map((stateName) => (
                <SelectItem key={stateName} value={stateName.toLowerCase().replace(' ', '-')}>
                  {stateName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          type="submit" 
          disabled={isGenerating || !businessStructure || !state} 
          variant="hero" 
          size="lg" 
          className="w-full"
          title={!businessStructure || !state ? "Please select both business structure and state to generate checklist" : ""}
        >
          {isGenerating ? "Generating Checklist..." : "Generate Startup Checklist (2 Credits)"}
        </Button>
      </form>

      {checklist.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-foreground">Progress</h4>
                <span className="text-sm text-muted-foreground">{completedTasks} of {checklist.length} completed</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-secondary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
            <Button 
              onClick={downloadChecklist}
              variant="outline"
              size="sm"
              className="ml-4"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          <div className="space-y-3">
            {['Foundation', 'Planning', 'Legal', 'Finance', 'Marketing', 'Operations'].map(category => {
              const categoryItems = checklist.filter(item => item.category === category);
              if (categoryItems.length === 0) return null;
              
              return (
                <div key={category}>
                  <h5 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {category}
                  </h5>
                  <div className="space-y-2 ml-6">
                    {categoryItems.map((item) => (
                      <Card key={item.id} className={`p-3 border-l-4 ${getPriorityColor(item.priority)} ${item.completed ? 'opacity-75' : ''}`}>
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={`task-${item.id}`}
                            checked={item.completed}
                            onCheckedChange={() => toggleTask(item.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <label htmlFor={`task-${item.id}`} className={`block cursor-pointer text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {item.task}
                            </label>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{item.timeline}</span>
                              <span className={`text-xs px-1 py-0.5 rounded ${
                                item.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                                'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              }`}>
                                {item.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};