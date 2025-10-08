import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BusinessPlanData {
  businessName: string;
  businessType: string;
  industry: string;
  targetMarket: string;
  businessModel: string;
  uniqueValue: string;
  startupCosts: string;
  revenueProjections: string;
  marketingStrategy: string;
  competitiveAdvantage: string;
}

export const BusinessPlanGenerator = () => {
  const [formData, setFormData] = useState<BusinessPlanData>({
    businessName: "",
    businessType: "",
    industry: "",
    targetMarket: "",
    businessModel: "",
    uniqueValue: "",
    startupCosts: "",
    revenueProjections: "",
    marketingStrategy: "",
    competitiveAdvantage: ""
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState("");

  const handleInputChange = (field: keyof BusinessPlanData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateBusinessPlan = async () => {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-business-content', {
        body: {
          type: 'business-plan',
          data: formData
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const result = data;
      
      if (result.error) {
        throw new Error(result.error);
      }

      setGeneratedPlan(result.content);
    } catch (error) {
      console.error('Error generating business plan:', error);
      // Fallback to mock data if API fails
      const plan = `
BUSINESS PLAN: ${formData.businessName || "Your Business"}

EXECUTIVE SUMMARY
${formData.businessName || "Your Business"} is a ${formData.businessType || "innovative"} ${formData.industry || "business"} venture that aims to ${formData.uniqueValue || "provide exceptional value to customers through innovative solutions"}.

BUSINESS DESCRIPTION
Our ${formData.businessType || "company"} operates in the ${formData.industry || "service"} industry, targeting ${formData.targetMarket || "consumers seeking quality solutions"}. We utilize a ${formData.businessModel || "direct-to-consumer"} business model to deliver value.

MARKET ANALYSIS
Target Market: ${formData.targetMarket || "Our primary target market consists of consumers who value quality and innovation"}
Competitive Advantage: ${formData.competitiveAdvantage || "We differentiate ourselves through superior customer service and innovative product offerings"}

MARKETING & SALES STRATEGY
${formData.marketingStrategy || "Our marketing strategy focuses on digital channels, word-of-mouth referrals, and strategic partnerships to reach our target audience effectively"}

FINANCIAL PROJECTIONS
Initial Investment: $${formData.startupCosts || "50,000"}
Projected Revenue: ${formData.revenueProjections || "We project steady growth with break-even expected within 18 months"}

IMPLEMENTATION PLAN
Phase 1: Business Setup & Initial Launch (Months 1-3)
Phase 2: Market Penetration & Growth (Months 4-12)
Phase 3: Expansion & Scaling (Months 13-24)

RISK ANALYSIS
We have identified key risks and developed mitigation strategies to ensure business continuity and success.

CONCLUSION
${formData.businessName || "This business"} represents a compelling opportunity in the ${formData.industry || "market"} with strong potential for growth and profitability.
      `;
      setGeneratedPlan(plan);
    } finally {
      setIsGenerating(false);
    }
  };
  const downloadPlan = () => {
    const blob = new Blob([generatedPlan], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.businessName || 'business'}-plan.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-8">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6 text-primary" />
        <h3 className="text-2xl font-bold text-foreground">Business Plan Generator</h3>
      </div>
      <p className="text-muted-foreground mb-2">
        Create a comprehensive business plan tailored to your venture
      </p>
      <p className="text-sm text-muted-foreground mb-6">Generate a comprehensive business plan tailored to your industry and goals. Get structured sections ready for investors and lenders.</p>
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name * (e.g., TechSolutions Inc., Green Cafe)</Label>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) => handleInputChange("businessName", e.target.value)}
              className={formData.businessName.length < 3 ? "border-orange-300" : "border-green-300"}
            />
            <p className="text-xs text-muted-foreground">
              {formData.businessName.length < 3 ? "Business name required" : "✓ Good"}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Select value={formData.industry} onValueChange={(value) => handleInputChange("industry", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="consulting">Consulting</SelectItem>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                <SelectItem value="food-beverage">Food & Beverage</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="businessType">Business Type (e.g., LLC, Corporation, Partnership)</Label>
            <Input
              id="businessType"
              value={formData.businessType}
              onChange={(e) => handleInputChange("businessType", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startupCosts">Estimated Startup Costs (in dollars, e.g., 50000)</Label>
            <Input
              id="startupCosts"
              type="number"
              value={formData.startupCosts}
              onChange={(e) => handleInputChange("startupCosts", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetMarket">Target Market * - Describe your ideal customers in detail: demographics (age, income), psychographics (values, interests), pain points, and behaviors</Label>
          <Textarea
            id="targetMarket"
            placeholder="Example: 'Small business owners aged 25-45 with 10-50 employees who struggle with manual inventory management and seek affordable digital solutions.'"
            value={formData.targetMarket}
            onChange={(e) => handleInputChange("targetMarket", e.target.value)}
            rows={3}
            className={formData.targetMarket.length < 50 ? "border-orange-300" : "border-green-300"}
          />
          <p className="text-xs text-muted-foreground">
            {formData.targetMarket.length < 50 ? `Add ${50 - formData.targetMarket.length} more characters for detailed analysis` : "Excellent detail ✓"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="uniqueValue">Unique Value Proposition * - Explain what makes your business unique and why customers should choose you over competitors. Include specific benefits, features, or approaches that differentiate you</Label>
          <Textarea
            id="uniqueValue"
            placeholder="Example: '50% faster delivery than competitors through AI-powered route optimization, with 24/7 customer support and eco-friendly packaging.'"
            value={formData.uniqueValue}
            onChange={(e) => handleInputChange("uniqueValue", e.target.value)}
            rows={3}
            className={formData.uniqueValue.length < 40 ? "border-orange-300" : "border-green-300"}
          />
          <p className="text-xs text-muted-foreground">
            {formData.uniqueValue.length < 40 ? `Add ${40 - formData.uniqueValue.length} more characters for stronger positioning` : "Strong value proposition ✓"}
          </p>
        </div>

        <Button 
          onClick={generateBusinessPlan}
          disabled={isGenerating || formData.businessName.length < 3 || formData.targetMarket.length < 50 || formData.uniqueValue.length < 40}
          size="lg"
          className="w-full"
          variant="hero"
        >
          {isGenerating ? "Generating Business Plan..." : "Generate Business Plan"}
        </Button>

        {generatedPlan && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Generated Business Plan</h3>
              <Button onClick={downloadPlan} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            <div className="bg-muted p-4 rounded-lg max-h-80 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{generatedPlan}</pre>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};