import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Scale, CheckCircle } from 'lucide-react';

interface LegalDocument {
  name: string;
  description: string;
  required: boolean;
  timeline: string;
}

export const LegalDocsGenerator = () => {
  const [businessStructure, setBusinessStructure] = useState('');
  const [state, setState] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);

  const generateDocuments = async () => {
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      let mockDocuments: LegalDocument[] = [];
      
      if (businessStructure === 'llc') {
        mockDocuments = [
          { name: "Articles of Organization", description: "Legal document that establishes your LLC", required: true, timeline: "Week 1" },
          { name: "Operating Agreement", description: "Defines ownership structure and operating procedures", required: true, timeline: "Week 2" },
          { name: "EIN Application (Form SS-4)", description: "Federal tax identification number", required: true, timeline: "Week 1" },
          { name: "Business License Application", description: "General business operating license", required: true, timeline: "Week 2-3" },
          { name: "State Tax Registration", description: "Register for state taxes if applicable", required: true, timeline: "Week 3" }
        ];
      } else if (businessStructure === 'corporation') {
        mockDocuments = [
          { name: "Articles of Incorporation", description: "Legal document that creates your corporation", required: true, timeline: "Week 1" },
          { name: "Corporate Bylaws", description: "Rules and procedures for corporate governance", required: true, timeline: "Week 2" },
          { name: "EIN Application (Form SS-4)", description: "Federal tax identification number", required: true, timeline: "Week 1" },
          { name: "Board of Directors Resolutions", description: "Initial board resolutions and meeting minutes", required: true, timeline: "Week 2" },
          { name: "Stock Certificates", description: "Certificates representing ownership shares", required: true, timeline: "Week 3" }
        ];
      } else if (businessStructure === 'sole-proprietorship') {
        mockDocuments = [
          { name: "DBA Filing", description: "Doing Business As registration if using trade name", required: false, timeline: "Week 1" },
          { name: "EIN Application (Form SS-4)", description: "Federal tax identification number (optional for sole props)", required: false, timeline: "Week 1" },
          { name: "Business License", description: "General business operating license", required: true, timeline: "Week 1-2" },
          { name: "Professional Licenses", description: "Industry-specific licenses if required", required: false, timeline: "Varies" }
        ];
      }

      setDocuments(mockDocuments);
      setIsGenerating(false);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateDocuments();
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
        <Scale className="h-5 w-5 text-secondary" />
        <h3 className="text-xl font-bold text-foreground">Legal Documents Generator</h3>
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
          <label className="block text-sm font-medium mb-2 text-foreground">State of Formation</label>
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

        <Button type="submit" disabled={isGenerating || !businessStructure || !state} size="lg" className="w-full bg-gradient-hero text-white shadow-strong hover:shadow-glow transition-elegant hover:scale-105 hover:-translate-y-1">
          {isGenerating ? "Generating Document List..." : "Generate Required Documents"}
        </Button>
      </form>

      {documents.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground">Required Legal Documents</h4>
          <div className="space-y-3">
            {documents.map((doc, index) => (
              <Card key={index} className={`p-4 border-l-4 ${doc.required ? 'border-red-500' : 'border-yellow-500'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center mt-1">
                    {doc.required ? (
                      <FileText className="h-4 w-4 text-red-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium text-foreground">{doc.name}</h5>
                      <span className={`text-xs px-2 py-1 rounded ${
                        doc.required 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' 
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {doc.required ? 'Required' : 'Optional'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{doc.description}</p>
                    <p className="text-xs text-secondary font-medium">Timeline: {doc.timeline}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Disclaimer:</strong> This is general information only. Consult with a qualified attorney or business advisor for specific legal requirements in your jurisdiction.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};