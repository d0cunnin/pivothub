import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface NameCheckResult {
  domain: string;
  available: boolean;
  platform: string;
}

export const NameChecker = () => {
  const [businessName, setBusinessName] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<NameCheckResult[]>([]);

  const checkNameAvailability = () => {
    setIsChecking(true);
    
    // Simulate API calls to check various platforms
    setTimeout(() => {
      const mockResults: NameCheckResult[] = [
        { domain: `${businessName.toLowerCase().replace(/\s+/g, '')}.com`, available: Math.random() > 0.5, platform: "Domain" },
        { domain: `@${businessName.toLowerCase().replace(/\s+/g, '')}`, available: Math.random() > 0.5, platform: "Instagram" },
        { domain: `@${businessName.toLowerCase().replace(/\s+/g, '')}`, available: Math.random() > 0.5, platform: "Twitter" },
        { domain: businessName, available: Math.random() > 0.5, platform: "Facebook" },
        { domain: businessName, available: Math.random() > 0.5, platform: "LinkedIn" },
        { domain: `${businessName.toLowerCase().replace(/\s+/g, '')}`, available: Math.random() > 0.5, platform: "YouTube" }
      ];
      setResults(mockResults);
      setIsChecking(false);
    }, 3000);
  };

  const getStatusIcon = (available: boolean) => {
    if (available) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusColor = (available: boolean) => {
    return available ? "border-l-green-500 bg-green-50" : "border-l-red-500 bg-red-50";
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Search className="h-8 w-8 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Business Name Checker
              </h2>
            </div>
            <p className="text-xl text-muted-foreground">
              Check if your business name is available across domains and social platforms
            </p>
          </div>

          <Card className="p-8 shadow-soft">
            <div className="space-y-6 mb-8">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="Enter your business name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="text-lg"
                />
              </div>

              <Button 
                onClick={checkNameAvailability}
                disabled={isChecking || !businessName.trim()}
                size="lg"
                className="w-full"
                variant="default"
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
                  Availability Results for "{businessName}":
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
                    In a live application, this would query actual domain registrars and social media APIs.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};