import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, ExternalLink, DollarSign, Calendar, Users } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { sanitizeAIContent } from "@/lib/utils";

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
    if (!searchTerm.trim()) {
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('grant-finder', {
        body: {
          businessType: searchTerm,
          industry: category,
          location: 'United States', // Could add location field later
          fundingAmount: fundingRange,
          businessStage: 'early-stage' // Could add stage field later
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to find grants');
      }

      // Transform the data to match the existing interface
      const transformedGrants: Grant[] = (data?.grants || []).map((grant: any) => ({
        id: grant.id,
        title: sanitizeAIContent(grant.name),
        description: sanitizeAIContent(grant.description),
        agency: sanitizeAIContent(grant.organization),
        amount: grant.amountRange,
        deadline: grant.deadline,
        eligibility: grant.eligibility.join(', '),
        category: grant.category
      }));

      setGrants(transformedGrants);
    } catch (error) {
      console.error('Error finding grants:', error);
      // Fallback to mock data on error
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
        }
      ];
      setGrants(mockGrants);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card className="p-8">
      <div className="flex items-center gap-2 mb-6">
        <Search className="h-6 w-6 text-primary" />
        <h3 className="text-2xl font-bold text-foreground">Grant Finder Tool</h3>
      </div>
      <p className="text-muted-foreground mb-2">
        Discover relevant grants based on your business criteria and location
      </p>
      <p className="text-sm text-muted-foreground mb-6">Find grants and funding opportunities for your business. Search by industry and location to discover financial support options.</p>
      <div className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Business Type/Keywords *</Label>
              <Input
                id="search"
                placeholder="e.g., technology startup, healthcare nonprofit, restaurant"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={searchTerm.trim().length > 0 && searchTerm.trim().length < 5 ? "border-destructive" : ""}
              />
              {searchTerm.trim().length > 0 && searchTerm.trim().length < 5 && (
                <p className="text-xs text-destructive">Please be more specific (at least 5 characters)</p>
              )}
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
          disabled={isSearching || !searchTerm.trim() || searchTerm.trim().length < 5}
          size="lg"
          className="w-full"
          variant="hero"
        >
          {isSearching ? "Searching Grants..." : "Find Grants"}
        </Button>
        
        {(!searchTerm.trim() || searchTerm.trim().length < 5) && (
          <p className="text-xs text-muted-foreground text-center">
            Please provide specific business details to find relevant grants
          </p>
        )}

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
      </div>
    </Card>
  );
};