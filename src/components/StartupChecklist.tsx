import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckSquare, Clock, Building } from 'lucide-react';

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
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      const baseChecklist: ChecklistItem[] = [
        { id: '1', task: 'Validate business idea and market research', category: 'Planning', timeline: 'Week 1', completed: false, priority: 'high' },
        { id: '2', task: 'Write business plan', category: 'Planning', timeline: 'Week 1-2', completed: false, priority: 'high' },
        { id: '3', task: 'Secure initial funding/capital', category: 'Finance', timeline: 'Week 2-4', completed: false, priority: 'high' },
        { id: '4', task: 'Choose and register business name', category: 'Legal', timeline: 'Week 2', completed: false, priority: 'high' },
        { id: '5', task: 'File business formation documents', category: 'Legal', timeline: 'Week 3', completed: false, priority: 'high' },
        { id: '6', task: 'Obtain EIN (Tax ID Number)', category: 'Legal', timeline: 'Week 3', completed: false, priority: 'high' },
        { id: '7', task: 'Open business bank account', category: 'Finance', timeline: 'Week 4', completed: false, priority: 'high' },
        { id: '8', task: 'Get business insurance', category: 'Legal', timeline: 'Week 4-5', completed: false, priority: 'medium' },
        { id: '9', task: 'Obtain necessary licenses and permits', category: 'Legal', timeline: 'Week 4-6', completed: false, priority: 'high' },
        { id: '10', task: 'Set up accounting system', category: 'Finance', timeline: 'Week 5', completed: false, priority: 'medium' },
        { id: '11', task: 'Design logo and brand identity', category: 'Marketing', timeline: 'Week 5-6', completed: false, priority: 'medium' },
        { id: '12', task: 'Build website and online presence', category: 'Marketing', timeline: 'Week 6-8', completed: false, priority: 'medium' },
        { id: '13', task: 'Set up business location/workspace', category: 'Operations', timeline: 'Week 6-8', completed: false, priority: 'medium' },
        { id: '14', task: 'Develop marketing strategy', category: 'Marketing', timeline: 'Week 7-8', completed: false, priority: 'medium' },
        { id: '15', task: 'Launch business and start operations', category: 'Operations', timeline: 'Week 8-10', completed: false, priority: 'high' }
      ];

      // Add structure-specific items
      if (businessStructure === 'corporation') {
        baseChecklist.push(
          { id: '16', task: 'Draft corporate bylaws', category: 'Legal', timeline: 'Week 3', completed: false, priority: 'high' },
          { id: '17', task: 'Issue stock certificates', category: 'Legal', timeline: 'Week 4', completed: false, priority: 'medium' },
          { id: '18', task: 'Hold first board meeting', category: 'Legal', timeline: 'Week 4', completed: false, priority: 'medium' }
        );
      } else if (businessStructure === 'llc') {
        baseChecklist.push(
          { id: '16', task: 'Create operating agreement', category: 'Legal', timeline: 'Week 3', completed: false, priority: 'high' }
        );
      }

      setChecklist(baseChecklist.sort((a, b) => a.timeline.localeCompare(b.timeline)));
      setIsGenerating(false);
    }, 1500);
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
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <CheckSquare className="h-5 w-5 text-secondary" />
        <h3 className="text-xl font-bold text-foreground">Startup Checklist</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Business Structure</label>
          <Select value={businessStructure} onValueChange={setBusinessStructure}>
            <SelectTrigger>
              <SelectValue placeholder="Select business structure" />
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
          <label className="block text-sm font-medium mb-2 text-foreground">State</label>
          <Select value={state} onValueChange={setState}>
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
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

        <Button type="submit" disabled={isGenerating || !businessStructure || !state} size="lg" className="w-full" variant="default">
          {isGenerating ? "Generating Checklist..." : "Generate Startup Checklist"}
        </Button>
      </form>

      {checklist.length > 0 && (
        <div className="space-y-6">
          <div>
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

          <div className="space-y-3">
            {['Planning', 'Legal', 'Finance', 'Marketing', 'Operations'].map(category => {
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
                            checked={item.completed}
                            onCheckedChange={() => toggleTask(item.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {item.task}
                            </p>
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