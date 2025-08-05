import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    if (!zipCode) return;
    
    setIsSearching(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
      },
      {
        id: "3",
        name: "Innovation Hub Coworking",
        type: "Workspace",
        description: "Collaborative workspace with networking and mentorship opportunities",
        address: "789 Innovation Blvd",
        phone: "(555) 345-6789",
        website: "www.innovationhub.com",
        hours: "24/7 Access",
        rating: 4.7,
        services: ["Hot Desks", "Private Offices", "Meeting Rooms", "Networking Events"]
      },
      {
        id: "4",
        name: "Tech Startup Accelerator",
        type: "Accelerator",
        description: "3-month program for early-stage tech startups with funding",
        address: "321 Startup Way",
        phone: "(555) 456-7890",
        website: "www.techaccelerator.com",
        hours: "By Appointment",
        rating: 4.9,
        services: ["Mentorship", "Seed Capital", "Demo Day", "Office Space"]
      }
    ];
    
    setResources(mockResources);
    setIsSearching(false);
  };

  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <MapPin className="h-6 w-6 text-primary" />
          Business Resource Finder
        </CardTitle>
        <CardDescription>
          Find local business support programs, funding sources, and opportunities by ZIP code
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              placeholder="Enter your ZIP code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              maxLength={5}
            />
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
          disabled={isSearching || !zipCode}
          size="lg"
          className="w-full"
        >
          {isSearching ? "Searching Resources..." : "Find Resources"}
        </Button>

        {resources.length > 0 && (
          <div className="space-y-4">
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
      </CardContent>
    </Card>
  );
};