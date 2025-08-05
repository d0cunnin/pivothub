import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, ExternalLink, DollarSign, Calendar, Users } from "lucide-react";

interface Grant {
  id: string;
  title: string;
  description: string;
  agency: string;
  amount: string;
  deadline: string;
  eligibility: string;
  category: string;
}

export const GrantFinder = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [fundingRange, setFundingRange] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [grants, setGrants] = useState<Grant[]>([]);

  const searchGrants = async () => {
    setIsSearching(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockGrants: Grant[] = [
      {
        id: "1",
        title: "Small Business Innovation Research (SBIR) Program",
        description: "Federal funding for small businesses to engage in R&D with commercialization potential",
        agency: "Small Business Administration",
        amount: "Up to $1.7M",
        deadline: "March 15, 2024",
        eligibility: "Small businesses with <500 employees",
        category: "Technology"
      },
      {
        id: "2",
        title: "Community Development Block Grant",
        description: "Federal funding for community development projects in low-income areas",
        agency: "HUD",
        amount: "$50K - $500K",
        deadline: "April 30, 2024",
        eligibility: "Non-profit organizations, local governments",
        category: "Community"
      },
      {
        id: "3",
        title: "National Science Foundation Research Grant",
        description: "Support for fundamental research in science and engineering",
        agency: "NSF",
        amount: "$100K - $2M",
        deadline: "Rolling basis",
        eligibility: "Universities, research institutions",
        category: "Research"
      }
    ];
    
    setGrants(mockGrants);
    setIsSearching(false);
  };

  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Search className="h-6 w-6 text-primary" />
          Grant Finder Tool
        </CardTitle>
        <CardDescription>
          Discover relevant grants based on your business criteria and location
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Business Type/Keywords</Label>
            <Input
              id="search"
              placeholder="e.g., technology, healthcare, education"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="community">Community Development</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="environment">Environment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="funding">Funding Range</Label>
            <Select value={fundingRange} onValueChange={setFundingRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Under $50K</SelectItem>
                <SelectItem value="medium">$50K - $500K</SelectItem>
                <SelectItem value="large">$500K - $1M</SelectItem>
                <SelectItem value="xlarge">Over $1M</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button 
          onClick={searchGrants}
          disabled={isSearching}
          className="w-full"
        >
          {isSearching ? "Searching Grants..." : "Find Grants"}
        </Button>

        {grants.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Available Grants</h3>
            {grants.map((grant) => (
              <Card key={grant.id} className="border">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-foreground">{grant.title}</h4>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{grant.description}</p>
                  <div className="grid md:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span>{grant.amount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{grant.deadline}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{grant.eligibility}</span>
                    </div>
                    <div>
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                        {grant.category}
                      </span>
                    </div>
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