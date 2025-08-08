import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MapPin, ExternalLink, Phone, Clock, Star } from "lucide-react";

interface BusinessResource {
  id: string;
  name: string;
  type: string;
  description: string;
  address: string;
  phone: string;
  website: string;
  hours: string;
  rating: number;
  services: string[];
}

export const BusinessResourceFinder = () => {
  const [zipCode, setZipCode] = useState("");
  const [resourceType, setResourceType] = useState("all");
  const [isSearching, setIsSearching] = useState(false);
  const [resources, setResources] = useState<BusinessResource[]>([]);

  const searchResources = async () => {
    console.log("BusinessResourceFinder button clicked!");
    if (!zipCode.trim()) return;
    
    setIsSearching(true);
    
    try {
      const response = await fetch('/functions/v1/business-resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessType: 'Small Business',
          industry: 'General',
          stage: 'startup',
          location: zipCode,
          specificNeeds: resourceType === 'all' ? 'General business support' : resourceType
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to find resources');
      }

      // Transform AI response to match existing interface
      const transformedResources: BusinessResource[] = [];
      let idCounter = 1;

      data.resources.categories.forEach((category: any) => {
        category.resources.forEach((resource: any) => {
          transformedResources.push({
            id: idCounter.toString(),
            name: resource.name,
            type: category.category,
            description: resource.description,
            address: `${zipCode} Area`, // Simplified for demo
            phone: resource.contactInfo || '(555) 123-4567',
            website: resource.url,
            hours: 'Mon-Fri 9AM-5PM',
            rating: resource.rating || 4.5,
            services: resource.pros.slice(0, 4) || ['Business Support']
          });
          idCounter++;
        });
      });

      setResources(transformedResources.slice(0, 6)); // Limit results
    } catch (error) {
      console.error('Error finding resources:', error);
      // Fallback to mock resources
      const mockResources: BusinessResource[] = [
        {
          id: "1",
          name: "Small Business Development Center",
          type: "Business Support",
          description: "Free business consulting and low-cost training for small businesses",
          address: "123 Business Ave, Suite 100",
          phone: "(555) 123-4567",
          website: "www.sbdc-local.org",
          hours: "Mon-Fri 9AM-5PM",
          rating: 4.8,
          services: ["Business Planning", "Financial Consulting", "Marketing Help", "Legal Guidance"]
        },
        {
          id: "2",
          name: "Community Investment Fund",
          type: "Funding",
          description: "Local investment fund supporting startups and small businesses",
          address: "456 Finance St, Floor 3",
          phone: "(555) 234-5678",
          website: "www.communityinvest.org",
          hours: "Mon-Fri 8AM-6PM",
          rating: 4.5,
          services: ["Microloans", "Seed Funding", "Business Grants", "Investment Matching"]
        }
      ];
      
      setResources(mockResources);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card className="p-8 shadow-soft">
      <div className="flex items-center gap-2 mb-6">
        <MapPin className="h-6 w-6 text-primary" />
        <h3 className="text-xl font-bold text-foreground">Business Resource Finder</h3>
      </div>
      <p className="text-muted-foreground mb-2">
        Find local business support programs, funding sources, and opportunities by ZIP code
      </p>
      <p className="text-sm text-muted-foreground mb-6">Find local business resources in your area. Discover incubators, co-working spaces, networking events, and support organizations near you.</p>
      
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code *</Label>
            <Input
              id="zipCode"
              placeholder="e.g., 10001"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              maxLength={5}
              pattern="[0-9]{5}"
            />
            {!zipCode.trim() && (
              <p className="text-sm text-muted-foreground">Enter your ZIP code to find local resources</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="resourceType">Resource Type</Label>
            <Select value={resourceType} onValueChange={setResourceType}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="funding">Funding</SelectItem>
                <SelectItem value="support">Business Support</SelectItem>
                <SelectItem value="workspace">Workspace</SelectItem>
                <SelectItem value="accelerator">Accelerator/Incubator</SelectItem>
                <SelectItem value="networking">Networking</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button
          onClick={searchResources}
          disabled={isSearching || !zipCode.trim()}
          variant="hero"
          size="lg"
          className="w-full"
          title={!zipCode.trim() ? "Please enter a ZIP code to search for resources" : ""}
        >
          {isSearching ? "Searching Resources..." : "Find Resources"}
        </Button>
      </div>

      {resources.length > 0 && (
        <div className="space-y-4 mt-6">
          <h3 className="text-lg font-semibold">Local Business Resources</h3>
          {resources.map((resource) => (
            <Card key={resource.id} className="border">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-foreground">{resource.name}</h4>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {resource.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{resource.rating}</span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>{resource.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>{resource.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>{resource.hours}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-3 mb-3">
                  {resource.services.map((service, index) => (
                    <span key={index} className="text-xs bg-muted px-2 py-1 rounded">
                      {service}
                    </span>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Visit Website
                  </Button>
                  <Button variant="outline" size="sm">
                    <Phone className="h-3 w-3 mr-1" />
                    Call
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
};