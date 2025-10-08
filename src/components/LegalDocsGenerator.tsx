import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Scale, CheckCircle, ExternalLink, Download } from 'lucide-react';

interface LegalDocument {
  name: string;
  description: string;
  required: boolean;
  timeline: string;
  officialLink?: string;
  linkText?: string;
}

export const LegalDocsGenerator = () => {
  const [businessStructure, setBusinessStructure] = useState('');
  const [state, setState] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);

  const getStateBusinessLink = (stateName: string) => {
    const stateLinks: { [key: string]: string } = {
      'alabama': 'https://www.sos.alabama.gov/business-entities',
      'alaska': 'https://www.commerce.alaska.gov/web/cbpl/Corporations.aspx',
      'arizona': 'https://azcc.gov/corporations',
      'arkansas': 'https://www.sos.arkansas.gov/business-commercial-services',
      'california': 'https://www.sos.ca.gov/business-programs',
      'colorado': 'https://www.sos.state.co.us/biz/home.do',
      'connecticut': 'https://portal.ct.gov/SOTS/Business-Services/Business-Services',
      'delaware': 'https://corp.delaware.gov',
      'florida': 'https://dos.myflorida.com/sunbiz',
      'georgia': 'https://sos.ga.gov/corporations',
      'hawaii': 'https://cca.hawaii.gov/breg',
      'idaho': 'https://sos.idaho.gov/corp',
      'illinois': 'https://www.ilsos.gov/departments/business_services',
      'indiana': 'https://www.in.gov/sos/business',
      'iowa': 'https://sos.iowa.gov/business',
      'kansas': 'https://kssos.org/business/business.html',
      'kentucky': 'https://www.sos.ky.gov/bus',
      'louisiana': 'https://www.sos.la.gov/BusinessServices',
      'maine': 'https://www.maine.gov/sos/cec/corp',
      'maryland': 'https://dat.maryland.gov',
      'massachusetts': 'https://www.sec.state.ma.us/cor',
      'michigan': 'https://www.michigan.gov/sos/business',
      'minnesota': 'https://www.sos.state.mn.us/business-liens',
      'mississippi': 'https://www.sos.ms.gov/business-services',
      'missouri': 'https://www.sos.mo.gov/business',
      'montana': 'https://biz.sosmt.gov',
      'nebraska': 'https://www.sos.nebraska.gov/business',
      'nevada': 'https://www.nvsos.gov/sos/businesses',
      'new-hampshire': 'https://www.sos.nh.gov/corporations',
      'new-jersey': 'https://www.nj.gov/treasury/revenue/busregist.shtml',
      'new-mexico': 'https://www.sos.state.nm.us/business-services',
      'new-york': 'https://www.dos.ny.gov/corps',
      'north-carolina': 'https://www.sosnc.gov/online_services/business',
      'north-dakota': 'https://sos.nd.gov/business',
      'ohio': 'https://www.sos.state.oh.us/businesses',
      'oklahoma': 'https://www.sos.ok.gov/business',
      'oregon': 'https://sos.oregon.gov/business',
      'pennsylvania': 'https://www.dos.pa.gov/BusinessCharities',
      'rhode-island': 'https://www.sos.ri.gov/divisions/business-services',
      'south-carolina': 'https://www.sos.sc.gov/business-filing',
      'south-dakota': 'https://sos.sd.gov/business-services',
      'tennessee': 'https://sos.tn.gov/business-services',
      'texas': 'https://www.sos.texas.gov/corp',
      'utah': 'https://corporations.utah.gov',
      'vermont': 'https://sos.vermont.gov/corporations',
      'virginia': 'https://www.scc.virginia.gov/clk/begin.aspx',
      'washington': 'https://www.sos.wa.gov/corps',
      'west-virginia': 'https://sos.wv.gov/business',
      'wisconsin': 'https://www.wdfi.org/corporations',
      'wyoming': 'https://sos.wyo.gov/business'
    };
    return stateLinks[stateName] || 'https://www.sba.gov/business-guide/launch-your-business/register-your-business';
  };

  const generateDocuments = () => {
    console.log("LegalDocsGenerator button clicked!");
    setIsGenerating(true);
    
    setTimeout(() => {
      let mockDocuments: LegalDocument[] = [];
      const stateLink = getStateBusinessLink(state);
      
      if (businessStructure === 'llc') {
        mockDocuments = [
          { 
            name: "Articles of Organization", 
            description: "Legal document that establishes your LLC", 
            required: true, 
            timeline: "Week 1",
            officialLink: stateLink,
            linkText: "File with State"
          },
          { 
            name: "Operating Agreement", 
            description: "Defines ownership structure and operating procedures", 
            required: true, 
            timeline: "Week 2",
            officialLink: "https://www.sba.gov/business-guide/launch-your-business/choose-business-structure",
            linkText: "SBA Guide"
          },
          { 
            name: "EIN Application (Form SS-4)", 
            description: "Federal tax identification number", 
            required: true, 
            timeline: "Week 1",
            officialLink: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online",
            linkText: "Apply on IRS.gov"
          },
          { 
            name: "Business License Application", 
            description: "General business operating license", 
            required: true, 
            timeline: "Week 2-3",
            officialLink: "https://www.sba.gov/business-guide/launch-your-business/apply-licenses-permits",
            linkText: "Find License Requirements"
          },
          { 
            name: "State Tax Registration", 
            description: "Register for state taxes if applicable", 
            required: true, 
            timeline: "Week 3",
            officialLink: stateLink,
            linkText: "State Tax Office"
          }
        ];
      } else if (businessStructure === 'corporation') {
        mockDocuments = [
          { 
            name: "Articles of Incorporation", 
            description: "Legal document that creates your corporation", 
            required: true, 
            timeline: "Week 1",
            officialLink: stateLink,
            linkText: "File with State"
          },
          { 
            name: "Corporate Bylaws", 
            description: "Rules and procedures for corporate governance", 
            required: true, 
            timeline: "Week 2",
            officialLink: "https://www.sba.gov/business-guide/launch-your-business/choose-business-structure",
            linkText: "SBA Guide"
          },
          { 
            name: "EIN Application (Form SS-4)", 
            description: "Federal tax identification number", 
            required: true, 
            timeline: "Week 1",
            officialLink: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online",
            linkText: "Apply on IRS.gov"
          },
          { 
            name: "Board of Directors Resolutions", 
            description: "Initial board resolutions and meeting minutes", 
            required: true, 
            timeline: "Week 2",
            officialLink: "https://www.sba.gov/business-guide/launch-your-business/choose-business-structure",
            linkText: "SBA Resources"
          },
          { 
            name: "Stock Certificates", 
            description: "Certificates representing ownership shares", 
            required: true, 
            timeline: "Week 3",
            officialLink: stateLink,
            linkText: "State Requirements"
          }
        ];
      } else if (businessStructure === 'sole-proprietorship') {
        mockDocuments = [
          { 
            name: "DBA Filing", 
            description: "Doing Business As registration if using trade name", 
            required: false, 
            timeline: "Week 1",
            officialLink: stateLink,
            linkText: "File DBA"
          },
          { 
            name: "EIN Application (Form SS-4)", 
            description: "Federal tax identification number (optional for sole props)", 
            required: false, 
            timeline: "Week 1",
            officialLink: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online",
            linkText: "Apply on IRS.gov"
          },
          { 
            name: "Business License", 
            description: "General business operating license", 
            required: true, 
            timeline: "Week 1-2",
            officialLink: "https://www.sba.gov/business-guide/launch-your-business/apply-licenses-permits",
            linkText: "Find License Requirements"
          },
          { 
            name: "Professional Licenses", 
            description: "Industry-specific licenses if required", 
            required: false, 
            timeline: "Varies",
            officialLink: "https://www.sba.gov/business-guide/launch-your-business/apply-licenses-permits",
            linkText: "SBA License Guide"
          }
        ];
      } else if (businessStructure === 'partnership') {
        mockDocuments = [
          { 
            name: "Partnership Agreement", 
            description: "Legal document defining partnership terms", 
            required: true, 
            timeline: "Week 1",
            officialLink: "https://www.sba.gov/business-guide/launch-your-business/choose-business-structure",
            linkText: "SBA Guide"
          },
          { 
            name: "EIN Application (Form SS-4)", 
            description: "Federal tax identification number", 
            required: true, 
            timeline: "Week 1",
            officialLink: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online",
            linkText: "Apply on IRS.gov"
          },
          { 
            name: "Business License", 
            description: "General business operating license", 
            required: true, 
            timeline: "Week 2",
            officialLink: "https://www.sba.gov/business-guide/launch-your-business/apply-licenses-permits",
            linkText: "Find License Requirements"
          },
          { 
            name: "State Registration", 
            description: "Register partnership with state if required", 
            required: false, 
            timeline: "Week 2-3",
            officialLink: stateLink,
            linkText: "State Registration"
          }
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

  const downloadDocumentList = () => {
    let content = `LEGAL DOCUMENTS CHECKLIST\n`;
    content += `Business Structure: ${businessStructure.replace('-', ' ').toUpperCase()}\n`;
    content += `State: ${state.replace('-', ' ').toUpperCase()}\n`;
    content += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    content += `${'='.repeat(80)}\n\n`;

    const required = documents.filter(doc => doc.required);
    const optional = documents.filter(doc => !doc.required);

    if (required.length > 0) {
      content += `REQUIRED DOCUMENTS\n${'-'.repeat(80)}\n\n`;
      required.forEach((doc, index) => {
        content += `${index + 1}. ${doc.name}\n`;
        content += `   Description: ${doc.description}\n`;
        content += `   Timeline: ${doc.timeline}\n`;
        if (doc.officialLink) {
          content += `   Link: ${doc.officialLink}\n`;
        }
        content += `\n`;
      });
    }

    if (optional.length > 0) {
      content += `\nOPTIONAL DOCUMENTS\n${'-'.repeat(80)}\n\n`;
      optional.forEach((doc, index) => {
        content += `${index + 1}. ${doc.name}\n`;
        content += `   Description: ${doc.description}\n`;
        content += `   Timeline: ${doc.timeline}\n`;
        if (doc.officialLink) {
          content += `   Link: ${doc.officialLink}\n`;
        }
        content += `\n`;
      });
    }

    content += `\n${'='.repeat(80)}\n`;
    content += `DISCLAIMER: This is general information only. Consult with a qualified attorney\n`;
    content += `or business advisor for specific legal requirements in your jurisdiction.\n`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legal-documents-${businessStructure}-${state}-${new Date().toISOString().split('T')[0]}.txt`;
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
        <Scale className="h-5 w-5 text-secondary" />
        <h3 className="text-xl font-bold text-foreground">Legal Documents Generator</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">Generate a list of required legal documents for your business structure and state. Know exactly what paperwork you need to file.</p>

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
          <label className="block text-sm font-medium mb-2 text-foreground">State of Formation *</label>
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
          title={!businessStructure || !state ? "Please select both business structure and state to generate documents" : ""}
        >
          {isGenerating ? "Generating Document List..." : "Generate Required Documents"}
        </Button>
      </form>

      {documents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">Required Legal Documents</h4>
            <Button 
              onClick={downloadDocumentList}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Checklist
            </Button>
          </div>
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
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-xs text-secondary font-medium">Timeline: {doc.timeline}</p>
                      {doc.officialLink && (
                        <a 
                          href={doc.officialLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                        >
                          {doc.linkText || 'Official Form'}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
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