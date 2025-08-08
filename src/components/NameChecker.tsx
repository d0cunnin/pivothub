import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface NameCheckResult {
  domain: string;
  available: boolean;
  platform: string;
}

export const NameChecker = () => {
  const [businessName, setBusinessName] = useState("");
  const [state, setState] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<NameCheckResult[]>([]);

  const states = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
    "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
    "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
    "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
    "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
    "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
    "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ];

  const checkNameAvailability = async () => {
    console.log("NameChecker button clicked!");
    if (!businessName.trim() || !state) return;
    
    setIsChecking(true);
    
    try {
      const response = await fetch('/functions/v1/name-checker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: businessName.trim()
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check name availability');
      }

      // Transform the API response to match the existing interface
      const transformedResults: NameCheckResult[] = [
        // Domain results
        ...data.domains.slice(0, 3).map((domain: any) => ({
          domain: domain.domain,
          available: domain.available,
          platform: "Domain"
        })),
        // Business registry
        { 
          domain: `${businessName} (${states.find(s => s.toLowerCase().replace(' ', '-') === state) || state})`, 
          available: Math.random() > 0.3, // Simulate registry check
          platform: "State Business Registry" 
        },
        { 
          domain: `${businessName} LLC (${states.find(s => s.toLowerCase().replace(' ', '-') === state) || state})`, 
          available: Math.random() > 0.4, 
          platform: "State LLC Registry" 
        },
        // Social media results
        ...data.socialMedia.map((social: any) => ({
          domain: social.handle.startsWith('@') ? social.handle : `@${social.handle}`,
          available: social.available,
          platform: social.platform
        }))
      ];

      setResults(transformedResults);
    } catch (error) {
      console.error('Error checking name availability:', error);
      // Fallback to mock data on error
      const mockResults: NameCheckResult[] = [
        { domain: `${businessName.toLowerCase().replace(/\s+/g, '')}.com`, available: Math.random() > 0.5, platform: "Domain" },
        { domain: `${businessName} (${states.find(s => s.toLowerCase().replace(' ', '-') === state) || state})`, available: Math.random() > 0.5, platform: "State Business Registry" },
        { domain: `${businessName} LLC (${states.find(s => s.toLowerCase().replace(' ', '-') === state) || state})`, available: Math.random() > 0.5, platform: "State LLC Registry" },
        { domain: `@${businessName.toLowerCase().replace(/\s+/g, '')}`, available: Math.random() > 0.5, platform: "Instagram" },
        { domain: `@${businessName.toLowerCase().replace(/\s+/g, '')}`, available: Math.random() > 0.5, platform: "Twitter" },
        { domain: businessName, available: Math.random() > 0.5, platform: "Facebook" },
        { domain: businessName, available: Math.random() > 0.5, platform: "LinkedIn" }
      ];
      setResults(mockResults);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (available: boolean) => {
    if (available) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusColor = (available: boolean) => {
    return available ? "border-l-green-500 bg-green-50" : "border-l-red-500 bg-red-50";
  };

  return (
    <Card className="p-8 shadow-soft">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Search className="h-8 w-8 text-primary" />
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Business Name Checker
          </h2>
        </div>
        <p className="text-xl text-muted-foreground mb-4">
          Check if your business name is available across domains, social platforms, and state records
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Enter your business name and state to instantly check availability across multiple platforms. Results show you what"s available and what"s taken.
        </p>
      </div>
      
      <div className="space-y-6 mb-8">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              placeholder="e.g., TechCorp Solutions"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="text-lg"
              autoFocus
            />
            {!businessName.trim() && (
              <p className="text-sm text-muted-foreground">Enter a business name to check availability</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger className="text-lg">
                <SelectValue placeholder="Choose your state" />
              </SelectTrigger>
              <SelectContent className="max-h-48 bg-background border shadow-lg z-50">
                {states.map((stateName) => (
                  <SelectItem key={stateName} value={stateName.toLowerCase().replace(' ', '-')}>
                    {stateName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!state && (
              <p className="text-sm text-muted-foreground">Select your state for business registry checks</p>
            )}
          </div>
        </div>

        <Button
          onClick={checkNameAvailability}
          disabled={isChecking || !businessName.trim() || !state}
          variant="hero"
          size="lg"
          className="w-full"
          title={(!businessName.trim() || !state) ? "Please enter a business name and select a state to check availability" : ""}
        >
          {isChecking ? (
            <>
              <AlertCircle className="mr-2 h-5 w-5 animate-pulse" />
              Checking Availability...
            </>
          ) : (
            <>
              <Search className="mr-2 h-5 w-5" />
              Check Name Availability
            </>
          )}
        </Button>
      </div>

      {results.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-6 text-foreground">
            Availability Results for "{businessName}" in {states.find(s => s.toLowerCase().replace(' ', '-') === state) || state}:
          </h3>
          <div className="grid gap-4">
            {results.map((result, index) => (
              <Card key={index} className={`p-4 border-l-4 ${getStatusColor(result.available)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="font-semibold text-foreground">{result.platform}</div>
                    <div className="text-muted-foreground">{result.domain}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(result.available)}
                    <span className={`font-medium ${
                      result.available ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.available ? 'Available' : 'Taken'}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This is a simulated check for demonstration. 
              In a live application, this would query actual domain registrars, social media APIs, and state business registries.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};